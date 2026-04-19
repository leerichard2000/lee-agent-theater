/**
 * Tipos de mensagem WebSocket do Lee Agent Theater.
 *
 * Define o protocolo de comunicação bidirecional entre server e clients.
 * Conexão via: ws://localhost:PORT/ws?sessionId=<id>
 */

import type { TheaterEvent } from './events.js';
import type { AgentInfo } from './agents.js';
import type { SessionState } from './session.js';

// ---------------------------------------------------------------------------
// Server → Client
// ---------------------------------------------------------------------------

/** Novo evento recebido */
export interface WsEventMessage {
  type: 'event';
  payload: TheaterEvent;
}

/** Snapshot do estado completo da sessão (enviado ao conectar) */
export interface WsSessionStateMessage {
  type: 'session_state';
  payload: SessionState;
}

/** Atualização de informação de um agente */
export interface WsAgentUpdateMessage {
  type: 'agent_update';
  /**
   * ID da sessão a que esta atualização pertence. Clients devem ignorar
   * atualizações cuja sessionId não corresponda à sessão ativa local,
   * para evitar vazamento de agentes entre sessões.
   */
  sessionId: string;
  payload: AgentInfo;
}

/** Erro do server */
export interface WsErrorMessage {
  type: 'error';
  payload: {
    code: string;
    message: string;
  };
}

/** Resposta a um ping */
export interface WsPongMessage {
  type: 'pong';
}

/** União de todas as mensagens server → client */
export type WsServerMessage =
  | WsEventMessage
  | WsSessionStateMessage
  | WsAgentUpdateMessage
  | WsErrorMessage
  | WsPongMessage;

// ---------------------------------------------------------------------------
// Client → Server
// ---------------------------------------------------------------------------

/** Inscrever-se em uma sessão */
export interface WsSubscribeMessage {
  type: 'subscribe';
  sessionId: string;
}

/** Cancelar inscrição de uma sessão */
export interface WsUnsubscribeMessage {
  type: 'unsubscribe';
  sessionId: string;
}

/** Ping para manter conexão viva */
export interface WsPingMessage {
  type: 'ping';
}

/** União de todas as mensagens client → server */
export type WsClientMessage =
  | WsSubscribeMessage
  | WsUnsubscribeMessage
  | WsPingMessage;

// ---------------------------------------------------------------------------
// Tipos auxiliares
// ---------------------------------------------------------------------------

/** Todos os tipos de mensagem server → client */
export type WsServerMessageType = WsServerMessage['type'];

/** Todos os tipos de mensagem client → server */
export type WsClientMessageType = WsClientMessage['type'];
