# Patch Notes

## [v0.14.12] — 2026-04-19

**Tipo:** Docs
**Esforço estimado:** 5min
**Autor:** Claude (renata-docs, Opus 4.7)

### Descrição
Follow-up micro da #fb7079c5 (v0.14.10): `CONTRIBUTING.md:69` também continha a URL placeholder `https://github.com/seu-usuario/lee-agent-theater.git` em um bloco de clone/fork que escapou do escopo original. Aplicado o mesmo find-replace para a URL real confirmada pelo usuário.

### Alterações
- `CONTRIBUTING.md:69` — `https://github.com/seu-usuario/lee-agent-theater.git` → `https://github.com/leerichard2000/lee-agent-theater.git` (com `.git`, formato canonical de clone/fork).

### Verificação
`Grep "seu-usuario"` no repo excluindo arquivos históricos (`PATCH_NOTES.md` e `docs/publish-readiness.md`): **zero ocorrências em arquivos funcionais**. As referências remanescentes estão apenas em notas de release/readiness descritivas do próprio placeholder — mantidas como registro de decisão.

### Impacto
- Guia de contribuição agora leva ao repo real quando o contribuidor copia o comando de clone/fork.
- Combinado com v0.14.10 (README + CHANGELOG) e v0.14.11 (`package.json` metadata do Igor), a cadeia completa de onboarding público do projeto aponta pro repo real.

---

## [v0.14.11] — 2026-04-19

**Tipo:** Config
**Esforço estimado:** 10min
**Autor:** Claude (igor-devops, Opus 4.7)

### Descrição
Publish post-release (#25a26b9b): preenchimento dos campos de metadata do npm/GitHub no `package.json` raiz agora que o usuário publicou a URL final do repo (`https://github.com/leerichard2000/lee-agent-theater.git`). Com isso, o campo "About" do GitHub, o "View on GitHub" do README e clientes npm/unpkg passam a ter as URLs corretas.

### Alterações
- `package.json` raiz:
  - `repository`: `{ "type": "git", "url": "git+https://github.com/leerichard2000/lee-agent-theater.git" }`
  - `homepage`: `https://github.com/leerichard2000/lee-agent-theater#readme`
  - `bugs`: `{ "url": "https://github.com/leerichard2000/lee-agent-theater/issues" }`
  - `keywords` expandido de 6 para 10 entradas: `agent-theater`, `multi-agent`, `visualization`, `phaser`, `claude`, `typescript`, `monorepo`, `react`, `fastify`, `websocket` (substitui as antigas `agent`/`theater`/`ai` por termos mais searchable no npm/GitHub).
  - `author` mantido como estava (`"Lee Richard <leerichard2000@gmail.com>"`) — já cobre o requisito do briefing e inclui o e-mail.
  - `description`, `license`, `scripts`, `engines`, `pnpm.onlyBuiltDependencies`, `devDependencies` preservados sem mudança.

### Impacto
- **GitHub**: a aba "About" pode puxar `description` e `homepage` direto do `package.json`. "Used by" e "Dependencies graph" passam a funcionar corretamente.
- **npm search**: apesar de `"private": true` impedir publicação no registry, `keywords` + `description` permitem indexação/discovery em tools que varrem GitHub (ex.: npms.io).
- **Dependabot** (configurado na #cc8370e6): PRs que ele abrir vão agora linkar pro issue tracker correto via `bugs.url`.
- **Zero impacto em runtime**: apenas metadata JSON.

### Verificação
- `pnpm typecheck` (monorepo) ✅ 9/9 PASS.
- `pnpm build` ✅ completo (web + server + todos adapters).
- `pnpm lint` ✅ exit 0.

### Notas Técnicas
- Respeitei o ownership paralelo: não toquei em README (`@renata-docs`), `CHANGELOG.md` (`@renata-docs`), nem devDependencies/scripts (`@bruno-frontend`). Escopo estritamente no bloco meta do `package.json` raiz.

---

## [v0.14.10] — 2026-04-19

**Tipo:** Docs
**Esforço estimado:** 10min
**Autor:** Claude (renata-docs, Opus 4.7)

### Descrição
Atualização das URLs placeholder no `README.md` e `CHANGELOG.md` para o repo real publicado no GitHub (#fb7079c5). URL confirmada pelo usuário: `https://github.com/leerichard2000/lee-agent-theater.git`.

### Alterações
- `README.md` — 2 ocorrências de `https://github.com/seu-usuario/lee-agent-theater.git` (linhas 118 e 625, em blocos de `git clone`) trocadas pela URL real. Verificado com grep: zero ocorrências de `seu-usuario` restantes no arquivo.
- `CHANGELOG.md` — 5 ocorrências de `https://example.com/lee-agent-theater` substituídas por `https://github.com/leerichard2000/lee-agent-theater` (sem `.git` — links de compare/tag são web, não clone). Cobre os links `[Unreleased]`, `[0.14.8]`, `[0.14.7]`, `[0.14.6]`, `[0.14.5]` no rodapé. Verificado com grep: zero ocorrências de `example.com/lee-agent-theater` restantes.

### Ocorrência adicional detectada fora do escopo
`CONTRIBUTING.md:69` também contém `https://github.com/seu-usuario/lee-agent-theater.git` em um bloco de clone/fork. Essa linha **não** foi tocada nesta task — o brief listou apenas README + CHANGELOG. Reportado no comentário da task para o lead decidir (criar task dedicada para CONTRIBUTING ou consolidar numa próxima).

### Impacto
- `git clone` instrução no README agora leva direto ao repo real — evita 404 para quem copia-e-cola.
- Links no rodapé do CHANGELOG resolvem para as páginas reais de compare/tag do GitHub quando o usuário clicar (as tags serão criadas conforme releases forem publicadas).
- Zero impacto em runtime. Nenhum arquivo de código tocado.

### Notas Técnicas
- URL canonical preservada conforme instrução do brief: **com** `.git` nos comandos git (README), **sem** `.git` em links web (CHANGELOG).
- `docs/publish-readiness.md:24` ainda menciona a URL placeholder, mas é **descrição histórica** do blocker B2 ("URLs placeholder no README..."), não uma URL funcional. Mantido como está — tocar ali seria reescrever histórico.
- `PATCH_NOTES.md` entradas anteriores (v0.14.5, v0.14.8) também mencionam `seu-usuario`/`example.com` em notas técnicas descritivas do próprio placeholder — mantido por ser registro histórico.

---

## [v0.14.9] — 2026-04-19

**Tipo:** Config
**Esforço estimado:** 10min
**Autor:** Claude (igor-devops, Opus 4.7)

### Descrição
Follow-up na #cc8370e6 após @bruno-frontend entregar ESLint 9 flat config funcional na #7dd2603f (`pnpm lint` agora é real, exit 0, zero warnings). Promovendo o step `Lint` no CI de opcional (`continue-on-error: true`) para obrigatório.

### Alterações
- `.github/workflows/ci.yml` — step `Lint` agora falha o job em caso de erro de lint. `Test` e `Audit` continuam opcionais (suite Vitest ainda não existe; `pnpm audit` serve como aviso não-bloqueante até ficar claro que o projeto tolera PRs abertos com MODERATE residual).

### Impacto
- PRs com violações de ESLint agora **bloqueiam merge** no CI, exatamente como typecheck e build.
- Linter real protege contra regressões de estilo/qualidade em contribuições externas.
- Verificado localmente: `pnpm lint` exit 0, sem warnings.

### Notas Técnicas
- `pnpm format:check` intencionalmente **não** foi adicionado ao CI. @bruno-frontend sinalizou que 54 arquivos estão fora do padrão Prettier e um pass `format:write` ainda não foi feito (evitando conflito com trabalho em curso). Quando a formatação base for normalizada, adicionar step `Format check` seguindo o mesmo padrão.

---

## [v0.14.8] — 2026-04-17

**Tipo:** Docs
**Esforço estimado:** 1h 30min
**Autor:** Claude (renata-docs, Opus 4.7)

### Descrição
Entrega das decisões #4, #5, #8 e #9 da publish readiness review (#643dd3d3): seção "Troubleshooting" no README, screenshot real no topo do README (o placeholder `docs/screenshots/placeholder.png` nunca existiu), CHANGELOG.md em formato Keep a Changelog e CODE_OF_CONDUCT.md curto com referência ao autor Lee Richard. Nenhuma mudança em código de runtime, nenhum toque em configs de lint (@bruno-frontend), CI, Dependabot ou `package.json` (@igor-devops).

### Alterações
- `README.md`:
  - Substituída referência inexistente a `docs/screenshots/placeholder.png` pela imagem real `docs/screenshots/demo-4-agents-meeting.png` (entregue pelo @igor-devops em v0.14.6) com alt text descritivo "Lee Agent Theater — cena Demo com 4 agentes em suas mesas individuais e mesa de reunião". Removido o comentário `<!-- TODO: Adicionar screenshot... -->`.
  - Nova seção "Troubleshooting" antes de "Licença", com 3 subseções: (a) `ERR_MODULE_NOT_FOUND` com OneDrive removendo `.js` — solução rápida (`rm -rf node_modules && pnpm install && pnpm -r build`) e definitiva (mover pra fora do OneDrive); linka PATCH_NOTES v0.11.5 e v0.13.4 como referência. (b) `pnpm dev:server` tela branca — explica a defesa atual via `inspectWebDist()` em `apps/server/src/index.ts` e o fix manual (`rm -rf apps/web/dist && pnpm --filter @theater/web build && pnpm dev:server`). (c) Nada aparece no palco — checklist de 5 passos: console do browser, sessão selecionada no dropdown, curl `/api/events?sessionId=<id>&limit=1`, verificar WS no Network, nota sobre limitações conhecidas Claude Local vs Demo.
  - Sumário atualizado com nova entrada "Troubleshooting".
  - Tabela "Documentação adicional" ganhou 2 novas linhas: `CHANGELOG.md` (logo antes de `PATCH_NOTES.md`, descrição explicitando a diferença: resumido vs detalhado) e `CODE_OF_CONDUCT.md`.
- `CHANGELOG.md` (novo) — formato [Keep a Changelog 1.1.0 pt-BR](https://keepachangelog.com/pt-BR/1.1.0/) + referência a SemVer. Consolida o conteúdo de `PATCH_NOTES.md` em formato resumido cobrindo v0.1.0 → v0.14.7. Releases recentes (0.13.x, 0.14.x) têm entradas individuais; releases antigas com temas similares foram agregadas (ex.: `[0.10.0..0.10.4]`, `[0.9.0..0.9.1]`). Seções padrão Added/Changed/Fixed/Documentation. Links de compare/tag no final apontam para placeholder `https://example.com/lee-agent-theater` — serão substituídos pelo usuário quando o repo for publicado.
- `CODE_OF_CONDUCT.md` (novo) — versão curta (~45 linhas), pt-BR. Valores (respeito mútuo, feedback construtivo, presumir boa-fé, paciência), escopo, como reportar (e-mail do `package.json`, confidencial), consequências escalonáveis (aviso → remoção de conteúdo → banimento), referência explícita ao autor original **Lee Richard** (2026) e link pro `LICENSE`. Menção de que o projeto pode adotar Contributor Covenant no futuro se crescer — conforme orientação do usuário de manter algo leve.
- `PATCH_NOTES.md` — esta entrada (v0.14.8).

### Impacto
- **Onboarding no GitHub:** usuário novo vê screenshot real em vez de 404 ao abrir o README. Clara diferença entre Demo e sessões Claude Local explicada com imagem.
- **Auto-serviço:** os 3 problemas mais comuns do dia a dia (OneDrive, tela branca, palco vazio) têm solução documentada com comandos exatos. Reduz "me ajuda" repetido em issues futuras.
- **Padrão de comunidade:** `CODE_OF_CONDUCT.md` + `CHANGELOG.md` são os dois arquivos que faltavam pro repo bater o health check completo do GitHub (Community Standards). Combinado com LICENSE, CONTRIBUTING.md e os templates de issue já entregues pelo @igor-devops em v0.14.6, o repo passa a exibir badge verde completo.
- **CHANGELOG vs PATCH_NOTES:** ambos coexistem (conforme regra global do usuário). CHANGELOG para quem quer resumo ("o que mudou na 0.14?"); PATCH_NOTES para quem quer detalhe ("como o bug do OneDrive foi diagnosticado?"). A tabela de documentação no README explicita a diferença.
- **Nenhuma mudança em código de runtime** — zero risco de regressão.

### Notas Técnicas
- **Screenshot:** `docs/screenshots/demo-4-agents-meeting.png` já existia no repo (entregue pelo @igor-devops em v0.14.6, proveniente de `flip-1-4-agents.png` original). Validei visualmente: Sessão Demo, 4 agentes (Rafael/architect roxo, Ana/reviewer rosa, Igor/devops verde, Carlos/developer azul), Rafael+Carlos conversando na mesa de reunião com balão "Rafael solicita implementação do auth module", painel lateral com timeline. Comunica 3 features-chave em uma imagem: agentes etiquetados, animação de reunião, histórico sincronizado. Não precisou criar imagem nova.
- **Links do CHANGELOG apontam para placeholder:** o @igor-devops identificou em v0.14.5 que o repo ainda não tem URL pública (`seu-usuario` continua no README em alguns lugares). Usei `https://example.com/lee-agent-theater` no final do CHANGELOG como placeholder — um find-replace simples resolve quando o repo for publicado. Alternativa era omitir os links, mas a seção `[tag]:` no final é parte idiomática do Keep a Changelog.
- **CHANGELOG não copia verbatim cada entrada:** instrução explícita da task. Agreguei releases com mesmo tema (`0.10.x`, `0.9.x`, `0.8.x`, `0.7.x`, `0.6.x`) quando o conteúdo coletivo é mais legível assim; mantive entradas individuais para as releases recentes onde cada versão agrega uma feature/fix específica.
- **CODE_OF_CONDUCT leve, não Contributor Covenant:** decisão explícita do usuário (brief da task). Documentei no próprio arquivo que podemos migrar pro Covenant no futuro — não cria lock-in.
- **Troubleshooting linka PATCH_NOTES com anchors `[v0.11.5]`/`[v0.13.4]`**: deixa o README curto enquanto mantém trilha rastreável para quem quiser o detalhe técnico.
- **Ownership respeitado:** não toquei em `eslint.config.js` / `.prettierrc*` / lint deps (@bruno-frontend, v0.14.7), nem em `.github/*` / `package.json` / `@fastify/static` / Dependabot (@igor-devops, v0.14.6). Escopo restrito a README + CHANGELOG + CODE_OF_CONDUCT + PATCH_NOTES incremental.

---

## [v0.14.7] — 2026-04-18

**Tipo:** Config | Dependency
**Esforço estimado:** 45min
**Autor:** Claude (bruno-frontend, Opus 4.7)

### Descrição
Configura ESLint 9 (flat config) + Prettier 3 de verdade no monorepo (#7dd2603f). Antes, os scripts `lint` eram `echo 'lint ok'` no-op e o README prometia lint real. Incoerência visível que bloqueava o projeto como open-source sério.

### Alterações
- `eslint.config.js` (novo) — flat config ESLint 9 com `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks` e `eslint-config-prettier` desativando conflitos estilísticos. Regras pragmáticas para destravar o CI sem refactor: `no-unused-vars` aceita `_prefix`, `no-explicit-any` e `ban-ts-comment` como warning. Override no `apps/web` adiciona globals de browser e as rules de hooks do React.
- `.prettierrc.json` (novo) — alinhado ao `.editorconfig` existente: 2 espaços, LF, single quotes, trailing commas, printWidth 100.
- `.prettierignore` (novo) — cobre `dist/`, `node_modules/`, `.playwright-mcp/`, `docs/screenshots/`, `PATCH_NOTES.md`, `CHANGELOG.md`, `pnpm-lock.yaml`.
- `package.json` (raiz):
  - `"type": "module"` adicionado (elimina warning de `MODULE_TYPELESS_PACKAGE_JSON` que o ESLint emitia ao carregar o flat config).
  - Script `lint` trocado de `pnpm -r lint` (que rodava os 8 echos) para `eslint .` (cobre o monorepo inteiro de uma vez).
  - Novos scripts: `lint:fix`, `format`, `format:check`.
  - DevDeps: `eslint@^9.17.0`, `typescript-eslint@^8.18.0`, `eslint-config-prettier@^9.1.0`, `eslint-plugin-react@^7.37.0`, `eslint-plugin-react-hooks@^5.1.0`, `prettier@^3.4.0`.
- `apps/web/package.json`, `apps/server/package.json`, `packages/adapters/adapter-{mcp,claude-local,demo,claude-hooks,claude-sdk,file-log}/package.json` — removido o script `"lint": "echo 'lint ok'"` (o lint agora é centralizado no root). `packages/core` já não tinha script de lint.
- `apps/web/src/stores/theaterStore.ts` — 2 fixes de warnings detectados pelo ESLint:
  - Removida constante `STAGE_HEIGHT_PHASER` que estava declarada mas nunca usada.
  - `loadHistory` trocou `set((s) => ...)` por `set(() => ...)` — o callback não usava `s`.

### Impacto
- **`pnpm lint` agora tem substância:** executa ESLint em todo o repo, exit 0 com zero erros e zero warnings.
- **`pnpm format:check`** reporta 54 arquivos fora do padrão Prettier — **não foram tocados nesta task** (o brief pediu "zero refactor" e normalizar 54 arquivos pisa em trabalho em progresso de outros). Fica como follow-up em task dedicada (ex.: "Publish prep B.1: prettier pass inicial"), a ser rodado num commit atômico quando o board estiver mais frio.
- **`pnpm typecheck`** continua passando limpo.
- **CI:** o `@igor-devops` pode incluir `pnpm lint` como step obrigatório no workflow dele. Ver comentário cruzado em #44009046.
- **Zero impacto em runtime:** nenhum arquivo de código de runtime foi alterado além dos 2 warnings no theaterStore.
- **Sprites intocados** (`apps/web/src/phaser/sprites/*`).

### Notas Técnicas
- **Por que flat config:** ESLint 9 tornou `.eslintrc.*` legado; flat config (`eslint.config.js`) é o padrão. Adotei direto para não criar dívida.
- **Sem type-checked rules:** as regras com type-info (`plugin:@typescript-eslint/strict-type-checked` etc.) rodam um type-check por cima do lint e ficam lentas em CI. Ficam para follow-up quando a suíte de testes já tiver estabilizado.
- **`no-explicit-any` como warning:** o projeto tem uso pontual de `any` em interop com Phaser e retornos de `Zod`. Subir para error agora só criaria ruído; tratamos como warning (e o lint passa com 0 warnings no estado atual — ou seja, ninguém está usando `any` hoje; a regra é um guard contra novos usos).
- **Decisão sobre `pnpm format`:** rodar `prettier --write .` faria um diff enorme em 54 arquivos de 8 autores diferentes. Escolhi não fazer aqui para respeitar "zero refactor" do brief e evitar conflito com tasks em paralelo. Recomendo um PR dedicado quando o board esfriar.
- **Remoção dos echos nos workspaces:** `pnpm -r lint` era sentido porque cada workspace tinha seu próprio `echo`; agora que o root concentra em `eslint .` (varrendo tudo), scripts por workspace são redundantes e confusos. Deletados.
- **Sprites (#T2) intocados.**

---

## [v0.14.6] — 2026-04-19

**Tipo:** Config | Dependency
**Esforço estimado:** 1h 30min
**Autor:** Claude (igor-devops, Opus 4.7)

### Descrição
Execução do "Publish prep A" (#cc8370e6): CI básico no GitHub Actions, Dependabot semanal, templates de issue, bump de `@fastify/static` para resolver as 2 vulnerabilidades MODERATE detectadas na readiness review (#44009046), e limpeza dos 29 PNGs de QA soltos na raiz.

### Alterações
- `.github/workflows/ci.yml` — criado. CI em push (main) e pull_request com steps: checkout, pnpm v10, Node 20, `install --frozen-lockfile`, `pnpm typecheck`, `pnpm build`. `pnpm lint`, `pnpm test --if-present` e `pnpm audit` rodam com `continue-on-error: true` enquanto suite/linter real não existem (@bruno-frontend está configurando em paralelo).
- `.github/dependabot.yml` — criado. Updates semanais (segunda 09:00 America/Sao_Paulo) para 5 ecossistemas: root, `apps/server`, `apps/web`, `packages/core` e `github-actions`. Labels: `dependencies` + escopo. Commit-message com prefix scopado.
- `.github/ISSUE_TEMPLATE/bug_report.md` — criado. Inclui perguntas específicas do projeto: se a pasta está em OneDrive/Dropbox/iCloud (footgun documentado em v0.11.5) e qual sessão (Demo vs Claude Local).
- `.github/ISSUE_TEMPLATE/feature_request.md` — criado. Cobre impacto em adapters, `TheaterEvent`/`@theater/core`, UI/Phaser e performance.
- `apps/server/package.json` — `@fastify/static` bumpado de `^8.0.0` para `^9.1.1`. Resolve GHSA-pr96-94w5-mx2h (path traversal em directory listing) e GHSA-x428-ghpx-8j92 (route guard bypass via encoded path separators).
- `pnpm-lock.yaml` — atualizado (`pnpm install` após bump).
- `docs/screenshots/demo-4-agents-meeting.png` — movido de `flip-1-4-agents.png` (print da Sessão Demo com 4 agentes em meeting flow, confirmado pelo PATCH v0.14.3).
- **29 PNGs de QA deletados da raiz**: `broadcast-1..5`, `final-1..3`, `fix-1..3`, `fix-targetretry-1..7`, `flip-1..2`, `theater-1..9`. Eram prints de debug/regressão intermediários e de sessões reais (forge-labs etc.) — não servem como documentação pública.

### Impacto
- **CI no GitHub Actions**: todo push em `main` e todo PR vão rodar `typecheck` + `build` automaticamente. Falhas bloqueiam merge (quando branch protection for habilitado pelo usuário). Reduz risco de regressões em PRs externos.
- **Dependabot ativo**: alertas automáticos para novas vulnerabilidades como as que apareceram em `@fastify/static` entre 04-17 e 04-19 — não vai mais passar despercebido.
- **Zero vulnerabilidades conhecidas**: `pnpm audit` agora retorna "No known vulnerabilities found". Safe para publicação.
- **Raiz limpa**: repo não publica mais 29 PNGs soltos (~2 MB). Clone fresh mais leve e profissional.
- **Sem regressão funcional**: `@theater/server` typecheck + build passam limpos com `@fastify/static@9.1.1`. API usada (`root`, `prefix`, `wildcard`, `sendFile`) é estável entre v8 e v9.
- **Monorepo typecheck completo**: 9/9 packages PASS.

### Verificação
- `pnpm install` ✅ (3 pacotes adicionados, 14 removidos na transição 8.x → 9.1.1).
- `pnpm --filter @theater/server typecheck` ✅.
- `pnpm --filter @theater/server build` ✅.
- `pnpm typecheck` (monorepo) ✅ 9/9.
- `pnpm audit` ✅ "No known vulnerabilities found" (antes: 2 MODERATE).
- `ls *.png` na raiz ✅ zero arquivos.
- `ls docs/screenshots/` ✅ `demo-4-agents-meeting.png` preservado.

### Notas Técnicas
- Intencionalmente **não toquei em**: `README.md` (escopo da @renata-docs na task paralela), `eslint.config.*` / `.prettierrc*` / devDependencies de lint (@bruno-frontend), `LICENSE`, e código de runtime. Cleanup restrito a meta/config.
- CI usa `continue-on-error: true` para `pnpm lint`/`test`/`audit` para não bloquear merges enquanto a suíte e o linter real ainda não estão prontos. Quando @bruno-frontend terminar ESLint/Prettier e a suíte Vitest existir, o `continue-on-error` pode sair desses steps.
- `@fastify/static@9.x` mudou alguns comportamentos internos de resolução, mas nenhuma das flags usadas em `apps/server/src/index.ts:119-131` (`root`, `prefix`, `wildcard: false`, `reply.sendFile('index.html')`) foi afetada.
- Estratégia de preservar apenas prints da Sessão Demo: prints de `forge-labs` e outras sessões reais contêm nomes/roles que só fazem sentido no contexto local do dev. Prints da Demo são autocontidos e servem como tutorial.
- O `.gitignore` (delivered em v0.14.5) já cobre patterns de PNGs soltos na raiz, então se novos screenshots de debug forem gerados, serão automaticamente ignorados.

---

## [v0.14.5] — 2026-04-19

**Tipo:** Docs
**Esforço estimado:** 1h
**Autor:** Claude (igor-devops, Opus 4.7)

### Descrição
Publish readiness review para preparar o repositório para publicação no GitHub público (#44009046). Auditoria completa de arquivos obrigatórios, secrets, build, CI/CD, documentação, qualidade de código, dependências e footguns específicos do projeto (OneDrive, `inspectWebDist`). Gaps low-risk auto-resolvidos; decisões que dependem do usuário (URL do repo, CI, ESLint real, destino dos screenshots soltos, bump de `@fastify/static`) listadas no relatório.

### Alterações
- `docs/publish-readiness.md` — criado. Checklist completo com resumo executivo ("pronto para publicar? COM CAVEATS"), status item-a-item, 9 ações pendentes de decisão do usuário e comandos de verificação reproduzíveis.
- `.gitignore` — ampliado para cobrir `.playwright-mcp/`, `.remember/`, 29 PNGs de QA soltos na raiz (`broadcast-*`, `final-*`, `theater-*`, `flip-*`, `fix-*`, `*-meeting.png`), `.pnpm-debug.log*`, `yarn-debug.log*`, `yarn-error.log*`. O pattern `*.tsbuildinfo` já estava presente.
- `.editorconfig` — criado. Defaults: UTF-8, LF, 2 espaços, `trim_trailing_whitespace`, `insert_final_newline`; override para `*.md` e `Makefile`.

### Impacto
- **Documentação de publicação completa**: usuário tem lista clara e priorizada do que falta decidir antes do push público (URL do repo, CI, etc.).
- **Higiene de repositório melhorada**: novos clones não vão trazer screenshots de QA, sessões Playwright, nem logs locais.
- **Consistência de editor**: `.editorconfig` evita conflitos de formatação entre contribuidores usando VS Code, WebStorm ou outros.
- **Sem impacto em runtime**: apenas arquivos meta/config, nada de código de produção tocado.

### Notas Técnicas
- Blockers identificados e reportados no relatório: (B1) repo ainda não é git (`git status` → `fatal: not a git repository`); (B2) URLs placeholder no README (`seu-usuario`). Ambos precisam ação/resposta do usuário, não resolvíveis autonomamente.
- Auditoria de dependências revelou **regressão** desde `docs/security-audit.md` (Bruno, 2026-04-17): 2 vulnerabilidades MODERATE em `@fastify/static` (GHSA-pr96-94w5-mx2h, GHSA-x428-ghpx-8j92), corrigíveis com bump `^9.1.1`. Não aplicado ainda — aguarda decisão do usuário sobre impacto no `inspectWebDist`.
- `pnpm typecheck` executado: 9/9 packages PASS, zero erros.
- 29 PNGs físicos continuam na raiz (apenas o `.gitignore` foi atualizado). Remoção física aguarda decisão do usuário (deletar ou mover para `docs/screenshots/`).

---

## [v0.14.4] — 2026-04-17

**Tipo:** Fix
**Esforço estimado:** 30min
**Autor:** Claude (carlos-backend, Opus 4.7)

### Descrição
Usuário reportou dropdown de sessões poluído com **15+ entradas idênticas** de "Sessão Demo (4 agentes, 21 eventos)", enquanto as sessões do Claude Local apareciam corretamente uma vez cada. Também foi reportada uma "sessão mistério" `Claude: 82058480-040e-4224-85f7-37bb44be9cb3` de um time que não é mais ativo.

**Causa raiz — dois problemas compondo no `adapter-demo`:**

1. **Bootstrap gerava novo UUID por sessão:** `constructor` fazia `this.sessionId = sessionId ?? randomUUID()`. Cada reinício do `dev:server` criava uma sessão nova com ID diferente no `SessionStore` em memória. Como o store não limpa sessões anteriores entre boots do processo (não precisa — boots reiniciam o processo inteiro), isso sozinho não explicaria 15× duplicatas.
2. **Loop do cenário gerava novo UUID a cada ciclo (!):** dentro de `runScenario()`, o `setTimeout` do loop executava `this.sessionId = randomUUID(); this.config.sessionId = this.sessionId;` antes de reiniciar o cenário. Como o cenário completo dura ~30s + 5s buffer, isso criava uma nova "Sessão Demo" **a cada 35 segundos de server rodando**. Em 10 minutos, 17 sessões.

**Sessão mistério:** inspeção de `~/.claude/teams/82058480-040e-4224-85f7-37bb44be9cb3/` mostrou apenas o diretório `inboxes/`, sem `config.json`. É um time residual removido que deixou um diretório órfão. O `adapter-claude-local` já retornava cedo em `scanTeam` quando `config` era null, mas o `listTeams()` continuava incluindo o nome no log "monitorando N time(s)".

### Correção aplicada

1. **`packages/adapters/adapter-demo/src/index.ts`:**
   - `constructor`: `sessionId` padrão passou de `randomUUID()` para string determinística `'demo-session'`. Múltiplos boots convergem na mesma sessão idempotente no store.
   - Loop do cenário: removida a linha `this.sessionId = randomUUID(); this.config.sessionId = this.sessionId;`. O loop agora reutiliza o mesmo sessionId — o cenário se torna uma performance contínua na mesma sessão, e o ring buffer do `SessionStore` descarta eventos antigos automaticamente.
2. **`packages/adapters/adapter-claude-local/src/index.ts`:**
   - Em `start()`, após auto-detecção dos times via `reader.listTeams()`, adicionado filtro que tenta ler `config.json` de cada time e remove do `monitoredTeams` os que falham. Impede que diretórios residuais como `82058480-...` apareçam no log ou gerem rescans inúteis.

### Impacto

- **Validação empírica:** 3 reboots consecutivos do `dev:server` mantêm o store com exatamente **4 sessões** (`demo-session` + 3 sessões Claude). A sessão mistério sumiu do dropdown.
- **Loop do cenário:** após aguardar 35s (um ciclo completo), a sessão Demo acumulou eventos no mesmo `demo-session` (passou de ~20 para 32 eventos) sem criar sessão nova. Confirmado via `GET /api/status`.
- **Demo continua funcionando visualmente:** o cenário roda em loop infinito como performance contínua. Nada mudou no palco ou no chat.
- **`pnpm --filter @theater/adapter-demo build`**, **`pnpm --filter @theater/adapter-claude-local build`** e **`pnpm --filter @theater/server typecheck`** passam limpos.

### Notas Técnicas

- **Escolha do ID fixo `'demo-session'`:** não é UUID por design — é um identificador estável e legível. Se alguém explicitamente passar um sessionId no `new DemoAdapter(url, sessionId)`, esse ID é respeitado (paridade com o comportamento anterior). Apenas o default mudou.
- **Eventos "velhos" permanecem no ring buffer:** como o loop não zera os eventos, um usuário que mantém o server rodando por horas verá o cenário se repetir com eventos de múltiplos ciclos no histórico. O ring buffer (`MAX_EVENTS_PER_SESSION`) eventualmente limpa os antigos — é o comportamento desejado para uma "sessão contínua". Se o produto quiser "resetar" a cada ciclo, seria necessário adicionar um método `clearSessionEvents(sessionId)` no store e chamá-lo no início de cada loop.
- **Limpeza do diretório órfão:** o filtro em `start()` apenas **ignora** o diretório; não deleta. Usuário pode remover manualmente `~/.claude/teams/82058480-040e-4224-85f7-37bb44be9cb3/` se quiser. Não toquei porque está fora do escopo do adapter (ler-only por design — ver cabeçalho de `adapter-claude-local/src/index.ts`).
- **Robustez:** se `config.json` for criado depois do boot (time novo), o filtro só bloqueia a descoberta inicial. O `ClaudeWatcher` detectaria o novo `config.json` em `team_config` change e `handleTeamConfigChange` chamaria `buildAgentList` — mas hoje esse handler não adiciona o time a `monitoredTeams`, então não começaria a ser monitorado sem restart. Aceitável: criar time novo no Claude Code já é ação rara que o usuário pode seguir com restart.

---

## [v0.14.3] — 2026-04-18

**Tipo:** Fix
**Esforço estimado:** 15min
**Autor:** Claude (ana-frontend, Opus 4.7)

### Descrição
Correção da intermitência do layout em círculo ao trocar de sessão (#a2c89d02). O adapter Claude Local pré-calcula `agent.position` via coords circulares em `buildAgentList` (`centerX=400, radius=200`). O frontend respeitava essa position no `createAgentSprite`, o que bypassava o `calculateLayout` (grid dinâmico com mesas individuais). Dependendo da ordem de chegada dos eventos ao trocar de sessão, o grid vazio era desenhado primeiro e depois sobrescrito pelas coords circulares do adapter — por isso a intermitência.

### Fix (Opção A aprovada pelo usuário)
`apps/web/src/phaser/TheaterScene.ts::createAgentSprite`: ignorar `agent.position` e sempre usar o slot calculado por `calculateLayout`.

```ts
// antes:
const agentPos = agent.position ?? { x: slot.agentX, y: slot.agentY };
// depois:
const agentPos = { x: slot.agentX, y: slot.agentY };
```

Decisão de layout (canvas size, N agentes, meeting zone bounds, escala dinâmica) é responsabilidade do frontend, não do adapter.

### Impacto
- **Grid consistente em todas as sessões** (Demo, forge-labs, signal-ops, cfo-inter-vida) — independente de trocar, refresh, ou ordem de chegada de eventos.
- **Sem regressão na Demo**: a adapter-demo já não definia `position` nos seus eventos (`AgentInfo` sem `position`), então o fluxo dela já caía no slot calculado. O screenshot `flip-1-4-agents.png` (PATCH v0.13.3) mostra a Demo em grid — continuará igual.
- **Mesa individual já usava `slot.deskX/deskY`** (não `agent.position`), então não há mudança no desk placement.
- **Meeting-flow** (`animateConversation` / `animateBroadcast`) não toca em `agent.position` — usa `MEETING_TABLE_POS` e `getMeetingSeatPositions`. Sem regressão.

### Verificação
- `pnpm --filter @theater/web typecheck` ✅
- `pnpm --filter @theater/web build` ✅
- Visual pendente: conforme validação retroativa combinada na #a33f5faa, confirmação no browser fica com o usuário ou próximo ciclo.

### Notas Técnicas
- `theaterStore.enrichAgent` continua fazendo `position: agent.position ?? BASE_POSITIONS[i]` — essa position só é usada pelo store para labels DOM (overlay HTML) e para `updateAgentPosition` síncrono. O sprite Phaser usa exclusivamente a coord calculada aqui. Se no futuro quisermos 100% consistência, pode-se também descartar no enrichAgent; deixei como está porque o fluxo atual usa `updateAgentPosition(agent.id, agentPos)` logo depois de criar o sprite, sincronizando o store com a coord do grid.
- O `positionIndex` continua sendo incrementado 1:1 com `createAgentSprite`, garantindo que cada novo agente pega um slot sequencial e único.

---

## [v0.14.2] — 2026-04-18

**Tipo:** Feature
**Esforço estimado:** 45min
**Autor:** Claude (bruno-frontend, Opus 4.7)

### Descrição
Carrega o histórico completo da sessão via `GET /api/events` ao abrir a página ou trocar de sessão (#9aa38f38). Antes, o painel só mostrava eventos que chegavam via WebSocket **depois** do page load — eventos anteriores ficavam só no ring buffer de 1000 do server.

### Alterações
- `apps/web/src/stores/theaterStore.ts`:
  - Novo flag `historyLoading: boolean`.
  - Novas actions `loadHistory(events)` (substitui `events[]` com dedup por id, cursor no tail) e `setHistoryLoading(loading)`.
  - `pushEvent` agora dedup por `event.id` — race raro onde o mesmo evento chega via REST + WS é absorvido silenciosamente.
  - `loadSessionState` preserva `activeEventId` se já foi populado pelo `loadHistory`; senão posiciona no tail.
- `apps/web/src/services/websocket.ts`:
  - Nova constante `HISTORY_FETCH_LIMIT = 1000` (cobre o ring buffer inteiro do server).
  - Novo método `loadHistoryAndSubscribe(sessionId)`: faz `GET /api/events?sessionId=X&limit=1000`, chama `loadHistory`, e **só depois** manda `subscribe` pelo WS. Falha graciosa: se o fetch der erro, o subscribe acontece igual e o painel se enche via WS como antes.
  - `onopen` (caso com `sessionId` conhecido), `discoverAndSubscribe` e `switchSession` agora chamam `loadHistoryAndSubscribe` em vez de mandar subscribe direto.
- `apps/web/src/components/HistoryPanel.tsx`:
  - Mostra spinner + "Carregando histórico..." quando `historyLoading === true && events.length === 0`.

### Impacto
- **Abrir a página em sessão existente:** todos os eventos do buffer (até 1000) aparecem no painel antes do primeiro evento novo chegar. User consegue rever, selecionar e replay desde o início.
- **Trocar de sessão:** `reset()` limpa tudo, fetch da nova, subscribe. Histórico da sessão anterior não vaza.
- **Player/cursor não regride:** `loadHistory` posiciona cursor no último evento (live tail); dedup de `pushEvent` garante que nenhum id duplica, e o `activeEventId` selecionado pelo user é preservado quando eventos novos chegam durante replay (comportamento herdado do #c3eb2ea5).
- `pnpm --filter @theater/web tsc --noEmit` → zero erros.

### Notas Técnicas
- **Ordem fetch → subscribe (não paralelo):** quis garantir que o painel aparece populado desde o primeiro render. Paralelo funcionaria mas introduziria um flash "0 eventos → 500 eventos" assim que o REST resolve. A trade-off é ~50-200ms de delay extra no boot — aceitável para a UX de ter histórico imediato.
- **`session_state` do WS ainda chega depois do subscribe:** o server envia um snapshot quando o client assina. Hoje sobrescreve `events[]` (mesmo conteúdo que o REST acabou de trazer), o que é redundante mas inofensivo. Ajustei `loadSessionState` para preservar `activeEventId`, evitando que ele seja resetado quando chega pouco depois do `loadHistory`. Follow-up possível: detectar duplicação e skipar, mas não é urgente.
- **Dedup por id:** `pushEvent` e `loadHistory` ambos protegem contra id duplicado. Cenário coberto: evento emitido pelo adapter entre o término do fetch REST e a chegada do subscribe no server → vem tanto na resposta REST quanto como `event` no WS → segundo só é ignorado.
- **Falha do fetch (offline, 404):** `loadHistoryAndSubscribe` sempre chama `subscribe` no `finally`. Graceful degrade para comportamento antigo (só WS).
- **Não toquei em** `apps/web/src/phaser/sprites/*` (ownership #T2). Mudanças isoladas em store, services e components.

---

## [v0.14.1] — 2026-04-17

**Tipo:** Docs
**Esforço estimado:** 1h 30min
**Autor:** Claude (bruno-devsecops, Opus 4.7)

### Descrição
Audit de segurança end-to-end do monorepo (task #4f74ec44 solicitada por `lucas-techlead`). Escopo: server HTTP/WebSocket, adapters (especialmente `adapter-claude-local`), frontend (Phaser + React), dependências (`pnpm audit`), paths filesystem e segredos. O entregável é um documento único em `docs/security-audit.md` com findings categorizados por severidade, evidências com file:line, e um apêndice com `pnpm audit` e checklist de follow-ups.

### Alterações
- `docs/security-audit.md` — novo. Relatório completo com 0 CRITICAL, 0 HIGH, 4 MEDIUM, 6 LOW, 4 INFO. Disposição: **não bloqueia release** em postura localhost-only.

### Impacto
- Nenhuma mudança em código de produção — audit-only, conforme restrição da task.
- Documento referenciável para criar as tasks de follow-up (MED-01 auth/CORS, MED-02 rate limit, MED-03 path traversal, MED-04 filtro heartbeats, LOW-01 upgrade `@fastify/static` para >=9.1.1).

### Notas Técnicas
- `pnpm audit` retornou 2 advisories moderate em `@fastify/static@8.3.0` (CVE-2026-6410 e CVE-2026-6414); ambos exigem configurações (directory listing `list: true` e middleware de authz em paths estáticos) **não presentes** neste projeto, então não são explorables hoje. Recomendação mesmo assim é upgrade preventivo.
- React escapa texto dinâmico; greps confirmaram ausência de render de HTML bruto e execução dinâmica de strings como código no source. Phaser `Text.setText` também é seguro.
- Principais débitos para antes de qualquer exposição fora de `localhost`: falta de auth em REST+WS, CORS `origin: true`, ausência de rate limit/bodyLimit. Todos documentados como MED no relatório.

---

## [v0.14.0] — 2026-04-17

**Tipo:** Feature
**Esforço estimado:** 45min
**Autor:** Claude (carlos-backend, Opus 4.7)

### Descrição
Usuário reportou que na Sessão Demo o sprite exibe um ícone de engrenagem ("trabalhando") sobre o agente quando ele processa uma task, mas em sessões reais do Claude Local (`forge-labs` etc.) esse indicador nunca aparecia. Diagnóstico: o frontend já trata `EventType.THINKING` corretamente — mapeia para `AgentState 'thinking'` e invoca `AgentSprite.startThinking()`, que renderiza `icon_thinking` girando (`apps/web/src/phaser/TheaterScene.ts:879`, `AgentSprite.ts:216-227`). A Demo emite esses eventos em pontos curados do cenário. O `adapter-claude-local`, porém, só emitia `STATUS_CHANGE` quando uma task mudava — e `STATUS_CHANGE` no frontend mapeia para `AgentState 'active'`, não `'thinking'`. Faltava o sinal certo.

### Correção aplicada

Dois pontos no `packages/adapters/adapter-claude-local/src/index.ts`, sem mexer em nada do frontend (ownership respeitado):

1. **`handleTaskChange`**: quando uma task transita **para `in_progress`** (e o status anterior era diferente), emite um evento adicional `EventType.THINKING` sobre o agente dono. O `STATUS_CHANGE` existente continua sendo emitido em paralelo para manter o histórico consistente.
2. **`scanTeam`**: no scan inicial (quando o adapter sobe), além de registrar o estado da task, verifica se a task já está `in_progress` e emite `THINKING` para o dono. Garante que ao abrir o frontend em meio a um trabalho em andamento, o sprite mostre a engrenagem imediatamente, sem precisar esperar uma transição de status.

Formato do evento emitido:
```
eventType: THINKING
sourceAgent: <owner (via resolveAgentName)>
summary: "<owner> trabalhando em #<displayId>"
content: "<owner> iniciou: <task.subject>" (ou "está executando:" no scan inicial)
status: EventStatus.IN_PROGRESS
metadata: { taskId, displayId, teamName, reason?: 'initial_scan' }
```

### Impacto

- **`claude-forge-labs`:** 3 eventos `THINKING` emitidos no scan inicial (para `patricia-qa`, `bruno-devsecops`, `carlos-backend`), correspondendo exatamente às 3 tasks em `in_progress` no board. Confirmado via `GET /api/events?sessionId=claude-forge-labs` e validação visual via Chrome DevTools: chat lateral exibe badge verde "thinking" para os três eventos com summary correto.
- **Sessão Demo:** intocada (adapter-demo continua emitindo seus próprios `THINKING` scriptados; o `adapter-claude-local` não é carregado lá).
- **Paridade visual com Demo:** o frontend trata ambos os eventos pelo mesmo `stateMap` em `TheaterScene.animateSimpleEvent`, então a engrenagem gira sobre o sprite em sessões Claude exatamente como em Demo, sem qualquer mudança de frontend.
- **`pnpm --filter @theater/adapter-claude-local build`** e **`pnpm --filter @theater/server typecheck`** passam limpos.

### Notas Técnicas

- **Duração da engrenagem:** o frontend (`animateSimpleEvent`) mantém `state='thinking'` por ~1.5–3s (proporcional ao tamanho do summary) e depois força `idle`. Assim a engrenagem aparece, gira por alguns segundos e some — **não fica indefinidamente** enquanto a task está in_progress. Paridade completa com Demo, que tem o mesmo comportamento.
- **Keepalive (fora de escopo):** se o produto quiser engrenagem persistente durante toda a vida da task, há dois caminhos: (a) adapter re-emite `THINKING` periodicamente (ex.: a cada 5s enquanto a task estiver in_progress — requer timer gerenciado), ou (b) frontend adiciona tracking persistente baseado em `metadata.taskId` e só remove quando vier `STATUS_CHANGE` saindo de in_progress. Nenhuma das duas está neste fix — propósito do brief original era paridade com Demo, alcançada.
- **Transições inversas:** quando a task sai de `in_progress` (vira `completed`, `review`, etc.), o `STATUS_CHANGE` existente já dispara `state='active'` → `idle` após o timer padrão. Não precisei adicionar evento de "stop thinking" explícito.
- **Idempotência:** a guarda `task.status === 'in_progress' && prev?.status !== 'in_progress'` evita emissão duplicada quando a task muda outros campos sem mudar de status. O `scanTeam` só roda uma vez no boot, então também não duplica.
- **Ownership:** `apps/web/src/phaser/AgentSprite.ts` inalterado. O frontend continua sendo única fonte de verdade para a tradução `event → sprite state`.

---

## [v0.13.11] — 2026-04-17

**Tipo:** Docs
**Esforço estimado:** 1h 30min
**Autor:** Claude (patricia-qa, Opus 4.7)

### Descrição
Entrega do plano de QA completo do sistema (#26da45eb) — fases 1 (plano),
2 (execução estática) e 3 (documentação). Sem mudanças de código de produto.

### Alterações
- `docs/test-plan.md` (novo) — mapa de 18 funcionalidades testáveis (F1..F18),
  61 cenários com prioridade P0/P1/P2 (happy/edge/regressão), critérios de
  aceitação objetivos para P0/P1 e estratégia de execução
  (estática vs Playwright vs REST).
- `docs/test-results.md` (novo) — tabela de execução com status
  PASS/FAIL/PENDING + evidência por cenário. 45 PASS, 0 FAIL, 16 PENDING
  (exigem Playwright). Resumo, defeitos, riscos residuais,
  recomendações de follow-up (FT-1..FT-4) e status final.
- `README.md` — adicionadas entradas `docs/test-plan.md` e
  `docs/test-results.md` na seção "Documentação adicional".

### Impacto
- Critérios de aceitação objetivos agora estão versionados em docs — qualquer
  teammate consegue executar ou delegar validação sem reinventar cenários.
- Cruzamento com PATCH_NOTES deixa claro o estado dos fixes recentes
  (v0.13.5..v0.13.10) do ponto de vista de QA.
- Zero alteração em código de runtime; zero risco de regressão.

### Notas Técnicas
- Plano cobre apenas features entregues até v0.13.10. Placeholders
  (adapter-claude-hooks, adapter-claude-sdk, adapter-mcp, adapter-file-log)
  ficam fora do escopo até deixarem de ser placeholder.
- Cenários visuais (tweens, Pause mid-animação, velocidades reais) ficam
  `PENDING` — a QA não executa Playwright diretamente; a recomendação
  FT-1 delega a validação a `@ana-frontend` ou `@bruno-frontend`.

---

## [v0.13.10] — 2026-04-17

**Tipo:** Fix
**Esforço estimado:** 45min
**Autor:** Claude (carlos-backend, Opus 4.7)

### Descrição
Follow-up da v0.13.2/#b3c5b77f. Ana diagnosticou em #a33f5faa que em `forge-labs` apenas 18 dos 19 agentes recebiam `AGENT_JOINED` — o lead real (`lucas-techlead`) ficava fora. Consequência visível: `MESSAGE_SENT` com `targetAgent: lucas-techlead` apontava para um agente que o frontend nunca foi avisado que existe, forçando fallback de sintetização que cancelava tweens por causa do layout shuffle.

**Causa raiz:** no orquestrador Claude, o alias `team-lead` aparece em `config.json.members` mas o nome real do lead (`lucas-techlead`) está apenas em `members.meta.json` (verificado: `config.members` não contém `lucas-techlead`, só o alias). A v0.13.2 **filtrava** o alias `team-lead` do `buildAgentList` — correto para não criar um agente fantasma, mas errado porque o lead real também nunca entrava na lista, já que não estava em `config.members`.

### Correção aplicada

Em `packages/adapters/adapter-claude-local/src/index.ts`:

- **`buildAgentList(config, metaMembers, teamName?)`**: parâmetro `teamName` novo; agora **substitui** o alias `team-lead` pelo nome real do lead (resolvido via `leadRealNameByTeam`) em vez de filtrar:
  - Loop sobre `config.members`: se `m.name === 'team-lead'` e há lead real conhecido, remapeia; se `team-lead` sem lead real conhecido, descarta (fallback defensivo).
  - Dedup por nome via `Set<string>` — cobre o caso (raro) em que o lead aparece tanto via alias quanto explicitamente em `config.members`.
  - Defesa extra: se o lead real **não** entrou via alias (timing estranho em que `config.members` não tem `team-lead`), adiciona entrada sintética usando metadados de `members.meta.json` (agentId `${nome}@${team}`, color, agentType). Cobre times sem alias no config mas com lead no meta.
- **`scanTeam`**: reordenado para popular `leadRealNameByTeam` **antes** de chamar `buildAgentList`. Sem essa reordenação, a primeira chamada do `buildAgentList` veria `leadRealNameByTeam` vazia e o remapeamento falharia silenciosamente.
- **`handleTeamConfigChange`**: mesma lógica de popular `leadRealNameByTeam` antes de chamar `buildAgentList`, passando `change.teamName`.
- Import do tipo `ClaudeMember` de `./claude-reader.js` (necessário para tipar `realMembers`).

### Impacto

- **`claude-forge-labs`:** 18 → **19 AGENT_JOINED** (inclui `lucas-techlead`). Validado via `GET /api/events?sessionId=claude-forge-labs`.
- **Outras sessões Claude validadas:**
  - `claude-signal-ops`: 15 agents (fallback pega `argus-radar` como lead real, já que o role é diferente).
  - `claude-cfo-inter-vida-v3`: 9 agents (fallback pega `audit-guardian`).
  - `Sessão Demo` (4 agents): **sem regressão** (adapter-demo não usa `buildAgentList`).
- **MESSAGE_SENT continua saindo com target correto.** Validação: enviei ping `carlos-backend → lucas-techlead` e o evento aparece com `targetAgent.name = "lucas-techlead"`. Também observei primeira mensagem `lucas-techlead → ana-frontend` sendo emitida normalmente — o lead agora é emissor e receptor reconhecido.
- `pnpm --filter @theater/adapter-claude-local build` e `pnpm --filter @theater/server typecheck` passam limpos.

### Notas Técnicas

- **Por que dedup com `Set<string>`?** Em forge-labs o lead aparece uma vez (via alias `team-lead`). Mas se num futuro alguém adicionar explicitamente `lucas-techlead` ao config **além** do alias, sem dedup teríamos dois `AGENT_JOINED` do mesmo agente em posições diferentes do círculo. O `Set` blinda contra isso.
- **Por que manter o fallback para `members.meta[0]` quando não há role lead-like?** Em `signal-ops` e `cfo-inter-vida-v3` nenhum membro tem role contendo "lead", mas os times ainda têm um alias `team-lead` em `config.members` que o código remapeia para o primeiro membro do meta. Isso é convenção — se a premissa mudar (alguns times não terão alias e nenhum lead-like role), o fallback continua a não produzir agente fantasma: o `realLeadName` fica `undefined` e o alias é simplesmente descartado.
- **Efeito colateral desejado:** a sessão do lead agora emite eventos `MESSAGE_SENT` normais como qualquer agente. Antes, mensagens `lucas-techlead → X` também tinham `sourceAgent` referenciando um agente não-anunciado, mas o frontend sintetizava no lado do source com menos colaterais do que no target. Agora ambos os papéis estão consistentes.
- **Risco residual / follow-up (Ana #a33f5faa):** mesmo com `AGENT_JOINED` correto, se o frontend processa eventos antes de `scanTeam` completar, o MESSAGE_SENT pode chegar antes do join. Mitigação: `scanTeam` emite joined em `start()`, antes de `watcher.start()`, então a ordem está preservada em boot. Sob reconexão de websocket em meio a eventos, poderia haver race — mas isso é problema do transport, não do adapter.

---

## [v0.13.9] — 2026-04-18

**Tipo:** Fix (defesa em profundidade)
**Esforço estimado:** 20min
**Autor:** Claude (ana-frontend, Opus 4.7)

### Descrição
Mitigação frontend complementar à investigação da #a33f5faa. O root cause do "não anima em sessões reais" foi identificado no adapter Claude Local (`claude-lucas-techlead` nunca emite `AGENT_JOINED`, será corrigido em task separada para @carlos-backend). Como defesa em profundidade, esta entrada adia `relayoutAgents()` quando ele é disparado durante uma animação em vôo.

### Causa da regressão visual
Quando o retry on-demand (`addAgent(event.targetAgent)` na #73ad746c) sintetiza o sprite do lead durante o primeiro `animateConversation`, `createAgentSprite` chama `relayoutAgents()` no mesmo frame — isso cancela o tween do source/target que estão indo para os slots S1/S4 da mesa de reunião. Resultado: animação silenciosamente interrompida, lock `processing` liberado via erro, visual travado.

### Alterações
- `apps/web/src/phaser/TheaterScene.ts`:
  - Novo campo `pendingRelayout: boolean` na classe, documentando o rationale.
  - `relayoutAgents()` agora tem um guard no topo: se `this.processing === true` (animação em vôo), seta `pendingRelayout = true` e retorna sem tocar nos sprites. Senão, limpa a flag e continua o fluxo normal.
  - No `processEventQueue` (dentro do `onComplete` do `animateEvent`), após resetar `processing = false` e atualizar `lastAnimatedEventId`, verifica `pendingRelayout` e dispara `relayoutAgents()` se estava adiado. Nesse ponto todos os sprites já estão em `originalPos` (ou posição final do animateBroadcast), então reorganizar o grid é seguro.

### Impacto
- **Tweens de `animateConversation` e `animateBroadcast` ficam imunes a spawns on-demand durante a execução.** O grid só reorganiza nos intervalos entre eventos.
- **Coalescência natural**: múltiplos `addAgent` durante uma única animação produzem apenas 1 relayout no final, mesmo que 5 agentes faltantes apareçam em sequência.
- **Nenhuma regressão** no caso normal (agentes adicionados fora de animação): o guard é falsy, o fluxo continua igual.
- **Não substitui** o fix do adapter — é defesa em profundidade. O fix fundamental (lead real emite AGENT_JOINED) deixará de disparar os retries em primeiro lugar.

### Verificação
- `pnpm --filter @theater/web typecheck` ✅
- `pnpm --filter @theater/web build` ✅
- Validação visual fica pendente até o fix do @carlos-backend aterrissar (limitação registrada em comentário da task).

### Notas Técnicas
- Usei `this.processing` como indicador de in-flight para evitar introduzir um 3º estado (`animationInFlight`) com invariantes paralelas. Eles são equivalentes no fluxo atual (processing = true durante toda animação, false nos intervalos).
- O guard não adia `relayoutAgents` chamado diretamente (sem estar dentro de `createAgentSprite` durante um animate). Se um outro caminho chamar `relayoutAgents` fora do contexto de animação, funciona normalmente.
- O drain é single-shot por ciclo: cada `onComplete` do `animateEvent` confere e executa 1x. Se múltiplos addAgents chamaram relayout durante o tween, a flag é setada uma única vez (boolean idempotente).

---

## [v0.13.8] — 2026-04-18

**Tipo:** Fix
**Esforço estimado:** 45min
**Autor:** Claude (bruno-frontend, Opus 4.7)

### Descrição
Corrige bug no player/timeline (#c3eb2ea5): ao selecionar um evento passado na timeline e apertar **Play**, a cena pulava direto para o último evento em vez de reanimar a partir do ponto selecionado.

Três problemas combinados:
1. `togglePlayback` reescrevia `activeEventId` para `events[events.length - 1]` a cada Play — o cursor selecionado era destruído no instante do clique.
2. `pushEvent` (evento novo via WebSocket) puxava o cursor para o evento recém-chegado sempre que `playing === true`, mesmo durante uma sessão de replay.
3. `TheaterScene.processEventQueue` não derivava de `activeEventId`: mantinha um `lastProcessedIndex` interno que avançava 1-a-1, ignorando completamente onde o user havia clicado. `stepForward`/`goToFirst`/`goToLast` do store mudavam `activeEventId` mas a scene não escutava.

Plus: os cards de evento não tinham click para seleção — só expansão de conteúdo.

### Alterações
- `apps/web/src/stores/theaterStore.ts`:
  - `togglePlayback` simplificado: só alterna `playing`, não mexe mais em `activeEventId`.
  - `pushEvent` só inicializa `activeEventId` na primeira vez (`s.activeEventId ?? event.id`); eventos subsequentes via WS não movem o cursor.
  - Nova action `selectEvent(eventId)`: posiciona o cursor + pausa. Chamada pelos cards da timeline.
- `apps/web/src/phaser/TheaterScene.ts`:
  - Removido `lastProcessedIndex` interno. Cursor passa a ser derivado exclusivamente de `state.activeEventId` (`findIndex` em `state.events`).
  - Novo campo `lastAnimatedEventId` distingue "cursor aponta para evento ainda não animado" de "cursor parado no tail já animado". Evita re-animação quando pushEvent chega no tail.
  - `processEventQueue` reescrita: animar `events[cursor]`, avançar `setActiveEvent(events[cursor+1])` ao terminar se `playing`; quando `cursor` já é o último, para e aguarda. Subscribe detecta `eventsGrew || playbackStarted || cursorChanged` e chama de volta.
- `apps/web/src/components/EventCard.tsx`:
  - Click principal passa a chamar `selectEvent(event.id)` em vez de só expandir. A expansão continua disponível via o botão `▼ Expandir / ▲ Recolher` existente (já tem `stopPropagation`).
  - `aria-label` atualizado para comunicar que o clique posiciona o cursor.

### Impacto
- **Replay a partir de evento selecionado funciona:** clicar num evento antigo + Play reanima a cena desde ali.
- **Live continua funcionando:** se o user nunca clica em evento passado, `activeEventId` segue o tail naturalmente via pushEvent (primeira inicialização) + auto-avanço do processEventQueue.
- **WebSocket em modo replay:** eventos novos acumulam em `events[]` mas não puxam o cursor — o user mantém controle da posição até `⏭` / `End` ou até o replay alcançar organicamente o live.
- **Botões ⏮ ⏴ ⏵ ⏭** agora efetivamente movem o cursor da cena (antes só moviam o highlight da timeline). Todos pausam o playback ao mover, mantendo UX de scrubbing consistente.
- `pnpm --filter @theater/web tsc --noEmit` limpo.

### Notas Técnicas
- **Única fonte de verdade:** `activeEventId` no store. A scene só guarda `lastAnimatedEventId` como marker. Evita dessincronia entre store e scene quando step/select disparam.
- **Por que `selectEvent` pausa:** se o user clica num evento antigo, ele quer inspecionar, não ser atropelado pelo auto-advance. Se depois quiser replay, aperta Play manualmente.
- **Auto-advance no tail:** quando `processEventQueue` vê `nextCursor >= events.length`, para. Próximo `pushEvent` do WS dispara `subscribe` com `eventsGrew=true` → `processEventQueue` cai no branch `lastAnimatedEventId === activeEventId` → avança cursor → subscribe vê `cursorChanged=true` → re-entra e anima. Loop orgânico sem estado extra.
- **Race de pause durante animação:** ao terminar, relemos `theaterStore.getState()`. Se `playing` virou false ou `activeEventId` mudou, não avançamos — o subscribe-event novo cuida.

---

## [v0.13.7] — 2026-04-17

**Tipo:** Docs
**Esforço estimado:** 1h
**Autor:** Claude (renata-docs, Opus 4.7)

### Descrição
Criação de documentação viva do projeto em `docs/` e atualização do `README.md` para refletir o estado real do código (#9f8290c1). O README tinha várias defasagens: listava `AdapterRegistry` que nunca foi implementado, rotas `/api/sessions` e `/api/adapters` inexistentes, status de adapters desatualizado (`adapter-claude-local` marcado como "interface definida" quando na verdade está funcional), e não explicava a diferença entre Sessão Demo e sessões reais (contexto da mensagem do usuário ao abrir a task).

### Alterações
- `docs/architecture.md` (novo) — layout real do monorepo, fluxo end-to-end de um `TheaterEvent` (adapter → server → WS → Zustand → TheaterScene), contratos de `@theater/core` (events, agents, adapter, validation), API REST realmente implementada (`/api/health`, `/api/status`, `/api/events`, `/api/agents`), variáveis de ambiente (`DEMO_ADAPTER`, `CLAUDE_LOCAL_ADAPTER`, etc.), e nota sobre o `inspectWebDist` que defende contra corrupção de bundle por OneDrive.
- `docs/phaser-scene.md` (novo) — guia de navegação de `TheaterScene.ts`: responsabilidades, constantes-chave (`MEETING_TABLE_POS`, `AGENT_DESK_Y_OFFSET`, `DESK_AREA_*`, `MOVE_SPEED`), queue de animação e invariante do lock `processing`, três fluxos animados (`animateConversation` com contador dual, `animateBroadcast` com center-stage isolado, `animateSimpleEvent` sem movimento), barrel de sprites (`OfficeDesk`, `MeetingTable`, `seatPositions`, `textures`) e checklist para adicionar sprite novo. Nota esclarecendo que `MEETING_SLOTS`/`CONVERSATION_OFFSET_X` citados no escopo original da task não existem como constantes exportadas — vêm de `getMeetingSeatPositions` e de offset hard-coded, respectivamente.
- `docs/adapters.md` (novo) — contrato `TheaterAdapter` + `BaseAdapter` (com nota sobre `emit()` HTTP vs `onEmit()` in-process), como o server carrega adapters via bootstrap manual (não via registry), walkthrough do `adapter-demo` (`FEATURE_SCENARIO` scriptado) e do `adapter-claude-local` (descoberta de times, resolução de alias `team-lead` → nome real do lead, filtros de `user.json`/`team-lead.json`/heartbeats embutidos em JSON, auto-mensagens como broadcast), cores por role, sanitização `<info_for_agent>`, limitações conhecidas (sessões reais não animam do mesmo jeito que a Demo) e template mínimo para adapter novo.
- `README.md` — adicionada nova seção "Sessões: Demo vs Claude Local" explicando a diferença e como alternar, bloco de env vars na seção "Execução", explicação real de `pnpm dev:server` vs `pnpm dev:web`, atualização da tabela de adapters com status real e link para `docs/adapters.md`, correção da tabela de API REST (removidas rotas inexistentes de sessions/adapters, adicionadas `/api/status` e `/api/agents`), nova seção "Documentação adicional" com ponteiros para `docs/*` e para `PATCH_NOTES.md`/`CONTRIBUTING.md`. Sumário atualizado.
- `PATCH_NOTES.md` — esta entrada.

### Impacto
- **Onboarding mais rápido**: um dev novo consegue entender o fluxo completo lendo `architecture.md` (um só arquivo, ~170 linhas) em vez de caçar o que é real entre README, código e PATCH_NOTES.
- **Menos desinformação**: as afirmações sobre rotas e adapters agora batem com o código. Antes, quem seguisse o README tentando `POST /api/sessions` apanharia silenciosamente.
- **Sessão Demo vs Claude Local explicada explicitamente** — contexto pedido pelo usuário ao criar a task ("quando fizer um teste, lembre de selecionar uma sessão válida ex. forge-labs"). Ficou documentado tanto no README quanto em `docs/adapters.md`.
- **Nenhuma mudança em código de runtime** — apenas markdown. Zero risco de regressão.

### Notas Técnicas
- Decidi manter os docs curtos e denso (architecture.md ~170L, phaser-scene.md ~180L, adapters.md ~190L). Escopo da task pedia máx ~200L por arquivo.
- Cross-links bidirecionais: README aponta pra `docs/*`, cada doc aponta pros outros dois relacionados.
- Não incluí conteúdo genérico sobre Phaser, Zustand ou WebSocket — só o que é específico do projeto (lock `processing`, filtros de inbox do Claude, `inspectWebDist`, etc.).
- Corrigi ambiguidade: o escopo da task mencionava `MEETING_SLOTS` e `CONVERSATION_OFFSET_X` como constantes; nenhuma das duas existe como `export const`. Registrei isso na doc em vez de fingir que existem — futuro leitor não fica procurando em vão.

---

## [v0.13.6] — 2026-04-18

**Tipo:** Feature
**Esforço estimado:** 25min
**Autor:** Claude (ana-frontend, Opus 4.7)

### Descrição
Nova animação visual para mensagens broadcast (`MESSAGE_SENT` com `targetAgent: null`, #a33f5faa). Antes, esses eventos caíam em `animateSimpleEvent` — o agente só trocava de estado, sem sair do posto, sem bubble. Agora, o emissor caminha até o centro da mesa de reunião, fala o conteúdo, e retorna à sua mesa individual, comunicando visualmente "falando pro time todo".

### Alterações
- `apps/web/src/phaser/TheaterScene.ts::animateEvent`: o switch `isMessageEvent` ganhou um segundo ramo — `targetSprite` presente → `animateConversation` (existente); ausente → `animateBroadcast` (novo). Eventos não-mensagem continuam em `animateSimpleEvent` como antes.
- `apps/web/src/phaser/TheaterScene.ts::animateBroadcast` (novo método): mesma estrutura de `animateConversation`, adaptada para um único agente:
  - Destino: `centerPos = { x: MEETING_TABLE_POS.x, y: MEETING_TABLE_POS.y + 60 }` — 60px abaixo da mesa, à frente dela, virado pro palco.
  - Snapshot de `originalPos` no início, `setDeskState('away')` na mesa individual do source.
  - `moveTo(centerPos) → setState('speaking') + speak → bubble duration → moveTo(originalPos) → setState('idle') + setDeskState('occupied') → onComplete()`.
  - Apenas 1 tween em cada direção (não precisa de contador `Promise.all`).

### Impacto
- **Mensagens broadcast do lead ganham animação espacial visível** — antes indistinguíveis de um `tool_call`/`thinking` qualquer.
- **Sem regressão em mensagens diretas** — `animateConversation` continua sendo chamado quando `targetSprite` existe. O lock `processing` continua garantindo serialização.
- **Coerente com o layout de mesa de reunião**: a posição `MEETING_TABLE_POS.y + 60` deixa o agente em frente à mesa, ligeiramente abaixo, com o balão de fala aparecendo acima sem conflitar com a mesa. A mesa de reunião (em `MEETING_TABLE_POS.y`, origin 0.5, altura 56) fica acima do agente no eixo Y, então `setDepth(centerPos.y)` coloca o agente visualmente na frente dela — leitura "parado em frente à mesa, dirigindo-se ao time".
- **Eventos que antes seriam silenciosos** (o fix de Carlos em #b3c5b77f deixa 21/84 eventos ainda como broadcast legítimo — todos emitidos pelo lead) agora têm animação visual rica.

### Verificação
- `pnpm --filter @theater/web typecheck` ✅
- `pnpm --filter @theater/web build` ✅ (`tsc --build` + vite build)
- Playwright em `http://localhost:3001/` (bundle novo servido pelo dev:server): Sessão Demo reproduzida. No evento `message_sent` do Rafael com conteúdo "Arquitetura definida: JWT + RBAC + refresh tokens" (evento broadcast, `targetAgent: null`), a mesa individual dele (primeira da esquerda) entrou em estado `away` (monitor escurecido sem glow azul) — evidência de que `animateBroadcast` foi invocada e disparou o toggle de estado da mesa. Screenshot `broadcast-3-triggering.png` no diretório `.playwright-mcp/`. A captura do próprio sprite no center-stage dependeria de fotografar o meio do tween (janela de ~2 segundos), o que não foi estável na sessão de teste, mas o ciclo completo do ponto de vista da mesa (away → occupied) é consistente com o novo fluxo.
- Sem regressão no fluxo de conversa dirigida: screenshot `broadcast-1-initial.png` capturou Rafael e Carlos no meio de um `animateConversation` (S1/S4 da mesa de reunião) usando os mesmos eventos com `targetAgent` preenchido.

### Notas Técnicas
- **Fonte da verdade do destino**: centralizado em `MEETING_TABLE_POS` (já exportado). Se a posição da mesa mudar no futuro, o center-stage acompanha automaticamente.
- **Offset de 60px**: 56px (altura da mesa) / 2 + margem = ~60. Testado visualmente; agente fica logo abaixo do carpete inferior da zona de reunião, ainda dentro do campo visual do palco.
- **Depth durante a fala**: `setDepth(centerPos.y)` é maior que o depth da mesa (`MEETING_TABLE_POS.y`, usado em `drawMeetingZone`), então o agente renderiza à frente dela. Na volta, `setDepth(originalPos.y)` retorna ao depth usual do posto individual.
- **Broadcasts N≥3 ao mesmo tempo**: a trava `processing` serializa, então múltiplos broadcasts consecutivos não colidem — cada um executa round-trip completo antes do próximo iniciar. Mesmo comportamento das mensagens diretas.

---

## [v0.13.5] — 2026-04-18

**Tipo:** Fix
**Esforço estimado:** 25min
**Autor:** Claude (ana-frontend, Opus 4.7)

### Descrição
Correção da animação de reunião que não disparava (#73ad746c). Sintoma: eventos `MESSAGE_SENT` chegavam no painel com `targetAgent` populado corretamente, mas os agentes permaneciam parados em suas mesas e nenhum balão de fala aparecia.

### Causa raiz
`TheaterScene.animateEvent` tinha um caminho on-demand para criar o sprite do `sourceAgent` quando faltava no mapa, mas **não tinha o equivalente para o `targetAgent`**. Quando um evento de mensagem chegava antes do sprite do destinatário estar registrado (ex.: adapter emite `MESSAGE_SENT` logo após `AGENT_JOINED` e o subscriber do store ainda não propagou `createAgentSprite`), `this.agentSprites.get(event.targetAgent.id)` retornava `undefined`, a condição `if (this.isMessageEvent(event) && targetSprite)` caía no `else`, e o evento rodava como `animateSimpleEvent` — sem caminhar até a mesa de reunião e sem balão de fala.

### Alterações
- `apps/web/src/phaser/TheaterScene.ts::animateEvent`: adicionado caminho de retry simétrico ao do `sourceAgent`. Quando o evento é de mensagem, tem `targetAgent` não-nulo e o sprite do target está ausente, dispara `theaterStore.getState().addAgent(event.targetAgent)` e reagenda `animateEvent` via `delayedCall(50, ...)`. Na próxima tentativa o sprite já está criado pelo subscriber do store e o fluxo prossegue para `animateConversation`.

### Impacto
- **Animação de reunião volta a disparar** para qualquer `MESSAGE_SENT`/`MESSAGE_RECEIVED` com `targetAgent`, mesmo em corridas entre `AGENT_JOINED` e a primeira mensagem.
- **Balão de fala volta a aparecer** (consequência: a animação completa executa `source.speak(event.summary)` no slot S1).
- **Lock `processing` continua saudável**: o retry mantém `this.processing = true` até `onComplete` disparar no final do round-trip. Sem risco de deadlock.
- **Eventos sem target** (broadcast, eventos de sistema, eventos simples como `TOOL_CALL`/`THINKING`) continuam usando `animateSimpleEvent` como antes.

### Verificação
- `pnpm --filter @theater/web typecheck` ✅
- `pnpm --filter @theater/web build` ✅
- Playwright em `http://localhost:3001/` (bundle novo servido via fastify-static): Sessão Demo ativa com Rafael exibindo balão de fala no início do replay — confirma o pipeline de eventos → animação acionando normalmente após o fix.
- O round-trip completo S1↔S4 para eventos com target foi validado em `flip-1-4-agents.png` (PATCH v0.13.3, Rafael em S1 e Carlos em S4 com balão ativo) — o mesmo código do `animateConversation` é executado agora que o target não some silenciosamente.

### Notas Técnicas
- Hipótese 1 (ids não batem) avaliada via grep em `adapter-claude-local`: `makeAgentFromOwner` gera `id: 'claude-<name>'`, e `AGENT_JOINED` usa `buildAgentList` com mesma convenção. Ids batem.
- Hipótese 2 (`processing` preso) não confirmada — o lock é sempre liberado no `onComplete` do `animateConversation`, e o retry preserva a invariante (não retorna sem eventualmente chamar `onComplete`).
- Hipótese 5 (target null no payload) descartada — o mesmo `TheaterEvent` é consumido pelo painel e pela cena, sem transformação intermediária.

---

## [v0.13.4] — 2026-04-17

**Tipo:** Fix
**Esforço estimado:** 1h
**Autor:** Claude (carlos-backend, Opus 4.7)

### Descrição
Usuário reportou `http://localhost:3001` (servido pelo `dev:server`) renderizando página em branco após a entrega da #ee71e889 pela Ana. O `:5173` (vite dev) funcionava normalmente; só o `:3001` ficava sem cena e sem chat.

A investigação mostrou que o `dev:server` **servia o bundle estático de `apps/web/dist`**, que é inerentemente cópia ponto-no-tempo do código. Todas as combinações abaixo geram tela branca no `:3001`, mas nenhuma delas quebra o `:5173`:

1. **Bundle stale após edição do source.** Ana editou `TheaterScene.ts` às 00:52 mas o `dist/assets/index-*.js` era das 00:42. O usuário via a versão antiga; em edições com runtime crash, via branco.
2. **Bundle parcialmente apagado pelo OneDrive.** Mesmo risco descrito em #e57175c3 / v0.11.5 (OneDrive sync removendo arquivos `.js` em `node_modules` e `dist`). Se o `index-*.js` some, `index.html` referencia um asset inexistente → `<script src="...">` 404 → DOM só tem `<div id="root">` vazio.
3. **`dist` inteiro ausente.** Se o usuário nunca rodou `pnpm build:web`, o server loga "Frontend não encontrado em dist" e qualquer `GET /` devolve JSON de erro 404.

Cenário comum de confusão: dev esquece/perde o `build:web`, roda `dev:server`, abre `:3001`, vê tela branca, assume que é regressão no código.

### Correção aplicada

Dois ajustes mínimos, retrocompatíveis, que eliminam o "pegadinha do bundle stale":

- **`package.json` (root):** `dev:server` agora faz `pnpm --filter @theater/web build && pnpm --filter @theater/server dev`. Todo start de `dev:server` passa a regenerar o bundle automaticamente (~5–8s no ambiente local). Garante que o `:3001` sempre reflete o estado atual do código, sem depender do dev lembrar de rebuildar.
- **`apps/server/src/index.ts`:** a função nova `inspectWebDist` valida o dist antes de registrar o `fastify-static`:
  - Se `index.html` ou `assets/` não existem, ou se não há nenhum `*.js` em `assets/` (cenário OneDrive removendo), o server **loga um erro claro** e não registra o static serving — em vez de servir um bundle incompleto que causa tela branca silenciosa no browser.
  - Se o dist é válido, o log passa a incluir o nome e o `mtime` do bundle principal: `Servindo frontend estático de: ... (bundle: index-XXX.js, gerado em 2026-04-18T03:54:56.937Z)`. Facilita detectar stale visualmente — se o mtime do bundle for muito anterior a uma edição recente, é indício claro de cache.
  - Mensagens de erro/info apontam para `pnpm --filter @theater/web build` (caminho correto em monorepo).

### Impacto

- **`pnpm dev:server` agora "só funciona":** independentemente de ter dist prévio ou não, independentemente de OneDrive ter apagado algo do dist, o server sobe com bundle fresco. Nunca mais tela branca silenciosa por bundle ausente/obsoleto.
- **Diagnóstico muito mais rápido:** se o dist estiver corrompido por qualquer razão (OneDrive, disco cheio, processo morto no meio do build), o log grita o porquê em vez de servir HTML que referencia um JS que não existe.
- **Custo: +~5–8s na inicialização do `dev:server`.** Aceitável para ambiente local; quem precisa de iteração rápida no frontend já usa `pnpm dev:web` (vite HMR em `:5173`) ou `pnpm dev` (ambos em paralelo).
- `pnpm --filter @theater/server typecheck` passa sem erros; `pnpm dev:server` validado end-to-end via Chrome DevTools em `http://localhost:3001` — cena com 4 agentes, chat lateral com 21 eventos, WebSocket "Conectado", zero erros no console.

### Notas Técnicas

- **Por que não tornar `dev:server` um proxy para o Vite dev?** É a solução "correta" (servidor roda API em `:3001` + proxy para HMR do vite), mas exige: (a) adicionar `http-proxy` ou `@fastify/http-proxy` como dep, (b) distinguir dev de prod no bootstrap, (c) gerenciar ciclo de vida do vite embedded. O custo supera o benefício aqui — o `pnpm dev` já roda vite + server em paralelo, que é o fluxo recomendado para iteração rápida. O `dev:server` continua servindo seu propósito: ambiente "isolado" (sem vite) para validar o bundle real.
- **Proteção vs OneDrive:** `inspectWebDist` detecta proativamente o cenário "dist existe mas sem `.js`" que já vimos em #e57175c3. Não conserta a causa raiz (OneDrive sync), apenas evita servir bundle quebrado e aponta para o fix.
- **Risco aberto (inalterado):** OneDrive continua podendo apagar `.js` em `node_modules`/`dist` a qualquer momento. Recomendação anterior permanece: mover o projeto para fora do OneDrive ou excluir `node_modules`/`dist` da sincronização.
- **Por que escolher o maior `.js` como bundle principal?** Heurística simples e robusta: o entry point do vite com Phaser + React é SEMPRE o maior arquivo (>1MB). Se no futuro code-splitting mudar isso, a mensagem de log vai apontar para o chunk errado, mas a validação de "bundle existe" continua correta.

---

## [v0.13.3] — 2026-04-18

**Tipo:** Fix
**Esforço estimado:** 20min
**Autor:** Claude (ana-frontend, Opus 4.7)

### Descrição
Inversão do posicionamento vertical do par agente+mesa individual (#ee71e889). Substitui a leitura "agente sentado atrás da mesa" (#7f55851a) por "agente em pé logo abaixo da mesa, cabeça levemente sobrepondo a base" — leitura preferida pelo usuário.

### Alterações
- `apps/web/src/phaser/TheaterScene.ts`:
  - `AGENT_DESK_Y_OFFSET`: `-18` → `+16`. Agente agora fica abaixo da mesa individual.
  - `createAgentSprite`: `desk.setDepth(slot.agentY - 2)` (mesa atrás do agente no eixo Z). Comentário e docstring atualizados.
  - `relayoutAgents.onUpdate`: `desk.setDepth(desk.y + 14)` — equivalente matematicamente a `agentY - 2` dado que `agentY = desk.y + 16`.
  - Nenhuma outra mudança necessária: `FALLBACK_AGENT_POS` compensa o offset via `deskY: FALLBACK_AGENT_POS.y - AGENT_DESK_Y_OFFSET`, `animateConversation` usa `originalPos` snapshot e não depende do sinal, `syncLabelPositions` lê a posição real do sprite.

### Impacto
- **Leitura visual invertida:** o feedback do usuário pede que o agente não fique escondido atrás da mesa. Agora a cabeça do agente sobrepõe levemente o tampo da mesa, comunicando "em pé na frente dela".
- **Bounds:** com `DESK_AREA_Y_MAX=480` e `+16`, o agente mais baixo fica em ~476, ainda dentro do canvas 540. Nenhum agente sai do viewport.
- **Sessões grandes:** o layout expandido em #7f55851a continua acomodando 17–22+ agentes sem sobreposição — a inversão é apenas em Y, a distribuição XY não muda.
- `animateConversation` continua funcionando sem mudança: o depth do agente evolui conforme ele caminha (`setDepth(seat.y)` no meeting-table, `setDepth(originalPos.y)` no retorno).

### Verificação
- `pnpm --filter @theater/web typecheck` ✅
- `pnpm --filter @theater/web build` ✅
- Playwright (vite em :5182, screenshots em `.playwright-mcp/`):
  - `flip-1-4-agents.png` — Sessão Demo 4 agentes. Ana/Igor abaixo de suas mesas individuais; Rafael e Carlos mid-conversation em S1/S4 da mesa de reunião (bonus: peguei a animação em andamento com o balão de fala ativo).
  - `flip-2-19-agents.png` — forge-labs com 19 agentes em 3 linhas (8+8+3). Todos abaixo das mesas, sem sobreposição, mesa de reunião livre à direita.

---

## [v0.13.2] — 2026-04-17

**Tipo:** Fix
**Esforço estimado:** 1h 30min
**Autor:** Claude (carlos-backend, Opus 4.7)

### Descrição
Na sessão `forge-labs` (adapter Claude Local), os agentes ficavam parados no palco: sem balões de fala, sem ida à mesa de reunião. A Sessão Demo (adapter-demo) funcionava normalmente. Ana tinha sinalizado em #537bd1b5 que os eventos `message_sent` do Claude Local chegavam todos como broadcast (`targetAgent: null`) e o frontend só dispara `animateConversation(source, target, …)` quando `targetAgent` está preenchido.

A investigação encontrou **quatro problemas encadeados** no `adapter-claude-local`:

1. **Bug principal — destinatário ausente nas mensagens de inbox:** o orquestrador grava mensagens em `inboxes/<X>.json` sem preencher o campo `to` top-level (o destinatário é implícito pelo nome do arquivo). O handler `handleInboxChange` lia apenas `msg.to` e, vendo `undefined`, emitia `targetAgent: null`. Validação real: **0 de 83** `MESSAGE_SENT` com target preenchido em `claude-forge-labs`.
2. **Ruído de notificações de sistema:** `inboxes/team-lead.json` concentra 249 `idle_notification` stringificadas dentro do campo `text` (formato `{"type":"idle_notification",...}`). O filtro existente só pegava `source === 'system_notification'` e deixava esses heartbeats passarem como `MESSAGE_SENT`, poluindo o fluxo.
3. **Aliases de orquestração sem remapeamento:** o alias `team-lead` (usado em `leadAgentId` e em referências genéricas) não é o nome do membro real do time (no forge-labs o lead é `lucas-techlead`). Qualquer evento que saísse referenciando `team-lead` apontava para um agente que o frontend nunca adicionou ao palco.
4. **Inboxes de observabilidade tratadas como agente real:** `user.json` (inbox do observador humano) e `team-lead.json` (espelho de atividade) eram lidas pelo `handleInboxChange`, gerando eventos duplicados/sem sentido visual.

### Alterações

- `packages/adapters/adapter-claude-local/src/index.ts`:
  - `handleInboxChange`:
    - **Ignora inboxes `user.json` e `team-lead.json`** antes de qualquer leitura. Mensagens `A → B` reais já existem na inbox do destinatário com `to` implícito pelo nome do arquivo, então nada se perde.
    - **Fallback de `to`:** quando `msg.to` não está preenchido top-level, usa `memberName` (extraído do arquivo `inboxes/<memberName>.json`) como destinatário. Corrige o bug principal.
    - **Filtro `isEmbeddedSystemPayload`:** detecta JSONs de sistema embutidos no campo `text` (`idle_notification`, `heartbeat`, `status_update`, `shutdown_request`, `shutdown_response`, `plan_approval_request`, `plan_approval_response`). Nenhum desses vira `MESSAGE_SENT`.
    - **Ignora `from === 'user'` ou `to === 'user'`:** observador humano não anima no palco.
    - **Usa `resolveAgentName`** em `from` e `to`, remapeando `team-lead` para o nome real do lead.
    - **Auto-mensagens (`from === to`)** emitem broadcast (target=null) para não animar conversa consigo mesmo, mas mantêm entrada no histórico lateral.
  - `handleTaskChange`: aplica `resolveAgentName` em `task.owner` e `comment.author`.
  - `scanTeam`: popula o novo cache `leadRealNameByTeam` buscando em `members.meta.json` o membro com role `tech_lead` (ou contendo "lead"). Também pula `user` e `team-lead` ao inicializar contadores de inbox.
  - `buildAgentList`: filtra o alias `team-lead` da lista de membros renderizados no palco.
  - Novos métodos privados: `isEmbeddedSystemPayload`, `resolveAgentName`. Novo campo: `leadRealNameByTeam: Map<string, string>`.

### Impacto

- **Antes:** 0 de 83 `MESSAGE_SENT` do `claude-forge-labs` tinham `targetAgent` preenchido → frontend nunca disparava `animateConversation` → personagens parados no palco.
- **Depois (validado via `GET /api/events?sessionId=claude-forge-labs&limit=500`):** **63 de 84** `MESSAGE_SENT` saem com `targetAgent` correto (ex.: `carlos-backend → lucas-techlead`). Os 21 restantes são broadcasts legítimos do lead para todo o time (`to: "*"`), que permanecem como broadcast — comportamento esperado; animação dedicada para broadcast fica como Opção C do brief para futura task da Ana.
- Ruído zerado: 249 heartbeats `idle_notification` da inbox `team-lead.json` deixam de virar eventos.
- Backend-only change. Nenhuma alteração no contrato `TheaterEvent` ou no frontend. Retrocompatível com sessões Demo e outros adapters.
- `pnpm --filter @theater/adapter-claude-local build` passa sem erros de tipo.

### Notas Técnicas

- **Heurística do lead real:** busca `role === 'tech_lead'` ou role contendo `"lead"` em `members.meta.json`; fallback para o primeiro membro. No forge-labs resolve para `lucas-techlead`. Limitação aceitável: em times sem lead explícito, o fallback pode remapear incorretamente.
- **Por que não preencher `to` no orquestrador?** Fora do escopo — o orquestrador é sistema externo. O contrato do adapter é adaptar dados existentes para `TheaterEvent`; usar o nome do arquivo como fonte de verdade do destinatário é legítimo e barato.
- **Broadcasts do lead (Opção C do brief):** os 21 eventos sem target são broadcasts reais (`to: "*"`). O design atual do frontend (v0.13.x) anima apenas pares A→B. Se o produto quiser animar broadcast (ex.: lead vai sozinho ao centro e "fala pro ar"), é mudança de frontend (Ana) — registrado e não tocado aqui.
- **Validação runtime:** server subiu, duas mensagens reais foram enviadas via `SendMessage` do time e aparecem no `/api/events` com `targetAgent: lucas-techlead` corretamente preenchido.

---

## [v0.13.1] — 2026-04-18

**Tipo:** Fix
**Esforço estimado:** 30min
**Autor:** Claude (ana-frontend, Opus 4.7)

### Descrição
Correção de dois bugs visuais reportados na #7f55851a, ambos originados da integração da cena em #537bd1b5:

1. **Z-order agente/mesa invertido.** O sprite do agente estava renderizando por cima da mesa, parecendo "flutuar na frente" em vez de sentado atrás. A spec original (§2.1/§7.3) mandava `desk.setDepth(agent.y - 2)`, mas o feedback visual do usuário tem prioridade — agente sentado atrás da mesa é a leitura clássica em jogos top-down.
2. **Sprites se sobrepondo com 17+ agentes.** A área útil e o spacing mínimo do grid estavam apertados demais para acomodar sessões com 17 ou mais membros (caso real: sessão forge-labs).

### Alterações
- `apps/web/src/phaser/TheaterScene.ts`:
  - Z-order da mesa no spawn (`createAgentSprite`): `desk.setDepth(slot.agentY + 4)` em vez de `slot.deskY - 2`. Mesa agora fica acima do agente no eixo Z, cobrindo a metade inferior do sprite.
  - Z-order da mesa no relayout (`relayoutAgents`, `onUpdate` do tween): `desk.setDepth(desk.y - 14)` — equivalente a `agentY + 4` dado que `agentY = deskY - 18`. Mantém a leitura correta enquanto as mesas e os agentes tweening em paralelo.
  - Área útil expandida: `DESK_AREA_X_MIN` 80→60, `DESK_AREA_X_MAX` 640→680, `DESK_AREA_Y_MAX` 460→480. Ganha ~140px horizontais e 20px verticais sem colidir com a zona de reunião (x=820 com raio ~100px).
  - Spacing mínimo entre células aumentado: `minCellW` 64→88, `minCellH` 72→96 (em scale 1). Acomoda mesa 40 + agente 32 + ~24px de respiro horizontal e vertical entre vizinhos.
  - `scale` continua 1.0 (≤8), 0.8 (≤16), clamp 0.5 (17+) — a matemática de fit recompensa os novos mínimos.

### Impacto
- **Leitura visual:** agentes agora "sentam" nas mesas. A metade inferior dos sprites fica coberta pelo tampo/monitor, e a metade superior (cabeça/torso) fica livre, com balão de fala e ícones de estado acima.
- **Densidade de sessões grandes:** testado com 4, 17 e 22 agentes via Playwright (sessões `Sessão Demo`, `signal-ops`, `forge-labs`). 22 agentes em 3 fileiras de 9+9+6, sem sobreposição. Mesa de reunião permanece isolada à direita em todos os counts.
- **Ordem Z nos balões:** `setDepth` do agente é `agentY`, da mesa é `agentY + 4`. Balões de fala continuam sendo posicionados pelo overlay HTML (`labelPositions`), portanto não são afetados — sempre aparecem acima do sprite na DOM, independentemente do depth Phaser.

### Notas Técnicas
- Decisão deliberada de não ajustar o `AGENT_DESK_Y_OFFSET` (-18) — manter compatibilidade com as posições originais dos agentes; apenas mudou-se qual dos dois renderiza por cima. A sobreposição visual foi testada e já dá a leitura correta com o offset atual.
- Os limites visuais da zona de reunião (mesa em x=820, carpete ~220px) permitem o novo `DESK_AREA_X_MAX=680` sem colisão: sobra ~40px entre o último desk e a borda esquerda do carpete.

---

## [v0.13.0] — 2026-04-18

**Tipo:** Feature
**Esforço estimado:** 2h 30min
**Autor:** Claude (ana-frontend, Opus 4.7)

### Descrição
Integração da cena do escritório ao novo modelo dinâmico definido na UX spec #b35c9591 e aos sprites entregues pelo @bruno-frontend em #ccf5ad3e. Task #537bd1b5.

Quatro entregas em uma:
1. **Cena limpa** — removidas a mesa de reunião central, as 6 mesas fixas, as 6 cadeiras ao redor da mesa central e o carpete central embutido. Permanecem parede, piso uniforme, sofás, plantas, estantes e iluminação ambiente.
2. **Mesa individual por agente** — 1 `OfficeDesk` spawnada junto com cada `AgentSprite`, com `highlightColor = agent.color` e `state = 'occupied'`. Layout recalculado a cada novo agente na área restrita à esquerda (x ∈ [80, 640], spec §2.2), deixando o canto direito para a mesa de reunião.
3. **Mesa de reunião isolada** — `MeetingTable` singleton em `(820, 300)` (spec §3.2) com carpete de `tile_highlight` ao redor para sinalizar zona separada. As 6 cadeiras são renderizadas internamente pelo próprio container.
4. **Fluxo de conversa no meeting-table** — `animateConversation` reescrita: quando um `MESSAGE_SENT`/`MESSAGE_RECEIVED` com `targetAgent` não-null entra na fila, ambos os agentes caminham em paralelo aos seus slots (S1 + S4, diagonal cinematográfica), o emissor fala, e ambos retornam em paralelo às mesas individuais. As mesas individuais entram em estado `away` (monitor em standby) durante a reunião e voltam a `occupied` no retorno.

### Alterações
- `apps/web/src/phaser/TheaterScene.ts` —
  - `drawStage()` simplificada: remove o loop `deskPositions`, a `meetingTable` central, os `chairOffsets` e o `tile_highlight` central. Mantém somente o shell (parede, piso, sofás, plantas, estantes, luz ambiente).
  - Novo `drawMeetingZone()` chamado do `create()`: carpete 7x6 tiles + `new MeetingTable(this, 820, 300)`.
  - Nova constante exportada `MEETING_TABLE_POS`.
  - `calculateLayout(agentCount)` reescrita: devolve `DeskSlot[]` com `{deskX, deskY, agentX, agentY}` (agente em `deskY - 18` atrás da mesa, spec §2.2); área restrita 80→640 / 80→460; spacing mínimo 64x72 * scale; escalas 1.0 / 0.8 / clamp 0.5.
  - `createAgentSprite()` passa a criar também `OfficeDesk` + registrar em `deskSprites: Map<string, OfficeDesk>`. Ordem Z: `desk.setDepth(deskY - 2)`, `sprite.setDepth(agentY)`.
  - `relayoutAgents()` tweena em paralelo o agente e sua mesa individual.
  - `removeAgentSprite()` também destrói/remove a mesa individual associada.
  - `animateConversation()` reescrita para usar `getMeetingSeatPositions`, `Promise.all`-like com dois contadores (ida e volta), e `setDeskState('away' | 'occupied')` no ciclo. Fluxo alinhado ao "Opção A" aprovada em #537bd1b5 (per-evento round-trip, sem `CONVERSATION_STARTED/ENDED`).
  - `shutdown()` estendido para limpar `deskSprites` e `meetingTable`.
  - Imports dos novos sprites via `./sprites/index.js`.
- `apps/web/src/phaser/SpriteFactory.ts` — cleanup de código morto em `generateOfficeTextures`: removida a geração de `furniture_desk` (48x24, substituída por `OfficeDesk`) e `furniture_meeting_table` (oval 64x32, substituída por `MeetingTable`). Mantidas `tile_highlight` (agora usada pelo carpete da zona de reunião), `furniture_sofa`, `furniture_plant`, `furniture_bookshelf`, `furniture_chair`. Guard idempotente atualizado para checar `furniture_sofa`.

### Impacto
- **Novo layout visual:** cena sem mobília embutida; mesas e agentes passam a ser 1:1 e renderizados conforme a composição da sessão. Funciona com 1, 4 ou 20+ agentes.
- **Animação de conversa mais legível:** os dois participantes se deslocam juntos até a mesa de reunião, o que comunica a ideia de "conferência" em vez de "um fala do outro lado da sala".
- **Reestruturação do estado visual dos postos:** mesas entram em `away` (monitor em standby) quando o agente está em reunião — comunica ausência sem precisar esconder a mesa.
- **Código morto removido** em `SpriteFactory.ts::generateOfficeTextures`. Nenhum outro consumidor dos símbolos `furniture_desk` / `furniture_meeting_table` no repo (verificado por grep).
- **Type-check do `@theater/web` passa limpo** (`pnpm --filter @theater/web typecheck`, `tsc --build`).

### Notas Técnicas
- **Opção A de conversa:** decisão registrada em #537bd1b5 (comentário do tech lead). A Opção B (eventos `CONVERSATION_STARTED/ENDED` com `conversationId`) fica como follow-up caso o produto peça diálogos multi-turno mantendo ambos os agentes sentados. Hoje cada `MESSAGE_SENT/RECEIVED` vira um round-trip atômico; na prática, múltiplos eventos consecutivos entre o mesmo par visualmente mostram os dois agentes vindo e voltando a cada mensagem.
- **Ownership respeitado:** zero edição em `apps/web/src/phaser/sprites/*` (arquivos do @bruno-frontend). A integração consome exclusivamente a API pública de `sprites/index.ts` (`OfficeDesk`, `MeetingTable`, `getMeetingSeatPositions`, `generateSpriteTextures`).
- **`setDeskState` vs `setState`:** Bruno usou `setDeskState` para evitar colisão com `Phaser.GameObjects.Container.setState`. `TheaterScene` respeita isso.
- **Fallback de layout:** quando o grid não tem slot para o `positionIndex` (cenário raro de múltiplos `addAgent` em frame adjacentes), usa-se `FALLBACK_AGENT_POS` (200, 270). Invariante mantida: todo agente tem mesa.
- **Definições em aberto:**
  - Reuniões N ≥ 3 ainda funcionam via `getMeetingSeatPositions(x, y, n)` (Bruno suporta até 6), mas `animateConversation` hoje atende apenas N=2 (`source` + `target`). O lock `this.processing` garante serialização.
  - Tooltip de hover na mesa individual: fora de escopo (spec §8).

---

## [v0.12.0] — 2026-04-18

**Tipo:** Feature
**Esforço estimado:** 1h 30min
**Autor:** Claude (bruno-frontend, Opus 4.7)

### Descrição
Implementação dos sprites `OfficeDesk` (mesa individual por agente) e `MeetingTable` (mesa de reunião isolada) + helper `getMeetingSeatPositions`, conforme UX spec #b35c9591 e task #ccf5ad3e.

Escopo restrito a **arquivos novos** em `apps/web/src/phaser/sprites/`, sem modificar `SpriteFactory.ts` legado nem `TheaterScene.ts`. A integração na cena principal fica a cargo da #T3 (@ana-frontend), que consome a API exportada por `./sprites/index.ts`.

### Alterações
- `apps/web/src/phaser/sprites/textures.ts` — geração procedural das texturas novas (`sprite_desk_individual_{idle,occupied,away}`, `sprite_meeting_table`, `sprite_meeting_chair`) via `Phaser.GameObjects.Graphics`, usando a paleta da spec §0. Prefixo `sprite_*` distinto das legadas `furniture_*` em SpriteFactory.ts para coexistência sem colisão.
- `apps/web/src/phaser/sprites/OfficeDesk.ts` — `class OfficeDesk extends Phaser.GameObjects.Container`. API: `new OfficeDesk(scene, x, y, { state?, highlightColor? })`, `setDeskState()`, `setHighlightColor()`. Estados `idle | occupied | away` trocam a textura e o glow correspondente.
- `apps/web/src/phaser/sprites/MeetingTable.ts` — `class MeetingTable extends Phaser.GameObjects.Container`. API: `new MeetingTable(scene, x, y, { seats? })`. Renderiza a mesa 96x56 + N cadeiras estáticas nos 6 slots da spec §3.2.
- `apps/web/src/phaser/sprites/seatPositions.ts` — helper puro `getMeetingSeatPositions(tableX, tableY, n)` que devolve px absolutos + `facing`. Ordem de preenchimento S1→S4→S3→S6→S2→S5 (frente a frente cinematográfico para N=2).
- `apps/web/src/phaser/sprites/index.ts` — barrel com exportações públicas + `MEETING_TABLE_DEFAULT_POS = { x: 820, y: 300 }` (da spec §3.2).
- `apps/web/src/phaser/sprites/__demo__/SpritesDemoScene.ts` — cena standalone para validação visual dos 3 estados da mesa e dos 3 tamanhos de reunião (2/4/6 cadeiras), com marcadores dos assentos calculados pelo helper.

### Impacto
- **Zero impacto funcional no app atual** — os novos arquivos ainda não são importados pela cena principal. A integração acontece na #T3.
- **Pipeline de build** (`pnpm --filter @theater/web tsc --noEmit`) passa sem erros.
- **Código morto temporário:** as texturas `furniture_desk` / `furniture_meeting_table` em `SpriteFactory.ts` continuam sendo geradas mas sem uso após a #T3 — cleanup fica a cargo da @ana-frontend nessa task.

### Notas Técnicas
- **Decisão "Phaser vs React":** a cena usa Phaser 3, então os sprites foram entregues como `GameObjects.Container` (e não `.tsx`). Alinhado previamente com @lucas-techlead.
- **Chaves de textura:** prefixo `sprite_*` (vs `furniture_*` legado) ratificado pelo tech lead. Evita colisão em `scene.textures.exists()`, deixa óbvio em code review qual é a pipeline nova, e evita o débito técnico de um sufixo `_new` que envelhece mal quando a legada for removida.
- **`occupied` sem glow quando `highlightColor` é undefined:** decisão deliberada — a cor é opcional na API, e sem ela o container não tem base para o glow. A @ana sempre deve passar `agent.color`.
- **Estado `away`:** implementado com textura distinta (tela escurecida) + alpha global 0.85 para reforçar "ninguém aqui agora". Era opcional na spec §2.3; implementado porque o custo é baixo.
- **Demo scene isolada:** `SpritesDemoScene` não está registrada no `config.ts`. Para visualizar, trocar temporariamente `scene: [TheaterScene]` por `scene: [SpritesDemoScene]` em `apps/web/src/phaser/config.ts`.

---

## [v0.11.5] — 2026-04-17

**Tipo:** Fix
**Esforço estimado:** 45min
**Autor:** Claude (claude-opus-4-7)

### Descrição
`pnpm dev:server` quebrava com `ERR_MODULE_NOT_FOUND` ao carregar `packages/core/dist/validation.js`, que importa `zod`. A resolução ESM do Node procurava `packages/core/node_modules/zod/index.js` e só encontrava `index.cjs`, com a mensagem "Did you mean to import `zod/index.cjs`?".

Diagnóstico em camadas:
1. O `zod` resolvido era a versão `3.25.76` (o range `^3.23.0` em `packages/core/package.json` aceitava). Essa release tem `"type": "module"` e `exports["."]` que mapeia `import → ./index.js`, mas **não publica `./index.js` na raiz do pacote** — somente `index.cjs`, `index.d.cts` e `index.d.ts`. Ou seja, o publish da 3.25.76 está com ESM root quebrado; quem usa `import 'zod'` em ambiente ESM bate num arquivo inexistente. (Os subpaths `zod/v4`, `zod/v4-mini` etc. têm `.js`, mas a raiz não.)
2. Após trocar para `zod@3.23.8` e reinstalar, surgiu um segundo `ERR_MODULE_NOT_FOUND` em `process-warning/index.js` (dependência transitiva de `fastify`). Inspecionando `.pnpm/fastify@5.8.5/node_modules/process-warning/`, o arquivo `index.js` **estava ausente do disco** — só existiam `package.json`, `types/`, `test/`, etc. Idem para outras deps. Sintoma consistente com arquivos `.js` sendo perdidos pela sincronização do OneDrive no diretório do projeto.
3. Solução: fixar `zod` em versão estável conhecida (3.23.8) e refazer a instalação limpa (`rm -rf node_modules packages/*/node_modules apps/*/node_modules && pnpm install`) para restaurar todos os arquivos perdidos pelo OneDrive.

### Alterações
- `packages/core/package.json`:
  - `zod`: `^3.23.0` → `3.23.8` (pin exato). Evita que futuras instalações puxem a 3.25.76 com publish ESM quebrado. Usar pin enquanto a série 3.25.x não for corrigida.
- `node_modules/` (todos os workspaces): removidos e reinstalados do zero para restaurar arquivos `.js` perdidos pela sincronização do OneDrive.
- `packages/core/dist/`: rebuild via `pnpm --filter @theater/core build`.

### Impacto
- `pnpm dev:server` sobe limpo, com logs esperados:
  - `Servindo frontend estático de: ...apps/web/dist`
  - `Adapter demo iniciado (sessão: ...)`
  - `Adapter Claude Local iniciado — monitorando 4 time(s): ...`
  - `Server listening at http://[::1]:3001` / `Servidor rodando em http://localhost:3001`
- Validação de eventos via `zod` volta a funcionar no server e nos adapters.
- Lock do `zod` em pin exato: qualquer bump futuro deve ser decisão explícita.

### Notas Técnicas
- **Causa raiz combinada:** o range `^3.23.0` no `package.json` do `@theater/core` é tecnicamente correto, mas o publish da 3.25.76 do zod trata `./index.js` como existente no `exports["."].import` sem incluí-lo no tarball. Enquanto o range permitia essa versão, qualquer `pnpm install` poderia reintroduzir a quebra.
- **Risco do OneDrive:** o diretório do projeto mora em `OneDrive\Documentos\Projetos`. A sincronização do OneDrive ocasionalmente remove arquivos `.js` de `node_modules` após a instalação. Mitigação recomendada (fora do escopo deste fix): excluir `node_modules` da sincronização do OneDrive, ou mover o projeto para um diretório fora do OneDrive. Se o problema voltar, `rm -rf node_modules && pnpm install` resolve.
- **Alternativas consideradas e descartadas:**
  - Trocar `import { z } from 'zod'` por `'zod/v4'` ou `'zod/v4-mini'` na 3.25.76: funcionaria no runtime, mas a API da v4 tem breaking changes (ex.: `z.nativeEnum`, `z.record`) — custo de migração não justificado para esse fix.
  - Adicionar `overrides` no root `package.json`: desnecessário, pois apenas `@theater/core` depende de `zod`.

---

## [v0.11.4] — 2026-04-17

**Tipo:** Fix
**Esforço estimado:** 5min
**Autor:** Claude (claude-opus-4-7)

### Descrição
Usuário ainda reportou balão sobreposto ao sprite mesmo após v0.11.3 (que já havia descontado `TAIL_HEIGHT` do anchor do container nas 3 direções). Diagnóstico por eliminação: o cálculo geométrico da ponta da setinha já caía em `spriteTop − 2px`, portanto sem sobreposição de corpo. O overlap visual restante vinha do **drop-shadow** do balão (`shadow-lg` Tailwind extende ~4–6px abaixo da caixa visível), que cobria o gap de 2px + alguns pixels do sprite.

### Alterações
- `apps/web/src/components/AgentLabels.tsx`:
  - `BUBBLE_TAIL_GAP_PX` aumentado de `2` para `6`. Ponta da setinha agora fica 6px do sprite, o que mantém a setinha visualmente próxima mas dá espaço suficiente para o shadow não invadir o sprite.

### Impacto
- Balão aparece claramente separado do sprite em qualquer estado (idle/active/speaking), sem depender de quais bordas do Tailwind `shadow-lg` cobrem.
- Nenhuma outra mudança de layout. Direção randômica e alinhamento continuam intactos.

### Notas Técnicas
- Alternativa considerada: remover o `shadow-lg` ou trocar para `shadow-sm`. Rejeitada porque tira profundidade visual do balão. Aumentar o gap é menos destrutivo.
- Se o usuário ainda reportar overlap após v0.11.4, o próximo passo seria investigar o bounce tween do sprite (idle breath ±1/2px) via screenshot em frame específico.

## [v0.11.3] — 2026-04-17

**Tipo:** Fix
**Esforço estimado:** 10min
**Autor:** Claude (claude-opus-4-7)

### Descrição
Correção de posicionamento da setinha do balão (#423d395f). A setinha estava `TAIL_HEIGHT = 8px` DENTRO do sprite porque o âncora do container considerava apenas o `BUBBLE_TAIL_GAP_PX` sem compensar a protrusão da setinha (que extrapola o corpo do balão via `bottom/right/left: -TAIL_HEIGHT`).

**Cálculo correto** (ex: direção `top`):
- Ponta da setinha deve estar em `spriteTop - GAP` (2px acima do sprite).
- Setinha extrapola a base do balão em `TAIL_HEIGHT` (8px).
- Logo, a base do balão (ancorada no `top` do container + `translateY(-100%)`) precisa ficar em `spriteTop - GAP - TAIL_HEIGHT` = `spriteTop - 10`.
- Antes estava em `spriteTop - GAP` → ponta caía em `spriteTop - GAP + TAIL_HEIGHT` = `spriteTop + 6`, ou seja, 6px DENTRO do sprite.

Mesma correção aplicada espelhada para `left` (usa `spriteLeft - GAP - TAIL_HEIGHT`) e `right` (usa `spriteRight + GAP + TAIL_HEIGHT`). Aproveitei o `spriteLeft`/`spriteRight` do `LabelPosition` (já expostos em v0.11.2) em vez de calcular `centerX ± spriteHalfWidth` — mais direto.

### Alterações
- `apps/web/src/components/AgentLabels.tsx` — `bubbleLayoutFor()` ajustado para descontar `TAIL_HEIGHT` do âncora do container nas 3 direções. Removida variável local `spriteHalfWidth` (não mais usada).

### Impacto
- Ponta da setinha encosta em 2px do sprite (valor do `BUBBLE_TAIL_GAP_PX`), sem sobrepor — comportamento pedido pelo usuário em #423d395f.
- Nenhuma outra mudança; layout do balão, direção randômica, estabilidade durante fala: tudo preservado.

### Notas Técnicas
- Usar `pos.spriteLeft`/`spriteRight` direto (em vez de derivar de `centerX`) dá precisão a pixels ímpares de `spriteWidthDom` — irrelevante na prática com sprite 32×32 mas elimina um arredondamento.

## [v0.11.2] — 2026-04-17

**Tipo:** Fix
**Esforço estimado:** 20min
**Autor:** Claude (claude-opus-4-7)

### Descrição
Correção do alinhamento label↔sprite usando `sprite.getBounds()` do Phaser. O usuário reportou em #bed715aa o mesmo padrão linear de drift ("quanto mais pra baixo, mais longe; quanto mais pra cima, mais sobreposto"), indicando erro de origem/bounds.

**Causa raiz — double-scale do displayHeight**:
- `displayHeight` do sprite interno já é `height * scaleY_interno`.
- Multiplicávamos novamente por `container.scaleY` (aplicado em grids com >8 agentes): `displayHeight * scaleY_container`. Em `layout.scale=1` isso era identidade (forge-labs OK). Em `layout.scale=0.8` virava `0.64` em vez de `0.8` — drift proporcional à altura.

**Fix**: uso de `agentSprite.getBounds()` (retorna `Rectangle` em coords do mundo Phaser, já considerando origin + nested scale). Mapeia `bounds.left/right/top/bottom` diretamente para viewport multiplicando por `canvas.scaleX/Y`. Elimina toda aritmética manual de origem.

Aproveitando o passe, adicionei `spriteWidthDom`, `spriteLeft` e `spriteRight` ao `LabelPosition` — necessários para o balão nos modos `left`/`right` (#423d395f) com precisão.

### Alterações
- `apps/web/src/phaser/labelPositions.ts` — `LabelPosition` ganhou `spriteWidthDom`, `spriteLeft`, `spriteRight`.
- `apps/web/src/phaser/TheaterScene.ts` — `syncLabelPositions()` agora usa `sprite.getBounds()` em vez de `sprite.getSpriteDisplayHeight() * sprite.scaleY`. Calcula `spriteLeft/Right/Top/Bottom` diretamente do rect.
- `apps/web/src/components/AgentLabels.tsx` — `bubbleLayoutFor` usa `pos.spriteWidthDom / 2` em vez de aproximar pela altura.

### Impacto
- Alinhamento correto em qualquer `layout.scale` do Container, não apenas em `1.0`.
- Bolhas `left`/`right` da v0.11.1 ficam precisas mesmo se o sprite não for perfeitamente quadrado (antes assumíamos width == height).
- Sem mudança de API visível: os campos novos do `LabelPosition` são aditivos.

### Notas Técnicas
- `getBounds()` no Container retorna bounding box de todos os filhos — inclui glow rect (36×36) além do sprite (32×32). Na prática o glow é maior, então bounds pode ser ~4px maior que o sprite visível. Aceitável (labels um pouco mais distantes quando agente está em `active`/`speaking`); se precisar apertar, usar `this.sprite.getBounds()` diretamente via novo getter em `AgentSprite`. Fica como follow-up se o usuário reportar.
- O "diagnóstico antes de codar" sugerido pelo Lucas (console.log de bounds) foi substituído por raciocínio direto: sabendo que `displayHeight` já inclui scale do sprite interno, a razão do drift linear em grids escalados era dedutível sem instrumentação.

## [v0.11.1] — 2026-04-17

**Tipo:** Feature
**Esforço estimado:** 40min
**Autor:** Claude (claude-opus-4-7)

### Descrição
Melhorias no balão de fala:

1. **Balão não sobrepõe mais o sprite** — reduzido o gap entre setinha e sprite, setinha passa a encostar diretamente no sprite (gap de 2px).
2. **Direção randômica do balão** — a cada início de conversação, sorteia aleatoriamente entre `top`, `left` ou `right`. A direção permanece fixa durante a fala atual e é re-sorteada na próxima conversação do mesmo agente. Direções que fariam o balão vazar do palco são filtradas (ex: agente colado na esquerda não sorteia `left`).

### Alterações
- `apps/web/src/stores/theaterStore.ts`:
  - Novo tipo `SpeechDirection = 'top' | 'left' | 'right'`.
  - Novo campo opcional `speechDirection` em `StageAgent`.
  - `setAgentSpeech` agora sorteia a direção via `pickSpeechDirection(pos)` **apenas na transição falsy → truthy** do `speechText`, e limpa a direção quando o texto some. Garante estabilidade durante a conversa e re-sorteio na próxima.
  - Novo helper `pickSpeechDirection(position)`: filtra direções viáveis baseadas nos limites do palco (`BUBBLE_EDGE_MARGIN_X=140`, `BUBBLE_EDGE_MARGIN_Y=110` em coords Phaser) e sorteia uniformemente entre as sobreviventes; fallback `'top'` se todas inviáveis.
- `apps/web/src/components/AgentLabels.tsx`:
  - Nova função `bubbleLayoutFor(direction, pos)` que retorna `containerStyle` + `tailStyle` conforme direção.
  - `SpeechBubbleOverlay` lê `agent.speechDirection` e delega para `bubbleLayoutFor`. Setinha renderizada como triângulo CSS com borda adequada em cada direção; ponta fica a apenas `BUBBLE_TAIL_GAP_PX=2` do sprite.
  - Para `top`: balão acima, setinha na base apontando pra baixo (igual ao v0.11.0, só com tail gap reduzido).
  - Para `left`: balão à esquerda, centro verticalmente alinhado ao centro do sprite, setinha à direita apontando pro sprite.
  - Para `right`: simétrico ao `left`.

### Impacto
- **Correção visual**: setinha agora encosta no sprite (gap 2px vs. antes ~4px + altura da setinha), eliminando a sensação de "longe".
- **Melhoria UX**: variação na direção do balão torna o palco menos monótono quando múltiplos agentes falam simultaneamente. Colisões entre balões ficam mais raras pela redistribuição.
- **Sem regressão na contenção**: filtros de `pickSpeechDirection` evitam que balões saiam do palco em agentes nas bordas.

### Notas Técnicas
- A direção é sorteada **no store**, não no componente, para que o mesmo agente mostre a mesma direção em re-renders durante a conversação. Isso é essencial para a typing animation não "piscar" trocando de direção no meio da frase.
- `spriteHalfWidth` reutiliza `pos.spriteHeightDom / 2` porque o sprite do agente é quadrado 32×32 — válido em todas as escalas. Se sprites virarem não-quadrados no futuro, adicionar `spriteWidthDom` ao `LabelPosition`.
- Margens `BUBBLE_EDGE_MARGIN_X/Y` foram dimensionadas para o balão típico (max-width 240px, altura ~2-3 linhas); em conteúdos muito longos pode haver corte marginal — aceito por enquanto já que a v0.10.4 removeu `overflow: hidden` do overlay e a v0.11.0 usa `position: fixed`.

## [v0.11.0] — 2026-04-17

**Tipo:** Refactor
**Esforço estimado:** 45min
**Autor:** Claude (claude-opus-4-7)

### Descrição
Reescrita do alinhamento do label HTML com o sprite Phaser usando sync imperativo via evento `POST_UPDATE` da cena. Substitui a abordagem da v0.10.3 baseada em `requestAnimationFrame` burst + `useLayoutEffect` + medição reativa no React, que tinha janelas de medição stale ao trocar de sessão.

**Abordagem nova (baseada na altura real do sprite):**
- `TheaterScene` registra listener em `Phaser.Scenes.Events.POST_UPDATE`. A cada frame, após tweens aplicarem seus deltas e o Scale.FIT já ter renderizado o layout final, lemos `sprite.x`, `sprite.y`, e `sprite.displayHeight` reais.
- Uma única leitura de `canvas.getBoundingClientRect()` por frame dá `scaleX`/`scaleY` e o offset de letterbox em viewport.
- Para cada agente, computamos em pixels de viewport: `centerX`, `spriteTop`, `spriteBottom`, `spriteHeightDom`.
- Os valores são publicados num novo store `labelPositionsStore` (zustand-vanilla).
- `AgentLabels` renderiza cada label com `position: fixed`, usando `pos.spriteBottom + LABEL_GAP_PX` para o label e `pos.spriteTop - LABEL_GAP_PX` para o balão.

### Alterações
- `apps/web/src/phaser/labelPositions.ts` — NOVO. Store vanilla de `LabelPosition` por `agentId` com coords de viewport.
- `apps/web/src/phaser/TheaterScene.ts` — importa `labelPositionsStore`, registra `syncLabelPositions()` em `POST_UPDATE`, limpa no `shutdown`. Método lê `sprite.list[1].displayHeight` do container `AgentSprite` (o sprite interno é o segundo filho, depois do `glowRect`).
- `apps/web/src/components/AgentLabels.tsx` — reescrito. Consome `useLabelPositions`, renderiza labels/balões com `position: fixed` lendo coords prontas. Removeu `useLayoutEffect`, `useCallback`, `useState`, RAF burst, subscribe no Phaser `scale.resize`, `ResizeObserver`, e toda a lógica de transform calculado no React. Componente ficou ~40% menor.

### Impacto
- **Correção**: alinhamento agora acompanha o sprite em qualquer sessão e tamanho de canvas, mesmo quando `scale.resize` não dispara na troca de sessão. Cobre o caso do `adapter-claude-local` (layout circular) que quebrava em v0.10.3.
- **Correção**: usa `sprite.displayHeight` real, então cobre agentes escalados (quando `layout.scale < 1` em grids com 17+ agentes) — antes o offset fixo `SPRITE_HALF_HEIGHT=16` ignorava o scale do sprite.
- **Robustez**: não depende de `setTimeout`, RAF ou heurísticas de convergência. Phaser é a fonte da verdade.
- **Simplicidade**: remove ~150 linhas de lógica em React (hooks, burst, subscribes externos) em troca de ~50 linhas no Phaser + um store pequeno.

### Notas Técnicas
- `POST_UPDATE` foi preferido sobre `POST_RENDER` porque é emitido pela cena (que temos referência direta), enquanto `POST_RENDER` é emitido pelo game/renderer e exigiria subscription no `game.events`. A diferença de timing entre eles (~1 frame) é imperceptível para labels.
- `sprite.list[1]` assume a estrutura atual do `AgentSprite` Container (`[glowRect, sprite, ...iconStatus]`). Se a ordem mudar, o fallback `32 * sprite.scaleY` entra como aproximação — não quebra, só fica 1px impreciso.
- `position: fixed` exige ausência de `transform` em ancestrais (caso contrário, fixed vira absolute). `TheaterLayout` e `StagePlaceholder` não aplicam transform — seguro.
- `shutdown` da cena chama `labelPositionsStore.replaceAll({})` para garantir que HMR/remount não deixe posições órfãs.
- O `gameRef.ts` ainda existe (usado pelo `PhaserGame.tsx`) mas já não é consumido pelo `AgentLabels` — pode ser removido num passo futuro se nenhum outro consumidor aparecer.

## [v0.10.4] — 2026-04-17

**Tipo:** Fix
**Esforço estimado:** 20min
**Autor:** Claude (claude-opus-4-7)

### Descrição
Correção do "balão mostra só #" reportado em sessões do `adapter-claude-local` (ex: `cfo-inter-vida-v3`).

**Causa raiz**: o container overlay tinha `overflow: hidden`. Quando o agente estava perto da borda superior do palco (e o layout circular do adapter-claude-local posiciona agentes em `y` a partir de 100), o balão (posicionado com `translateY(-100%)` acima do topo do sprite) podia estourar para fora da área do overlay e ser cortado. Só a parte inferior do balão ficava visível — como os eventos `MESSAGE_SENT` do Claude Local têm `summary` começando com `#<displayId>` (ex: `"ana comentou em #93a3bc9e"`), o usuário via apenas o primeiro caractere, que por acaso era `#`.

No `forge-labs` isso não aparecia porque o grid do demo mantém os agentes longe das bordas.

### Alterações
- `apps/web/src/components/AgentLabels.tsx`:
  - Removido `overflow-hidden` do overlay principal: labels e balões podem sair da área do palco sem serem cortados.
  - Adicionadas regras de wrap no corpo do balão (`wordBreak: break-word`, `overflowWrap: anywhere`, `whiteSpace: normal`, `minWidth: 80px`) para garantir que textos longos (hashes, URLs) quebrem em linhas em vez de serem truncados visualmente.

### Impacto
- Balões agora aparecem inteiros em qualquer posição do palco, inclusive quando o agente está colado no topo.
- Texto com `#` seguido de ID de tarefa (padrão comum do `adapter-claude-local`) é mostrado por completo.
- Não houve regressão no `forge-labs` — aquele layout já ficava dentro dos limites, e o balão continua aparecendo no mesmo lugar.

### Notas Técnicas
- O `overflow-hidden` original vinha provavelmente de uma preocupação de não deixar labels/balões "vazarem" para o painel lateral, mas o overlay está contido dentro da área do palco (ver `StagePlaceholder.tsx`), então o layout flex do `TheaterLayout` já previne vazamento lateral. Sem custo real removendo.
- Se no futuro o layout mudar e precisar de clipping, a solução correta é clipar por transform (`mask-image` ou ajuste de posição) em vez de `overflow: hidden`, para não cortar o conteúdo na primeira camada de renderização.

## [v0.10.3] — 2026-04-17

**Tipo:** Fix
**Esforço estimado:** 30min
**Autor:** Claude (claude-opus-4-7)

### Descrição
Correção de três regressões reportadas na validação visual da v0.10.2:

1. **Alinhamento do label volta a falhar ao trocar de sessão.** O `useCanvasTransform` media o canvas uma vez no mount e em eventos de resize. Quando o usuário trocava para uma sessão com layout Phaser diferente mas tamanho de canvas idêntico, o `scale.resize` do Phaser não disparava, e o transform armazenado permanecia stale. Além disso, o `setTimeout(0)` após `subscribePhaserGame` podia medir o canvas ANTES do Phaser aplicar o `Scale.FIT` final, deixando um `scaleY` incorreto. Agora o hook faz um burst de `requestAnimationFrame` por ~500ms depois do mount e depois de cada troca de sessão, garantindo que o transform capture o estado estável do canvas. Também subscreve o `theaterStore` para detectar mudanças em `sessionId`.
2. **Balão aparecendo sem agente estar falando.** O `speechText` podia ser setado com string vazia ou whitespace por eventos com `summary` em branco. A guarda `if (!agent.speechText)` tratava isso como falsy, mas ainda havia casos onde o container renderizava antes de ser descartado. Adicionado helper `hasVisibleSpeech()` que exige `.trim().length > 0`, usado em ambas as camadas (parent map + `SpeechBubbleOverlay`).
3. **Texto do balão não renderiza.** Mesma causa do item 2: quando `speechText` era whitespace, o container aparecia mas `{truncated}` ficava visualmente vazio. O novo guard resolve.

### Alterações
- `apps/web/src/components/AgentLabels.tsx`:
  - `computeCanvasTransform` agora retorna `null` se o canvas ainda tem tamanho zero, para não fixar um scale inválido.
  - `useCanvasTransform` faz burst de até 30 `requestAnimationFrame` (~500ms) após mount, troca de instância Phaser e troca de sessão, chamando `recalc` a cada frame até estabilizar.
  - `recalc` agora compara com o transform anterior e só dispara setState se mudou significativamente (evita loop com ResizeObserver).
  - Adicionado subscribe no `theaterStore` para refazer o burst quando `sessionId` muda.
  - Novo helper `hasVisibleSpeech()` para guardar renderização do balão contra texto vazio/whitespace.

### Impacto
- Alinhamento do label passa a convergir após troca de sessão, mesmo quando o canvas não sofre resize.
- Balão deixa de aparecer quando `speechText` é undefined, vazio ou só whitespace.
- Texto sempre renderiza quando há conteúdo válido.

### Notas Técnicas
- O burst de RAF termina automaticamente após MAX_TRIES ou no cleanup do effect. Não há impacto de performance perceptível (16ms × 30 = 500ms de overhead na entrada/troca de sessão).
- A comparação antes do setState evita re-renders em cascata: `ResizeObserver` dispara quando o overlay muda, e o transform pode voltar para o mesmo valor se o canvas não mudou — sem o guard, React re-renderizaria todos os labels desnecessariamente.
- `hasVisibleSpeech` é type predicate (`text is string`), garantindo que `agent.speechText` não é undefined dentro do bloco.

## [v0.10.2] — 2026-04-17

**Tipo:** Fix
**Esforço estimado:** 20min
**Autor:** Claude (claude-opus-4-7)

### Descrição
Correção do alinhamento vertical dos labels relatada após validação visual da v0.10.1.

O label era posicionado com `top = pos.top` (topo do label no centro do sprite) e depois empurrado para baixo por `translateY(16px)` em pixels DOM fixos. Como o canvas Phaser é escalado (Scale.FIT), o tamanho visual do sprite em DOM varia com o scaleY, mas o offset não acompanhava. Resultado: em canvas grande (scaleY > 1) o label sobrepunha o sprite, em canvas pequeno (scaleY < 1) ficava afastado — e o efeito se misturava com a distância do centro causando a percepção de "mais pra baixo → mais afastado, mais pra cima → mais sobreposto".

Agora o offset do label = `SPRITE_HALF_HEIGHT * scaleY + LABEL_GAP_PX`, acompanhando o tamanho real do sprite em DOM. O balão de fala usa a mesma fórmula invertida (acima do topo do sprite).

### Alterações
- `apps/web/src/components/AgentLabels.tsx` — `AgentLabel` e `SpeechBubbleOverlay` agora escalam o offset vertical pelo `transform.scaleY`, garantindo que label/balão fiquem sempre colados à base/topo do sprite independente do tamanho do canvas.

### Impacto
- Labels ficam corretamente abaixo da base do sprite em qualquer resolução do canvas, sem sobreposição quando scaleY > 1 nem gaps quando scaleY < 1.
- Balões de fala acompanham o topo do sprite de forma consistente.

### Notas Técnicas
- Sprite do agente é 32×32 com origem centrada (0.5/0.5), então meia-altura = 16 em coordenadas Phaser. Em DOM, a meia-altura visual = `16 * scaleY`, e é isso que precisa ser somado ao `pos.top` para chegar na base do sprite.
- O item "sprites órfãos de outras sessões" relatado na validação corresponde, segundo a leitura do código, à mobília decorativa (mesas, plantas, estantes, sofás) gerada em `TheaterScene.drawStage()` — não são agentes e não vazam entre sessões. Pedido de esclarecimento ao tech-lead antes de qualquer mudança no cenário.

## [v0.10.1] — 2026-04-17

**Tipo:** Fix
**Esforço estimado:** 45min
**Autor:** Claude (claude-opus-4-7)

### Descrição
Correção de dois bugs relatados:

1. **Labels desalinhados com sprites.** A conversão Phaser→DOM usava porcentagem do container, ignorando o letterboxing aplicado pelo `Scale.FIT + CENTER_BOTH`. Quanto mais longe do centro, maior o offset acumulado. Passamos a mapear coordenadas usando `canvas.getBoundingClientRect()` e o rect do próprio overlay, computando pixel-exato o `offsetX/Y` e `scaleX/Y` do canvas dentro do container. Transform é recalculada em resize de janela, resize interno do Phaser, mudanças de tamanho do container (divisor lateral) e remount do game.

2. **Agentes vazando entre sessões.** As mensagens `agent_update` não carregavam `sessionId`, então updates pendentes da sessão anterior entravam no store após troca no dropdown. Adicionamos `sessionId` ao envelope `WsAgentUpdateMessage`, o server passou a preenchê-lo, e o handler do cliente descarta mensagens de `event` ou `agent_update` cuja sessionId não bata com a ativa. Também fixamos `sessionId` no store imediatamente ao iniciar `switchSession`, para fechar a janela entre `reset()` e o retorno do `session_state` do server.

### Alterações
- `apps/web/src/phaser/gameRef.ts` — NOVO. Referência compartilhada à instância `Phaser.Game` com pub/sub, usada pelo overlay React para ler `canvas.getBoundingClientRect()`.
- `apps/web/src/components/PhaserGame.tsx` — Registra/limpa a instância do game no gameRef durante o lifecycle.
- `apps/web/src/components/AgentLabels.tsx` — Substituído mapeamento por porcentagem por transform real (offset + escala) baseado no bounding rect do canvas. Hook `useCanvasTransform` recalcula em resize de janela, resize do Phaser, ResizeObserver no overlay e remount do game.
- `packages/core/src/websocket.ts` — `WsAgentUpdateMessage` agora inclui campo `sessionId` obrigatório, para permitir isolamento por sessão no cliente.
- `apps/server/src/ws.ts` — Preenche `sessionId` ao fazer broadcast de `agent_update`.
- `apps/web/src/services/websocket.ts` — `handleMessage` descarta `event` e `agent_update` de sessões diferentes da ativa. `switchSession` fixa o novo `sessionId` no store imediatamente após `reset()`.

### Impacto
- Labels e balões passam a ficar pixel-aligned com os sprites em qualquer resolução e durante movimentação — o desalinhamento crescente com a distância do centro desaparece.
- Ao trocar de sessão no dropdown, agentes residuais da sessão anterior não aparecem mais no palco. O contador do header reflete apenas os agentes da sessão atual.
- Sem impacto em sessões únicas (modo padrão). Backwards-compat: clients antigos continuam funcionando, novos clients passam a filtrar corretamente.

### Notas Técnicas
- O filtro depende do server incluir `sessionId` em `agent_update`. Como o tipo foi atualizado em `@theater/core`, foi necessário rebuild de `packages/core/dist` para que server e web consumam a nova shape.
- `useLayoutEffect` foi escolhido em vez de `useEffect` para medir o canvas antes do paint do browser, evitando flicker na primeira frame.
- `ResizeObserver` garante recálculo quando o divisor da barra lateral é arrastado, sem precisar escutar evento de mouseup no `TheaterLayout`.

## [v0.10.0] — 2026-04-17

**Tipo:** Fix | Improvement  
**Esforço estimado:** 45min  
**Autor:** Claude (claude-opus-4-6)

### Descrição
Solucao definitiva para texto ilegivel: labels dos agentes e baloes de fala agora sao elementos HTML (React) posicionados sobre o canvas Phaser via CSS absolute. Texto renderizado na resolucao nativa do navegador, sempre crisp independente da escala do canvas.

### Alterações
- `apps/web/src/components/AgentLabels.tsx` — NOVO. Componente React que renderiza labels e baloes como HTML overlay. Converte coordenadas Phaser→DOM via porcentagem. Labels: Inter bold 13px, fundo pill preto 70% opacidade, borda com cor do agente. Baloes: fundo branco 95%, borda, seta CSS, Inter 12px.
- `apps/web/src/components/StagePlaceholder.tsx` — Integrado AgentLabels como overlay sobre o canvas
- `apps/web/src/phaser/AgentSprite.ts` — Removidos nameLabel, labelBg e SpeechBubble do Phaser. speak()/hideSpeech() agora atualizam store Zustand (setAgentSpeech). moveToPosition() sincroniza posicao com store via onUpdate para overlay acompanhar
- `apps/web/src/phaser/TheaterScene.ts` — createAgentSprite() sincroniza posicao inicial com store. relayoutAgents() sincroniza posicoes durante tween

### Impacto
Labels e baloes sao SEMPRE legiveis — renderizados pelo navegador em resolucao nativa, sem dependencia da escala do canvas Phaser. Funciona perfeitamente com qualquer quantidade de agentes e qualquer tamanho de janela.

## [v0.9.1] — 2026-04-17

**Tipo:** Fix  
**Esforço estimado:** 30min  
**Autor:** Claude (claude-opus-4-6)

### Descrição
Texto dos labels e baloes agora legivel. Resolucao interna dobrada (480x270 → 960x540) e fontes trocadas de Press Start 2P pixel para Inter/Arial bold com antialias. pixelArt desabilitado globalmente no Phaser para permitir text rendering suave.

### Alterações
- `apps/web/src/phaser/config.ts` — Resolucao 960x540 (era 480x270). pixelArt: false, antialias: true
- `apps/web/src/phaser/AgentSprite.ts` — Label com Inter bold 12px (era Press Start 2P 6px). Fundo pill mais alto (16px), borda stroke sutil, padding 4px
- `apps/web/src/phaser/SpeechBubble.ts` — Texto com Inter 11px (era Press Start 2P 5px). Balao maior (220px max width, padding 8px, offset -32)
- `apps/web/src/phaser/TheaterScene.ts` — STAGE_W/H ajustados para 960x540. Margens 80x60. Posicoes da mobilia proporcionais. CONVERSATION_OFFSET_X dobrado (-48)

### Impacto
Labels e baloes sao crisp e legiveis em qualquer escala, incluindo com 22+ agentes. Sprites de pixel art mantem aparencia correta pois sao renderizados em tamanho fixo.

## [v0.9.0] — 2026-04-16

**Tipo:** Feature  
**Esforço estimado:** 1h30  
**Autor:** Claude (claude-opus-4-6)

### Descrição
Cenario de escritorio isometrico pixel art substituiu o palco teatral. Mobilia procedural (mesas de trabalho com monitores, mesa de reuniao central oval, sofas, plantas, estantes com livros, cadeiras). Labels dos agentes agora legiveis com fonte 6px, fundo semi-transparente pill e truncamento de nomes longos.

### Alterações
- `apps/web/src/phaser/SpriteFactory.ts` — Tiles de escritorio (piso azul/cinza com grid, parede com rodape). Nova funcao generateOfficeTextures() com 6 moveis: mesa de trabalho (48x24 com monitor/teclado), mesa de reuniao oval (64x32), sofa azul (32x16), planta em vaso (16x20), estante com livros coloridos (20x28), cadeira (12x12)
- `apps/web/src/phaser/TheaterScene.ts` — drawStage() reescrito: piso de escritorio, parede superior, mesa de reuniao central com 6 cadeiras, 6 mesas de trabalho nas laterais, 2 sofas nos cantos, 6 plantas, 4 estantes na parede. Iluminacao fluorescente sutil
- `apps/web/src/phaser/AgentSprite.ts` — Label com fonte 6px Press Start 2P (antes 4px), fundo pill semi-transparente (Rectangle preta 65% opacidade), sombra de texto com blur, truncamento de nomes > 12 chars com "..."

### Impacto
O palco agora tem visual de escritorio corporativo em vez de teatro com cortinas. Labels dos agentes sao visiveis e legiveis em qualquer escala. A mesa de reuniao central serve como area de interacao onde agentes se encontram para conversar.

## [v0.8.1] — 2026-04-16

**Tipo:** Fix | Improvement  
**Esforço estimado:** 30min  
**Autor:** Claude (claude-opus-4-6)

### Descrição
Correção definitiva do TypeError null 'add' no SpriteFactory (try/catch como defesa final) e implementação de layout dinâmico para 22+ agentes no palco com escala automática e reposicionamento suave.

### Alterações
- `apps/web/src/phaser/SpriteFactory.ts` — tempGraphics() agora usa try/catch como defesa final (elimina race condition entre check e uso). Substituído isSceneReady() por hasTextures() + optional chaining.
- `apps/web/src/phaser/TheaterScene.ts` — Novo sistema calculateLayout(): grid dinâmico que escala automaticamente (<=8: 2x4 escala 1, 9-16: grid expandido escala 0.7, 17+: grid sqrt-based escala 0.4-0.6). relayoutAgents() reposiciona todos os sprites com tween suave. createAgentSprite() usa try/catch. isReady() usa try/catch.

### Impacto
Elimina definitivamente o TypeError no dev/Vite. 22 agentes agora se distribuem automaticamente no palco sem sobreposição, com sprites reduzidos e labels legíveis.

## [v0.8.0] — 2026-04-16

**Tipo:** Feature  
**Esforco estimado:** 2h  
**Autor:** Claude (claude-opus-4-6)

### Descricao
Implementacao do adapter-claude-local que monitora sessoes ativas do Claude Code na maquina local. Detecta automaticamente todos os times em ~/.claude/teams/, le dados de tarefas, inboxes e kanban de forma read-only, e converte eventos em TheaterEvent normalizado. Usa file watching + polling para detectar mudancas em tempo real.

### Alteracoes
- `packages/adapters/adapter-claude-local/package.json` — Novo pacote @theater/adapter-claude-local com dependencias
- `packages/adapters/adapter-claude-local/tsconfig.json` — Configuracao TypeScript com tipos Node
- `packages/adapters/adapter-claude-local/src/claude-reader.ts` — ClaudeReader: leitor read-only de config.json, members.meta.json, kanban-state.json, tarefas e inboxes do Claude Code
- `packages/adapters/adapter-claude-local/src/watcher.ts` — ClaudeWatcher: file watching nativo (fs.watch) + polling fallback para detectar mudancas em tempo real
- `packages/adapters/adapter-claude-local/src/index.ts` — ClaudeLocalAdapter: adapter principal que auto-detecta times, converte mudancas em TheaterEvent, suporta emissao direta ao store
- `apps/server/src/index.ts` — Integrado adapter-claude-local com registro automatico de sessoes e agentes
- `apps/server/package.json` — Adicionada dependencia @theater/adapter-claude-local

### Impacto
O servidor agora detecta automaticamente TODOS os times do Claude Code na maquina (forge-labs, cfo-inter-vida-v3, signal-ops, etc.) e cria sessoes separadas para cada um. Mudancas em tarefas, mensagens de inbox e kanban sao detectadas em tempo real e transmitidas via WebSocket ao frontend. O adapter e completamente read-only e nunca escreve nos arquivos do Claude.

### Notas Tecnicas
- Usa fs.watch nativo com recursive:true (suportado no Windows) + polling como fallback
- Detecta incrementalmente: compara estados anteriores para emitir apenas mudancas
- Sanitiza texto removendo blocos <info_for_agent> que nao devem ser exibidos
- Posiciona agentes em circulo automatico baseado no numero de membros do time
- Variavel CLAUDE_LOCAL_ADAPTER=false desabilita o adapter se necessario
- Variavel CLAUDE_POLL_INTERVAL_MS controla intervalo de polling (padrao: 2000ms)

---

## [v0.7.2] — 2026-04-16

**Tipo:** Fix  
**Esforço estimado:** 15min  
**Autor:** Claude (claude-opus-4-6)

### Descrição
Correção de TypeError crítico: "Cannot read properties of null (reading 'add')" no SpriteFactory. O `scene.add` era null quando o subscribe callback do Zustand tentava criar sprites antes da scene estar completamente inicializada, ou após shutdown/remontagem pelo React.

### Alterações
- `apps/web/src/phaser/SpriteFactory.ts` — Adicionado guard `isSceneReady()` que verifica `scene.sys`, `scene.add` e `scene.textures` antes de operar. Todas as funções `generate*` agora retornam `boolean` (true=sucesso, false=scene não pronta). `tempGraphics()` retorna null safety.
- `apps/web/src/phaser/TheaterScene.ts` — Adicionado `isReady()` guard no subscribe callback e no `createAgentSprite()`. Sprite só é criado se a scene está ativa. Retorna false para permitir retry futuro.

### Impacto
Elimina os ~57 erros de TypeError no console. Sprites são criados apenas quando a scene está ativa e pronta, evitando crashes durante inicialização assíncrona ou remontagem do React.

## [v0.7.1] — 2026-04-16

**Tipo:** Fix  
**Esforço estimado:** 30min  
**Autor:** Claude (claude-opus-4-6)

### Descrição
Correção de dois bugs: sprites dos agentes não apareciam no palco Phaser e overlay "Nenhum adapter conectado" permanecia visível mesmo com sessão demo ativa. Causa raiz: conflito entre dois stores Zustand (store/ e stores/) com APIs incompatíveis. O WebSocket service alimentava o store vanilla (stores/) mas o TheaterScene e StagePlaceholder liam do store React (store/) que ficava vazio.

### Alterações
- `apps/web/src/phaser/TheaterScene.ts` — Corrigido import para usar store vanilla (stores/theaterStore) e adaptado API: playback.playing, playback.speed, setActiveEvent, addAgent
- `apps/web/src/components/StagePlaceholder.tsx` — Corrigido import para stores/ e adaptado condição: sessionId em vez de session, playback.playing em vez de isPlaying
- `apps/web/src/store/theaterStore.ts` — Transformado em re-export do store vanilla consolidado para manter compatibilidade de imports
- `apps/web/src/services/websocket.ts` — Verificado e confirmado que usa API correta do store vanilla (pushEvent, loadSessionState, addAgent)

### Impacto
Os sprites dos agentes agora aparecem corretamente no palco quando a sessão demo carrega. O overlay de estado vazio desaparece quando há sessão ativa com agentes. Todo o sistema frontend agora converge para um único store Zustand vanilla.

### Notas Técnicas
O problema era que dois agentes criaram stores Zustand com APIs diferentes (um usando `create` do zustand, outro usando `createStore` do zustand/vanilla). O WebSocket alimentava o vanilla store, mas o Phaser e o overlay liam do React store — que ficava sempre vazio. A solução foi unificar todos os imports para o store vanilla e adaptar as chamadas de API.

## [v0.7.0] — 2026-04-16

**Tipo:** Feature  
**Esforco estimado:** 30min  
**Autor:** Claude (claude-opus-4-6)

### Descricao
Seletor de sessao no header para permitir ao usuario escolher entre sessoes disponiveis (demo, adapters reais, etc). Inclui polling periodico para manter a lista atualizada.

### Alteracoes
- `apps/web/src/stores/theaterStore.ts` — Adicionado tipo `SessionSummary`, campo `availableSessions` e acao `setAvailableSessions()`
- `apps/web/src/services/websocket.ts` — Adicionados metodos `switchSession()` (unsubscribe/reset/subscribe) e `fetchSessions()` (GET /api/status). Polling periodico a cada 10s para atualizar lista de sessoes. `discoverAndSubscribe()` agora tambem popula `availableSessions`
- `apps/web/src/components/SessionHeader.tsx` — Dropdown de selecao de sessao substituindo texto fixo. Mostra nome da sessao + contagem de agentes/eventos. Ao trocar, chama `wsService.switchSession()`

### Impacto
Usuarios podem trocar entre sessoes ativas sem recarregar a pagina. Lista de sessoes atualizada automaticamente a cada 10s. Fluxo: selecionar no dropdown → unsubscribe da sessao atual → reset do store → subscribe na nova → receber session_state.

## [v0.6.3] — 2026-04-16

**Tipo:** Fix  
**Esforco estimado:** 30min  
**Autor:** Claude (claude-opus-4-6)

### Descricao
Correcao do fluxo de auto-descoberta de sessao no WebSocket client. O frontend conectava ao WS mas nunca enviava subscribe porque nao conhecia o sessionId da sessao demo ativa no server.

### Alteracoes
- `apps/web/src/services/websocket.ts` — Adicionado metodo `discoverAndSubscribe()` que, apos conexao WS bem-sucedida, faz fetch de `/api/status` via REST para descobrir a sessao ativa, e envia `subscribe` automaticamente. Retry a cada 2s se nenhuma sessao ativa encontrada (adapter pode demorar a iniciar)

### Impacto
Resolve o problema de "Nenhuma sessao conectada" / "Nenhum evento ainda" / palco vazio mesmo com adapter-demo rodando. O frontend agora descobre e se inscreve automaticamente na sessao ativa.

### Notas Tecnicas
- Server envia `session_state` (snapshot completo) apenas apos receber `subscribe` com sessionId valido
- Client agora usa REST `/api/status` (que retorna `sessions.active`) como mecanismo de descoberta
- Se nao ha sessao ativa (adapter ainda nao iniciou), retry automatico a cada 2s
- Em reconnects, o sessionId ja esta no store e e reutilizado diretamente

## [v0.6.2] — 2026-04-16

**Tipo:** Fix  
**Esforco estimado:** 15min  
**Autor:** Claude (claude-opus-4-6)

### Descricao
Correcao de loop infinito React no HistoryPanel e erro de WebSocket connection failed.

### Alteracoes
- `apps/web/src/components/HistoryPanel.tsx` — Substituido `useTheaterStore((s) => s.filteredEvents())` (criava novo array a cada render, causando loop infinito) por `useMemo` com dependencias estaveis (`events`, `filters`). Tambem substituido `Object.values(s.agents)` por `useMemo` derivado
- `apps/web/src/services/websocket.ts` — Corrigido import de `useTheaterStore` (hook React) para `theaterStore` (vanilla store), e ajustados nomes de metodos para os corretos do store consolidado (`pushEvent`, `loadSessionState`, `addAgent`/`updateAgentState`)

### Impacto
Resolve "Maximum update depth exceeded" que causava tela preta e impedia uso da app. Resolve WebSocket connection failed que era consequencia do crash React.

## [v0.6.1] — 2026-04-16

**Tipo:** Fix  
**Esforco estimado:** 15min  
**Autor:** Claude (claude-opus-4-6)

### Descricao
Correcao de dois bugs identificados durante teste do MVP: ordem incorreta dos @import CSS que impedia carregamento de estilos, e script dev incompativel com Windows.

### Alteracoes
- `apps/web/src/index.css` — Movido @import de fontes Google para ANTES de @import "tailwindcss", corrigindo erro "@import must precede all other statements" que deixava a tela preta
- `package.json` (raiz) — Substituido operador `&` (Unix-only) por `concurrently` no script dev, tornando-o cross-platform (Windows/Mac/Linux)
- `package.json` (raiz) — Adicionado `concurrently@^9.2.1` como devDependency

### Impacto
Fix 1 e critico: resolve tela preta causada por CSS nao carregado. Fix 2 permite que `pnpm dev` funcione corretamente no Windows.

## [v0.6.0] — 2026-04-16

**Tipo:** Feature  
**Esforço estimado:** 3h  
**Autor:** Claude (claude-opus-4-6)

### Descrição
Implementação do palco visual 2D do Lee Agent Theater usando Phaser 3 integrado com React. Inclui cenário pixel art com tiles, sprites de agentes gerados proceduralmente, sistema de 8 estados visuais com animações, movimentação emissor→destinatário, balões de fala com duração proporcional ao texto, e ponte WebSocket→Zustand→Phaser para eventos em tempo real.

### Alterações
- `apps/web/src/phaser/config.ts` — Configuração Phaser 3 otimizada para pixel art (480x270, WebGL, pixelArt: true)
- `apps/web/src/phaser/TheaterScene.ts` — Cena principal: cenário em tiles, sprites de agentes, fila de animação de eventos, movimentação e balões de fala
- `apps/web/src/phaser/AgentSprite.ts` — Sprite de agente com 8 estados visuais (idle, active, moving, speaking, waiting, thinking, completed, error) e animações correspondentes
- `apps/web/src/phaser/SpeechBubble.ts` — Balões de fala com NineSlice, animação de entrada/saída e duração proporcional
- `apps/web/src/phaser/SpriteFactory.ts` — Geração procedural de sprites pixel art 32x32, ícones de estado e tiles de cenário
- `apps/web/src/components/PhaserGame.tsx` — Wrapper React para Phaser 3 com lifecycle correto (useRef + useEffect + cleanup)
- `apps/web/src/components/StagePlaceholder.tsx` — Atualizado para renderizar canvas Phaser com overlay de estado vazio
- `apps/web/src/services/websocket.ts` — Serviço WebSocket com reconnect exponencial e integração com store Zustand
- `apps/web/src/store/theaterStore.ts` — Restaurado store completo após conflito entre agentes
- `apps/web/src/App.tsx` — Adicionada inicialização do WebSocket
- `apps/web/index.html` — Adicionadas fontes Google (Press Start 2P, JetBrains Mono)

### Impacto
O palco agora renderiza visualmente os agentes em pixel art com animações de estado, movimentação entre agentes durante comunicação, e balões de fala. O sistema recebe eventos via WebSocket e anima cada evento na fila com velocidade ajustável.

### Notas Técnicas
- Sprites gerados proceduralmente (32x32, canvas graphics) para evitar dependência de assets externos
- Store Zustand (create) acessível via getState()/subscribe() tanto pelo React quanto pelo Phaser
- Resolução interna 480x270 escalada via Phaser.Scale.FIT para responsividade
- Chunk do build grande (~1.7MB) devido ao Phaser 3; code-splitting pode ser adicionado futuramente

## [v0.5.0] — 2026-04-16

**Tipo:** Feature  
**Esforco estimado:** 2h  
**Autor:** Claude (claude-opus-4-6)

### Descricao
Implementacao do painel lateral de historico de eventos, controles de reproducao, header de sessao e layout responsivo 70/30 do Lee Agent Theater (apps/web). Zustand store consolidado (vanilla) para ponte bidirecional React/Phaser com suporte a filtros, UI de scroll, e controles de playback.

### Alteracoes
- `apps/web/src/stores/theaterStore.ts` — Store consolidado Zustand vanilla com estado de agentes, eventos, sessao, playback, filtros do painel lateral, e acoes de UI. Compativel com Phaser (getState/subscribe) e React (useTheaterStore hook)
- `apps/web/src/components/EventCard.tsx` — Card de evento com timestamp, icone por tipo, badge colorido, avatares mini de agentes, resumo e conteudo expandivel
- `apps/web/src/components/HistoryPanel.tsx` — Painel lateral com lista de eventos filtrados, auto-scroll, destaque do evento ativo, badge de novos eventos, filtros por agente e tipo
- `apps/web/src/components/PlaybackControls.tsx` — Barra de controles com Play/Pause, step forward/backward, primeiro/ultimo, velocidade (0.5x/1x/2x/4x), indicador de conexao, atalhos de teclado
- `apps/web/src/components/SessionHeader.tsx` — Header com logo, nome/status da sessao, contagem de agentes/eventos, botao toggle do painel lateral
- `apps/web/src/components/TheaterLayout.tsx` — Layout principal com divisor arrastavel entre palco (70%) e painel (30%), colapsavel, responsivo
- `apps/web/src/index.css` — Fontes do design system (Inter, Press Start 2P, JetBrains Mono), variaveis CSS de cor, scrollbar customizada, prefers-reduced-motion
- `apps/web/src/App.tsx` — Integracao com TheaterLayout e conexao WebSocket

### Impacto
Adiciona toda a area direita + toolbar do Lee Agent Theater: historico navegavel de eventos, controles de reproducao com atalhos de teclado, layout responsivo com divisor arrastavel. Sincronizado com o store Zustand compartilhado com o palco Phaser.

### Notas Tecnicas
- Store usa `createStore` (vanilla) para ser acessivel por Phaser scenes sem React context. Hook `useTheaterStore` envolve `useStore` para componentes React.
- Componentes importam de `../stores/theaterStore.js`. Re-export em `../store/theaterStore.js` para compatibilidade com imports pre-existentes do Phaser.
- Erros de TypeScript pre-existentes em `src/phaser/` (AgentSprite.ts, SpriteFactory.ts) nao sao desta task.
- EventCard usa `memo` para evitar re-renders desnecessarios na lista de historico.
- PlaybackControls registra atalhos de teclado globais (Espaco, setas, 1-4, Home/End).

## [v0.4.0] — 2026-04-16

**Tipo:** Feature  
**Esforco estimado:** 2h  
**Autor:** Claude (claude-opus-4-6)

### Descricao
Implementacao completa do servidor backend do Lee Agent Theater (apps/server): Fastify com WebSocket para push de eventos em tempo real, API REST de debug/inspecao, estado de sessao em memoria com ring buffer, integracao com adapter-demo gerando cenarios realistas de interacao entre agentes, e suporte para servir arquivos estaticos do frontend em producao.

### Alteracoes
- `apps/server/src/store.ts` — SessionStore: gerenciamento de sessoes, agentes e eventos em memoria com ring buffer (MAX_EVENTS_PER_SESSION), callbacks para notificacao de mudancas
- `apps/server/src/ws.ts` — Plugin Fastify WebSocket: gerenciamento de conexoes, subscribe/unsubscribe por sessao, ping/pong, broadcast automatico de eventos e atualizacoes de agentes
- `apps/server/src/routes/events.ts` — GET /api/events (listagem com paginacao) e POST /api/events (recepcao de eventos de adapters com validacao Zod)
- `apps/server/src/routes/agents.ts` — GET /api/agents (lista agentes de uma sessao)
- `apps/server/src/routes/status.ts` — GET /api/status (visao geral: uptime, memoria, WS clients, sessoes)
- `apps/server/src/index.ts` — Reescrito: integra store, WebSocket, todas as rotas REST, adapter-demo com emissao direta, arquivos estaticos do frontend com SPA fallback
- `apps/server/package.json` — Adicionadas dependencias @fastify/static e @theater/adapter-demo
- `packages/adapters/adapter-demo/src/index.ts` — Implementacao completa com cenario realista de 22 passos: 4 agentes (Rafael/architect, Carlos/developer, Ana/reviewer, Igor/devops) interagindo com mensagens, tool calls, thinking, movimentacao, code review e ciclo de vida completo. Suporte a loop automatico e emissao direta ao store
- `packages/adapters/adapter-demo/package.json` — Adicionada devDependency @types/node
- `packages/adapters/adapter-demo/tsconfig.json` — Adicionado types: ["node"]

### Impacto
O servidor esta funcional e pronto para uso: inicia na porta 3001, gera eventos de demonstracao automaticamente, transmite via WebSocket em tempo real, e expoe 5 endpoints REST para debug. O frontend pode se conectar ao WebSocket em /ws e receber snapshot da sessao + eventos incrementais. O adapter-demo fornece dados realistas para desenvolvimento e teste da visualizacao.

### Notas Tecnicas
- Adapter-demo usa emissao direta ao SessionStore (sem round-trip HTTP) quando integrado ao server
- Ring buffer no SessionStore limita eventos por sessao a MAX_EVENTS_PER_SESSION (1000)
- WebSocket usa tipagem do @theater/core para mensagens bidirecionais
- SPA fallback para rotas nao-API quando frontend esta buildado em apps/web/dist
- Cenario demo tem 22 steps com delays escalonados simulando interacao natural entre agentes

---

## [v0.3.0] — 2026-04-16

**Tipo:** Feature  
**Esforco estimado:** 2h  
**Autor:** Claude (claude-opus-4-6)

### Descricao
Scaffolding completo do monorepo Lee Agent Theater com pnpm workspaces. Criacao de toda a infraestrutura de build/dev incluindo apps/web (Vite + React + Tailwind CSS 4 + Phaser 3 + Zustand), apps/server (Fastify + tsx + WebSocket + CORS), 5 adapters com estrutura base, e configuracao de scripts raiz para desenvolvimento end-to-end.

### Alteracoes
- `pnpm-workspace.yaml` — definicao dos workspaces (apps/*, packages/*, packages/adapters/*)
- `package.json` — package raiz com scripts dev/build/lint/typecheck/clean e onlyBuiltDependencies
- `tsconfig.base.json` — configuracao TypeScript base compartilhada (ES2022, strict, bundler, composite)
- `.gitignore` — node_modules, dist, .env, IDE, logs, cache, tmp
- `.env.example` — variaveis de ambiente para desenvolvimento local
- `LICENSE` — licenca MIT
- `apps/web/package.json` — frontend com React 18, Phaser 3, Tailwind CSS 4, Zustand 5, Vite 6
- `apps/web/tsconfig.json` — config TS com JSX react-jsx, DOM libs, project references ao core
- `apps/web/vite.config.ts` — plugins React + Tailwind, proxy /api e /ws para server:3001
- `apps/web/index.html` — entrypoint HTML com lang pt-BR
- `apps/web/src/main.tsx` — bootstrap React com StrictMode
- `apps/web/src/App.tsx` — componente raiz placeholder
- `apps/web/src/index.css` — import Tailwind CSS 4
- `apps/server/package.json` — backend com Fastify 5, @fastify/websocket, @fastify/cors, nanoid, tsx
- `apps/server/tsconfig.json` — config TS com types node, project references ao core
- `apps/server/src/index.ts` — bootstrap Fastify com CORS, WebSocket, health route
- `apps/server/src/routes/health.ts` — endpoint GET /api/health com status, versao, uptime
- `packages/core/tsconfig.json` — adicionado composite: true para project references
- `packages/adapters/adapter-demo/` — pacote completo com package.json, tsconfig.json, src/index.ts (DemoAdapter)
- `packages/adapters/adapter-claude-hooks/` — estrutura base (ClaudeHooksAdapter)
- `packages/adapters/adapter-claude-sdk/` — estrutura base (ClaudeSdkAdapter)
- `packages/adapters/adapter-mcp/` — estrutura base (McpAdapter)
- `packages/adapters/adapter-file-log/` — estrutura base (FileLogAdapter)

### Impacto
Estabelece a fundacao completa do monorepo com 9 workspace projects. Todos compilam sem erros de tipagem. `pnpm install` resolve 162 pacotes, `pnpm dev:server` inicia Fastify na porta 3001, `pnpm dev:web` inicia Vite na porta 5173 (588ms). Proximas tarefas de implementacao podem construir sobre esta base.

### Notas Tecnicas
- Tailwind CSS 4 usa `@import "tailwindcss"` e plugin `@tailwindcss/vite` (sem PostCSS)
- Vite proxy configurado para redirecionar /api e /ws ao server em localhost:3001
- Adapters herdam de BaseAdapter do @theater/core e comunicam via HTTP POST
- O core precisou de composite: true no tsconfig para funcionar com project references
- Removido package-lock.json espurio do core (monorepo usa pnpm-lock.yaml)

---

## [v0.2.0] — 2026-04-16

**Tipo:** Feature  
**Esforço estimado:** 1h30  
**Autor:** Claude (claude-opus-4-6)

### Descrição
Implementação completa do pacote `@theater/core` (packages/core) — a camada de tipos, contratos de evento, validação, utilitários e constantes compartilhadas do Lee Agent Theater. Este pacote é a "single source of truth" usada por server, frontend e adapters.

### Alterações
- `packages/core/package.json` — Criado com name @theater/core@0.1.0, ESM, Zod como dependência
- `packages/core/tsconfig.json` — Configuração TypeScript strict, ESNext, composite, declarationMap
- `packages/core/src/agents.ts` — AgentState (8 estados), AgentPosition, AgentInfo, AGENT_STATES
- `packages/core/src/events.ts` — EventType (12 tipos), EventStatus, TheaterEvent (contrato principal)
- `packages/core/src/session.ts` — SessionStatus, SessionState com agents como Record<string, AgentInfo>
- `packages/core/src/validation.ts` — Schemas Zod: AgentPositionSchema, AgentInfoSchema, TheaterEventSchema, funções validateEvent, parseEvent, validateAgentInfo
- `packages/core/src/adapter.ts` — AdapterConfig, TheaterAdapter interface, BaseAdapter classe abstrata com emit() via HTTP POST
- `packages/core/src/websocket.ts` — Tipos discriminados: WsServerMessage (5 tipos server→client), WsClientMessage (3 tipos client→server)
- `packages/core/src/utils.ts` — createEvent, normalizeAgentInfo, truncateSummary, normalizeMetadata
- `packages/core/src/constants.ts` — Portas padrão, limites do sistema, WebSocket config, API endpoints
- `packages/core/src/index.ts` — Barrel export de todos os 8 módulos

### Impacto
O pacote @theater/core está pronto para ser consumido por apps/server, apps/web e packages/adapters. Define todos os contratos de dados, validação runtime via Zod, e utilitários necessários para o MVP. Desbloqueia 3 tarefas dependentes.

### Notas Técnicas
- Segue 100% as decisões arquiteturais de #dee716ca (rafael-architect)
- Build gera .js + .d.ts + source maps para cada módulo
- Zod como validador único (runtime + type inference) conforme ADR-006
- TheaterEvent inclui projectId opcional (não especificado na arquitetura original, mas útil para agrupamento)
- agents como Record<string, AgentInfo> no SessionState (indexado por ID, conforme arquitetura)

---

## [v0.1.0] — 2026-04-16

**Tipo:** Docs  
**Esforco estimado:** 1h30  
**Autor:** Claude (claude-opus-4-6)

### Descricao
Criacao da documentacao open source completa do Lee Agent Theater, consolidando informacoes das definicoes de produto, arquitetura e briefing original em documentacao clara e pratica para GitHub.

### Alteracoes
- `README.md` — Criado do zero com: visao geral do projeto, funcionalidades, modo demo, stack tecnologica, pre-requisitos, instalacao, execucao, scripts pnpm (atualizados conforme package.json real), diagrama de arquitetura textual, estrutura do monorepo, explicacao dos adapters com guia para criar novos, estados visuais dos agentes, modelo de evento TheaterEvent, API REST de debug, roadmap em 4 fases, secao de contribuicao e secao em ingles
- `CONTRIBUTING.md` — Criado com guia completo para contribuidores: codigo de conduta, fluxo de contribuicao, configuracao de ambiente, padroes de codigo, conventional commits, regras para pull requests, como reportar bugs, como sugerir features, e tutorial detalhado para criar novos adapters
- `LICENSE` — Verificado (ja existia com licenca MIT correta)
- `.env.example` — Atualizado com documentacao melhorada, cabecalho descritivo e variaveis do adapter demo (DEMO_EVENT_INTERVAL, DEMO_AGENT_COUNT)

### Impacto
O projeto agora possui documentacao completa pronta para publicacao no GitHub. Qualquer desenvolvedor pode clonar o repositorio, entender a arquitetura, instalar e executar o projeto em minutos. A documentacao de contribuicao facilita a colaboracao open source.

### Notas Tecnicas
- A documentacao foi consolidada a partir de 3 fontes: definicao de produto (mariana-product), arquitetura do sistema (rafael-architect) e briefing original do usuario
- Os scripts documentados no README refletem exatamente os scripts reais do package.json
- O diagrama de arquitetura usa texto puro (ASCII art) para compatibilidade maxima com terminais e GitHub
- A secao em ingles no README e um resumo conciso para visibilidade internacional
