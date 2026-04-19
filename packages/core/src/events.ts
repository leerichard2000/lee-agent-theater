/**
 * Tipos e enums de eventos do Lee Agent Theater.
 *
 * TheaterEvent é o contrato principal — todo dado que transita no sistema
 * é um TheaterEvent validado. Adapters emitem, server centraliza, frontend consome.
 */

import type { AgentInfo } from './agents.js';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Tipos de evento suportados pelo sistema */
export enum EventType {
  // Comunicação entre agentes
  MESSAGE_SENT = 'message_sent',
  MESSAGE_RECEIVED = 'message_received',

  // Ciclo de vida
  AGENT_JOINED = 'agent_joined',
  AGENT_LEFT = 'agent_left',
  SESSION_STARTED = 'session_started',
  SESSION_ENDED = 'session_ended',

  // Ações
  TOOL_CALL = 'tool_call',
  TOOL_RESULT = 'tool_result',
  THINKING = 'thinking',

  // Status
  ERROR = 'error',
  STATUS_CHANGE = 'status_change',

  // Meta
  CUSTOM = 'custom',
}

/** Status de processamento de um evento */
export enum EventStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** Contrato principal de evento do Theater */
export interface TheaterEvent {
  /** UUID v4 único do evento */
  id: string;

  /** ISO 8601 timestamp de quando o evento foi gerado na fonte */
  timestamp: string;

  /** ID da sessão à qual o evento pertence */
  sessionId: string;

  /** ID do projeto (opcional — agrupa sessões relacionadas) */
  projectId?: string;

  /** Agente que originou o evento */
  sourceAgent: AgentInfo;

  /** Agente destinatário (null para broadcasts ou eventos de sistema) */
  targetAgent: AgentInfo | null;

  /** Tipo do evento (enum tipado) */
  eventType: EventType;

  /** Resumo curto para exibição em balões/HUD (max 280 chars) */
  summary: string;

  /** Conteúdo completo (pode ser longo, exibido em painel de detalhes) */
  content: string;

  /** Status atual do evento */
  status: EventStatus;

  /** Metadados livres, específicos por tipo de evento/adapter */
  metadata: Record<string, unknown>;
}

// Re-export de AgentInfo para conveniência (definido em agents.ts)
export type { AgentInfo } from './agents.js';
