import { BaseAdapter, type AdapterConfig } from '@theater/core';

/**
 * Adapter que le logs de arquivo (JSON lines) via file watcher.
 * Funciona no estilo tail -f, monitorando novos eventos no arquivo.
 */
export class FileLogAdapter extends BaseAdapter {
  readonly config: AdapterConfig;

  constructor(serverUrl: string, sessionId?: string) {
    super();
    this.config = {
      id: 'adapter-file-log',
      name: 'File Log Adapter',
      serverUrl,
      sessionId,
    };
  }

  async start(): Promise<void> {
    this.running = true;
    // TODO: implementar file watcher (chokidar/fs.watch)
  }

  async stop(): Promise<void> {
    this.running = false;
  }
}
