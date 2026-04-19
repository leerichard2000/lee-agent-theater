import type { FastifyInstance } from 'fastify';

const startedAt = new Date().toISOString();

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    return {
      status: 'ok',
      version: '0.1.0',
      startedAt,
      uptime: process.uptime(),
    };
  });
}
