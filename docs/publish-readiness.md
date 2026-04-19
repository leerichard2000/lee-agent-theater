# Publish Readiness — Lee Agent Theater

**Data:** 2026-04-19
**Autor:** Igor (devops, time `forge-labs`)
**Task:** #44009046
**Escopo:** revisão completa do repositório para publicação como projeto open-source no GitHub.

---

## Resumo executivo

> **Pronto para publicar? COM CAVEATS.**

Não há bloqueadores de segurança, código, ou licença. O projeto tem `LICENSE`, `README`, `CONTRIBUTING`, `PATCH_NOTES`, `.env.example`, `LICENSE` MIT, `pnpm-lock.yaml` commitado, typecheck 100% limpo, zero secrets em código-fonte, e zero vulnerabilidades CRITICAL/HIGH. Os gaps residuais são duas categorias:

1. **Higiene de repositório** (low-risk, já em grande parte resolvido nesta entrega): `.gitignore` enxuto demais, 29 PNGs soltos na raiz, falta `.editorconfig` e `docs/screenshots/`.
2. **Decisões pendentes do usuário** (médio-risco, não bloqueia publicação mas precisa escolha): URL real do repositório no `README.md`, ausência de CI/CD em `.github/workflows/`, ausência de linter real (scripts `lint` retornam `echo 'lint ok'`), duas vulnerabilidades MODERATE novas em `@fastify/static` surgidas depois da auditoria do Bruno.

### Blockers (precisam resposta antes do push)

| # | Blocker | Ação requerida |
|---|---|---|
| B1 | **Repositório ainda não é um git repo.** `git status` retorna `fatal: not a git repository`. Sem `git init` não há o que publicar. | Rodar `git init`, `git add`, primeiro commit. Requer confirmação do usuário. |
| B2 | **URL placeholder no README.** `README.md:118` e `:551` apontam `https://github.com/seu-usuario/lee-agent-theater.git`. | Usuário precisa confirmar owner/repo real no GitHub. |

Tudo abaixo é **não bloqueante**; publicável como está, mas recomendo resolver antes de tornar público.

---

## Checklist detalhado

Legenda: ✅ OK · ❌ gap (ação necessária) · ⚠️ parcial / recomendação · 💬 decisão do usuário

### 1. Arquivos raiz obrigatórios

| Item | Status | Observações |
|---|---|---|
| `README.md` | ⚠️ | Existe (≈24 KB, completo). Referências a screenshot placeholder (`docs/screenshots/placeholder.png`) que não existe. URL do repo é placeholder (`seu-usuario`). Falta seção "Troubleshooting" (OneDrive, `inspectWebDist`) citada no checklist. |
| `LICENSE` | ✅ | MIT, `Copyright (c) 2026 Lee Richard`. Válido. |
| `.gitignore` | ✅ (atualizado) | Estava mínimo. **Atualizado nesta entrega** para cobrir `.playwright-mcp/`, `.remember/`, PNGs soltos da raiz, `*.tsbuildinfo`, `.pnpm-debug.log*`, etc. |
| `CONTRIBUTING.md` | ✅ | Existe (≈7 KB, bem estruturado). |
| `CHANGELOG.md` | ⚠️ | Ausente. Só há `PATCH_NOTES.md`. Regra global (`CLAUDE.md`) diz "se existir PATCH_NOTES separado, manter ambos" — mas nada força a existência. Decisão: pode ser gerado a partir do `PATCH_NOTES.md` no formato Keep a Changelog, ou deixar só o PATCH_NOTES. |
| `CODE_OF_CONDUCT.md` | ⚠️ | Ausente (opcional para projetos pequenos). Recomendação: adotar Contributor Covenant v2.1. |
| `.editorconfig` | ✅ (criado) | **Criado nesta entrega.** |
| `package.json` raiz | ⚠️ | Tem `name`, `description`, `author`, `license`, `keywords`, `engines`. **Falta** `repository`, `homepage`, `bugs` (campos importantes para descoberta no npm/GitHub mesmo em projeto privado). Ação: adicionar depois que o usuário informar URL do repo. |

### 2. Secrets e informação sensível

| Item | Status | Observações |
|---|---|---|
| Grep por API keys, tokens, senhas | ✅ | Zero achados em código-fonte. As únicas ocorrências aparecem em `node_modules/` (Phaser lib) e `apps/web/dist/` (bundle com sourcemap de Phaser) — ignoráveis pelo `.gitignore`. |
| `.env.example` | ✅ | Presente, apenas placeholders (portas, URLs de localhost, flags bool). Sem valores reais. |
| `.env` | ✅ | Ausente da raiz. Não seria commitado mesmo que existisse (`.gitignore` cobre). |
| Paths absolutos `C:\Users\leeri\...` no source | ✅ | Zero em source/config commitáveis. Aparecem apenas em `node_modules/.bin/*` e `apps/web/dist/assets/*.js` — ambos `.gitignore`. |
| Histórico git não vazou secrets | ✅ N/A | Repo ainda não existe. Ao criar, primeiro commit será limpo. |
| Auditoria cruzada com `docs/security-audit.md` | ✅ | Bruno confirma: "React escapa texto", "`.env` em `.gitignore`", "`.env.example` apenas placeholders", "`pnpm-lock.yaml` commitado". |

### 3. Build do zero

| Item | Status | Observações |
|---|---|---|
| `pnpm install` limpo | ⚠️ (não testado do zero nesta sessão) | Lockfile presente; dependências são públicas do npm registry. Sem credenciais privadas em `package.json`/`.npmrc`. Nenhum `.npmrc` na raiz. |
| `pnpm typecheck` | ✅ | **Executado: passou em 9/9 packages**. Zero erros. |
| `pnpm test` | ❌ | Nenhum script `test` definido no `package.json` raiz. README cita Vitest em "Tooling" (linha 102) mas não há suíte executável. Gap de documentação vs realidade. |
| `pnpm build` | ⚠️ (não executado do zero nesta sessão) | `apps/web/dist/` já existe como artefato anterior; build funcionou em v0.14.3 (confirmado em PATCH_NOTES). |
| `pnpm dev` / `pnpm dev:server` | ⚠️ | Não executado nesta sessão (tarefa é meta/config, não runtime). QA do Patrícia confirma funcional em `docs/test-results.md`. |

### 4. CI/CD

| Item | Status | Observações |
|---|---|---|
| `.github/workflows/` | ❌ | Diretório não existe. Sem CI. Recomendação mínima: workflow rodando `pnpm install --frozen-lockfile && pnpm typecheck && pnpm build` em PRs. |
| Badges no README | ❌ | README não tem badges (CI, license, version, Node version). |
| `.github/dependabot.yml` | ❌ | Ausente. Recomendado para repo público (notifica vulnerabilidades novas — Dependabot teria pego as 2 MODERATE do `@fastify/static`). |
| `.github/ISSUE_TEMPLATE/` | ❌ | Ausente. Opcional. |
| `.github/PULL_REQUEST_TEMPLATE.md` | ❌ | Ausente. Opcional. |

### 5. Documentação

| Arquivo | Status | Observações |
|---|---|---|
| `README.md` screenshot | ❌ | Linha 10 referencia `docs/screenshots/placeholder.png` — diretório e arquivo **não existem**. README mostra quebrado no GitHub. |
| Seção "Features" | ✅ | "Funcionalidades" (linha 38). |
| Seção "Getting Started" | ✅ | "Instalacao" + "Execucao" (linhas 114, 127). |
| Seção "Development" | ✅ | "Scripts Disponiveis" + "Sessões" (linhas 158, 176). |
| Seção "Architecture overview" | ✅ | "Arquitetura" com link para `docs/architecture.md` (linha 199). |
| Link para `docs/architecture.md` | ✅ | Linha 467. |
| Link para `docs/phaser-scene.md` | ✅ | Linha 468. |
| Link para `docs/adapters.md` | ✅ | Linha 469. |
| Link para `docs/test-plan.md` | ✅ | Linha 470. |
| Link para `docs/test-results.md` | ✅ | Linha 471. |
| Link para `docs/security-audit.md` | ❌ | **Não está referenciado** no README, apesar de existir (18 KB, entregue pelo Bruno). Ação: adicionar linha na tabela "Documentação adicional". |
| `PATCH_NOTES.md` | ✅ | Completo, 122 KB, ordem decrescente por versão (v0.14.3 no topo) conforme regra global. |

### 6. Qualidade de código

| Item | Status | Observações |
|---|---|---|
| ESLint config | ❌ | Nenhum `.eslintrc.*` ou `eslint.config.*` no repo. Scripts `lint` em `apps/web/package.json:9` e `apps/server/package.json:9` são literalmente `echo 'lint ok'`. README anuncia "ESLint + Prettier" em Tooling (linha 101) — **inconsistência**. |
| Prettier config | ❌ | Nenhum `.prettierrc*` ou `prettier.config.*`. Mesma inconsistência com README. |
| TODOs / FIXMEs | ✅ | 4 arquivos em `packages/adapters/*/src/index.ts` (os placeholders: `adapter-mcp`, `adapter-claude-hooks`, `adapter-claude-sdk`, `adapter-file-log`) — esperado, eles são stubs documentados como "Placeholder" no README (linhas 344–347). |
| `console.log` esquecidos | ⚠️ | 2 arquivos em `apps/` tocam `console.*`: `apps/server/src/index.ts` e `apps/web/src/services/websocket.ts`. Provavelmente intencionais (boot log / debug de WS), mas revisar se devem migrar para `pino` (já usado no server). |

### 7. Dependências

| Item | Status | Observações |
|---|---|---|
| `pnpm audit` | ⚠️ | **Regressão desde a auditoria do Bruno.** 2 vulnerabilidades MODERATE em `@fastify/static` (`>=8.0.0 <=9.1.0`). Path: `apps__server>@fastify/static`. Patched em `>=9.1.1`. Zero CRITICAL/HIGH. Ver GHSA-pr96-94w5-mx2h e GHSA-x428-ghpx-8j92. Ação: atualizar `@fastify/static` para `^9.1.1` em `apps/server/package.json`. |
| `pnpm-lock.yaml` | ✅ | Commitado (91 KB). |
| Dependências locais / registry privado | ✅ | Todas apontam pro registry público; apenas `workspace:*` internos. |

### 8. Footguns específicos do projeto

| Item | Status | Observações |
|---|---|---|
| OneDrive risk (v0.11.5) | ❌ | README **não** menciona OneDrive. Novos contribuidores Windows+OneDrive vão reproduzir o bug documentado em PATCH v0.11.5. Ação: adicionar seção "Troubleshooting" ao README. |
| `inspectWebDist` (v0.13.4) | ❌ | Defesa já está no código mas não há documentação no README sobre como usar / o que significa o aviso. |

### 9. Outros gaps de higiene detectados nesta revisão

| Item | Severidade | Observações |
|---|---|---|
| **29 PNGs de QA soltos na raiz** | ⚠️ alta | `broadcast-*.png`, `final-*.png`, `theater-*.png`, `flip-*.png`, `fix-*.png` — todos screenshots de QA/dev (ver datas `abr 18`). **Não devem ir pro GitHub** — poluem root, inflam clone. Adicionados ao `.gitignore` nesta entrega, mas **arquivos físicos ainda estão lá**. Ação: mover para `docs/screenshots/` (se forem úteis como documentação) ou deletar. |
| `apps/web/dist/` presente | ✅ | Já no `.gitignore` via pattern `dist/`. OK. |
| `.playwright-mcp/console-*.log` | ✅ (após update) | 7 arquivos de log da sessão Playwright. Agora ignorados via `.gitignore`. |
| `.remember/` | ✅ (após update) | Sessão "remember" local. Agora ignorado. |
| `pnpm-workspace.yaml` | ✅ | Válido: `apps/*`, `packages/*`, `packages/adapters/*`. |
| Node/pnpm engines | ✅ | `>=20.0.0` / `>=9.0.0`. Documentado no README. |

---

## Ações aplicadas nesta entrega (low-risk auto-resolvido)

- **`.gitignore`** ampliado: adicionadas regras para `.playwright-mcp/`, `.remember/`, PNGs soltos na raiz (`broadcast-*.png` etc.), `*.tsbuildinfo`, `.pnpm-debug.log*`, `yarn-debug.log*`.
- **`.editorconfig`** criado com defaults sensatos (UTF-8, LF, 2 espaços, trim trailing whitespace).
- **`docs/publish-readiness.md`** (este arquivo) criado.
- **PATCH_NOTES.md** atualizado (entrada v0.14.4).

---

## Ações que dependem de decisão do usuário

Preciso das respostas abaixo antes de prosseguir com qualquer delas:

1. **URL do repositório GitHub** (owner/repo). Ex.: `https://github.com/leerichard/lee-agent-theater`.
   - Usado em: `README.md` (2 lugares), `package.json` raiz (campos `repository`, `homepage`, `bugs`).
2. **Deseja CI no GitHub Actions?** Se sim, confirmo criação de:
   - `.github/workflows/ci.yml` — `pnpm install --frozen-lockfile && pnpm typecheck && pnpm build`, gatilhado em push/PR.
   - `.github/dependabot.yml` — monitoramento semanal de npm e github-actions.
3. **Deseja ESLint + Prettier configurados de verdade?** O README promete, mas hoje só há `echo 'lint ok'`. Se sim, escolha do preset (`@typescript-eslint/recommended` + `plugin:react-hooks` + `eslint-config-prettier`).
4. **Adicionar `CODE_OF_CONDUCT.md` baseado em Contributor Covenant v2.1?** (recomendado para público).
5. **Gerar `CHANGELOG.md` resumido** a partir do `PATCH_NOTES.md`, no formato Keep a Changelog? (Regra global pede os dois quando existirem.)
6. **Destino dos 29 PNGs soltos na raiz:** mover para `docs/screenshots/` (organizados por feature), ou deletar porque estão capturados no QA em `docs/test-results.md`?
7. **Bump de `@fastify/static` para `^9.1.1`** em `apps/server/package.json` para resolver as 2 vulnerabilidades MODERATE. Posso aplicar direto, mas pode afetar o comportamento do `inspectWebDist` — prefiro confirmação.
8. **Adicionar seção "Troubleshooting" ao README** cobrindo OneDrive (v0.11.5) e `inspectWebDist` (v0.13.4)? Posso escrever um draft se autorizar.
9. **Screenshot real no topo do README** — posso usar `final-1-forge-labs-layout.png` movido para `docs/screenshots/stage-overview.png`, ou aguardo o usuário escolher?

---

## Comandos de verificação reproduzíveis

```bash
# Typecheck monorepo (verificado nesta sessão: PASS)
pnpm typecheck

# Audit de segurança
pnpm audit   # 2 MODERATE em @fastify/static; 0 CRITICAL/HIGH

# Grep por secrets em source
grep -rE "(sk-ant-|AKIA[0-9A-Z]{16}|ghp_|api[_-]?key\s*=)" \
  --include="*.ts" --include="*.tsx" --include="*.json" \
  --exclude-dir=node_modules --exclude-dir=dist .
# → zero achados em source

# Conferir paths absolutos do dev
grep -rE "C:[/\\\\]Users[/\\\\]leeri|/Users/leeri" \
  --include="*.ts" --include="*.tsx" --include="*.json" \
  --exclude-dir=node_modules --exclude-dir=dist .
# → zero achados em source

# Inventário de screenshots soltos na raiz (29 arquivos)
ls *.png
```

---

## Referências cruzadas

- `docs/security-audit.md` (Bruno, devsecops) — auditoria de segurança 2026-04-17. Findings MEDIUM `LOCAL-ONLY` não bloqueiam publicação.
- `docs/test-results.md` (Patrícia, QA) — resultados de QA funcional.
- `PATCH_NOTES.md` — histórico completo de versões (v0.1.0 → v0.14.3).
- `README.md` — entregue em v0.13.7 pela Renata (docs).
