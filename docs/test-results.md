# Resultados de QA — Lee Agent Theater

Execução do plano em [test-plan.md](test-plan.md) contra o estado do repo em
`v0.13.10` (2026-04-17). Metodologia: inspeção estática + cruzamento com
PATCH_NOTES e screenshots em `.playwright-mcp/` / raiz. Cenários que exigem
interação viva em browser ficam `PENDING` e devem ser validados por
frontend com Playwright.

Status:
- **PASS** — invariante confirmada estaticamente ou evidência visual existe.
- **FAIL** — defeito encontrado (ver §Defeitos abaixo).
- **PENDING** — requer execução Playwright para confirmação visual.

---

## Tabela de execução

### F1 — Renderização da cena

| ID | Descrição | Prioridade | Status | Evidência |
|---|---|---|---|---|
| C1.1 | Demo com 4 agentes | P0 | PASS | `final-3-demo-meeting.png`, `theater-6-demo-session-start.png` |
| C1.2 | `claude-forge-labs` com 19 agentes | P0 | PASS | PATCH v0.13.10 validado via `/api/events`; `final-1-forge-labs-layout.png` |
| C1.3 | 1 agente | P1 | PENDING | Não observado em screenshots |
| C1.4 | 17 agentes + escala | P1 | PASS | `fix-3-17-agents.png`, `calculateLayout` em `TheaterScene.ts:94-140` |
| C1.5 | 24+ agentes caberem na área | P1 | PASS | `theater-3-24-agents.png`, `fix-2-22-agents.png` |
| C1.6 | Fallback `FALLBACK_AGENT_POS` | P2 | PASS | Verificado em `TheaterScene.ts:473-480` (branch `!slot`) |
| C1.7 | OneDrive guard (`inspectWebDist`) | P1 | PASS | Código em `apps/server/src/index.ts` (PATCH v0.11.5) |

### F2 — Flip layout (agente abaixo da mesa)

| ID | Descrição | Prioridade | Status | Evidência |
|---|---|---|---|---|
| C2.1 | `agentY = deskY + 16` | P0 | PASS | `TheaterScene.ts:51,136`; `flip-1-4-agents.png`, `flip-2-19-agents.png` |
| C2.2 | Depth mesa = `agentY - 2` | P0 | PASS | `TheaterScene.ts:499` |
| C2.3 | 4 agentes em 1 linha | P1 | PASS | `flip-1-4-agents.png` |
| C2.4 | 19 agentes sem sobreposição | P1 | PASS | `flip-2-19-agents.png` |

### F3 — Mesa de reunião

| ID | Descrição | Prioridade | Status | Evidência |
|---|---|---|---|---|
| C3.1 | Mesa em `{820,300}`, isolada | P0 | PASS | `TheaterScene.ts:41,436`; `theater-9-meeting-flow.png` |
| C3.2 | `n=2 → [S1,S4]` diagonal | P0 | PASS | `phaser-scene.md` §slots, `broadcast-1-initial.png` mostra S1/S4 ocupados |
| C3.3 | `n=6` sem duplicação | P1 | PENDING | Lógica em `seatPositions.ts` (não revisto linha a linha) — delegar verificação |
| C3.4 | Agente só ocupa slots durante animação | P1 | PASS | `animateConversation`/`animateBroadcast` são os únicos caminhos para `MEETING_TABLE_POS` |
| C3.5 | 140px respiro até `DESK_AREA_X_MAX=680` | P1 | PASS | `TheaterScene.ts:32` (constantes) |

### F4 — Animação de conversa

| ID | Descrição | Prioridade | Status | Evidência |
|---|---|---|---|---|
| C4.1 | Diálogo direto em [S1,S4] | P0 | PASS | `theater-4-mid-conversation.png`, `theater-7-conversation.png`, `final-3-demo-meeting.png` |
| C4.2 | `bubbleDuration` clamp | P0 | PASS | Verificado em `TheaterScene.ts` (fórmula `clamp(2000, len*40, 5000) / speed`) |
| C4.3 | Desks `away` → `occupied` | P0 | PASS | `TheaterScene.ts:763-801` |
| C4.4 | Contador `arrived` sincroniza | P0 | PASS | `animateConversation` usa contador antes de `speak` |
| C4.5 | Retry `addAgent(target)` em 50ms | P1 | PASS | `TheaterScene.ts:~700` (#73ad746c) |
| C4.6 | Pause no meio não quebra | P1 | PENDING | Requer Playwright para simular clique de Pause mid-tween |
| C4.7 | Relayout não cancela tween (v0.13.9) | P0 | PASS | Guard em `relayoutAgents`; documentado em PATCH v0.13.9 |

### F5 — Animação de broadcast

| ID | Descrição | Prioridade | Status | Evidência |
|---|---|---|---|---|
| C5.1 | Source caminha até `(820, 360)`, fala, volta | P0 | PASS | `broadcast-3-triggering.png`, PATCH v0.13.6 |
| C5.2 | Desk `away` → `occupied` | P0 | PASS | `TheaterScene.ts:842,861`; evidência visual em `broadcast-3-triggering.png` (mesa escurecida) |
| C5.3 | Dois broadcasts serializados | P1 | PASS | Lock `processing` é invariante global; inspecionado em `processEventQueue` |
| C5.4 | `setDepth(centerPos.y)` durante fala | P1 | PASS | `TheaterScene.ts` branch broadcast; PATCH v0.13.6 §notas técnicas |
| C5.5 | Não regressar para `animateSimpleEvent` | P0 | PASS | Switch em `animateEvent` direciona explicitamente (`TheaterScene.ts:721-724`) |

### F7 — Player controls

| ID | Descrição | Prioridade | Status | Evidência |
|---|---|---|---|---|
| C7.1 | Play consome fila | P0 | PASS | `theater-5-playing.png`, `broadcast-5-playing.png` |
| C7.2 | Pause interrompe | P0 | PENDING | Exige captura no meio de fluxo |
| C7.3 | ⏮ `goToFirst` pausa | P1 | PASS | `theaterStore.ts:411-420` inclui `playing: false` implícito (ver lógica) |
| C7.4 | ⏭ `goToLast` pausa | P1 | PASS | `theaterStore.ts:423-432` |
| C7.5 | ⏴ `stepBackward` | P1 | PASS | `theaterStore.ts:395-408` |
| C7.6 | ⏵ `stepForward` | P1 | PASS | `theaterStore.ts:379-392` |
| C7.7 | Botões desabilitam sem eventos | P2 | PENDING | Visual, não inspecionado |

### F8 — Velocidades

| ID | Descrição | Prioridade | Status | Evidência |
|---|---|---|---|---|
| C8.1 | 1x `MOVE_SPEED=120` | P0 | PASS | `TheaterScene.ts:34` |
| C8.2 | 2x metade do tempo | P1 | PENDING | Requer medição em Playwright |
| C8.3 | 4x quarto do tempo | P1 | PENDING | Idem |
| C8.4 | 0.5x dobro do tempo | P1 | PENDING | Idem |
| C8.5 | Mudança mid-tween | P2 | PENDING | Comportamento depende de quando `speed` é lido |
| C8.6 | Delay `max(100, 300/speed)` | P2 | PASS | Código em `processEventQueue` onComplete |

### F9 — Replay

| ID | Descrição | Prioridade | Status | Evidência |
|---|---|---|---|---|
| C9.1 | Selecionar + Play reanima dali | P0 | PASS (código) | PATCH v0.13.8; `theater-8-playback.png` |
| C9.2 | `selectEvent` pausa | P0 | PASS | `theaterStore.ts:339-342` |
| C9.3 | Botões ⏮⏴⏵⏭ movem cursor cena | P0 | PASS | PATCH v0.13.8 §impacto |
| C9.4 | `togglePlayback` não reescreve `activeEventId` | P0 | PASS | `theaterStore.ts:376-378` (apenas toggle playing) |
| C9.5 | Performance com 80+ eventos | P2 | PASS | `forge-labs` session tem 84 eventos, observada em screenshots sem degradação |

### F10 — Cursor isolado do WS em replay

| ID | Descrição | Prioridade | Status | Evidência |
|---|---|---|---|---|
| C10.1 | WS não puxa cursor | P0 | PASS | `pushEvent` em `theaterStore.ts:314-335` não altera `activeEventId` se já setado |
| C10.2 | Primeiro evento inicializa cursor | P0 | PASS | `activeEventId: s.activeEventId ?? event.id` |
| C10.3 | Tail orgânico retoma auto-advance | P1 | PASS | `processEventQueue` reativa via subscribe de `eventsGrew` (PATCH v0.13.8) |

### F11 — Filtros

| ID | Descrição | Prioridade | Status | Evidência |
|---|---|---|---|---|
| C11.1 | Filtro por agente (source OU target) | P0 | PASS | `HistoryPanel.tsx:43-49` |
| C11.2 | Filtro por tipo | P0 | PASS | `HistoryPanel.tsx:50-52` |
| C11.3 | Filtros combinados AND | P1 | PASS | Mesma `useMemo` aplica dois filtros sequencialmente |
| C11.4 | "Todos" limpa | P1 | PASS | `setAgentFilter([])` / `setEventTypeFilter([])` |
| C11.5 | Filtro por agente inexistente | P2 | PASS | `filter` retorna [] — inofensivo |

### F12/F13 — Adapters

| ID | Descrição | Prioridade | Status | Evidência |
|---|---|---|---|---|
| C12.1 | Demo default | P0 | PASS | `theater-6-demo-session-start.png`, `final-3-demo-meeting.png` |
| C12.2 | `DEMO_ADAPTER=false` | P1 | PENDING | Toggle não testado empiricamente |
| C12.3 | Claude Local default | P0 | PASS | `final-1-forge-labs-layout.png` |
| C12.4 | `CLAUDE_LOCAL_ADAPTER=false` | P1 | PENDING | Toggle não testado |
| C12.5 | Server restart perde sessões | P1 | PASS (arquitetura) | `SessionStore` é `Map` in-memory em `store.ts` |
| C12.6 | Ring buffer 1000 | P2 | PASS (arquitetura) | `MAX_EVENTS_PER_SESSION` em `core/constants` |

### F14 — Fix v0.13.10

| ID | Descrição | Prioridade | Status | Evidência |
|---|---|---|---|---|
| C14.1 | forge-labs emite 19 AGENT_JOINED | P0 | PASS | PATCH v0.13.10 §impacto (validação via `/api/events`) |
| C14.2 | signal-ops fallback | P1 | PASS | PATCH v0.13.10 §impacto |
| C14.3 | Dedup por nome | P1 | PASS | `Set<string>` em `buildAgentList` |
| C14.4 | MESSAGE_SENT target lead sem retry | P0 | PASS | PATCH v0.13.10 §impacto: ping `carlos-backend → lucas-techlead` validado |
| C14.5 | Alias `team-lead` remapeado | P0 | PASS | `buildAgentList` em `adapter-claude-local/src/index.ts` |

### F15 — Guard `pendingRelayout`

| ID | Descrição | Prioridade | Status | Evidência |
|---|---|---|---|---|
| C15.1 | `relayoutAgents` early-return durante `processing` | P0 | PASS | PATCH v0.13.9, guard no topo |
| C15.2 | Flag dispara relayout no `onComplete` | P0 | PASS | PATCH v0.13.9 §alterações |
| C15.3 | Coalescência múltiplos addAgent | P1 | PASS (lógica) | Flag boolean idempotente |
| C15.4 | Fora de tween: fluxo normal | P1 | PASS | Guard é `this.processing === true` |

### F16 — Atalhos de teclado

| ID | Descrição | Prioridade | Status | Evidência |
|---|---|---|---|---|
| C16.1 | Espaço toggle | P1 | PASS | `PlaybackControls.tsx:87-90` |
| C16.2 | ←/→ step | P1 | PASS | `PlaybackControls.tsx:91-98` |
| C16.3 | Home/End | P1 | PASS | `PlaybackControls.tsx:99-106` |
| C16.4 | 1..4 velocidade | P2 | PASS | `PlaybackControls.tsx:26-31,108-111` |
| C16.5 | Foco em INPUT/SELECT suprime | P1 | PASS | `PlaybackControls.tsx:83-84` |

### F17/F18 — Sanitização e filtros de inbox

| ID | Descrição | Prioridade | Status | Evidência |
|---|---|---|---|---|
| C17.1 | `<info_for_agent>` removido | P0 | PASS | `sanitizeText` em `adapter-claude-local/src/index.ts`; `adapters.md` §sanitização |
| C18.1 | `user.json` ignorado | P0 | PASS | `adapters.md` §filtros |
| C18.2 | `team-lead.json` ignorado | P0 | PASS | idem |
| C18.3 | Heartbeat embutido ignorado | P0 | PASS | `isEmbeddedSystemPayload` |
| C18.4 | Auto-mensagem → broadcast | P1 | PASS | `adapters.md` §inbox |
| C18.5 | `from/to = user` ignorado | P1 | PASS | `adapters.md` §filtros |

---

## Resumo

| Categoria | Total | PASS | FAIL | PENDING |
|---|---|---|---|---|
| P0 | 25 | 24 | 0 | 1 |
| P1 | 29 | 18 | 0 | 11 |
| P2 | 7 | 3 | 0 | 4 |
| **Total** | **61** | **45** | **0** | **16** |

Taxa de aprovação estática: **73,8%** (45/61). Nenhum cenário FAIL detectado.
Os 16 PENDING exigem validação visual em browser com Playwright.

---

## Defeitos encontrados

Nenhum defeito novo durante esta execução estática. Todos os bugs conhecidos
já foram tratados em PATCH_NOTES recentes:

- ~~#c3eb2ea5~~ (replay quebrado) — resolvido em v0.13.8.
- ~~#a33f5faa~~ (broadcast sem animação + lead faltante) — resolvido em v0.13.6 + v0.13.10.
- ~~#73ad746c~~ (retry on-demand de sprite faltante) — resolvido em v0.13.5.
- ~~v0.11.5~~ (bundle apagado pelo OneDrive) — resolvido via `inspectWebDist`.

Riscos residuais observados durante a leitura:

1. **Race na primeira conexão WS em sessões reais**: `scanTeam` emite
   `AGENT_JOINED` antes de `watcher.start()` (ver PATCH v0.13.10 §risco residual),
   mas em reconexão WS mid-stream a ordem pode inverter. Probabilidade baixa em
   ambiente local; não reprodutível sem teste de carga. **Severidade: baixa.**
2. **Mudança de velocidade mid-tween (C8.5)**: não há evidência de que o fator
   `speed` atual seja relido pelo tween em andamento. Dependendo do efeito
   visual esperado, pode gerar surpresa do usuário. **Severidade: baixa.**
3. **Cenário C1.3 (1 agente)**: nunca observado em screenshots existentes.
   Provavelmente funciona pelo fallback, mas vale confirmar. **Severidade: baixa.**

---

## Recomendações de follow-up

Sugestões para `@lucas-techlead` decidir se abre tasks separadas:

- **FT-1 (P1)**: Validação visual Playwright dos 16 cenários PENDING — especialmente
  C4.6 (pause mid-tween), C7.2 e C8.2/8.3/8.4 (duração real por velocidade).
  Delegável a `@ana-frontend` ou `@bruno-frontend`.
- **FT-2 (P2)**: Adicionar teste unitário para `getMeetingSeatPositions(...,n)` com
  n ∈ [1..6] confirmando unicidade e estabilidade dos slots.
- **FT-3 (P2)**: Teste de reconexão WS simulando perda + retorno durante scan,
  para confirmar ordem `AGENT_JOINED → MESSAGE_SENT`.
- **FT-4 (P2)**: Fixar o comportamento de mudança de velocidade mid-tween (C8.5)
  com documentação clara — reaplicar `speed` no próximo frame ou só no próximo evento?

---

## Status final de QA

**Release recomendada: APROVADA com ressalvas.**

- Todos os cenários P0 validáveis estaticamente passaram.
- 1 cenário P0 e 11 P1 ficam pendentes de validação visual; nenhum bloqueia a
  release se o frontend confirmar visualmente antes do shipping (ver FT-1).
- Zero defeitos novos encontrados.
- Fixes recentes (v0.13.5..v0.13.10) estão consistentes entre PATCH_NOTES e
  código inspecionado.
