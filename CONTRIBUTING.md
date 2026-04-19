# Guia de Contribuicao

Obrigado pelo interesse em contribuir com o **Lee Agent Theater**! Este guia explica como participar do desenvolvimento do projeto.

---

## Sumario

- [Codigo de Conduta](#codigo-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Configurando o Ambiente](#configurando-o-ambiente)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Padroes de Codigo](#padroes-de-codigo)
- [Commits e Pull Requests](#commits-e-pull-requests)
- [Reportando Bugs](#reportando-bugs)
- [Sugerindo Funcionalidades](#sugerindo-funcionalidades)
- [Criando Adapters](#criando-adapters)

---

## Codigo de Conduta

Este projeto segue um ambiente respeitoso e colaborativo. Ao contribuir, voce concorda em:

- Tratar todos os participantes com respeito
- Aceitar criticas construtivas de forma profissional
- Focar no que e melhor para a comunidade e o projeto
- Manter comunicacao clara e objetiva

---

## Como Contribuir

### Tipos de contribuicao aceitos

- **Bug fixes** -- correcoes de erros encontrados
- **Features** -- novas funcionalidades alinhadas ao roadmap
- **Adapters** -- novos adapters para fontes de eventos
- **Documentacao** -- melhorias na documentacao
- **Testes** -- aumento de cobertura de testes
- **Performance** -- otimizacoes de desempenho
- **Acessibilidade** -- melhorias de acessibilidade na interface

### Fluxo de contribuicao

1. Verifique as [Issues](../../issues) abertas para evitar trabalho duplicado
2. Para features grandes, abra uma issue para discussao antes de implementar
3. Faca um fork do repositorio
4. Crie uma branch descritiva a partir de `main`
5. Implemente suas alteracoes seguindo os padroes do projeto
6. Escreva/atualize testes conforme necessario
7. Garanta que `pnpm lint`, `pnpm typecheck` e `pnpm test` passam
8. Abra um Pull Request com descricao clara

---

## Configurando o Ambiente

### Pre-requisitos

- **Node.js** 20+
- **pnpm** 9+
- **Git**

### Passos

```bash
# 1. Fork e clone o repositorio
git clone https://github.com/leerichard2000/lee-agent-theater.git
cd lee-agent-theater

# 2. Instale as dependencias
pnpm install

# 3. Inicie em modo desenvolvimento
pnpm dev

# 4. Verifique que tudo funciona
pnpm lint
pnpm typecheck
pnpm test
```

O frontend estara disponivel em `http://localhost:5173` e o server em `http://localhost:3001`.

---

## Estrutura do Projeto

Entender a estrutura e essencial para contribuir de forma eficaz:

```
lee-agent-theater/
├── apps/web/          # Frontend React + Phaser 3
├── apps/server/       # Backend Fastify + WebSocket
├── packages/core/     # Tipos, contratos, validacao (Zod)
├── packages/adapters/ # Adapters de fontes de eventos
└── docs/              # Documentacao extra
```

### Regras de fronteira

| Modulo | Responsabilidade | Nao deve fazer |
|---|---|---|
| `@theater/core` | Tipos, enums, schemas Zod, interface BaseAdapter | Logica de negocio, IO, estado |
| `apps/server` | Receber eventos, gerenciar sessoes, broadcast WS | Renderizacao, logica de adapter |
| `apps/web` | Renderizar cena teatral, UI, consumir WS | Processar eventos brutos |
| `adapter-*` | Capturar e normalizar eventos | Estado global, comunicacao direta com frontend |

### Separacao React / Phaser

- **React** e dono do layout, paineis, controles (tudo que e texto/UI)
- **Phaser** e dono exclusivo da cena 2D (sprites, animacoes, cenario)
- **Zustand** e o barramento de comunicacao entre ambos
- Phaser NUNCA importa React; React NUNCA importa APIs Phaser diretamente

---

## Padroes de Codigo

### Linguagem

- Todo o codigo, comentarios, documentacao e mensagens de commit devem estar em **portugues do Brasil (pt-BR)**
- Nomes de variaveis, funcoes e tipos seguem convencoes em **ingles** (padrao da industria)

### TypeScript

- Tipagem estrita em todo o projeto -- evite `any`
- Use tipos de `@theater/core` para garantir consistencia
- Valide dados externos com Zod antes de processar

### Estilo

- **ESLint + Prettier** -- execute `pnpm lint` antes de commitar
- Indentacao com 2 espacos
- Ponto e virgula obrigatorio
- Aspas simples para strings

### Testes

- Use **Vitest** para testes unitarios
- Nomeie arquivos de teste como `*.test.ts` ou `*.spec.ts`
- Cubra cenarios de sucesso e de erro

---

## Commits e Pull Requests

### Formato de commit

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
tipo(escopo): descricao curta em portugues

corpo opcional com mais detalhes
```

**Tipos aceitos:**

| Tipo | Uso |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correcao de bug |
| `docs` | Apenas documentacao |
| `style` | Formatacao (sem mudanca de logica) |
| `refactor` | Refatoracao de codigo |
| `test` | Adicao/correcao de testes |
| `chore` | Tarefas de manutencao |

**Exemplos:**
```
feat(adapters): adiciona adapter para leitura de logs
fix(web): corrige balao de fala cortado em telas pequenas
docs(readme): atualiza instrucoes de instalacao
test(core): adiciona testes para validacao de eventos
```

### Pull Requests

- Titulo claro e descritivo em portugues
- Descricao explicando **o que** foi feito e **por que**
- Referencia issues relacionadas (`Resolve #123`)
- Screenshots para mudancas visuais
- Garanta que CI passa (lint, typecheck, testes)

---

## Reportando Bugs

Ao reportar um bug, inclua:

1. **Descricao clara** do problema
2. **Passos para reproduzir** o bug
3. **Comportamento esperado** vs **comportamento atual**
4. **Ambiente**: OS, versao do Node.js, navegador
5. **Screenshots** ou logs se aplicavel

Use o template de issue de bug quando disponivel.

---

## Sugerindo Funcionalidades

Para sugerir uma nova funcionalidade:

1. Verifique se ja nao existe uma issue sobre o assunto
2. Abra uma issue com o tipo **Feature Request**
3. Descreva:
   - O problema que a feature resolve
   - A solucao proposta
   - Alternativas consideradas
   - Se esta disposto a implementar

Funcionalidades alinhadas ao [Roadmap](README.md#roadmap) tem maior probabilidade de serem aceitas.

---

## Criando Adapters

Adapters sao a forma mais natural de contribuir com o projeto. Para criar um novo adapter:

### 1. Crie o diretorio

```
packages/adapters/adapter-meu-nome/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts
```

### 2. Configure o `package.json`

```json
{
  "name": "@theater/adapter-meu-nome",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "dependencies": {
    "@theater/core": "workspace:*"
  }
}
```

### 3. Implemente a interface

```typescript
import { BaseAdapter, type AdapterConfig } from '@theater/core';

export class MeuAdapter extends BaseAdapter {
  readonly config: AdapterConfig = {
    id: 'adapter-meu-nome',
    name: 'Descricao do Adapter',
    serverUrl: 'http://localhost:3001',
  };

  async start(): Promise<void> {
    this.running = true;
    // Sua logica de captura aqui
    // Use this.emit(event) para enviar eventos ao server
  }

  async stop(): Promise<void> {
    this.running = false;
    // Cleanup
  }
}
```

### 4. Regras para adapters

- **Read-only obrigatorio** -- adapters NUNCA devem escrever no ambiente monitorado
- **Validacao Zod** -- todo evento deve ser validado antes de emitir (BaseAdapter.emit() ja faz isso)
- **Sem estado global** -- adapters devem ser autocontidos
- **Tratamento de erros** -- falhas devem ser logadas sem crashar o processo
- **Documentacao** -- inclua um README no diretorio do adapter explicando a fonte de dados e configuracao

---

## Duvidas?

Abra uma issue com a tag `question` ou participe das discussoes do projeto. Toda contribuicao e valorizada!
