import { BaseAdapter, type AdapterConfig } from '@theater/core';

/**
 * Adapter que captura eventos via Claude Code hooks (PostToolUse, Stop, etc.).
 * O hook executa um script que faz POST para o server.
 */
export class ClaudeHooksAdapter extends BaseAdapter {
  readonly config: AdapterConfig;

  constructor(serverUrl: string, sessionId?: string) {
    super();
    this.config = {
      id: 'adapter-claude-hooks',
      name: 'Claude Hooks Adapter',
      serverUrl,
      sessionId,
    };
  }

  async start(): Promise<void> {
    this.running = true;
    // TODO: implementar captura de eventos via hooks
  }

  async stop(): Promise<void> {
    this.running = false;
  }
}
