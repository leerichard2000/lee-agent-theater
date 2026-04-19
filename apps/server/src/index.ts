/**
 * Ponto de entrada do servidor Lee Agent Theater.
 *
 * Integra Fastify, WebSocket, API REST, adapter-demo e
 * servir estáticos do frontend em produção.
 */

import { resolve, join } from 'node:path';
import { existsSync, readdirSync, statSync } from 'node:fs';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import { DEFAULT_SERVER_PORT } from '@theater/core';
import { DemoAdapter } from '@theater/adapter-demo';
import { ClaudeLocalAdapter } from '@theater/adapter-claude-local';

import { SessionStore } from './store.js';
import { wsPlugin } from './ws.js';
import { healthRoutes } from './routes/health.js';
import { eventRoutes } from './routes/events.js';
import { agentRoutes } from './routes/agents.js';
import { statusRoutes } from './routes/status.js';

// ---------------------------------------------------------------------------
// Instâncias compartilhadas
// ---------------------------------------------------------------------------

const store = new SessionStore();

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
});

// ---------------------------------------------------------------------------
// Validação do bundle web (defende contra dist corrompido pelo OneDrive)
// ---------------------------------------------------------------------------

type BundleInspection =
  | { ok: true; bundleFile: string; bundleMtime: Date }
  | { ok: false; reason: string };

function inspectWebDist(distPath: string): BundleInspection {
  const indexHtml = join(distPath, 'index.html');
  if (!existsSync(indexHtml)) {
    return { ok: false, reason: 'index.html ausente' };
  }

  const assetsDir = join(distPath, 'assets');
  if (!existsSync(assetsDir)) {
    return { ok: false, reason: 'diretório assets/ ausente' };
  }

  let jsBundles: string[];
  try {
    jsBundles = readdirSync(assetsDir).filter((name) => name.endsWith('.js'));
  } catch (err) {
    return { ok: false, reason: `falha ao ler assets/: ${String(err)}` };
  }

  if (jsBundles.length === 0) {
    return {
      ok: false,
      reason: 'nenhum bundle .js em assets/ (possível sync do OneDrive removeu arquivos)',
    };
  }

  // Usa o maior bundle como referência (o entry principal geralmente é o maior).
  const withStats = jsBundles.map((name) => {
    const full = join(assetsDir, name);
    return { name, full, stats: statSync(full) };
  });
  withStats.sort((a, b) => b.stats.size - a.stats.size);
  const main = withStats[0]!;

  return {
    ok: true,
    bundleFile: main.name,
    bundleMtime: main.stats.mtime,
  };
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

async function start() {
  // --- Plugins ---
  await server.register(cors, { origin: true });
  await server.register(websocket);

  // --- WebSocket ---
  await server.register(wsPlugin, { store });

  // --- Rotas REST ---
  await server.register(healthRoutes, { prefix: '/api' });
  await server.register(eventRoutes, { prefix: '/api', store });
  await server.register(agentRoutes, { prefix: '/api', store });
  await server.register(statusRoutes, { prefix: '/api', store });

  // --- Arquivos estáticos do frontend (produção) ---
  const webDistPath = resolve(
    import.meta.dirname ?? process.cwd(),
    '../../../apps/web/dist',
  );

  if (existsSync(webDistPath)) {
    // Sanidade do bundle: valida que o dist NÃO está corrompido/incompleto.
    // No Windows sob OneDrive sync já vimos arquivos .js desaparecerem da pasta
    // (ver PATCH_NOTES v0.11.5 / #e57175c3). Se index.html referencia um asset
    // ausente, o browser renderiza tela branca silenciosamente. Em vez de
    // servir um bundle quebrado, logamos um erro claro e desabilitamos o
    // static serving para que o usuário saiba que precisa de rebuild.
    const bundleStatus = inspectWebDist(webDistPath);

    if (bundleStatus.ok) {
      await server.register(fastifyStatic, {
        root: webDistPath,
        prefix: '/',
        wildcard: false,
      });

      // SPA fallback: retorna index.html para rotas não-API
      server.setNotFoundHandler((request, reply) => {
        if (request.url.startsWith('/api') || request.url.startsWith('/ws')) {
          return reply.status(404).send({ error: 'Rota não encontrada' });
        }
        return reply.sendFile('index.html');
      });

      server.log.info(
        `Servindo frontend estático de: ${webDistPath} (bundle: ${bundleStatus.bundleFile}, gerado em ${bundleStatus.bundleMtime.toISOString()})`,
      );
    } else {
      server.log.error(
        `Bundle em ${webDistPath} inválido: ${bundleStatus.reason}. Rode "pnpm --filter @theater/web build" para regenerar.`,
      );
    }
  } else {
    server.log.info(
      'Frontend não encontrado em dist — rode "pnpm --filter @theater/web build" para habilitar.',
    );
  }

  // --- Adapter Demo ---
  const enableDemo = process.env.DEMO_ADAPTER !== 'false';

  if (enableDemo) {
    const demo = new DemoAdapter(
      `http://localhost:${Number(process.env.SERVER_PORT) || DEFAULT_SERVER_PORT}`,
    );

    // Emissão direta ao store (evita round-trip HTTP desnecessário)
    demo.onEmit((event) => {
      // Garante que a sessão existe
      if (!store.getSession(event.sessionId)) {
        store.createSession(event.sessionId, 'Sessão Demo');
      }
      store.addEvent(event);
    });

    // Registra os agentes do demo na sessão ao iniciar
    const sessionId = demo.getSessionId();
    store.createSession(sessionId, 'Sessão Demo');
    for (const agent of demo.getAgents()) {
      store.upsertAgent(sessionId, agent);
    }

    await demo.start();
    server.log.info(`Adapter demo iniciado (sessão: ${sessionId})`);

    // Cleanup ao encerrar
    server.addHook('onClose', async () => {
      await demo.stop();
    });
  }

  // --- Adapter Claude Local ---
  const enableClaudeLocal = process.env.CLAUDE_LOCAL_ADAPTER !== 'false';

  if (enableClaudeLocal) {
    const claudeLocal = new ClaudeLocalAdapter({
      serverUrl: `http://localhost:${Number(process.env.SERVER_PORT) || DEFAULT_SERVER_PORT}`,
      pollIntervalMs: Number(process.env.CLAUDE_POLL_INTERVAL_MS) || 2000,
    });

    // Emissão direta ao store
    claudeLocal.onEmit((event) => {
      if (!store.getSession(event.sessionId)) {
        store.createSession(event.sessionId, event.sessionId.replace('claude-', 'Claude: '));
      }
      store.addEvent(event);
    });

    // Quando um novo time é descoberto, registra os agentes
    claudeLocal.onTeamDiscovered((teamName, agents) => {
      const sessionId = `claude-${teamName}`;
      if (!store.getSession(sessionId)) {
        store.createSession(sessionId, `Claude: ${teamName}`);
      }
      for (const agent of agents) {
        store.upsertAgent(sessionId, agent);
      }
    });

    await claudeLocal.start();
    const teams = claudeLocal.getMonitoredTeams();
    server.log.info(
      `Adapter Claude Local iniciado — monitorando ${teams.length} time(s): ${teams.join(', ')}`,
    );

    server.addHook('onClose', async () => {
      await claudeLocal.stop();
    });
  }

  // --- Iniciar servidor ---
  const port = Number(process.env.SERVER_PORT) || DEFAULT_SERVER_PORT;
  const host = process.env.SERVER_HOST ?? 'localhost';

  await server.listen({ port, host });
  server.log.info(`Servidor rodando em http://${host}:${port}`);
}

start().catch((err) => {
  console.error('Erro ao iniciar servidor:', err);
  process.exit(1);
});
