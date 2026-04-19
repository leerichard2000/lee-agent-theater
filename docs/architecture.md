# Arquitetura — Lee Agent Theater

Documento de referência rápida sobre como os pacotes se encaixam e como um
evento atravessa o sistema de ponta a ponta.

Para detalhes específicos, ver também:

- [phaser-scene.md](phaser-scene.md) — internals da cena 2D.
- [adapters.md](adapters.md) — contrato e walkthrough dos adapters.

---

## Layout do monorepo

```
lee-agent-theater/
├── apps/
│   ├── server/        # Fastify + WebSocket + serve bundle estático
│   └── web/           # React + Phaser 3 (frontend)
└── packages/
    ├── core/          # @theater/core — contratos, tipos, Zod schemas
    └── adapters/
        ├── adapter-demo/           # Sessão Demo scriptada
        ├── adapter-claude-local/   # Lê ~/.claude/teams, tasks, inboxes
        ├── adapter-claude-hooks/   # (placeholder)
        ├── adapter-claude-sdk/     # (placeholder)
        ├── adapter-mcp/            # (placeholder)
        └── adapter-file-log/       # (placeholder)
```

Gerenciamento: `pnpm-workspace.yaml`. Cada pacote expõe `@theater/<nome>`.

---

## Stack real

| Camada | Tecnologia |
|---|---|
| Frontend | TypeScript, React 18, Phaser 3, Zustand (vanilla + hook), Vite, Tailwind 4 |
| Backend | TypeScript, Node 20+, Fastify, `@fastify/websocket`, `@fastify/static`, `@fastify/cors`, pino |
| Core | TypeScript, Zod |
| Tooling | pnpm 9+, tsx (dev server), Vitest, ESLint, Prettier |

---

## Fluxo de um evento, fim a fim

```
┌────────────────────────┐
│ Fonte (Claude Code,    │
│ script demo, etc.)     │
└──────────┬─────────────┘
           │ file watch / timer / SDK hook
           ▼
┌────────────────────────┐
│ Adapter                │   packages/adapters/<adapter-*>
│ - normaliza p/         │
│   TheaterEvent         │
│ - valida com Zod       │
└──────────┬─────────────┘
           │ HTTP POST /api/events  ou  onEmit(cb) direto
           ▼
┌────────────────────────┐
│ SessionStore (server)  │   apps/server/src/store.ts
│ - upsert sessão        │
│ - ring buffer 1000 ev. │
│ - upsert agentes       │
└──────────┬─────────────┘
           │ onEvent / onAgentUpdate callbacks
           ▼
┌────────────────────────┐
│ WsHub (broadcast)      │   apps/server/src/ws.ts
│ - broadcast por        │
│   sessão inscrita      │
└──────────┬─────────────┘
           │ ws://localhost:3001/ws  (WS_PATH em core/constants)
           ▼
┌────────────────────────┐
│ theaterStore (Zustand) │   apps/web/src/stores/theaterStore.ts
│ - buffer de eventos    │
│ - agentes ativos       │
│ - filtros e playback   │
└──────────┬─────────────┘
           │ subscribe() em TheaterScene.create()
           ▼
┌────────────────────────┐
│ TheaterScene (Phaser)  │   apps/web/src/phaser/TheaterScene.ts
│ - cria/remove sprites  │
│ - enfileira animação   │
│ - serializa via `lock` │
└────────────────────────┘
```

Pontos não-óbvios:

- Adapters rodando **dentro do server** (caso de uso atual do `adapter-demo` e
  `adapter-claude-local`, ver `apps/server/src/index.ts`) usam
  `onEmit(cb)` para gravar direto no `SessionStore` e pular o round-trip
  HTTP. O método `emit()` em `BaseAdapter` (HTTP POST) existe como fallback
  para adapters externos em processos separados.
- `SessionStore` é in-memory puro. Ao reiniciar o server, todas as sessões
  desaparecem. Limite de eventos por sessão: `MAX_EVENTS_PER_SESSION` (em
  `@theater/core/constants.ts`).
- Toda broadcast WebSocket é filtrada por `subscribedSessions` — um client
  só recebe eventos das sessões em que chamou `{type:"subscribe"}`.

---

## Contratos principais (`@theater/core`)

Arquivos em `packages/core/src/`:

- `events.ts` — `TheaterEvent`, `EventType`, `EventStatus`.
- `agents.ts` — `AgentInfo`, `AgentState`, `AgentPosition`.
- `session.ts` — `SessionState`, `SessionStatus`.
- `adapter.ts` — `TheaterAdapter`, `BaseAdapter`, `AdapterConfig`.
- `validation.ts` — schemas Zod (`TheaterEventSchema`, `validateEvent`).
- `websocket.ts` — `WsClientMessage`, `WsServerMessage`, `WS_PATH`.
- `utils.ts` — helper `createEvent(id, partial)`.
- `constants.ts` — `DEFAULT_SERVER_PORT`, `MAX_EVENTS_PER_SESSION`.

### `TheaterEvent`

```ts
interface TheaterEvent {
  id: string;                        // UUID v4
  timestamp: string;                 // ISO 8601
  sessionId: string;
  projectId?: string;
  sourceAgent: AgentInfo;
  targetAgent: AgentInfo | null;     // null → broadcast / evento de sistema
  eventType: EventType;
  summary: string;                   // balão na cena (máx 280 chars)
  content: string;                   // painel lateral
  status: EventStatus;
  metadata: Record<string, unknown>;
}
```

O par `sourceAgent` / `targetAgent` é o que decide **qual animação** dispara
no Phaser (ver [phaser-scene.md](phaser-scene.md)).

### `EventType`

`MESSAGE_SENT`, `MESSAGE_RECEIVED`, `AGENT_JOINED`, `AGENT_LEFT`,
`SESSION_STARTED`, `SESSION_ENDED`, `TOOL_CALL`, `TOOL_RESULT`, `THINKING`,
`ERROR`, `STATUS_CHANGE`, `CUSTOM`.

Apenas `MESSAGE_SENT` e `MESSAGE_RECEIVED` são tratados como "conversa" no
frontend (dispara `animateConversation` ou `animateBroadcast`). Os demais
caem em `animateSimpleEvent` — balão + mudança de estado, sem movimento.

### `AgentInfo`

```ts
interface AgentInfo {
  id: string;         // ex.: "claude-lucas-techlead", "agent-architect"
  name: string;
  role?: string;
  color?: string;     // hex, usado no glow da mesa e borda do balão
  state?: AgentState; // 8 estados (ver agents.ts)
  position?: AgentPosition;
}
```

Convenção de id do adapter-claude-local: `claude-<nome-do-membro>`. Adapter
demo: `agent-<role>`. O frontend não impõe formato, apenas usa como chave.

---

## API REST (debug)

Prefixo `/api`, registrada em `apps/server/src/routes/`.

| Método | Rota | Uso |
|---|---|---|
| GET | `/api/health` | Liveness + versão |
| GET | `/api/status` | Lista sessões + uptime + clients WS |
| GET | `/api/events?sessionId=…&limit=&offset=` | Pagina eventos |
| POST | `/api/events` | Recebe TheaterEvent de adapter externo |
| GET | `/api/agents?sessionId=…` | Agentes da sessão |

Não existe endpoint de mutação de sessão ou de adapter — o
`AdapterRegistry` descrito no README original nunca foi implementado.
Adapters são instanciados no bootstrap do server (`apps/server/src/index.ts`).

---

## Configuração via env

Lidos em `apps/server/src/index.ts`:

| Variável | Default | Função |
|---|---|---|
| `SERVER_PORT` | `3001` | Porta HTTP/WS |
| `SERVER_HOST` | `localhost` | Interface do Fastify |
| `LOG_LEVEL` | `info` | pino |
| `DEMO_ADAPTER` | `true` | `"false"` desliga a Sessão Demo |
| `CLAUDE_LOCAL_ADAPTER` | `true` | `"false"` desliga o adapter Claude Local |
| `CLAUDE_POLL_INTERVAL_MS` | `2000` | Intervalo de polling do `ClaudeWatcher` |

O frontend usa `VITE_WS_URL` / `VITE_API_URL` quando presentes; caso
contrário, infere do hostname atual.

---

## Sanidade do bundle (OneDrive gotcha)

`inspectWebDist()` em `apps/server/src/index.ts` valida que
`apps/web/dist/` tem `index.html` + pelo menos um `.js` em `assets/` antes
de registrar o `fastify-static`. Motivo: sync do OneDrive já removeu
bundles silenciosamente em Windows (ver PATCH_NOTES v0.11.5 / #e57175c3).
Se a validação falha, o server loga erro claro e não serve o frontend —
rode `pnpm --filter @theater/web build` para regenerar.
