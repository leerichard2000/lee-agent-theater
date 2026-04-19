/**
 * Adapter de demonstração do Lee Agent Theater.
 *
 * Gera eventos simulados com agentes fictícios interagindo entre si:
 * movimentação, falas, mudanças de estado, tool calls e ciclo de vida.
 * Usado para testar o pipeline completo sem fontes externas reais.
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

// ---------------------------------------------------------------------------
// Agentes fictícios do cenário de demonstração
// ---------------------------------------------------------------------------

const DEMO_AGENTS: AgentInfo[] = [
  {
    id: 'agent-architect',
    name: 'Rafael',
    role: 'architect',
    state: 'idle',
    color: '#8B5CF6',
    position: { x: 200, y: 150 },
  },
  {
    id: 'agent-developer',
    name: 'Carlos',
    role: 'developer',
    state: 'idle',
    color: '#3B82F6',
    position: { x: 400, y: 250 },
  },
  {
    id: 'agent-reviewer',
    name: 'Ana',
    role: 'reviewer',
    state: 'idle',
    color: '#EC4899',
    position: { x: 600, y: 150 },
  },
  {
    id: 'agent-devops',
    name: 'Igor',
    role: 'devops',
    state: 'idle',
    color: '#10B981',
    position: { x: 400, y: 50 },
  },
];

// ---------------------------------------------------------------------------
// Cenários de interação entre agentes
// ---------------------------------------------------------------------------

interface ScenarioStep {
  delay: number;
  source: string;
  target?: string;
  eventType: EventType;
  summary: string;
  content: string;
  sourceState?: AgentInfo['state'];
  targetState?: AgentInfo['state'];
  metadata?: Record<string, unknown>;
}

/** Cenário: planejamento e implementação de uma feature */
const FEATURE_SCENARIO: ScenarioStep[] = [
  // Rafael inicia sessão
  {
    delay: 500,
    source: 'agent-architect',
    eventType: EventType.SESSION_STARTED,
    summary: 'Sessão de desenvolvimento iniciada',
    content: 'Rafael iniciou uma nova sessão para implementar o sistema de autenticação.',
    sourceState: 'active',
  },
  // Rafael convoca a equipe
  {
    delay: 1500,
    source: 'agent-architect',
    target: 'agent-developer',
    eventType: EventType.MESSAGE_SENT,
    summary: 'Rafael solicita implementação do auth module',
    content: 'Carlos, precisamos implementar o módulo de autenticação. Vou definir a arquitetura e você implementa o backend. Usaremos JWT com refresh tokens.',
    sourceState: 'speaking',
    targetState: 'waiting',
  },
  // Carlos confirma
  {
    delay: 2500,
    source: 'agent-developer',
    target: 'agent-architect',
    eventType: EventType.MESSAGE_SENT,
    summary: 'Carlos confirma e inicia análise',
    content: 'Entendido, Rafael. Vou começar pelo middleware de autenticação e os schemas de validação. Preciso da definição dos endpoints.',
    sourceState: 'active',
    targetState: 'thinking',
  },
  // Rafael pensa na arquitetura
  {
    delay: 3500,
    source: 'agent-architect',
    eventType: EventType.THINKING,
    summary: 'Rafael define a arquitetura do auth',
    content: 'Analisando patterns: OAuth2 + JWT, middleware chain, role-based access control...',
    sourceState: 'thinking',
    metadata: { thinkingDuration: 4000, topic: 'auth-architecture' },
  },
  // Rafael move para posição central
  {
    delay: 5000,
    source: 'agent-architect',
    eventType: EventType.STATUS_CHANGE,
    summary: 'Rafael se posiciona para apresentar',
    content: 'Movendo para o centro do palco para apresentar o diagrama de arquitetura.',
    sourceState: 'moving',
  },
  // Rafael apresenta a arquitetura
  {
    delay: 6500,
    source: 'agent-architect',
    eventType: EventType.MESSAGE_SENT,
    summary: 'Arquitetura definida: JWT + RBAC + refresh tokens',
    content: `Arquitetura aprovada:
- POST /auth/login → gera access + refresh token
- POST /auth/refresh → renova access token
- Middleware: validateJWT → extractUser → checkRole
- Roles: admin, editor, viewer
- Access token TTL: 15min, Refresh token TTL: 7d`,
    sourceState: 'speaking',
    metadata: { diagramType: 'architecture', version: 'v1.0' },
  },
  // Carlos chama tool para criar arquivo
  {
    delay: 8000,
    source: 'agent-developer',
    eventType: EventType.TOOL_CALL,
    summary: 'Carlos cria auth.middleware.ts',
    content: 'Criando arquivo src/middleware/auth.middleware.ts com validação JWT e extração de usuário.',
    sourceState: 'active',
    metadata: { tool: 'file_create', path: 'src/middleware/auth.middleware.ts' },
  },
  // Resultado da tool
  {
    delay: 9000,
    source: 'agent-developer',
    eventType: EventType.TOOL_RESULT,
    summary: 'Middleware de auth criado com sucesso',
    content: 'Arquivo criado: src/middleware/auth.middleware.ts (45 linhas). Implementa validateJWT, extractUser e checkRole.',
    sourceState: 'active',
    metadata: { tool: 'file_create', success: true, linesWritten: 45 },
  },
  // Igor entra na conversa
  {
    delay: 10500,
    source: 'agent-devops',
    eventType: EventType.AGENT_JOINED,
    summary: 'Igor se junta à sessão',
    content: 'Igor entrou para configurar o pipeline de deploy com as novas variáveis de ambiente do auth.',
    sourceState: 'active',
  },
  // Igor fala com Carlos
  {
    delay: 12000,
    source: 'agent-devops',
    target: 'agent-developer',
    eventType: EventType.MESSAGE_SENT,
    summary: 'Igor pede lista de env vars necessárias',
    content: 'Carlos, quais variáveis de ambiente o auth module precisa? Vou adicionar ao vault e ao CI/CD.',
    sourceState: 'speaking',
    targetState: 'waiting',
  },
  // Carlos responde com env vars
  {
    delay: 13500,
    source: 'agent-developer',
    target: 'agent-devops',
    eventType: EventType.MESSAGE_SENT,
    summary: 'Carlos lista variáveis de ambiente',
    content: 'JWT_SECRET, JWT_EXPIRY=15m, REFRESH_SECRET, REFRESH_EXPIRY=7d, BCRYPT_ROUNDS=12',
    sourceState: 'speaking',
    targetState: 'active',
  },
  // Carlos implementa mais código
  {
    delay: 15000,
    source: 'agent-developer',
    eventType: EventType.TOOL_CALL,
    summary: 'Carlos cria auth.routes.ts',
    content: 'Implementando rotas de login, logout e refresh token.',
    sourceState: 'active',
    metadata: { tool: 'file_create', path: 'src/routes/auth.routes.ts' },
  },
  {
    delay: 16500,
    source: 'agent-developer',
    eventType: EventType.TOOL_RESULT,
    summary: 'Rotas de auth implementadas',
    content: 'Arquivo criado: src/routes/auth.routes.ts (78 linhas). POST /login, POST /logout, POST /refresh.',
    sourceState: 'active',
    metadata: { tool: 'file_create', success: true, linesWritten: 78 },
  },
  // Ana entra para review
  {
    delay: 18000,
    source: 'agent-reviewer',
    eventType: EventType.AGENT_JOINED,
    summary: 'Ana inicia code review',
    content: 'Ana entrou na sessão para revisar o módulo de autenticação.',
    sourceState: 'active',
  },
  // Ana revisa e encontra problema
  {
    delay: 19500,
    source: 'agent-reviewer',
    target: 'agent-developer',
    eventType: EventType.MESSAGE_SENT,
    summary: 'Ana encontra vulnerabilidade no refresh token',
    content: 'Carlos, encontrei um problema: o refresh token não está sendo invalidado no logout. Precisamos de uma blacklist ou rotation strategy. Também falta rate limiting no /auth/login.',
    sourceState: 'speaking',
    targetState: 'waiting',
    metadata: { reviewType: 'security', severity: 'high' },
  },
  // Carlos reconhece e corrige
  {
    delay: 21000,
    source: 'agent-developer',
    target: 'agent-reviewer',
    eventType: EventType.MESSAGE_SENT,
    summary: 'Carlos aceita feedback e inicia correção',
    content: 'Boa observação, Ana! Vou implementar token rotation — cada refresh gera um novo refresh token e invalida o anterior. Também adiciono rate limiting com sliding window.',
    sourceState: 'thinking',
    targetState: 'waiting',
  },
  // Carlos corrige
  {
    delay: 23000,
    source: 'agent-developer',
    eventType: EventType.TOOL_CALL,
    summary: 'Carlos implementa token rotation',
    content: 'Adicionando token rotation strategy e rate limiting ao módulo de auth.',
    sourceState: 'active',
    metadata: { tool: 'file_edit', path: 'src/routes/auth.routes.ts' },
  },
  {
    delay: 24500,
    source: 'agent-developer',
    eventType: EventType.TOOL_RESULT,
    summary: 'Correção de segurança aplicada',
    content: 'Token rotation implementado. Rate limiting: máximo 5 tentativas por minuto por IP.',
    sourceState: 'active',
    metadata: { tool: 'file_edit', success: true, linesChanged: 23 },
  },
  // Ana aprova
  {
    delay: 26000,
    source: 'agent-reviewer',
    target: 'agent-developer',
    eventType: EventType.MESSAGE_SENT,
    summary: 'Ana aprova o código corrigido',
    content: 'Excelente correção, Carlos! Token rotation + rate limiting resolvem os issues de segurança. LGTM — aprovado para merge.',
    sourceState: 'speaking',
    targetState: 'idle',
    metadata: { reviewResult: 'approved' },
  },
  // Rafael finaliza
  {
    delay: 28000,
    source: 'agent-architect',
    eventType: EventType.MESSAGE_SENT,
    summary: 'Rafael encerra sessão com sucesso',
    content: 'Módulo de autenticação concluído com sucesso. Arquitetura definida, implementado, revisado e aprovado. Próxima sessão: módulo de autorização com RBAC granular.',
    sourceState: 'speaking',
  },
  // Todos ficam idle
  {
    delay: 30000,
    source: 'agent-architect',
    eventType: EventType.SESSION_ENDED,
    summary: 'Sessão encerrada',
    content: 'Sessão de desenvolvimento do auth module finalizada.',
    sourceState: 'completed',
  },
];

// ---------------------------------------------------------------------------
// DemoAdapter
// ---------------------------------------------------------------------------

export class DemoAdapter extends BaseAdapter {
  readonly config: AdapterConfig;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private sessionId: string;
  private agents: Map<string, AgentInfo>;
  private loopEnabled: boolean;
  private loopTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(serverUrl: string, sessionId?: string, loop = true) {
    super();
    // Usa um sessionId determinístico por padrão. Antes era randomUUID() em
    // cada construção, o que fazia cada bootstrap do server criar uma sessão
    // "Sessão Demo" nova no store, acumulando duplicatas no dropdown a cada
    // restart do dev:server (ver #39df041f). ID fixo garante que múltiplos
    // boots/instâncias convergem na mesma sessão idempotente.
    this.sessionId = sessionId ?? 'demo-session';
    this.loopEnabled = loop;
    this.agents = new Map(DEMO_AGENTS.map((a) => [a.id, { ...a }]));

    this.config = {
      id: 'adapter-demo',
      name: 'Demo Adapter',
      serverUrl,
      sessionId: this.sessionId,
    };
  }

  async start(): Promise<void> {
    this.running = true;
    this.runScenario();
  }

  async stop(): Promise<void> {
    this.running = false;
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers = [];
    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = null;
    }
  }

  /** Retorna os agentes do cenário de demonstração */
  getAgents(): AgentInfo[] {
    return Array.from(this.agents.values());
  }

  /** Retorna o ID da sessão */
  getSessionId(): string {
    return this.sessionId;
  }

  // -------------------------------------------------------------------------
  // Execução do cenário
  // -------------------------------------------------------------------------

  private runScenario(): void {
    if (!this.running) return;

    for (const step of FEATURE_SCENARIO) {
      const timer = setTimeout(() => {
        if (!this.running) return;
        this.executeStep(step);
      }, step.delay);

      this.timers.push(timer);
    }

    // Loop: reinicia o cenário após conclusão — mantendo o MESMO sessionId.
    // Antes gerávamos um novo randomUUID() a cada ciclo, o que fazia aparecer
    // uma nova "Sessão Demo" no dropdown a cada ~30s de server rodando, poluindo
    // a lista com dezenas de entradas idênticas. Reaproveitar a sessão deixa o
    // cenário rodar em loop infinito como uma performance contínua; o ring
    // buffer do SessionStore descarta eventos antigos automaticamente.
    if (this.loopEnabled) {
      const totalDuration = FEATURE_SCENARIO[FEATURE_SCENARIO.length - 1].delay + 5000;
      this.loopTimeout = setTimeout(() => {
        if (!this.running) return;
        this.timers = [];
        // Reseta estados dos agentes para o cenário começar do zero visualmente
        for (const agent of this.agents.values()) {
          agent.state = 'idle';
        }
        this.runScenario();
      }, totalDuration);
    }
  }

  private executeStep(step: ScenarioStep): void {
    const source = this.agents.get(step.source);
    if (!source) return;

    // Atualiza estado do agente fonte
    if (step.sourceState) {
      source.state = step.sourceState;
    }

    // Atualiza estado do agente destino
    let target: AgentInfo | null = null;
    if (step.target) {
      target = this.agents.get(step.target) ?? null;
      if (target && step.targetState) {
        target.state = step.targetState;
      }
    }

    const event = createEvent(randomUUID(), {
      sessionId: this.sessionId,
      sourceAgent: { ...source },
      targetAgent: target ? { ...target } : null,
      eventType: step.eventType,
      summary: step.summary,
      content: step.content,
      status: EventStatus.COMPLETED,
      metadata: step.metadata ?? {},
    });

    this.emitDirect(event);
  }

  /**
   * Emissão direta ao store local (sem HTTP).
   * Usado quando o adapter roda integrado ao server.
   */
  private emitCallback: ((event: TheaterEvent) => void) | null = null;

  /** Registra callback de emissão direta (evita round-trip HTTP) */
  onEmit(cb: (event: TheaterEvent) => void): void {
    this.emitCallback = cb;
  }

  private emitDirect(event: TheaterEvent): void {
    if (this.emitCallback) {
      this.emitCallback(event);
    } else {
      // Fallback: envia via HTTP (BaseAdapter.emit)
      this.emit(event).catch((err) => {
        console.error('Erro ao emitir evento via HTTP:', err);
      });
    }
  }
}
