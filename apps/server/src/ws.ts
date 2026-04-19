/**
 * WebSocket server do Lee Agent Theater.
 *
 * Gerencia conexões de clients, distribui eventos em tempo real
 * e responde a mensagens de controle (subscribe, unsubscribe, ping).
 */

import type { FastifyInstance } from 'fastify';
import type {
  WsClientMessage,
  WsServerMessage,
  TheaterEvent,
  AgentInfo,
} from '@theater/core';
import { WS_PATH } from '@theater/core';
import type { SessionStore } from './store.js';

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

/** Representa uma conexão WebSocket ativa com suas inscrições */
interface ConnectedClient {
  socket: {
    readyState: number;
    OPEN: number;
    send: (data: string) => void;
    on: (event: string, handler: (...args: unknown[]) => void) => void;
  };
  subscribedSessions: Set<string>;
}

// ---------------------------------------------------------------------------
// Registro e broadcast
// ---------------------------------------------------------------------------

const clients = new Set<ConnectedClient>();

/** Envia mensagem JSON para um client */
function send(client: ConnectedClient, message: WsServerMessage): void {
  if (client.socket.readyState === client.socket.OPEN) {
    client.socket.send(JSON.stringify(message));
  }
}

/** Broadcast para todos os clients inscritos em uma sessão */
function broadcast(sessionId: string, message: WsServerMessage): void {
  for (const client of clients) {
    if (client.subscribedSessions.has(sessionId)) {
      send(client, message);
    }
  }
}

// ---------------------------------------------------------------------------
// Plugin Fastify
// ---------------------------------------------------------------------------

export async function wsPlugin(
  app: FastifyInstance,
  opts: { store: SessionStore },
): Promise<void> {
  const { store } = opts;

  // Registra callbacks no store para broadcast automático
  store.onEvent((sessionId: string, event: TheaterEvent) => {
    broadcast(sessionId, { type: 'event', payload: event });
  });

  store.onAgentUpdate((sessionId: string, agent: AgentInfo) => {
    broadcast(sessionId, { type: 'agent_update', sessionId, payload: agent });
  });

  // Rota WebSocket
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.get(WS_PATH, { websocket: true }, (socket: any) => {
    const client: ConnectedClient = {
      socket,
      subscribedSessions: new Set(),
    };

    clients.add(client);
    app.log.info(`WebSocket client conectado (total: ${clients.size})`);

    socket.on('message', (raw: Buffer | string) => {
      try {
        const data = JSON.parse(raw.toString()) as WsClientMessage;
        handleClientMessage(client, data, store, app);
      } catch {
        send(client, {
          type: 'error',
          payload: { code: 'INVALID_MESSAGE', message: 'JSON inválido' },
        });
      }
    });

    socket.on('close', () => {
      clients.delete(client);
      app.log.info(`WebSocket client desconectado (total: ${clients.size})`);
    });

    socket.on('error', (err: Error) => {
      app.log.error(`WebSocket erro: ${err.message}`);
      clients.delete(client);
    });
  });
}

// ---------------------------------------------------------------------------
// Handler de mensagens do client
// ---------------------------------------------------------------------------

function handleClientMessage(
  client: ConnectedClient,
  message: WsClientMessage,
  store: SessionStore,
  app: FastifyInstance,
): void {
  switch (message.type) {
    case 'subscribe': {
      client.subscribedSessions.add(message.sessionId);
      app.log.info(`Client inscrito na sessão ${message.sessionId}`);

      // Envia snapshot do estado atual da sessão
      const session = store.getSession(message.sessionId);
      if (session) {
        send(client, { type: 'session_state', payload: session });
      } else {
        send(client, {
          type: 'error',
          payload: {
            code: 'SESSION_NOT_FOUND',
            message: `Sessão ${message.sessionId} não encontrada`,
          },
        });
      }
      break;
    }

    case 'unsubscribe': {
      client.subscribedSessions.delete(message.sessionId);
      app.log.info(`Client desinscrito da sessão ${message.sessionId}`);
      break;
    }

    case 'ping': {
      send(client, { type: 'pong' });
      break;
    }
  }
}

/** Retorna o número de clients conectados */
export function getConnectedClientCount(): number {
  return clients.size;
}
