import { BaseAdapter, type AdapterConfig } from '@theater/core';

/**
 * Adapter que intercepta chamadas ao Anthropic SDK.
 * Funciona como wrapper/proxy que captura requests e responses.
 */
export class ClaudeSdkAdapter extends BaseAdapter {
  readonly config: AdapterConfig;

  constructor(serverUrl: string, sessionId?: string) {
    super();
    this.config = {
      id: 'adapter-claude-sdk',
      name: 'Claude SDK Adapter',
      serverUrl,
      sessionId,
    };
  }

  async start(): Promise<void> {
    this.running = true;
    // TODO: implementar interceptacao de chamadas SDK
  }

  async stop(): Promise<void> {
    this.running = false;
  }
}
