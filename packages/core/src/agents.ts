/**
 * Tipos e estados de agentes do Lee Agent Theater.
 *
 * AgentInfo descreve um agente no palco. AgentState representa
 * os estados possíveis de um agente durante uma sessão.
 */

// ---------------------------------------------------------------------------
// Estados do agente
// ---------------------------------------------------------------------------

/** Estados possíveis de um agente no palco */
export type AgentState =
  | 'idle'
  | 'active'
  | 'moving'
  | 'speaking'
  | 'waiting'
  | 'thinking'
  | 'completed'
  | 'error';

/** Todos os estados disponíveis como array (útil para validação e iteração) */
export const AGENT_STATES: readonly AgentState[] = [
  'idle',
  'active',
  'moving',
  'speaking',
  'waiting',
  'thinking',
  'completed',
  'error',
] as const;

// ---------------------------------------------------------------------------
// Informação do agente
// ---------------------------------------------------------------------------

/** Posição 2D do agente no palco */
export interface AgentPosition {
  x: number;
  y: number;
}

/** Informação completa de um agente */
export interface AgentInfo {
  /** Identificador único do agente */
  id: string;

  /** Nome de exibição do agente */
  name: string;

  /** Papel do agente (ex: 'architect', 'developer', 'reviewer') */
  role?: string;

  /** Referência ao sprite/avatar */
  avatar?: string;

  /** Posição no palco (gerenciada pelo frontend) */
  position?: AgentPosition;

  /** Estado atual do agente */
  state?: AgentState;

  /** Cor identificadora no palco (hex string) */
  color?: string;
}
