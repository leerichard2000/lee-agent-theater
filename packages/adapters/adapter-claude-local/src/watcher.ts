/**
 * File watcher para detectar mudanças em tempo real nos dados do Claude Code.
 *
 * Usa fs.watch nativo do Node.js para monitorar diretórios de teams e tasks.
 * Combina watching com polling para garantir que nenhuma mudança seja perdida,
 * já que fs.watch pode não ser 100% confiável em todas as plataformas.
 */

import { watch, type FSWatcher } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type ChangeType = 'team_config' | 'task' | 'inbox' | 'kanban' | 'sent_messages';

export interface FileChange {
  type: ChangeType;
  teamName: string;
  filePath: string;
  fileName: string;
  timestamp: number;
}

export type OnChangeCallback = (change: FileChange) => void;

// ---------------------------------------------------------------------------
// ClaudeWatcher
// ---------------------------------------------------------------------------

export class ClaudeWatcher {
  private watchers: FSWatcher[] = [];
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private callbacks: OnChangeCallback[] = [];
  private lastMtimes = new Map<string, number>();
  private running = false;

  constructor(
    private watchPaths: { teamDir: string; taskDir: string; teamName: string }[],
    private pollIntervalMs = 2000,
  ) {}

  /** Registra callback para mudanças detectadas */
  onChange(cb: OnChangeCallback): void {
    this.callbacks.push(cb);
  }

  /** Inicia watching + polling */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    // Inicializa mtimes para comparação
    await this.initMtimes();

    // Inicia watchers nativos
    for (const { teamDir, taskDir, teamName } of this.watchPaths) {
      this.watchDir(teamDir, teamName);
      this.watchDir(taskDir, teamName);
    }

    // Inicia polling como fallback
    this.pollTimer = setInterval(() => {
      this.poll().catch(() => {
        // Erros de polling são ignorados (arquivo pode estar sendo escrito)
      });
    }, this.pollIntervalMs);
  }

  /** Para watching e polling */
  stop(): void {
    this.running = false;

    for (const w of this.watchers) {
      try {
        w.close();
      } catch {
        // Ignorar erros ao fechar
      }
    }
    this.watchers = [];

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  // -------------------------------------------------------------------------
  // Watching nativo
  // -------------------------------------------------------------------------

  private watchDir(dirPath: string, teamName: string): void {
    try {
      const watcher = watch(dirPath, { recursive: true }, (_event, filename) => {
        if (!this.running || !filename) return;

        const change = this.classifyChange(dirPath, filename.toString(), teamName);
        if (change) {
          this.notify(change);
        }
      });

      watcher.on('error', () => {
        // Diretório pode não existir ou ser removido — ignorar
      });

      this.watchers.push(watcher);
    } catch {
      // Diretório não existe — será detectado por polling quando criado
    }
  }

  // -------------------------------------------------------------------------
  // Polling fallback
  // -------------------------------------------------------------------------

  private async initMtimes(): Promise<void> {
    for (const { teamDir, taskDir, teamName } of this.watchPaths) {
      await this.scanDir(teamDir, teamName, true);
      await this.scanDir(taskDir, teamName, true);
    }
  }

  private async poll(): Promise<void> {
    if (!this.running) return;

    for (const { teamDir, taskDir, teamName } of this.watchPaths) {
      await this.scanDir(teamDir, teamName, false);
      await this.scanDir(taskDir, teamName, false);
    }
  }

  private async scanDir(
    dirPath: string,
    teamName: string,
    initOnly: boolean,
  ): Promise<void> {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          // Scan subdirectórios (ex: inboxes/)
          const subDir = join(dirPath, entry.name);
          await this.scanDir(subDir, teamName, initOnly);
          continue;
        }

        if (!entry.name.endsWith('.json')) continue;

        const filePath = join(dirPath, entry.name);
        try {
          const s = await stat(filePath);
          const prevMtime = this.lastMtimes.get(filePath) ?? 0;

          if (s.mtimeMs > prevMtime) {
            this.lastMtimes.set(filePath, s.mtimeMs);

            if (!initOnly && prevMtime > 0) {
              const change = this.classifyChange(dirPath, entry.name, teamName);
              if (change) {
                this.notify(change);
              }
            }
          }
        } catch {
          // Arquivo pode ter sido removido entre readdir e stat
        }
      }
    } catch {
      // Diretório pode não existir
    }
  }

  // -------------------------------------------------------------------------
  // Classificação de mudanças
  // -------------------------------------------------------------------------

  private classifyChange(
    dirPath: string,
    fileName: string,
    teamName: string,
  ): FileChange | null {
    const normalizedDir = dirPath.replace(/\\/g, '/');
    const normalizedFile = fileName.replace(/\\/g, '/');

    let type: ChangeType;

    if (normalizedFile === 'config.json' || normalizedFile === 'members.meta.json') {
      type = 'team_config';
    } else if (normalizedFile === 'kanban-state.json') {
      type = 'kanban';
    } else if (normalizedFile === 'sentMessages.json') {
      type = 'sent_messages';
    } else if (normalizedFile.startsWith('inboxes/') || normalizedDir.includes('/inboxes')) {
      type = 'inbox';
    } else if (normalizedFile.endsWith('.json') && normalizedDir.includes('/tasks/')) {
      type = 'task';
    } else if (normalizedFile.endsWith('.json')) {
      type = 'task'; // Fallback para JSONs em tasks/
    } else {
      return null;
    }

    return {
      type,
      teamName,
      filePath: join(dirPath, fileName),
      fileName,
      timestamp: Date.now(),
    };
  }

  // -------------------------------------------------------------------------
  // Notificação
  // -------------------------------------------------------------------------

  private notify(change: FileChange): void {
    for (const cb of this.callbacks) {
      try {
        cb(change);
      } catch {
        // Erro no callback não deve parar o watcher
      }
    }
  }
}
