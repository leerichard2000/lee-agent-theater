# Changelog

Todas as mudanças notáveis deste projeto são documentadas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

Para o histórico detalhado por patch (decisões, causa raiz, verificação,
notas técnicas), ver [PATCH_NOTES.md](PATCH_NOTES.md).

---

## [Unreleased]

## [0.14.8] — 2026-04-17

### Documentation
- Seção "Troubleshooting" no README cobrindo OneDrive removendo `.js`, tela branca em `dev:server` e triagem em 5 passos quando nada aparece no palco.
- Screenshot real da Sessão Demo no topo do README (`docs/screenshots/demo-4-agents-meeting.png`), substituindo referência a placeholder inexistente.
- `CHANGELOG.md` (este arquivo, formato Keep a Changelog) consolidando releases a partir da v0.1.0.
- `CODE_OF_CONDUCT.md` curto com referência ao autor original Lee Richard.

## [0.14.7] — 2026-04-18

### Added
- ESLint 9 (flat config) + Prettier 3 reais no monorepo: `eslint.config.js` com `typescript-eslint` + plugins React, `.prettierrc.json`, `.prettierignore`. Script `pnpm lint` passa a rodar `eslint .` em vez de no-op.
- Scripts `lint:fix`, `format` e `format:check` na raiz.

### Changed
- `package.json` raiz: `"type": "module"` adicionado; devDeps de ESLint, Prettier e plugins React/TypeScript.
- Removidos os scripts `"lint": "echo 'lint ok'"` de todos os workspaces (lint centralizado na raiz).

### Fixed
- Dois warnings detectados pelo novo lint em `apps/web/src/stores/theaterStore.ts`: constante `STAGE_HEIGHT_PHASER` não usada removida e `loadHistory` ajustado para não receber parâmetro não utilizado.

## [0.14.6] — 2026-04-19

### Added
- `.github/workflows/ci.yml` — CI no GitHub Actions: checkout + pnpm v10 + Node 20 + `install --frozen-lockfile` + `pnpm typecheck` + `pnpm build`. `pnpm lint`/`test`/`audit` com `continue-on-error` até suite real estar estável.
- `.github/dependabot.yml` — updates semanais (seg 09:00 America/Sao_Paulo) para root, `apps/server`, `apps/web`, `packages/core` e `github-actions`.
- `.github/ISSUE_TEMPLATE/bug_report.md` e `feature_request.md` — templates com perguntas específicas do projeto (OneDrive/Dropbox/iCloud, sessão Demo vs Claude Local, impacto em adapters/`TheaterEvent`/Phaser).
- `docs/screenshots/demo-4-agents-meeting.png` — print da Sessão Demo preservado como imagem oficial do README.

### Changed
- `@fastify/static` bumpado de `^8.0.0` para `^9.1.1` em `apps/server/package.json`. Resolve GHSA-pr96-94w5-mx2h (path traversal) e GHSA-x428-ghpx-8j92 (route guard bypass).

### Removed
- 29 PNGs de QA deletados da raiz (`broadcast-*`, `final-*`, `fix-*`, `fix-targetretry-*`, `flip-*`, `theater-*`) — eram prints de debug/regressão intermediários, não servem como documentação pública.

## [0.14.5] — 2026-04-19

### Added
- `docs/publish-readiness.md` — checklist de preparação para publicação pública no GitHub com 9 ações pendentes priorizadas.
- `.editorconfig` com defaults UTF-8/LF/2 espaços, override para `*.md` e `Makefile`.
- `.gitignore` expandido cobrindo `.playwright-mcp/`, `.remember/`, PNGs de QA da raiz, logs de pnpm/yarn.

## [0.14.4] — 2026-04-17

### Fixed
- Dropdown de sessões acumulava ~15 entradas idênticas de "Sessão Demo" porque o `adapter-demo` regenerava `sessionId` a cada loop do cenário. Agora usa ID estável `demo-session`.
- Diretório órfão `~/.claude/teams/<uuid>/` sem `config.json` entrava na lista de times monitorados. `adapter-claude-local` passa a filtrar esses diretórios no `start()`.

## [0.14.3] — 2026-04-18

### Fixed
- Layout em círculo intermitente ao trocar de sessão: `TheaterScene.createAgentSprite` deixou de respeitar `agent.position` do adapter e passou a usar sempre o slot calculado por `calculateLayout` (grid + mesa individual).

## [0.14.2] — 2026-04-18

### Added
- Carregamento de histórico completo via `GET /api/events?limit=1000` ao abrir ou trocar de sessão, com spinner no painel lateral enquanto carrega.
- Deduplicação de eventos por `id` no `theaterStore` (cobre race REST+WS).

## [0.14.1] — 2026-04-17

### Documentation
- `docs/security-audit.md` — audit de segurança end-to-end (server, adapters, frontend, dependências). Resultado: 0 CRITICAL, 0 HIGH, 4 MEDIUM, 6 LOW, 4 INFO. Não bloqueia release em postura localhost-only.

## [0.14.0] — 2026-04-17

### Added
- Ícone de engrenagem "trabalhando" em sessões Claude Local: `adapter-claude-local` emite `THINKING` quando uma task vai para `in_progress` ou já está `in_progress` no scan inicial. Paridade visual com a Sessão Demo.

## [0.13.11] — 2026-04-17

### Documentation
- Plano de QA (`docs/test-plan.md`) e resultados de execução (`docs/test-results.md`) cobrindo cenários P0/P1/P2 do sistema.

## [0.13.10] — 2026-04-17

### Fixed
- Lead real (`claude-<lead-name>`) agora emite `AGENT_JOINED` no `adapter-claude-local`. Antes o lead ficava fora da lista de `buildAgentList` e `MESSAGE_SENT` com `targetAgent` apontando para ele caía em fallback de sintetização que cancelava tweens.

## [0.13.9] — 2026-04-18

### Fixed
- `relayoutAgents()` adiado quando uma animação está em vôo — defesa em profundidade contra tweens cancelados por reposicionamento abrupto durante conversa.

## [0.13.8] — 2026-04-18

### Fixed
- Player/timeline respeita cursor selecionado: ao escolher um evento passado e apertar Play, a cena reanima a partir desse ponto em vez de pular pro último evento.

## [0.13.7] — 2026-04-17

### Documentation
- Docs vivos criados em `docs/`: `architecture.md`, `phaser-scene.md`, `adapters.md`. README atualizado com seção "Sessões: Demo vs Claude Local", env vars, tabela de API REST corrigida (removidas rotas `/api/sessions` e `/api/adapters` inexistentes).

## [0.13.6] — 2026-04-18

### Added
- `animateBroadcast`: `MESSAGE_SENT` com `targetAgent: null` agora dispara animação — emissor caminha até o centro da mesa de reunião, fala, retorna à mesa individual. Comunica visualmente "falando pro time todo".

## [0.13.5] — 2026-04-18

### Fixed
- Animação de reunião voltava a não disparar quando `MESSAGE_SENT` chegava antes do `AGENT_JOINED` do target. `TheaterScene.animateEvent` ganhou retry simétrico ao do source (spawna sprite on-demand e reagenda em 50ms).

## [0.13.4] — 2026-04-17

### Fixed
- `pnpm dev:server` servindo tela branca quando o bundle em `apps/web/dist` estava corrompido pelo OneDrive. Novo `inspectWebDist()` valida `index.html` + `assets/*.js` antes de registrar `fastify-static`; falha explicitamente em vez de servir silenciosamente.

## [0.13.3] — 2026-04-18

### Changed
- Flip do posicionamento agente+mesa individual: agente em pé logo abaixo da mesa (cabeça sobrepondo a base), em vez de "sentado atrás". Decisão do usuário.

## [0.13.2] — 2026-04-17

### Fixed
- Sessão `forge-labs` (Claude Local) não disparava animação de conversa: `adapter-claude-local` passou a preencher `targetAgent` usando o nome do arquivo da inbox como fallback quando o campo `to` top-level está em branco. Filtros adicionados para ignorar `user.json`, `team-lead.json` e heartbeats embutidos em JSON no campo `text`.

## [0.13.1] — 2026-04-18

### Fixed
- Bugs visuais pequenos herdados da integração da cena dinâmica (#7f55851a): depth de sprite e ordem de render de mesas individuais vs mesa de reunião.

## [0.13.0] — 2026-04-18

### Added
- Cena dinâmica do escritório integrada aos sprites `OfficeDesk` e `MeetingTable` com `calculateLayout` escalável (≤8, ≤16, 17+ agentes).

## [0.12.0] — 2026-04-18

### Added
- Sprites `OfficeDesk` (1 mesa individual por agente, estados `idle`/`occupied`/`away` com glow opcional) e `MeetingTable` (singleton da cena) + helper puro `getMeetingSeatPositions(tableX, tableY, n)` com ordem preferencial S1..S6 (S1+S4 diagonal para N=2).

## [0.11.5] — 2026-04-17

### Fixed
- `pnpm dev:server` quebrando com `ERR_MODULE_NOT_FOUND` em `packages/core/dist/validation.js` porque `zod` tinha só `index.cjs` em `packages/core/node_modules/`. OneDrive sync em Windows remove `.js` esporadicamente.

## [0.11.4] — 2026-04-17

### Fixed
- Drop-shadow do balão de fala cobrindo ~4-6px abaixo da caixa visível — ajuste do gap compensa a extensão da shadow.

## [0.11.3] — 2026-04-17

### Fixed
- Setinha do balão posicionada dentro do sprite porque o âncora não compensava a protrusão da cauda (`TAIL_HEIGHT`).

## [0.11.2] — 2026-04-17

### Fixed
- Drift linear label↔sprite corrigido usando `sprite.getBounds()` do Phaser em vez de cálculo manual.

## [0.11.1] — 2026-04-17

### Added
- Melhorias no balão de fala: direção variável (top/left/right), sorteio por conversação, clamp de largura.

## [0.11.0] — 2026-04-17

### Changed
- Alinhamento label↔sprite reescrito com sync imperativo via `POST_UPDATE` da cena Phaser, substituindo `requestAnimationFrame` + `useLayoutEffect` reativos que tinham janelas de medição stale ao trocar de sessão.

## [0.10.0..0.10.4] — 2026-04-17

### Added
- Painel lateral de histórico com timeline, filtros por agente e por tipo de evento.
- Controles de reprodução (pause/play, velocidade 0.5x/1x/2x/4x).
- Destaque do evento ativo sincronizado entre painel e palco.

### Fixed
- Miscelânea de bugs visuais herdados da integração inicial da cena Phaser + React + Zustand.

## [0.9.0..0.9.1] — 2026-04-16..17

### Added
- `TheaterScene` com fila de animação serializada via lock `processing`.
- `animateConversation` com encontro S1+S4 na mesa de reunião e `animateSimpleEvent` para eventos sem movimento.

## [0.8.0..0.8.1] — 2026-04-16

### Added
- `AgentSprite` com 8 estados visuais, balão de fala, indicadores de status (thinking, error).
- Texturas procedurais de agentes e cenário geradas em runtime (`SpriteFactory`).

## [0.7.0..0.7.2] — 2026-04-16

### Added
- WebSocket hub com subscribe/unsubscribe por sessão no server; `theaterStore` (Zustand vanilla) consumindo no frontend.
- `ClaudeReader` e `ClaudeWatcher` do `adapter-claude-local`: leitura read-only de `~/.claude/teams/` e `~/.claude/tasks/` com polling + file watching.

## [0.6.0..0.6.3] — 2026-04-16

### Added
- `SessionStore` em memória com ring buffer de eventos e callbacks `onEvent`/`onAgentUpdate`/`onSessionChange`.
- Rotas REST `/api/health`, `/api/status`, `/api/events` (GET/POST), `/api/agents`.

## [0.5.0] — 2026-04-16

### Added
- `adapter-demo` com `FEATURE_SCENARIO` curado (Rafael, Carlos, Ana, Igor) exercitando todo o pipeline de eventos.

## [0.4.0] — 2026-04-16

### Added
- `@theater/core`: `TheaterEvent`, `EventType`, `AgentInfo`, `AgentState`, schemas Zod em `validation.ts`, `BaseAdapter`, `createEvent` helper.

## [0.3.0] — 2026-04-16

### Added
- Bootstrap do server Fastify com `@fastify/websocket`, `@fastify/cors`, `@fastify/static`, logging via pino.

## [0.2.0] — 2026-04-16

### Added
- Frontend Vite + React 18 + TypeScript + Tailwind 4 + Phaser 3.

## [0.1.0] — 2026-04-16

### Added
- Monorepo pnpm workspaces inicial (`apps/web`, `apps/server`, `packages/core`, `packages/adapters/*`).
- `tsconfig.base.json` compartilhado.
- Scripts `dev`, `dev:web`, `dev:server`, `build`, `lint`, `typecheck`, `clean` na raiz.

---

[Unreleased]: https://github.com/leerichard2000/lee-agent-theater/compare/v0.14.8...HEAD
[0.14.8]: https://github.com/leerichard2000/lee-agent-theater/releases/tag/v0.14.8
[0.14.7]: https://github.com/leerichard2000/lee-agent-theater/releases/tag/v0.14.7
[0.14.6]: https://github.com/leerichard2000/lee-agent-theater/releases/tag/v0.14.6
[0.14.5]: https://github.com/leerichard2000/lee-agent-theater/releases/tag/v0.14.5
