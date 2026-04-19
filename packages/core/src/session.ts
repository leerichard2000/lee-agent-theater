/**
 * Tipos relacionados a sessões do Lee Agent Theater.
 *
 * Uma sessão agrupa eventos e agentes em uma unidade lógica
 * de visualização no palco.
 */

import type { AgentInfo } from './agents.js';
import type { TheaterEvent } from './events.js';

/** Status possíveis de uma sessão */
export type SessionStatus = 'active' | 'paused' | 'ended';

/** Estado completo de uma sessão */
export interface SessionState {
  /** Identificador único da sessão */
  id: string;

  /** Nome legível da sessão */
  name: string;

  /** ISO 8601 timestamp de quando a sessão iniciou */
  startedAt: string;

  /** Status atual da sessão */
  status: SessionStatus;

  /** Agentes participantes, indexados por ID */
  agents: Record<string, AgentInfo>;

  /** Buffer de eventos da sessão (ring buffer no server) */
  events: TheaterEvent[];

  /** Metadados livres da sessão */
  metadata: Record<string, unknown>;
}
