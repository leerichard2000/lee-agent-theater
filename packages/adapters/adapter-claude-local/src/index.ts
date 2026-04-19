/**
 * Adapter Claude Local — monitora sessões ativas do Claude Code na máquina.
 *
 * Lê dados de ~/.claude/teams/ e ~/.claude/tasks/ de forma read-only,
 * detecta mudanças em tempo real via file watching + polling,
 * e converte eventos do ecossistema Claude Code em TheaterEvent normalizado.
 *
 * IMPORTANTE: Este adapter NUNCA escreve nos arquivos do Claude.
 */

import {
  BaseAdapter,
  type AdapterConfig,
  type AgentInfo,
  type TheaterEvent,
  EventType,
  EventStatus,
  createEvent,
} from '@theater/core';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

import {
  ClaudeReader,
  type ClaudeTeamConfig,
  type ClaudeMember,
  type ClaudeMemberMeta,
} from './claude-reader.js';
import { ClaudeWatcher, type FileChange } from './watcher.js';

// ---------------------------------------------------------------------------
// Cores padrão para roles de membros
// ---------------------------------------------------------------------------

const ROLE_COLORS: Record<string, string> = {
  tech_lead: '#8B5CF6',
  frontend_developer: '#3B82F6',
  backend_developer: '#10B981',
  ux_ui_designer: '#EC4899',
  devops: '#F59E0B',
  devsecops: '#EF4444',
  database_engineer: '#06B6D4',
  performance_optimizer: '#84CC16',
  researcher: '#A855F7',
  product_manager: '#F97316',
  documentation: '#6366F1',
  architect: '#8B5CF6',
};

// ---------------------------------------------------------------------------
// ClaudeLocalAdapter
// ---------------------------------------------------------------------------

export class ClaudeLocalAdapter extends BaseAdapter {
  readonly config: AdapterConfig;

  private reader: ClaudeReader;
  private watcher: ClaudeWatcher | null = null;
  private monitoredTeams: string[] = [];
  private pollIntervalMs: number;

  // Cache para detectar mudanças incrementais
  private lastTaskStates = new Map<string, string>();
  private lastInboxCounts = new Map<string, number>();
  private lastKanbanHash = new Map<string, string>();

  // Mapeia teamName -> nome real do lead (ex.: "forge-labs" -> "lucas-techlead").
  // O campo `leadAgentId` do config.json usa o alias "team-lead@<teamName>", mas
  // mensagens na inbox referenciam o lead como "team-lead" genérico. Precisamos
  // saber qual membro do time de fato é o lead para remapear as referências.
  private leadRealNameByTeam = new Map<string, string>();

  // Emissão direta (quando integrado ao server)
  private emitCallback: ((event: TheaterEvent) => void) | null = null;
  private teamDiscoveredCallback: ((teamName: string, agents: AgentInfo[]) => void) | null = null;

  constructor(opts?: {
    serverUrl?: string;
    claudeDir?: string;
    teams?: string[];
    pollIntervalMs?: number;
  }) {
    super();
    this.reader = new ClaudeReader(opts?.claudeDir);
    this.monitoredTeams = opts?.teams ?? [];
    this.pollIntervalMs = opts?.pollIntervalMs ?? 2000;

    this.config = {
      id: 'adapter-claude-local',
      name: 'Claude Local Adapter',
      serverUrl: opts?.serverUrl ?? 'http://localhost:3001',
    };
  }

  /** Registra callback de emissão direta (evita round-trip HTTP) */
  onEmit(cb: (event: TheaterEvent) => void): void {
    this.emitCallback = cb;
  }

  /** Registra callback para quando um novo time é descoberto */
  onTeamDiscovered(cb: (teamName: string, agents: AgentInfo[]) => void): void {
    this.teamDiscoveredCallback = cb;
  }

  async start(): Promise<void> {
    this.running = true;

    // Auto-detecta times se nenhum foi especificado
    if (this.monitoredTeams.length === 0) {
      this.monitoredTeams = await this.reader.listTeams();
    }

    // Filtra times sem config.json — diretórios residuais do Claude (ex.: só
    // inboxes/ sobrevivendo de um time removido) não representam times ativos
    // e apenas poluem o log e o dropdown com IDs opacos. Mantê-los forçaria o
    // scanTeam a retornar cedo toda vez sem sinal útil.
    const validTeams: string[] = [];
    for (const teamName of this.monitoredTeams) {
      const config = await this.reader.readTeamConfig(teamName);
      if (config) {
        validTeams.push(teamName);
      }
    }
    this.monitoredTeams = validTeams;

    // Scan inicial de todos os times
    for (const teamName of this.monitoredTeams) {
      await this.scanTeam(teamName);
    }

    // Configura watching
    const watchPaths = this.monitoredTeams.map((teamName) => ({
      teamDir: join(this.reader.getClaudeDir(), 'teams', teamName),
      taskDir: join(this.reader.getClaudeDir(), 'tasks', teamName),
      teamName,
    }));

    this.watcher = new ClaudeWatcher(watchPaths, this.pollIntervalMs);
    this.watcher.onChange((change) => this.handleChange(change));
    await this.watcher.start();
  }

  async stop(): Promise<void> {
    this.running = false;
    this.watcher?.stop();
    this.watcher = null;
  }

  /** Retorna os times monitorados */
  getMonitoredTeams(): string[] {
    return [...this.monitoredTeams];
  }

  // -------------------------------------------------------------------------
  // Scan inicial
  // -------------------------------------------------------------------------

  private async scanTeam(teamName: string): Promise<void> {
    const config = await this.reader.readTeamConfig(teamName);
    if (!config) return;

    const membersMeta = await this.reader.readMembersMeta(teamName);

    // Cacheia o nome real do lead ANTES de montar a lista de agentes. Sem isso,
    // buildAgentList não conseguiria substituir o alias "team-lead" pelo membro
    // real e a AGENT_JOINED do lead nunca seria emitida (ver #83e8ed39).
    // Heurística: primeiro membro do members.meta.json com role "tech_lead" ou
    // contendo "lead". Se nada bater, usa o primeiro membro do meta (convenção
    // do orquestrador coloca o lead como membro principal).
    if (membersMeta?.members?.length) {
      const leadMember = membersMeta.members.find(
        (m) => m.role === 'tech_lead' || m.role.toLowerCase().includes('lead'),
      ) ?? membersMeta.members[0];
      if (leadMember) {
        this.leadRealNameByTeam.set(teamName, leadMember.name);
      }
    }

    const agents = this.buildAgentList(config, membersMeta?.members ?? [], teamName);

    // Notifica que um time foi descoberto
    if (this.teamDiscoveredCallback) {
      this.teamDiscoveredCallback(teamName, agents);
    }

    // Emite evento de sessão iniciada
    const systemAgent: AgentInfo = {
      id: 'system',
      name: 'Sistema',
      role: 'system',
      state: 'active',
      color: '#6B7280',
    };

    this.emitEvent(createEvent(randomUUID(), {
      sessionId: `claude-${teamName}`,
      sourceAgent: systemAgent,
      eventType: EventType.SESSION_STARTED,
      summary: `Time "${teamName}" detectado com ${agents.length} membros`,
      content: `Monitorando time ${teamName}: ${agents.map((a) => a.name).join(', ')}`,
      status: EventStatus.COMPLETED,
      metadata: { teamName, memberCount: agents.length },
    }));

    // Emite eventos de join para cada agente
    for (const agent of agents) {
      this.emitEvent(createEvent(randomUUID(), {
        sessionId: `claude-${teamName}`,
        sourceAgent: agent,
        eventType: EventType.AGENT_JOINED,
        summary: `${agent.name} (${agent.role ?? 'membro'}) entrou no time`,
        content: `Agente ${agent.name} detectado no time ${teamName}`,
        status: EventStatus.COMPLETED,
        metadata: { teamName },
      }));
    }

    // Scan tarefas existentes
    const taskIds = await this.reader.listTaskIds(teamName);
    for (const taskId of taskIds) {
      const task = await this.reader.readTask(teamName, taskId);
      if (task) {
        // Salva estado para comparação futura
        this.lastTaskStates.set(`${teamName}:${taskId}`, JSON.stringify({
          status: task.status,
          owner: task.owner,
          commentCount: task.comments?.length ?? 0,
        }));

        // Se a task já está in_progress no scan inicial, emite THINKING para o
        // dono. Isso garante que ao abrir o frontend em meio a um trabalho em
        // andamento, o sprite mostre a engrenagem imediatamente (sem precisar
        // esperar uma nova transição de status).
        if (task.status === 'in_progress' && task.owner) {
          const ownerAgent = this.makeAgentFromOwner(
            this.resolveAgentName(task.owner, teamName),
            teamName,
          );
          this.emitEvent(createEvent(randomUUID(), {
            sessionId: `claude-${teamName}`,
            sourceAgent: ownerAgent,
            eventType: EventType.THINKING,
            summary: `${task.owner} trabalhando em #${task.displayId}`,
            content: `${task.owner} está executando: ${task.subject}`,
            status: EventStatus.IN_PROGRESS,
            metadata: {
              taskId: task.id,
              displayId: task.displayId,
              teamName,
              reason: 'initial_scan',
            },
          }));
        }
      }
    }

    // Salva contagem de inbox apenas para membros reais do time.
    // user.json e team-lead.json são inboxes de observabilidade — ignoradas em
    // handleInboxChange também, então não gastamos leitura aqui.
    for (const agent of agents) {
      if (agent.name === 'user' || agent.name === 'team-lead') continue;
      const inbox = await this.reader.readInbox(teamName, agent.name);
      this.lastInboxCounts.set(`${teamName}:${agent.name}`, inbox.length);
    }
  }

  // -------------------------------------------------------------------------
  // Handler de mudanças
  // -------------------------------------------------------------------------

  private handleChange(change: FileChange): void {
    if (!this.running) return;

    switch (change.type) {
      case 'task':
        this.handleTaskChange(change).catch(() => {});
        break;
      case 'inbox':
        this.handleInboxChange(change).catch(() => {});
        break;
      case 'kanban':
        this.handleKanbanChange(change).catch(() => {});
        break;
      case 'team_config':
        this.handleTeamConfigChange(change).catch(() => {});
        break;
      case 'sent_messages':
        this.handleSentMessagesChange(change).catch(() => {});
        break;
    }
  }

  private async handleTaskChange(change: FileChange): Promise<void> {
    const taskId = change.fileName.replace('.json', '').replace(/\\/g, '/').split('/').pop()!;
    if (taskId === '.lock') return;

    const task = await this.reader.readTask(change.teamName, taskId);
    if (!task) return;

    const key = `${change.teamName}:${taskId}`;
    const currentState = JSON.stringify({
      status: task.status,
      owner: task.owner,
      commentCount: task.comments?.length ?? 0,
    });

    const prevState = this.lastTaskStates.get(key);
    if (prevState === currentState) return;

    const prev = prevState ? JSON.parse(prevState) as { status: string; owner: string; commentCount: number } : null;
    this.lastTaskStates.set(key, currentState);

    const ownerAgent = this.makeAgentFromOwner(
      this.resolveAgentName(task.owner, change.teamName),
      change.teamName,
    );

    // Status mudou
    if (!prev || prev.status !== task.status) {
      this.emitEvent(createEvent(randomUUID(), {
        sessionId: `claude-${change.teamName}`,
        sourceAgent: ownerAgent,
        eventType: EventType.STATUS_CHANGE,
        summary: `Tarefa "${task.subject}" → ${task.status}`,
        content: `${task.owner} moveu tarefa #${task.displayId} para ${task.status}`,
        status: EventStatus.COMPLETED,
        metadata: {
          taskId: task.id,
          displayId: task.displayId,
          prevStatus: prev?.status,
          newStatus: task.status,
          teamName: change.teamName,
        },
      }));

      // Quando a task entra em progresso, emite um evento THINKING para que o
      // frontend mostre o ícone de engrenagem sobre o agente dono — paridade
      // com o comportamento da Sessão Demo (ver stateMap em TheaterScene.ts:
      // EventType.THINKING → AgentState 'thinking' → icon_thinking girando).
      // Um THINKING por transição: o ícone aparece por ~1.5–3s e depois o
      // sprite volta a idle. Para manter a engrenagem permanente ao longo de
      // toda a vida do in_progress seria necessário reemitir periodicamente
      // ou alterar o lado do frontend — fora do escopo desta feature.
      if (task.status === 'in_progress' && prev?.status !== 'in_progress') {
        this.emitEvent(createEvent(randomUUID(), {
          sessionId: `claude-${change.teamName}`,
          sourceAgent: ownerAgent,
          eventType: EventType.THINKING,
          summary: `${task.owner} trabalhando em #${task.displayId}`,
          content: `${task.owner} iniciou: ${task.subject}`,
          status: EventStatus.IN_PROGRESS,
          metadata: {
            taskId: task.id,
            displayId: task.displayId,
            teamName: change.teamName,
          },
        }));
      }
    }

    // Novo comentário
    if (prev && task.comments && task.comments.length > (prev.commentCount ?? 0)) {
      const newComments = task.comments.slice(prev.commentCount);
      for (const comment of newComments) {
        const commentAgent = this.makeAgentFromOwner(
          this.resolveAgentName(comment.author, change.teamName),
          change.teamName,
        );
        this.emitEvent(createEvent(randomUUID(), {
          sessionId: `claude-${change.teamName}`,
          sourceAgent: commentAgent,
          targetAgent: ownerAgent.id !== commentAgent.id ? ownerAgent : null,
          eventType: EventType.MESSAGE_SENT,
          summary: `${comment.author} comentou em #${task.displayId}`,
          content: this.sanitizeText(comment.text),
          status: EventStatus.COMPLETED,
          metadata: {
            taskId: task.id,
            displayId: task.displayId,
            commentId: comment.id,
            commentType: comment.type,
            teamName: change.teamName,
          },
        }));
      }
    }
  }

  private async handleInboxChange(change: FileChange): Promise<void> {
    // Extrai nome do membro do path (inboxes/member-name.json)
    const normalizedFile = change.fileName.replace(/\\/g, '/');
    const parts = normalizedFile.split('/');
    const memberFile = parts[parts.length - 1];
    const memberName = memberFile.replace('.json', '');

    // Inbox "user.json" pertence ao observador humano (não é agente do palco) e
    // só contém broadcasts resumo do lead. Inbox "team-lead.json" é espelho da
    // atividade do time e gera duplicação + muito ruído (idle_notifications).
    // Para evitar eventos com targetAgent=null (que quebram a animação de
    // conversa no frontend), ignoramos ambas na geração de MESSAGE_SENT.
    // As mensagens reais entre agentes A→B já ficam na inbox do destinatário
    // com `to` preenchido top-level e são processadas corretamente por lá.
    if (memberName === 'user' || memberName === 'team-lead') return;

    const inbox = await this.reader.readInbox(change.teamName, memberName);
    const key = `${change.teamName}:${memberName}`;
    const prevCount = this.lastInboxCounts.get(key) ?? 0;

    if (inbox.length <= prevCount) return;
    this.lastInboxCounts.set(key, inbox.length);

    // Processa apenas novas mensagens
    const newMessages = inbox.slice(prevCount);
    for (const msg of newMessages) {
      // Ignora notificações de sistema internas (info_for_agent, task events)
      if (msg.source === 'system_notification') continue;

      // Ignora heartbeats embutidos como JSON no campo `text`
      // (idle_notification, status pings, etc.) — não são conversa visual.
      if (this.isEmbeddedSystemPayload(msg.text)) continue;

      // Ignora mensagens envolvendo o observador humano (não é agente do palco).
      if (msg.from === 'user' || msg.to === 'user') continue;

      // O destinatário é implícito pelo arquivo de inbox: toda mensagem em
      // inboxes/<X>.json tem destinatário X, mesmo quando o campo `to`
      // top-level não é preenchido pelo orquestrador. Caímos no nome do
      // arquivo como fallback para garantir targetAgent não-nulo — isso é o
      // que faz a animação de conversa disparar no frontend.
      const rawTo = msg.to ?? memberName;

      const fromName = this.resolveAgentName(msg.from, change.teamName);
      const toName = this.resolveAgentName(rawTo, change.teamName);

      // Auto-mensagens (from == to) não disparam animação de conversa.
      // Emitir mesmo assim como broadcast garante que o histórico lateral
      // continue recebendo a entrada.
      const isSelfMessage = fromName === toName;
      const fromAgent = this.makeAgentFromOwner(fromName, change.teamName);
      const toAgent = isSelfMessage
        ? null
        : this.makeAgentFromOwner(toName, change.teamName);

      this.emitEvent(createEvent(randomUUID(), {
        sessionId: `claude-${change.teamName}`,
        sourceAgent: fromAgent,
        targetAgent: toAgent,
        eventType: EventType.MESSAGE_SENT,
        summary: msg.summary ?? `${fromName} → ${isSelfMessage ? 'broadcast' : toName}`,
        content: this.sanitizeText(msg.text),
        status: EventStatus.COMPLETED,
        metadata: {
          messageId: msg.messageId,
          source: msg.source,
          teamName: change.teamName,
        },
      }));
    }
  }

  /**
   * Detecta payloads de sistema embutidos como JSON no `text` de uma mensagem.
   * O orquestrador às vezes grava objetos como {"type":"idle_notification",...}
   * diretamente em `text` para consumo interno — não devem virar MESSAGE_SENT.
   */
  private isEmbeddedSystemPayload(text: string | undefined | null): boolean {
    if (!text) return false;
    const trimmed = text.trimStart();
    if (!trimmed.startsWith('{')) return false;
    try {
      const parsed = JSON.parse(trimmed) as { type?: unknown };
      if (typeof parsed.type !== 'string') return false;
      const SYSTEM_TYPES = new Set([
        'idle_notification',
        'status_update',
        'heartbeat',
        'shutdown_request',
        'shutdown_response',
        'plan_approval_request',
        'plan_approval_response',
      ]);
      return SYSTEM_TYPES.has(parsed.type);
    } catch {
      return false;
    }
  }

  /**
   * Remapeia aliases de orquestração (ex.: "team-lead") para o nome real do
   * membro do time. Sem isso, o frontend recebe referência a um agente que
   * nunca foi adicionado ao palco e a animação de conversa não dispara.
   */
  private resolveAgentName(name: string, teamName: string): string {
    if (name === 'team-lead') {
      return this.leadRealNameByTeam.get(teamName) ?? name;
    }
    return name;
  }

  private async handleKanbanChange(change: FileChange): Promise<void> {
    const kanban = await this.reader.readKanbanState(change.teamName);
    if (!kanban) return;

    const key = change.teamName;
    const currentHash = JSON.stringify(kanban.tasks);
    const prevHash = this.lastKanbanHash.get(key);

    if (prevHash === currentHash) return;
    this.lastKanbanHash.set(key, currentHash);

    // Emite evento genérico de atualização do kanban
    const systemAgent: AgentInfo = {
      id: 'system',
      name: 'Sistema',
      role: 'system',
      state: 'active',
      color: '#6B7280',
    };

    const taskCount = Object.keys(kanban.tasks).length;
    this.emitEvent(createEvent(randomUUID(), {
      sessionId: `claude-${change.teamName}`,
      sourceAgent: systemAgent,
      eventType: EventType.STATUS_CHANGE,
      summary: `Kanban do time "${change.teamName}" atualizado (${taskCount} tarefas)`,
      content: `Estado do kanban atualizado para o time ${change.teamName}`,
      status: EventStatus.COMPLETED,
      metadata: { teamName: change.teamName, taskCount },
    }));
  }

  private async handleTeamConfigChange(change: FileChange): Promise<void> {
    const config = await this.reader.readTeamConfig(change.teamName);
    if (!config) return;

    const membersMeta = await this.reader.readMembersMeta(change.teamName);

    // Mantém o cache do lead real atualizado quando o config muda.
    if (membersMeta?.members?.length) {
      const leadMember = membersMeta.members.find(
        (m) => m.role === 'tech_lead' || m.role.toLowerCase().includes('lead'),
      ) ?? membersMeta.members[0];
      if (leadMember) {
        this.leadRealNameByTeam.set(change.teamName, leadMember.name);
      }
    }

    const agents = this.buildAgentList(config, membersMeta?.members ?? [], change.teamName);

    if (this.teamDiscoveredCallback) {
      this.teamDiscoveredCallback(change.teamName, agents);
    }
  }

  private async handleSentMessagesChange(_change: FileChange): Promise<void> {
    // Mensagens enviadas são capturadas pelas inboxes dos destinatários,
    // então não precisamos processar sentMessages.json separadamente.
    // Mantemos o handler para possível uso futuro.
  }

  // -------------------------------------------------------------------------
  // Utilitários
  // -------------------------------------------------------------------------

  private buildAgentList(
    config: ClaudeTeamConfig,
    metaMembers: ClaudeMemberMeta[],
    teamName?: string,
  ): AgentInfo[] {
    const metaMap = new Map(metaMembers.map((m) => [m.name, m]));

    // O alias "team-lead" em config.members é uma entrada de orquestração —
    // NÃO é um membro real. O lead de verdade (ex.: "lucas-techlead") está
    // em members.meta.json mas frequentemente NÃO em config.members. Sem a
    // substituição abaixo, o adapter nunca emite AGENT_JOINED para o lead e
    // o frontend recebe MESSAGE_SENT com targetAgent referenciando um agente
    // que nunca foi anunciado, quebrando a animação de conversa (#83e8ed39).
    //
    // Estratégia: mapear "team-lead" → nome real do lead (resolvido em
    // scanTeam e guardado em leadRealNameByTeam). Depois dedupe por nome,
    // para o caso raro em que o lead também aparece explicitamente em
    // config.members além do alias.
    const realLeadName = teamName ? this.leadRealNameByTeam.get(teamName) : undefined;
    const seen = new Set<string>();
    const realMembers: ClaudeMember[] = [];
    for (const m of config.members) {
      const resolvedName =
        m.name === 'team-lead' && realLeadName ? realLeadName : m.name;
      if (resolvedName === 'team-lead') continue; // sem lead real conhecido — descarta alias
      if (seen.has(resolvedName)) continue;
      seen.add(resolvedName);
      realMembers.push(resolvedName === m.name ? m : { ...m, name: resolvedName });
    }

    // Garante que o lead real entre na lista mesmo quando ele NÃO está em
    // config.members e o alias "team-lead" também não aparece lá (defesa
    // extra). Se nada disso se aplicar, o loop acima já cobre.
    if (realLeadName && !seen.has(realLeadName)) {
      const leadMeta = metaMap.get(realLeadName);
      realMembers.push({
        agentId: `${realLeadName}@${teamName ?? 'team'}`,
        name: realLeadName,
        color: leadMeta?.color,
        agentType: leadMeta?.agentType,
        joinedAt: leadMeta?.joinedAt ?? Date.now(),
      });
      seen.add(realLeadName);
    }

    return realMembers.map((member, index) => {
      const meta = metaMap.get(member.name);
      const role = meta?.role ?? member.agentType ?? 'member';

      // Distribui agentes em posições circulares no palco
      const angle = (2 * Math.PI * index) / realMembers.length;
      const centerX = 400;
      const centerY = 300;
      const radius = 200;

      return {
        id: `claude-${member.name}`,
        name: member.name,
        role,
        state: 'idle' as const,
        color: member.color ?? meta?.color ?? ROLE_COLORS[role] ?? '#6B7280',
        position: {
          x: Math.round(centerX + radius * Math.cos(angle)),
          y: Math.round(centerY + radius * Math.sin(angle)),
        },
      };
    });
  }

  private makeAgentFromOwner(ownerName: string, _teamName: string): AgentInfo {
    return {
      id: `claude-${ownerName}`,
      name: ownerName,
      role: 'member',
      state: 'active',
      color: ROLE_COLORS['backend_developer'] ?? '#6B7280',
    };
  }

  /** Remove tags internas do Claude Code que não devem ser exibidas */
  private sanitizeText(text: string): string {
    // Remove blocos <info_for_agent>...</info_for_agent>
    return text.replace(/<info_for_agent>[\s\S]*?<\/info_for_agent>/g, '').trim();
  }

  private emitEvent(event: TheaterEvent): void {
    if (this.emitCallback) {
      this.emitCallback(event);
    } else {
      this.emit(event).catch(() => {
        // Fallback HTTP falhou — server pode não estar rodando
      });
    }
  }
}

// Re-exports
export { ClaudeReader } from './claude-reader.js';
export { ClaudeWatcher } from './watcher.js';
