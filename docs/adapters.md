# Adapters

Adapters são a camada de integração do Lee Agent Theater. Cada adapter
captura dados de uma fonte externa (arquivos, SDK, logs, timer) e emite
`TheaterEvent` normalizado. Ver [architecture.md](architecture.md) para
o contexto geral.

---

## Contrato

Definido em `packages/core/src/adapter.ts`:

```ts
export interface TheaterAdapter {
  readonly config: AdapterConfig;   // { id, name, serverUrl, sessionId? }
  start(): Promise<void>;           // abre watchers/timers/hooks
  stop(): Promise<void>;            // cleanup
  isRunning(): boolean;
}
```

### `BaseAdapter`

Classe abstrata com:

- Flag `protected running = false`.
- `isRunning()` baseado em `running`.
- `protected emit(event)` que **valida com Zod** (`TheaterEventSchema.parse`)
  e faz `fetch(serverUrl + '/api/events', POST JSON)`.

Adapters que rodam **dentro do processo do server** (`adapter-demo`,
`adapter-claude-local`) sobrescrevem o caminho de envio usando um callback
`onEmit(cb)` — evita o round-trip HTTP e grava direto no `SessionStore`.

---

## Como o server carrega adapters

Não existe `AdapterRegistry`. Os adapters são instanciados
**manualmente** em `apps/server/src/index.ts` durante o bootstrap:

```ts
// Demo
if (process.env.DEMO_ADAPTER !== 'false') {
  const demo = new DemoAdapter(serverUrl);
  demo.onEmit((event) => store.addEvent(event));
  await demo.start();
}

// Claude Local
if (process.env.CLAUDE_LOCAL_ADAPTER !== 'false') {
  const claudeLocal = new ClaudeLocalAdapter({ serverUrl, pollIntervalMs });
  claudeLocal.onEmit((event) => store.addEvent(event));
  claudeLocal.onTeamDiscovered((teamName, agents) => { /* upsert agents */ });
  await claudeLocal.start();
}
```

Cleanup é via `server.addHook('onClose', () => adapter.stop())`.

Para adicionar um novo adapter ao server, siga o mesmo padrão no
bootstrap. Para um adapter externo (processo separado), basta
`BaseAdapter.emit()` fazer o POST em `/api/events`.

---

## adapter-demo

Arquivo único: `packages/adapters/adapter-demo/src/index.ts`.

- **Objetivo**: sessão curada que exercita o pipeline completo sem
  dependência externa. A Sessão Demo é o **único fluxo que funciona
  visualmente out-of-the-box** (movimentação + balões).
- **Como funciona**: define `DEMO_AGENTS` fixos (Rafael/architect,
  Carlos/developer, Ana/reviewer, Igor/devops) e um array
  `FEATURE_SCENARIO: ScenarioStep[]` com delays em ms. `start()` agenda
  os eventos via `setTimeout` encadeados, cada um chamando `emit(event)`
  com `createEvent()` do core.
- **Session id**: gerado em construção (UUID), acessível via
  `getSessionId()`. O server registra a sessão como `"Sessão Demo"`.
- **Estados visuais**: cada step pode carregar `sourceState` e
  `targetState` (ex.: `'speaking'`, `'waiting'`) que viram `metadata`
  do evento — o frontend usa para forçar transição de estado.

Usar o adapter-demo é a maneira mais rápida de validar uma mudança na
cena Phaser: `pnpm dev` com `CLAUDE_LOCAL_ADAPTER=false` desliga o
polling de arquivos e deixa só o demo rodando.

---

## adapter-claude-local

Pacote: `packages/adapters/adapter-claude-local/src/` —
`index.ts` (ClaudeLocalAdapter), `claude-reader.ts`, `watcher.ts`.

Monitora `~/.claude/teams/<team>/` e `~/.claude/tasks/<team>/` de forma
**read-only**. Nunca escreve.

### Descoberta

- Se `opts.teams` não for passado, `start()` chama
  `reader.listTeams()` e monitora todos os times encontrados.
- Para cada time, `scanTeam(teamName)`:
  1. Lê `config.json` e `members.meta.json`.
  2. Constrói lista de agentes com `buildAgentList` (filtra o alias
     `"team-lead"` do config — ele é entrada de orquestração, o lead real
     está com seu nome próprio, ex. `lucas-techlead`).
  3. Emite `SESSION_STARTED` + um `AGENT_JOINED` por membro.
  4. Snapshot do estado de cada task (`lastTaskStates`) e contagem de
     cada inbox (`lastInboxCounts`).

### Session id

`claude-<teamName>` (ex.: `claude-forge-labs`).

### File watching

`ClaudeWatcher` emite `FileChange` nos tipos: `task`, `inbox`, `kanban`,
`team_config`, `sent_messages`. Polling intervalo `pollIntervalMs`
(default 2000, sobrescrito via `CLAUDE_POLL_INTERVAL_MS`).

### Geração de eventos

Dois caminhos principais:

1. **Task (`handleTaskChange`)**:
   - Re-lê o task JSON e compara com snapshot anterior.
   - Mudança de status → `STATUS_CHANGE` do owner.
   - Novos comentários → um `MESSAGE_SENT` por comentário. Source é o
     autor do comentário; target é o owner da task (ou `null` se owner ==
     autor).

2. **Inbox (`handleInboxChange`)**:
   - Arquivo `inboxes/<member>.json` — toda mensagem nesse arquivo tem
     destinatário implícito `<member>` (mesmo se `msg.to` estiver em
     branco). Resolve o alias `team-lead` → nome real via
     `resolveAgentName`.
   - **Filtros obrigatórios** (evitam ruído e bugs na animação):
     - Ignora `inboxes/user.json` — observador humano, não é agente do
       palco.
     - Ignora `inboxes/team-lead.json` — espelho da atividade do time,
       gera duplicação e muitos `idle_notification`.
     - Ignora `msg.source === 'system_notification'`.
     - Ignora heartbeats embutidos como JSON no campo `text`
       (`{"type":"idle_notification",...}` e companhia) via
       `isEmbeddedSystemPayload`.
     - Ignora mensagens cujo `from` ou `to` seja `'user'`.
   - Auto-mensagens (`from == to`) viram broadcast (`targetAgent: null`)
     para ainda entrarem no histórico sem travar a animação de conversa.

### Cores por role

Tabela `ROLE_COLORS` no topo do `index.ts`:
`tech_lead` → violeta `#8B5CF6`, `frontend_developer` → azul, etc.
Prioridade: `member.color` > `meta.color` > `ROLE_COLORS[role]` > cinza.

### Sanitização

`sanitizeText(text)` remove blocos `<info_for_agent>...</info_for_agent>`
antes de gravar em `content`. Evita que instruções internas do orquestrador
vazem para balões visíveis.

### Limitações conhecidas

- Sessões reais (Claude Local) **não reproduzem animação de movimento /
  balões de fala do mesmo jeito que a Sessão Demo** — investigação ativa
  no momento. Sessões com muitos broadcasts (lead pra time todo) agora
  disparam `animateBroadcast` (#a33f5faa, PATCH v0.13.6), mas mensagens
  direcionadas em sessões reais ainda podem não animar dependendo do
  timing entre `AGENT_JOINED` e `MESSAGE_SENT`.
- Ao testar, selecione uma sessão válida no seletor (ex.: `claude-forge-labs`),
  não confundir com Sessão Demo.

---

## Placeholders

Existem, mas não implementados de fato (interfaces apenas):

- `adapter-claude-hooks` — captura Claude Code hooks (PostToolUse, Stop).
- `adapter-claude-sdk` — intercepta chamadas do Anthropic SDK.
- `adapter-mcp` — escuta eventos MCP.
- `adapter-file-log` — lê logs em JSON lines.

---

## Escrevendo um adapter novo

Template mínimo, rodando dentro do server:

```ts
import {
  BaseAdapter, type AdapterConfig, type TheaterEvent,
  EventType, EventStatus, createEvent,
} from '@theater/core';
import { randomUUID } from 'node:crypto';

export class MyAdapter extends BaseAdapter {
  readonly config: AdapterConfig = {
    id: 'my-adapter',
    name: 'Meu Adapter',
    serverUrl: 'http://localhost:3001',
  };

  private emitCallback: ((e: TheaterEvent) => void) | null = null;

  onEmit(cb: (e: TheaterEvent) => void) { this.emitCallback = cb; }

  async start() {
    this.running = true;
    // ... abrir watchers / hooks / timers
    this.push(createEvent(randomUUID(), {
      sessionId: 'my-session',
      sourceAgent: { id: 'system', name: 'Sistema', state: 'active' },
      eventType: EventType.SESSION_STARTED,
      summary: 'Sessão iniciada',
      content: '...',
      status: EventStatus.COMPLETED,
      metadata: {},
    }));
  }

  async stop() { this.running = false; /* cleanup */ }

  private push(event: TheaterEvent) {
    if (this.emitCallback) this.emitCallback(event);
    else this.emit(event).catch(() => {});
  }
}
```

Registrar no bootstrap do server (`apps/server/src/index.ts`) seguindo
o padrão dos adapters existentes: instanciar, cadastrar `onEmit` →
`store.addEvent`, criar sessão inicial se necessário, registrar hook
`onClose` para `adapter.stop()`.
