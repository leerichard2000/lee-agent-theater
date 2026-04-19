/**
 * Rotas REST de status/debug do Lee Agent Theater.
 *
 * GET /api/status — visão geral do servidor (sessões, agentes, ws clients)
 */

import type { FastifyInstance } from 'fastify';
import type { SessionStore } from '../store.js';
import { getConnectedClientCount } from '../ws.js';

export async function statusRoutes(
  app: FastifyInstance,
  opts: { store: SessionStore },
): Promise<void> {
  const { store } = opts;

  // GET /api/status — status geral do servidor
  app.get('/status', async () => {
    const sessions = store.getAllSessions();
    const activeSession = store.getActiveSession();

    return {
      server: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage().heapUsed,
        wsClients: getConnectedClientCount(),
      },
      sessions: {
        total: sessions.length,
        active: activeSession?.id ?? null,
        list: sessions.map((s) => ({
          id: s.id,
          name: s.name,
          status: s.status,
          agentCount: Object.keys(s.agents).length,
          eventCount: s.events.length,
          startedAt: s.startedAt,
        })),
      },
    };
  });
}
