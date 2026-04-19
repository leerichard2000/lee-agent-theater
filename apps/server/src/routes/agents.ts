/**
 * Rotas REST de agentes do Lee Agent Theater.
 *
 * GET /api/agents?sessionId=<id> — lista agentes da sessão
 */

import type { FastifyInstance } from 'fastify';
import type { SessionStore } from '../store.js';

export async function agentRoutes(
  app: FastifyInstance,
  opts: { store: SessionStore },
): Promise<void> {
  const { store } = opts;

  // GET /api/agents — lista agentes de uma sessão
  app.get<{
    Querystring: { sessionId?: string };
  }>('/agents', async (request, reply) => {
    const sessionId =
      request.query.sessionId ?? store.getActiveSession()?.id;

    if (!sessionId) {
      return reply.status(400).send({
        error: 'Nenhuma sessão ativa. Forneça ?sessionId=<id>',
      });
    }

    const session = store.getSession(sessionId);
    if (!session) {
      return reply.status(404).send({
        error: `Sessão ${sessionId} não encontrada`,
      });
    }

    const agents = store.getAgents(sessionId);

    return {
      sessionId,
      total: agents.length,
      agents,
    };
  });
}
