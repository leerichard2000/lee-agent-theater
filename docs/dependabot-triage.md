# Triagem de PRs do Dependabot

Guia reutilizável para processar os PRs semanais do Dependabot em ~5 minutos sem ajuda do tech lead. Complementa o workflow de CI e o Dependabot config do repo.

**Princípio geral:** o risco de um bump não depende apenas do semver — depende também de _onde_ a dep vive no monorepo (runtime vs dev), de quanto a gente _usa_ dela, e do histórico de breaking changes da lib.

---

## TL;DR — árvore de decisão

```
Olhou o título do PR → "Bump <dep> from <X> to <Y>"
│
├─ devDependency (typescript, tsx, @types/*, eslint*, prettier, tailwind, autoprefixer, postcss, concurrently)
│    ├─ patch → 🟢 auto-merge
│    ├─ minor → 🟢 auto-merge
│    └─ major → 🟡 rodar `pnpm install && pnpm typecheck && pnpm lint && pnpm build` local; se passar, merge
│
└─ runtime dependency (react*, phaser, zustand, fastify*, @fastify/*, zod, nanoid)
     ├─ patch → 🟢 auto-merge
     ├─ minor → 🟡 rodar smoke test (`pnpm dev`, abrir `:5173`, checar 3 fluxos) antes de merge
     └─ major → 🔴 HOLD. Fechar o PR e abrir issue "Migrar <dep> <X> → <Y>" com checklist
```

"Auto-merge" aqui é apenas a recomendação humana — o repo não tem auto-merge automatizado habilitado.

---

## Inventário de deps do monorepo

Snapshot do estado atual (`pnpm-workspace.yaml` → 10 workspaces). Apenas deps diretas; transitivas ficam por conta do lockfile.

### Root (`package.json`)

| Dep | Versão atual | Tipo | Classificação de bump |
|---|---|---|---|
| `concurrently` | `^9.2.1` | dev | minor OK, major ⚠ (mudanças de API rara, mas checar) |
| `eslint` | `^9.17.0` | dev | 🔴 já está em 9 (flat config). Ignorar sugestões de `8→9`. Major `9→10` quando sair: 🔴 hold |
| `eslint-config-prettier` | `^9.1.0` | dev | 🟢 qualquer bump |
| `eslint-plugin-react` | `^7.37.0` | dev | 🟢 qualquer bump (minor/patch). Major 🟡 |
| `eslint-plugin-react-hooks` | `^5.1.0` | dev | 🟢 qualquer bump |
| `prettier` | `^3.4.0` | dev | 🟢 minor/patch. `3→4` quando sair: 🟡 (format output pode mudar sutilmente) |
| `typescript-eslint` | `^8.18.0` | dev | 🟢 minor/patch. Major 🟡 |

### `apps/web` — frontend React + Phaser + Vite

| Dep | Versão atual | Tipo | Classificação de bump |
|---|---|---|---|
| `react` | `^18.3.1` | runtime | 🟡 minor. **`18→19` 🔴 hold** — novo compiler, mudanças em `useEffect` cleanup, breaking em `ReactDOM.createRoot`. Issue de migração dedicada. |
| `react-dom` | `^18.3.1` | runtime | Mesmo que `react` — bumpar ambos juntos. |
| `@types/react` | `^18.3.0` | dev | Acompanhar `react` (bumpar junto, nunca antes). |
| `@types/react-dom` | `^18.3.0` | dev | Idem. |
| `phaser` | `^3.87.0` | runtime | 🟡 minor (Phaser 3 é estável e o time é responsivo em patches). **`3→4` 🔴 hold permanente** — Phaser 4 está em beta e muda arquitetura de rendering, cenas e input; virtualmente todo nosso código de `TheaterScene` e `sprites/*` precisaria reescrita. |
| `zustand` | `^5.0.0` | runtime | 🟢 minor/patch (API estável, bumps são bugfixes). Major 🟡 (nossa ponte vanilla + React pode quebrar). |
| `vite` | `^6.0.0` | dev (build) | 🟡 minor. **Major 🔴 hold** — Vite 7 muda API de plugins, Vite 8 idem. Antes de mexer, validar que `@vitejs/plugin-react` e `@tailwindcss/vite` têm versões compatíveis publicadas. |
| `@vitejs/plugin-react` | `^4.3.0` | dev | 🟡 — bumpar em lockstep com `vite`. |
| `@tailwindcss/vite` | `^4.0.0` | dev | 🟡 — Tailwind 4 é novo; cada minor pode ajustar classes. Smoke test visual. |
| `tailwindcss` | `^4.0.0` | dev | 🟡 idem. Patch 🟢. |
| `autoprefixer` | `^10.4.20` | dev | 🟢 qualquer bump |
| `postcss` | `^8.4.49` | dev | 🟢 patch. `8→9` 🟡. |
| `typescript` | `^5.7.0` | dev | 🟢 minor/patch. Major 🟡 (raríssimo quebrar type-check nosso). |

### `apps/server` — backend Fastify

| Dep | Versão atual | Tipo | Classificação de bump |
|---|---|---|---|
| `fastify` | `^5.2.0` | runtime | 🟡 minor. **`5→6` quando sair 🔴 hold** — Fastify quebra API a cada major. Migração via guide oficial. |
| `@fastify/websocket` | `^11.0.0` | runtime | 🟡 bumpar junto com `fastify` (compatibilidade de major). |
| `@fastify/cors` | `^10.0.0` | runtime | 🟡 idem. |
| `@fastify/static` | `^9.1.1` | runtime | 🟡 idem. **Cuidado:** bump recente de `8→9` já causou incidente (resolvido pela equipe). Verificar changelog do `@fastify/static` antes. |
| `nanoid` | `^5.0.0` | runtime | 🟢 patch/minor. Major já foi (CJS→ESM em `3→4`, `5→6` quando sair = 🟡. |
| `tsx` | `^4.19.0` | dev | 🟢 qualquer bump. |
| `typescript` | `^5.7.0` | dev | Mesma regra do `apps/web`. |
| `@types/node` | `^22.0.0` | dev | 🟢 acompanhar a LTS do Node que o projeto usa (hoje Node 20+). Major só se subir a LTS. |

### `packages/core`

| Dep | Versão atual | Tipo | Classificação de bump |
|---|---|---|---|
| `zod` | `3.23.8` (pin exato) | runtime | 🔴 **NÃO bumpar sem validação manual.** Ver `PATCH_NOTES` v0.11.5 — a versão `3.25.76` tem publish ESM quebrado, deixamos em pin. Qualquer PR de bump do zod precisa smoke test real (`pnpm dev:server` e conferir que as rotas com `validateEvent` funcionam). `3→4` 🔴 hold com migração (API breaking). |
| `typescript` | `^5.5.0` | dev | 🟢 minor/patch. |

### `packages/adapters/*` (6 workspaces)

Todos os adapters têm só `@theater/core` (workspace:*) + `typescript` em dev. Dependabot não bumpa workspace deps. Os bumps desses workspaces são sempre **só TypeScript** → 🟢.

---

## Três padrões de título do Dependabot e o que fazer

Dependabot gera títulos com formato consistente. Use o formato pra aplicar o framework sem abrir o PR:

### Padrão 1: `Bump <dep> from <X.Y.Z> to <A.B.C>`

Olhe só o semver:
- `X === A` E `Y === B` → **patch** (só Z mudou).
- `X === A` E `Y !== B` → **minor**.
- `X !== A` → **major**. Aplica a regra 🔴 da tabela acima.

### Padrão 2: `Bump the <group> group with N updates`

Dependabot pode agrupar bumps quando o `dependabot.yml` define grupos. Nesse caso:
- Se todos são patch/minor: aplica a regra "most conservative wins" — se tiver um 🟡, o grupo inteiro vira 🟡.
- Se algum é major: desagrupar (fechar esse PR, Dependabot vai reabrir um por um).

### Padrão 3: `Bump <dep> from <X.Y.Z> to <A.B.C> in <path>`

Indica que é um workspace específico. Útil pra saber em qual `package.json` o bump está:
- `in /apps/web` → vê tabela `apps/web`.
- `in /packages/core` → cuidado especial com `zod` (ver acima).

---

## Categorias de recomendação

### 🟢 Merge now

- Qualquer patch em qualquer dep.
- Minor em devDependency (TypeScript, ESLint plugins, Prettier, PostCSS, Autoprefixer, concurrently, tsx).
- Minor em `zustand`, `eslint-config-prettier`, `eslint-plugin-react-hooks`.

**Workflow:** abre o PR, confere que o CI ficou verde, clica "Merge".

### 🟡 Needs local smoke test

- Minor em runtime: `react`, `phaser`, `fastify*`, `@fastify/*`.
- Minor em build: `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `tailwindcss`, `postcss` major.
- Qualquer bump em `zod` (status atual: pinado manualmente, ver PATCH_NOTES v0.11.5).

**Workflow:**
1. Checkout local do branch do PR.
2. `pnpm install && pnpm lint && pnpm typecheck && pnpm build`.
3. `pnpm dev`, abrir `:5173`, smoke test:
   - Abrir sessão forge-labs (não Demo).
   - Ver 5 eventos animarem no palco (agentes caminham até a mesa de reunião, falam, voltam).
   - Clicar num evento antigo da timeline + Play → cena reanima dali.
4. Se tudo OK → merge.

### 🟡 Needs rebase

- PR CI vermelho **mas** main tem fix recente que o PR não pegou.
- Sintoma: o PR foi aberto há ≥1 dia e um fix foi mergeado no main depois.

**Workflow:** na UI do PR, clicar botão **"Update branch"** (atualiza o branch do Dependabot com o main atual). Esperar CI re-rodar. Se verde, merge; se continuar vermelho → 🔴 real.

### 🔴 Hold until planned migration

- Major em runtime: `react`, `phaser`, `fastify`, `zod`.
- Major em build crítico: `vite`.
- Bump problemático conhecido (ex.: `zod 3.25.76` — ESM publish quebrado, pin em 3.23.8 documentado em PATCH_NOTES v0.11.5).

**Workflow:**
1. **Fechar o PR** do Dependabot (comentário: "holding for planned migration, tracking in issue #X").
2. **Abrir issue** "Migrar <dep> <X> → <Y>" com:
   - Link pro CHANGELOG da dep.
   - Lista de breaking changes relevantes pro nosso código.
   - Estimativa de esforço.
   - Critério de aceitação: `pnpm typecheck && pnpm lint && pnpm build` limpos + smoke test.
3. Configurar `dependabot.yml` com `ignore: [{ dependency-name: "<dep>", update-types: ["version-update:semver-major"] }]` pra parar de receber PRs recorrentes.

---

## O trick do "Update branch"

Quando um fix foi mergeado no main **depois** do PR do Dependabot ser aberto, o CI do PR pode estar vermelho por causa do bug antigo. Na UI do PR há um botão **"Update branch"** (ao lado do status de CI). Ele faz o equivalente de `git merge main` no branch do Dependabot. Depois disso, o CI re-roda e geralmente fica verde.

Se o "Update branch" aparecer cinza/desabilitado, o PR não tem conflito mas também não tem nada pra atualizar — o problema é outro (bump genuinamente breaking).

---

## Configuração recomendada do `dependabot.yml`

Para reduzir volume de PRs futuros (não parte desta triagem — follow-up):

```yaml
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    groups:
      dev-minor:
        dependency-type: "development"
        update-types: ["minor", "patch"]
      dev-major:
        dependency-type: "development"
        update-types: ["major"]
      runtime-minor:
        dependency-type: "production"
        update-types: ["minor", "patch"]
    ignore:
      - dependency-name: "react"
        update-types: ["version-update:semver-major"]
      - dependency-name: "phaser"
        update-types: ["version-update:semver-major"]
      - dependency-name: "vite"
        update-types: ["version-update:semver-major"]
      - dependency-name: "fastify"
        update-types: ["version-update:semver-major"]
      - dependency-name: "zod"
        # pinado em 3.23.8 — ver PATCH_NOTES v0.11.5
```

Com isso, os 18 PRs abertos caem pra ~3-4 por semana (agrupados), e os majors perigosos param de vir.

---

## Cross-references

- `PATCH_NOTES.md` — o pin do `zod` está documentado em v0.11.5 com explicação do incidente.
- `CONTRIBUTING.md` — link pra este doc em uma seção "Processando PRs do Dependabot".
- `docs/publish-readiness.md` — decisão #2 da readiness review (Dependabot habilitado) referencia este framework.

Para atualizar este documento quando alguma dep mudar de categoria, abrir PR que ajusta a tabela respectiva + uma linha em `PATCH_NOTES.md` do tipo `Docs`.
