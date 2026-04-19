/**
 * Constantes compartilhadas do Lee Agent Theater.
 *
 * Valores de configuração padrão usados por server, frontend e adapters.
 */

// ---------------------------------------------------------------------------
// Portas e URLs padrão
// ---------------------------------------------------------------------------

/** Porta padrão do server Fastify */
export const DEFAULT_SERVER_PORT = 3001;

/** Porta padrão do frontend Vite */
export const DEFAULT_WEB_PORT = 5173;

/** URL padrão do server para adapters */
export const DEFAULT_SERVER_URL = `http://localhost:${DEFAULT_SERVER_PORT}`;

/** Path do WebSocket no server */
export const WS_PATH = '/ws';

// ---------------------------------------------------------------------------
// Limites do sistema
// ---------------------------------------------------------------------------

/** Máximo de eventos por sessão no ring buffer do server */
export const MAX_EVENTS_PER_SESSION = 1000;

/** Tamanho máximo do summary de um evento (caracteres) */
export const MAX_SUMMARY_LENGTH = 280;

/** Intervalo de ping WebSocket do client (ms) */
export const WS_PING_INTERVAL_MS = 30_000;

/** Timeout para considerar conexão WebSocket perdida (ms) */
export const WS_TIMEOUT_MS = 60_000;

/** Delay inicial de reconnect WebSocket (ms) */
export const WS_RECONNECT_BASE_DELAY_MS = 1_000;

/** Delay máximo de reconnect WebSocket com backoff exponencial (ms) */
export const WS_RECONNECT_MAX_DELAY_MS = 30_000;

// ---------------------------------------------------------------------------
// API endpoints
// ---------------------------------------------------------------------------

/** Prefixo base de todas as rotas REST */
export const API_PREFIX = '/api';

/** Endpoints da API REST */
export const API_ENDPOINTS = {
  HEALTH: `${API_PREFIX}/health`,
  EVENTS: `${API_PREFIX}/events`,
  SESSIONS: `${API_PREFIX}/sessions`,
  ADAPTERS: `${API_PREFIX}/adapters`,
} as const;

// ---------------------------------------------------------------------------
// Nomes de pacote
// ---------------------------------------------------------------------------

/** Nome do pacote core */
export const CORE_PACKAGE_NAME = '@theater/core';

/** Prefixo de pacotes de adapter */
export const ADAPTER_PACKAGE_PREFIX = '@theater/adapter-';
