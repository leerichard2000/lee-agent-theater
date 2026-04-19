import { BaseAdapter, type AdapterConfig } from '@theater/core';

/**
 * Adapter que escuta eventos de servidores MCP.
 * Captura tool calls e outras interacoes MCP.
 */
export class McpAdapter extends BaseAdapter {
  readonly config: AdapterConfig;

  constructor(serverUrl: string, sessionId?: string) {
    super();
    this.config = {
      id: 'adapter-mcp',
      name: 'MCP Adapter',
      serverUrl,
      sessionId,
    };
  }

  async start(): Promise<void> {
    this.running = true;
    // TODO: implementar listener de eventos MCP
  }

  async stop(): Promise<void> {
    this.running = false;
  }
}
