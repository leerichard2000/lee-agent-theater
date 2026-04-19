# Security Audit — Lee Agent Theater

**Data:** 2026-04-17
**Auditor:** Bruno (devsecops, time `forge-labs`)
**Task:** #4f74ec44
**Escopo:** monorepo completo (`apps/server`, `apps/web`, `packages/core`, `packages/adapters/*`)
**Postura atual de exposição:** `localhost-only` por padrão (`SERVER_HOST=localhost`, sem TLS, sem auth). Findings marcados `LOCAL-ONLY` mudam de severidade se o servidor passar a ser exposto (bind `0.0.0.0`, reverse proxy público, tunnel tipo ngrok, etc.).

---

## Resumo executivo

| Severidade | Qtd | Bloqueia release? |
|---|---|---|
| CRITICAL | 0 | — |
| HIGH | 0 | — |
| MEDIUM | 4 | Não (todos `LOCAL-ONLY`, dependem de futura exposição) |
| LOW | 6 | Não |
| INFO | 4 | — |

**Disposição:** **NÃO bloqueia release**. O projeto é localhost-only e não lida com segredos/credenciais de usuário, não tem autenticação nem autorização, e sua superfície de ataque efetiva hoje é quem já tem acesso local à máquina do desenvolvedor. Os findings MEDIUM são *dívida de segurança* para quando/se o servidor for exposto em rede; recomendo criar follow-ups para eles antes de qualquer mudança de deployment.

**Pontos positivos observados:**

- React escapa todo texto dinâmico renderizado. Greps em código-fonte (excluindo `node_modules` e `dist`) retornaram **zero ocorrências** dos padrões perigosos de XSS/code-injection tradicionais (render de HTML bruto, execução dinâmica de strings como código).
- Phaser `Text.setText` trata conteúdo como texto puro (não HTML).
- Zod (`TheaterEventSchema`) valida a forma de todo evento em `/api/events` (POST).
- Adapter Claude Local é rigorosamente **read-only** (imports apenas de `readFile`, `readdir`, `stat` — nenhum `writeFile`/`unlink`/`exec`/`spawn`).
- Ring buffer em `SessionStore.addEvent` protege contra memory exhaustion por flood de eventos (limite 1000 por sessão).
- `.env` em `.gitignore`; `.env.example` contém apenas placeholders sem valores reais.
- `pnpm-lock.yaml` committado.

---

## Findings

### [MED-01] (LOCAL-ONLY) Ausência de autenticação/autorização no servidor HTTP e WebSocket

**Severidade:** MEDIUM (HIGH se exposto fora de localhost)
**Local:** `apps/server/src/index.ts:91` (`cors({ origin: true })`), `apps/server/src/ws.ts`, `apps/server/src/routes/*`

**Descrição.** Nenhum endpoint REST nem a rota WS (`/ws`) exige autenticação. Qualquer processo que conseguir abrir uma conexão TCP para o port alvo tem permissão total para:

- Listar todas as sessões (`GET /api/status`, `GET /api/events`, `GET /api/agents`).
- Se inscrever em qualquer `sessionId` via WS e receber todo o tráfego de eventos em tempo real.
- Injetar eventos arbitrários via `POST /api/events` (sem deduplicação, sem rate-limit, sem assinatura).

**Evidência.**

- `apps/server/src/ws.ts:76-107`: handler WS aceita qualquer socket que cumpra o handshake; não inspeciona `Origin`, não valida tokens em query/cookie.
- `apps/server/src/routes/events.ts:54-75`: `POST /events` aceita qualquer corpo que passe `validateEvent` — não há verificação de quem enviou.
- `apps/server/src/index.ts:91`: `origin: true` em CORS espelha o Origin do requisitante, habilitando credentialed requests de qualquer página web.

**Impacto.**

- **Hoje (localhost-only):** limitado a processos locais, mas qualquer página aberta no mesmo browser pode fazer `fetch('http://localhost:3001/api/events', {method:'POST', body:…})` ou abrir uma conexão WebSocket para `/ws` — uma aba maliciosa **consegue** injetar eventos falsos no palco e espionar conversas em andamento (CSRF/cross-origin tradicional).
- **Se o servidor for exposto** (tunnel, LAN, deploy público): vira HIGH — vazamento de todas as conversas entre agentes e vetor de injeção.

**Recomendação.**

1. Enquanto `localhost-only`: manter `SERVER_HOST=localhost` rigorosamente (hoje já é default — bom). Restringir CORS para `origin: 'http://localhost:<port>'` específico em vez de `true`.
2. Se for expor: adicionar token compartilhado (ex.: `Authorization: Bearer <token>` em REST + query `?token=<token>` no WS handshake). Rejeitar conexões cujo `Origin` não esteja em allowlist.
3. Considerar desabilitar `POST /api/events` quando nenhum adapter interno o utilizar — hoje os adapters `demo` e `claude-local` usam `onEmit` direto ao store (ver `apps/server/src/index.ts:157-162, 190-195`), então o POST é usado apenas por adapters externos (ex.: `adapter-mcp`, `adapter-claude-hooks`, `adapter-file-log`) que poderiam usar IPC ou Unix socket em vez de HTTP.

---

### [MED-02] (LOCAL-ONLY) Ausência de rate limiting e body size limit explícito

**Severidade:** MEDIUM (LOW em localhost puro)
**Local:** `apps/server/src/index.ts` (bootstrap do Fastify)

**Descrição.** O servidor não registra `@fastify/rate-limit` e não sobrescreve `bodyLimit` (default do Fastify: 1 MB). Não há throttle por IP/sessão nem em REST nem em WS.

**Impacto.**

- `POST /api/events` repetido em loop satura o ring buffer (o ring buffer protege a memória — ver `store.ts:101-104` — mas CPU para `validateEvent` + broadcast WS fica ocupada).
- WS sem limit: cliente mal-intencionado pode abrir muitas conexões e receber broadcast de sessões grandes (não há cap de `clients.size`).
- Sem limit explícito de tamanho de mensagem WS do cliente (`socket.on('message', …)` em `ws.ts:85` aceita qualquer buffer até o default de `@fastify/websocket`; vale tornar explícito).

**Recomendação.**

1. Registrar `@fastify/rate-limit` com limite moderado (ex.: 100 req/min por IP) em `apps/server/src/index.ts`.
2. Definir `bodyLimit: 64_000` (ou similar) no `Fastify({...})`.
3. Em `ws.ts`, dropar conexões que excedam N mensagens/segundo ou tamanhos absurdos (`raw.length > 32_000`).
4. Opcional: cap no número de sessões inscritas por cliente (`client.subscribedSessions`), para evitar que um client inscreva-se em todas as sessões e consuma bandwidth.

---

### [MED-03] Path traversal teórico em `adapter-claude-local` via `teamName` / `memberName`

**Severidade:** MEDIUM (LOW na configuração atual)
**Local:** `packages/adapters/adapter-claude-local/src/claude-reader.ts:140-194`

**Descrição.** `teamName` e `memberName` são concatenados em caminhos via `path.join(claudeDir, 'teams', teamName, …)` e `path.join(…, 'inboxes', ${memberName}.json)` sem validação de caracteres. `path.join` **não** previne traversal: `teamName = '../../etc'` resolve fora do `claudeDir`.

**Origem dos valores (hoje):**

- `teamName` vem de `reader.listTeams()` (só nomes de subdiretórios reais em `~/.claude/teams`) **ou** do parâmetro `opts.teams` passado ao construtor (hoje não é preenchido pelo server — `apps/server/src/index.ts:184-187`).
- `memberName` vem de `agent.name`, que por sua vez vem de `config.json.members[*].name` ou `members.meta.json.members[*].name`, ambos arquivos no diretório do time.

**Por que é um risco real (ainda que indireto):**

- Se algum dia `opts.teams` passar a ser preenchido por configuração externa (env var, request parameter, CLI arg), traversal vira exploitable direto.
- Se um atacante puder criar um `config.json` com `members[].name = '../../foo'` na pasta de um time (por exemplo via outro processo Claude Code comprometido), `readInbox` tentará abrir `~/.claude/teams/<time>/inboxes/../../foo.json` — que pode resolver para qualquer JSON legível pelo usuário. `safeReadJson` retorna `null` em erro mas não distingue "arquivo fora do root".

**Impacto.** Information disclosure de qualquer JSON legível pelo usuário do processo (arquivos em `~/.claude/`, JSONs de configuração variados, etc.), desde que o atacante controle um `config.json`/meta JSON. Em cenário localhost-only com usuário único, risco é teórico; em máquinas multi-usuário ou se o adapter virar um consumer de input externo, vira explorável.

**Recomendação.**

1. Em `claude-reader.ts`, validar que `teamName` e `memberName` casam `^[A-Za-z0-9._-]+$` antes de usar em `join`. Rejeitar/ignorar valores que não casem.
2. Após `join`, verificar que o path resolvido começa com `this.claudeDir` (`resolve(filePath).startsWith(resolve(this.claudeDir))`).
3. Aplicar a mesma validação ao campo `agent.name` em `adapter-claude-local/src/index.ts` na construção do AgentInfo, para defender emissão de `sessionId`/`id` derivados (`claude-${member.name}` em `index.ts:559`, `573`) — valores maliciosos poderiam quebrar filtros por sessionId ou introduzir IDs ambíguos.

---

### [MED-04] Filtro de heartbeats embedded em `text` é case-sensitive e whitelist-based

**Severidade:** MEDIUM (LOW em operação normal)
**Local:** `packages/adapters/adapter-claude-local/src/index.ts:404-424` (`isEmbeddedSystemPayload`)

**Descrição.** O filtro que suprime heartbeats JSON embutidos em `text` usa:

```ts
if (!trimmed.startsWith('{')) return false;
const parsed = JSON.parse(trimmed);
return SYSTEM_TYPES.has(parsed.type);
```

Problemas possíveis:

- **Array JSON:** `text = "[{...}]"` não começa com `{` → passa direto como MESSAGE_SENT com array renderizado no frontend. Não é XSS (React escapa), mas polui o histórico.
- **Whitespace antes de `{`:** coberto por `trimStart()` — ok.
- **Prefix attack:** `text = "fake prefix {…}"` não começa com `{` → passa como mensagem normal (ok).
- **Novos tipos de heartbeat adicionados ao orquestrador** não entram em `SYSTEM_TYPES` → ficam visíveis. Isso já aconteceu historicamente (heartbeats adicionados em ondas). O filtro é *deny-list* implícita, o que é frágil.

**Impacto.** Hoje: usabilidade (ruído no histórico). Não é vetor de ataque direto porque o sanitizador `<info_for_agent>` em `sanitizeText` apaga blocos de injeção; mas note que `sanitizeText` roda depois — se um futuro "embedded payload" tiver conteúdo mais arriscado (URLs, comandos), passaria direto para `content`.

**Recomendação.**

1. Inverter para **allow-list**: qualquer JSON-objeto cujo `type` esteja fora de um conjunto pequeno de tipos válidos de mensagem visível (ex.: `task_update`, `broadcast`) é tratado como sistema e suprimido.
2. Também checar `Array.isArray(parsed)` → suprime.
3. Documentar em `docs/adapters.md` qual é a política de embedded payloads (hoje o doc menciona `<info_for_agent>` mas não o filtro de types).

---

### [LOW-01] CVE-2026-6410 / CVE-2026-6414 em `@fastify/static@8.3.0`

**Severidade:** LOW (não aplicável à configuração atual)
**Local:** `apps/server/package.json` (`"@fastify/static": "^8.0.0"` → resolve 8.3.0)

**Descrição.** `pnpm audit` reporta 2 advisories moderate:

- **CVE-2026-6410 (GHSA-pr96-94w5-mx2h):** path traversal em *directory listing*. Requer `list: true` no plugin — **não usado** em `apps/server/src/index.ts:119` (a config tem só `root`, `prefix`, `wildcard: false`). Não aplicável.
- **CVE-2026-6414 (GHSA-x428-ghpx-8j92):** route guard bypass via `%2F` encoded. Requer middleware de autorização em paths servidos estaticamente — **não existe** neste projeto. Não aplicável.

**Impacto.** Nenhum hoje. Mas o versioner `^8.0.0` trava em `<9.0.0` e o fix está em `>= 9.1.1`.

**Recomendação.** Atualizar para `@fastify/static@^9.1.1` (ou mais recente compatível com Fastify 5). Baixo esforço; remove os advisories do output de `pnpm audit`.

---

### [LOW-02] CORS `origin: true` é permissivo

**Severidade:** LOW
**Local:** `apps/server/src/index.ts:91`

**Descrição.** `origin: true` em `@fastify/cors` espelha qualquer Origin e habilita CORS com credenciais se combinado com cookies — não é o caso hoje (sem cookies/autenticação), mas é uma pegada perigosa. Qualquer página web aberta no mesmo browser pode fazer requests cross-origin ao server.

**Recomendação.** `origin: ['http://localhost:5173', 'http://localhost:3001']` (Vite dev + server). Se o server também serve o frontend buildado, `origin: false` é suficiente (mesma origem).

---

### [LOW-03] Session IDs não são criptograficamente opacos; ausência de namespace

**Severidade:** LOW
**Local:** `apps/server/src/index.ts:192, 201`, `packages/adapters/adapter-claude-local/src/index.ts:182-203`

**Descrição.** `sessionId` é determinístico e previsível:

- Demo: `demo.getSessionId()` — fixo.
- Claude: `claude-<teamName>` — derivado de nome de pasta.
- Se um atacante local souber o nome do time, consegue se inscrever.

**Impacto.** Combinado com [MED-01], qualquer processo local pode observar tráfego Claude Local conhecendo o nome do time. Não é "vazamento" em localhost-only mas nota-se.

**Recomendação.** Opcional: aceitar um prefixo randômico por boot do servidor (`nanoid()` já é dep) e expor o sessionId via `/api/status`, mantendo a associação internamente. Aumenta custo para adivinhação.

---

### [LOW-04] Sem limite de tamanho de `summary`/`content` no broadcast WS

**Severidade:** LOW
**Local:** `apps/server/src/ws.ts:47-53`, `packages/core/src/validation.ts:48`

**Descrição.** `summary` tem cap de 280 chars no Zod. `content` é `z.string()` sem limite superior. Um adapter pode emitir um evento com `content` de vários MB e o server distribui para todos os clients inscritos.

**Impacto.** Em LAN, um cliente lento é derrubado; server continua rodando. Em localhost-only, negligenciável.

**Recomendação.** Cap `content.max(50_000)` em `TheaterEventSchema`. Se o conteúdo real for maior (ex.: output de tool longo), truncar com indicador "..." em vez de rejeitar.

---

### [LOW-05] Error handler do WS manipula `clients.delete` duas vezes

**Severidade:** LOW (code quality com implicação defensiva)
**Local:** `apps/server/src/ws.ts:97-105`

**Descrição.** `socket.on('close')` e `socket.on('error')` ambos removem o cliente. Se `error` disparar antes de `close`, o cliente é removido, `close` roda sobre um `Set` que não contém mais a entrada — tudo bem no `Set.delete`, mas o `clients.size` do log fica incorreto. Sem impacto de segurança direto, mas pode mascarar erros em diagnóstico de flood.

**Recomendação.** Guardar uma flag `client.removed = true` e só remover+logar uma vez.

---

### [LOW-06] `inspectWebDist` usa `statSync` sem validar `assetsDir` ⊂ `webDistPath`

**Severidade:** LOW (não explorável na config atual)
**Local:** `apps/server/src/index.ts:45-83`

**Descrição.** `inspectWebDist` recebe `distPath` construído internamente (`resolve(import.meta.dirname, '../../../apps/web/dist')`) — hoje o valor é hard-coded, sem input externo. Nenhum risco prático.

**Recomendação.** Nenhuma ação necessária. Registrar aqui apenas para auditoria futura: **se algum dia** `webDistPath` passar a vir de env var (ex.: `WEB_DIST_PATH`), aplicar whitelist/canonicalização para que `assetsDir = join(distPath, 'assets')` não escape da raiz esperada.

---

### [INFO-01] `.env` e secrets

**Local:** `.gitignore:10-12`, `.env.example`

**Observação.** `.env`, `.env.local`, `.env.*.local` estão no `.gitignore`. `.env.example` contém apenas placeholders (`SERVER_PORT=3001`, `LOG_LEVEL=info`, etc.) — **sem** valores sensíveis. Greps por `API_KEY|apiKey|password|SECRET|TOKEN` no source (excluindo `node_modules` e `dist`) não encontraram segredos committados — apenas strings temáticas em `adapter-demo` (mensagens de exemplo fictícias sobre JWT/refresh token — texto simulado, não credenciais reais).

**Status:** OK.

---

### [INFO-02] `localStorage` / `sessionStorage` no frontend

**Local:** `apps/web/src/` (greps no source puro)

**Observação.** Nenhum uso de `localStorage` ou `sessionStorage` em código-fonte do frontend (apenas no bundle `dist/` pré-compilado e em `node_modules/phaser` — não é nosso código). Store do Zustand é in-memory apenas, volátil por page reload. **Nenhum dado sensível persistido**.

**Status:** OK.

---

### [INFO-03] Source maps em produção

**Local:** `apps/web` build output

**Observação.** `dist/assets/*.js.map` ficam disponíveis em produção se o server estiver servindo `apps/web/dist` com `fastifyStatic`. Source maps expõem structure/variable names do app. Para localhost-only não é problema, mas registra-se para eventual exposição pública.

**Recomendação (se expor):** configurar Vite com `build.sourcemap: false` ou não servir `.map` via `fastifyStatic` (filtro no `send` hook).

---

### [INFO-04] `fs.watch` com `recursive: true` no Windows

**Local:** `packages/adapters/adapter-claude-local/src/watcher.ts:97`

**Observação.** Não é security finding — só nota operacional. `fs.watch` com `recursive: true` tem comportamento inconsistente entre plataformas (comentário no código já reconhece, mitigado com polling de 2s). Sem impacto de segurança.

**Status:** OK (side note).

---

## Apêndice A — `pnpm audit` (2026-04-17)

```text
Total: 2 vulnerabilidades moderate / 0 high / 0 critical
Dependencies: 321 | devDependencies: 0

1. GHSA-pr96-94w5-mx2h — CVE-2026-6410
   Pacote: @fastify/static (v8.3.0)
   Severidade: moderate (CVSS 5.3)
   Caminho: apps__server>@fastify/static
   Requer: list option enabled (NÃO USADO aqui)
   Fix: upgrade para >=9.1.1

2. GHSA-x428-ghpx-8j92 — CVE-2026-6414
   Pacote: @fastify/static (v8.3.0)
   Severidade: moderate (CVSS 5.9)
   Caminho: apps__server>@fastify/static
   Requer: middleware de autorização em paths servidos (NÃO EXISTE aqui)
   Fix: upgrade para >=9.1.1
```

Nenhum advisory aplicável à configuração atual do projeto; ainda assim recomenda-se upgrade para remover os alertas do output e evitar regressão se `list`/route-guards forem adicionados no futuro.

---

## Apêndice B — Checklist de follow-ups sugeridos

Tasks separadas recomendadas (não aplicadas nesta audit por restrição de escopo):

1. **[MED-01] Auth token + CORS restrito** — tech-lead + carlos-backend. Bloquear antes de qualquer exposição fora de localhost.
2. **[MED-02] Rate limit + bodyLimit** — carlos-backend. Independente de exposição, boa higiene.
3. **[MED-03] Validação de `teamName`/`memberName` em `adapter-claude-local`** — carlos-backend. Whitelist regex + path containment check.
4. **[MED-04] Filtro allow-list em `isEmbeddedSystemPayload`** — carlos-backend. Documentar em `docs/adapters.md`.
5. **[LOW-01] Upgrade `@fastify/static` para `^9.1.1`** — carlos-backend. Verificar compatibilidade com Fastify 5. Trivial.
6. **[LOW-02] CORS origin explícito** — carlos-backend. Pequeno.
7. **[LOW-04] Cap `content.max()` no `TheaterEventSchema`** — carlos-backend.
8. **[LOW-03/05/06 + INFO-03]** — baixa prioridade, agrupar em "hardening cleanup" quando houver espaço.

---

**Disposição final do audit:** **APROVADO PARA RELEASE — NÃO BLOQUEADO.**
Recomendo que itens MED sejam endereçados **antes** de qualquer mudança de postura que torne o servidor acessível fora de `localhost`.
