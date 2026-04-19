/**
 * Interface base de Adapter do Lee Agent Theater.
 *
 * Adapters capturam dados de fontes externas, normalizam para TheaterEvent
 * e enviam ao server via HTTP POST. BaseAdapter fornece a implementação
 * comum de validação e envio.
 */

import type { TheaterEvent } from './events.js';
import { TheaterEventSchema } from './validation.js';

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

/** Configuração de um adapter */
export interface AdapterConfig {
  /** Identificador único do adapter */
  id: string;
  /** Nome legível */
  name: string;
  /** URL do server para enviar eventos */
  serverUrl: string;
  /** ID da sessão (pode ser auto-gerado) */
  sessionId?: string;
}

// ---------------------------------------------------------------------------
// Interface do adapter
// ---------------------------------------------------------------------------

/** Contrato que todo adapter deve implementar */
export interface TheaterAdapter {
  readonly config: AdapterConfig;

  /** Inicializa o adapter (conectar a fontes, abrir listeners) */
  start(): Promise<void>;

  /** Para o adapter (cleanup de recursos) */
  stop(): Promise<void>;

  /** Status atual */
  isRunning(): boolean;
}

// ---------------------------------------------------------------------------
// Classe base
// ---------------------------------------------------------------------------

/** Classe base com utilitários comuns para adapters */
export abstract class BaseAdapter implements TheaterAdapter {
  abstract readonly config: AdapterConfig;
  protected running = false;

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;

  isRunning(): boolean {
    return this.running;
  }

  /** Envia evento validado ao server via HTTP POST */
  protected async emit(event: TheaterEvent): Promise<void> {
    const parsed = TheaterEventSchema.parse(event);
    await fetch(`${this.config.serverUrl}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    });
  }
}
