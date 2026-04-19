/**
 * @theater/core — Barrel export
 *
 * Ponto de entrada único do pacote compartilhado do Lee Agent Theater.
 * Todos os tipos, enums, schemas, utilitários e constantes são
 * re-exportados daqui.
 */

// ---------------------------------------------------------------------------
// Agentes — estados, posição, informação
// ---------------------------------------------------------------------------
export {
  type AgentState,
  type AgentPosition,
  type AgentInfo,
  AGENT_STATES,
} from './agents.js';

// ---------------------------------------------------------------------------
// Eventos — tipos, enums, contrato principal
// ---------------------------------------------------------------------------
export {
  EventType,
  EventStatus,
  type TheaterEvent,
} from './events.js';

// ---------------------------------------------------------------------------
// Sessão — estado da sessão
// ---------------------------------------------------------------------------
export {
  type SessionStatus,
  type SessionState,
} from './session.js';

// ---------------------------------------------------------------------------
// Validação — schemas Zod e funções auxiliares
// ---------------------------------------------------------------------------
export {
  AgentPositionSchema,
  AgentInfoSchema,
  TheaterEventSchema,
  validateEvent,
  parseEvent,
  validateAgentInfo,
} from './validation.js';

// ---------------------------------------------------------------------------
// Adapter — interface base e configuração
// ---------------------------------------------------------------------------
export {
  type AdapterConfig,
  type TheaterAdapter,
  BaseAdapter,
} from './adapter.js';

// ---------------------------------------------------------------------------
// WebSocket — tipos de mensagem bidirecional
// ---------------------------------------------------------------------------
export {
  type WsEventMessage,
  type WsSessionStateMessage,
  type WsAgentUpdateMessage,
  type WsErrorMessage,
  type WsPongMessage,
  type WsServerMessage,
  type WsSubscribeMessage,
  type WsUnsubscribeMessage,
  type WsPingMessage,
  type WsClientMessage,
  type WsServerMessageType,
  type WsClientMessageType,
} from './websocket.js';

// ---------------------------------------------------------------------------
// Utilitários — normalização de payload
// ---------------------------------------------------------------------------
export {
  type CreateEventInput,
  createEvent,
  normalizeAgentInfo,
  truncateSummary,
  normalizeMetadata,
} from './utils.js';

// ---------------------------------------------------------------------------
// Constantes — valores padrão do sistema
// ---------------------------------------------------------------------------
export {
  DEFAULT_SERVER_PORT,
  DEFAULT_WEB_PORT,
  DEFAULT_SERVER_URL,
  WS_PATH,
  MAX_EVENTS_PER_SESSION,
  MAX_SUMMARY_LENGTH,
  WS_PING_INTERVAL_MS,
  WS_TIMEOUT_MS,
  WS_RECONNECT_BASE_DELAY_MS,
  WS_RECONNECT_MAX_DELAY_MS,
  API_PREFIX,
  API_ENDPOINTS,
  CORE_PACKAGE_NAME,
  ADAPTER_PACKAGE_PREFIX,
} from './constants.js';
