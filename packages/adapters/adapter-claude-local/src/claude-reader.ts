/**
 * Leitor read-only de dados do Claude Code no disco.
 *
 * Lê teams, tasks, inboxes e kanban do diretório ~/.claude/
 * sem nunca escrever nenhum arquivo. Toda leitura é feita com
 * tratamento de erros para lidar com arquivos sendo escritos
 * por outros processos simultaneamente.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

// ---------------------------------------------------------------------------
// Tipos de dados do Claude Code no disco
// ---------------------------------------------------------------------------

/** Membro de um time conforme config.json */
export interface ClaudeMember {
  agentId: string;
  name: string;
  color?: string;
  agentType?: string;
  model?: string;
  joinedAt: number;
  cwd?: string;
  backendType?: string;
}

/** Configuração de um time conforme config.json */
export interface ClaudeTeamConfig {
  name: string;
  description?: string;
  createdAt: number;
  leadAgentId?: string;
  leadSessionId?: string;
  members: ClaudeMember[];
}

/** Membro do members.meta.json com role */
export interface ClaudeMemberMeta {
  name: string;
  role: string;
  workflow?: string;
  agentType?: string;
  color?: string;
  joinedAt: number;
}

/** Metadados de membros */
export interface ClaudeMembersMeta {
  version: number;
  members: ClaudeMemberMeta[];
}

/** Tarefa conforme {taskId}.json */
export interface ClaudeTask {
  id: string;
  displayId: string;
  subject: string;
  description?: string;
  owner: string;
  createdBy: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  blocks: string[];
  blockedBy: string[];
  reviewState: string;
  comments?: ClaudeTaskComment[];
  historyEvents?: ClaudeTaskHistory[];
}

/** Comentário de uma tarefa */
export interface ClaudeTaskComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  type: string;
}

/** Evento de histórico de uma tarefa */
export interface ClaudeTaskHistory {
  id: string;
  timestamp: string;
  type: string;
  status: string;
  actor: string;
}

/** Coluna do kanban */
export interface ClaudeKanbanState {
  teamName: string;
  tasks: Record<string, { column: string; movedAt: string }>;
}

/** Mensagem de inbox */
export interface ClaudeInboxMessage {
  from: string;
  to?: string;
  text: string;
  timestamp: string;
  read?: boolean;
  summary?: string;
  source?: string;
  messageId?: string;
}

// ---------------------------------------------------------------------------
// ClaudeReader
// ---------------------------------------------------------------------------

export class ClaudeReader {
  private claudeDir: string;

  constructor(claudeDir?: string) {
    this.claudeDir = claudeDir ?? join(homedir(), '.claude');
  }

  /** Retorna o caminho base do Claude */
  getClaudeDir(): string {
    return this.claudeDir;
  }

  /** Lista todos os times disponíveis */
  async listTeams(): Promise<string[]> {
    const teamsDir = join(this.claudeDir, 'teams');
    try {
      const entries = await readdir(teamsDir, { withFileTypes: true });
      return entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name);
    } catch {
      return [];
    }
  }

  /** Lê a configuração de um time */
  async readTeamConfig(teamName: string): Promise<ClaudeTeamConfig | null> {
    return this.safeReadJson<ClaudeTeamConfig>(
      join(this.claudeDir, 'teams', teamName, 'config.json'),
    );
  }

  /** Lê os metadados dos membros de um time */
  async readMembersMeta(teamName: string): Promise<ClaudeMembersMeta | null> {
    return this.safeReadJson<ClaudeMembersMeta>(
      join(this.claudeDir, 'teams', teamName, 'members.meta.json'),
    );
  }

  /** Lê o estado do kanban de um time */
  async readKanbanState(teamName: string): Promise<ClaudeKanbanState | null> {
    return this.safeReadJson<ClaudeKanbanState>(
      join(this.claudeDir, 'teams', teamName, 'kanban-state.json'),
    );
  }

  /** Lista IDs de tarefas de um time */
  async listTaskIds(teamName: string): Promise<string[]> {
    const tasksDir = join(this.claudeDir, 'tasks', teamName);
    try {
      const entries = await readdir(tasksDir);
      return entries
        .filter((f) => f.endsWith('.json') && f !== '.lock')
        .map((f) => f.replace('.json', ''));
    } catch {
      return [];
    }
  }

  /** Lê uma tarefa específica */
  async readTask(teamName: string, taskId: string): Promise<ClaudeTask | null> {
    return this.safeReadJson<ClaudeTask>(
      join(this.claudeDir, 'tasks', teamName, `${taskId}.json`),
    );
  }

  /** Lê a inbox de um membro */
  async readInbox(teamName: string, memberName: string): Promise<ClaudeInboxMessage[]> {
    const data = await this.safeReadJson<ClaudeInboxMessage[]>(
      join(this.claudeDir, 'teams', teamName, 'inboxes', `${memberName}.json`),
    );
    return data ?? [];
  }

  /** Lê as mensagens enviadas de um time */
  async readSentMessages(teamName: string): Promise<unknown[]> {
    const data = await this.safeReadJson<unknown[]>(
      join(this.claudeDir, 'teams', teamName, 'sentMessages.json'),
    );
    return data ?? [];
  }

  /** Verifica o mtime de um arquivo */
  async getFileMtime(filePath: string): Promise<number> {
    try {
      const s = await stat(filePath);
      return s.mtimeMs;
    } catch {
      return 0;
    }
  }

  /** Retorna caminhos de arquivos monitoráveis para um time */
  getWatchPaths(teamName: string): string[] {
    return [
      join(this.claudeDir, 'teams', teamName),
      join(this.claudeDir, 'tasks', teamName),
    ];
  }

  // -------------------------------------------------------------------------
  // Leitura segura
  // -------------------------------------------------------------------------

  private async safeReadJson<T>(filePath: string): Promise<T | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      // Arquivo não existe, sendo escrito, ou JSON inválido
      return null;
    }
  }
}
