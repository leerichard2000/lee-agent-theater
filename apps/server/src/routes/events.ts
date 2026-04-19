/**
 * Rotas REST de eventos do Lee Agent Theater.
 *
 * GET  /api/events?sessionId=<id>&limit=N&offset=N — lista eventos
 * POST /api/events — recebe novo evento (usado por adapters)
 */

import type { FastifyInstance } from 'fastify';
import type { TheaterEvent } from '@theater/core';
import { validateEvent } from '@theater/core';
import type { SessionStore } from '../store.js';

export async function eventRoutes(
  app: FastifyInstance,
  opts: { store: SessionStore },
): Promise<void> {
  const { store } = opts;

  // GET /api/events — lista eventos de uma sessão
  app.get<{
    Querystring: { sessionId?: string; limit?: string; offset?: string };
  }>('/events', async (request, reply) => {
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

    const limit = request.query.limit ? Number(request.query.limit) : 100;
    const offset = request.query.offset ? Number(request.query.offset) : 0;

    const events = store.getEvents(sessionId, { limit, offset });

    return {
      sessionId,
      total: session.events.length,
      limit,
      offset,
      events,
    };
  });

  // POST /api/events — recebe evento de um adapter
  app.post('/events', async (request, reply) => {
    const result = validateEvent(request.body);

    if (!result.success) {
      return reply.status(400).send({
        error: 'Evento inválido',
        details: result.error.issues,
      });
    }

    // Cast seguro: Zod já validou a conformidade com TheaterEvent
    const event = result.data as TheaterEvent;

    // Garante que a sessão existe (cria automaticamente se necessário)
    if (!store.getSession(event.sessionId)) {
      store.createSession(event.sessionId, `Sessão ${event.sessionId}`);
    }

    store.addEvent(event);

    return reply.status(201).send({ ok: true, eventId: event.id });
  });
}
