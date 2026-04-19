# Plano de Testes — Lee Agent Theater

Plano de QA cobrindo as funcionalidades entregues até `v0.13.10` do sistema
Lee Agent Theater. Para contexto de cada camada, ver:

- [architecture.md](architecture.md) — fluxo end-to-end e contratos.
- [phaser-scene.md](phaser-scene.md) — cena Phaser e invariantes de animação.
- [adapters.md](adapters.md) — contrato de adapter e walkthrough do `adapter-claude-local`.

Resultados de execução em [test-results.md](test-results.md).

---

## 1.1 Mapa de funcionalidades testáveis

| ID | Área | Origem |
|---|---|---|
| F1 | Renderização da cena (1, 4, 17, 20+ agentes) + escala adaptativa | `calculateLayout` (#7f55851a) |
| F2 | Flip layout: agente renderiza abaixo da mesa (`AGENT_DESK_Y_OFFSET=16`) | `TheaterScene.ts:51`, `:499` |
| F3 | Mesa de reunião: zona isolada com 6 slots S1..S6 | `getMeetingSeatPositions` |
| F4 | Animação de conversa (S1/S4) — mensagens diretas | `animateConversation` (#b35c9591) |
| F5 | Animação de broadcast — mensagens do lead sem target | `animateBroadcast` (#a33f5faa, v0.13.6) |
| F6 | `setDeskState('away')` durante animação, `'occupied'` no retorno | `TheaterScene.ts:763,801,842,861` |
| F7 | Player controls: Play, Pause, ⏮, ⏴, ⏵, ⏭ | `PlaybackControls.tsx` |
| F8 | Velocidades 0.5x / 1x / 2x / 4x | `PlaybackControls.tsx:16` |
| F9 | Replay: selecionar evento passado + Play executa a partir dali | `selectEvent`, `processEventQueue` (v0.13.8) |
| F10 | Cursor não é puxado por eventos WS em replay | `pushEvent` (v0.13.8) |
| F11 | Filtros `HistoryPanel`: por agente e por tipo | `HistoryPanel.tsx`, `setAgentFilter` |
| F12 | Adapter Demo: scripts curados (`FEATURE_SCENARIO`) | `adapter-demo` |
| F13 | Adapter Claude Local: sessões `claude-<team>` via inboxes/tasks | `adapter-claude-local` |
| F14 | Fix v0.13.10: lead real emite `AGENT_JOINED` | `buildAgentList(config, meta, teamName)` |
| F15 | Defesa em profundidade: `pendingRelayout` guard (v0.13.9) | `TheaterScene.relayoutAgents` |
| F16 | Atalhos de teclado (Espaço, ←/→, Home/End, 1..4) | `PlaybackControls.handleKeyDown` |
| F17 | Sanitização de `<info_for_agent>` em inboxes | `sanitizeText` |
| F18 | Filtros de inbox: ignora `user.json`, `team-lead.json`, heartbeats | `adapter-claude-local` |

---

## 1.2 Cenários de teste

### F1 — Renderização da cena

| ID | Descrição | Prioridade | Tipo |
|---|---|---|---|
| C1.1 | Sessão Demo carrega com 4 agentes; cada sprite renderizado em slot distinto, sem sobreposição | P0 | Happy |
| C1.2 | Sessão `claude-forge-labs` carrega com 19 agentes; escala cai para `0.8` (≤16 é `1.0`, >16 reduz) | P0 | Happy |
| C1.3 | Sessão com 1 agente: sprite usa slot único sem fallback `FALLBACK_AGENT_POS` | P1 | Edge |
| C1.4 | Sessão com 17 agentes: escala calculada como `max(0.5, min(0.8, 8/√17))` = ~0.77 | P1 | Edge |
| C1.5 | Sessão com 24+ agentes: todos cabem na área `DESK_AREA_X [60,680] × Y [80,480]` sem ultrapassar a mesa de reunião | P1 | Edge |
| C1.6 | Agente sem slot em `calculateLayout` usa `FALLBACK_AGENT_POS = {x:200, y:270}` | P2 | Edge |
| C1.7 | Regressão: OneDrive não corrompe o bundle — `inspectWebDist` valida `index.html + assets/*.js` antes de servir (v0.11.5) | P1 | Regressão |

### F2 — Flip layout

| ID | Descrição | Prioridade | Tipo |
|---|---|---|---|
| C2.1 | Sprite do agente é posicionado em `agentY = deskY + 16`, portanto visualmente abaixo do centro da mesa individual | P0 | Happy |
| C2.2 | Depth da mesa = `agentY - 2`, garantindo que a cabeça do agente sobrepõe a base da mesa | P0 | Happy |
| C2.3 | Com 4 agentes em 1 linha, os 4 aparecem abaixo das mesas | P1 | Happy |
| C2.4 | Com 19 agentes em grid, cada agente mantém offset de +16px em Y em relação a sua mesa, sem sobreposição entre linhas | P1 | Edge |

### F3 — Mesa de reunião

| ID | Descrição | Prioridade | Tipo |
|---|---|---|---|
| C3.1 | Mesa de reunião renderizada em `{x:820, y:300}` (canto direito), isolada dos postos individuais | P0 | Happy |
| C3.2 | `getMeetingSeatPositions(..., 2)` retorna [S1, S4] — diagonal frente a frente | P0 | Happy |
| C3.3 | `getMeetingSeatPositions(..., 6)` retorna os 6 slots sem duplicação | P1 | Edge |
| C3.4 | Agente não ocupa slot da mesa de reunião fora de `animateConversation`/`animateBroadcast` | P1 | Edge |
| C3.5 | Postos individuais ficam à esquerda (`DESK_AREA_X_MAX=680`), com ~140px de respiro até a mesa (x=820) | P1 | Edge |

### F4 — Animação de conversa

| ID | Descrição | Prioridade | Tipo |
|---|---|---|---|
| C4.1 | `MESSAGE_SENT` com `targetAgent` populado: source e target caminham para [S1, S4]; source `speaking`, target `waiting`; ambos retornam | P0 | Happy |
| C4.2 | `bubbleDuration = clamp(2000, len*40, 5000) / speed` — em 1x, summary de 50 chars → 2000ms | P0 | Happy |
| C4.3 | Mesas individuais dos dois agentes entram em `away` durante conversa e voltam a `occupied` no retorno | P0 | Happy |
| C4.4 | Contador `arrived` espera ambos antes de iniciar fala (evita race) | P0 | Edge |
| C4.5 | Sprite do target ausente: retry via `addAgent(target)` e reagendamento em 50ms, mantendo `processing=true` | P1 | Edge (#73ad746c) |
| C4.6 | Ao pausar no meio da conversa, tween continua até o `onComplete`; o próximo evento só dispara após Play | P1 | Edge |
| C4.7 | Regressão: relayout durante tween não cancela animação (v0.13.9, `pendingRelayout`) | P0 | Regressão |

### F5 — Animação de broadcast

| ID | Descrição | Prioridade | Tipo |
|---|---|---|---|
| C5.1 | `MESSAGE_SENT` com `targetAgent: null`: source caminha até `{MEETING_TABLE_POS.x, +60}`, fala, retorna | P0 | Happy |
| C5.2 | Mesa do source `away` durante broadcast, `occupied` no retorno | P0 | Happy |
| C5.3 | Dois broadcasts consecutivos são serializados pelo lock `processing` — o segundo só começa após o `onComplete` do primeiro | P1 | Edge |
| C5.4 | `setDepth(centerPos.y)` durante fala, sprite renderiza à frente da mesa de reunião | P1 | Edge |
| C5.5 | Regressão pré-v0.13.6: broadcasts caíam em `animateSimpleEvent` sem movimento — não pode voltar a ocorrer | P0 | Regressão |

### F7 — Player controls

| ID | Descrição | Prioridade | Tipo |
|---|---|---|---|
| C7.1 | Botão Play inicia `processEventQueue`, consome eventos sequencialmente | P0 | Happy |
| C7.2 | Botão Pause interrompe consumo na próxima verificação de `playback.playing` | P0 | Happy |
| C7.3 | ⏮ (`goToFirst`): cursor vai para `filteredEvents[0]`, pausa | P1 | Happy |
| C7.4 | ⏭ (`goToLast`): cursor vai para o último filtrado, pausa | P1 | Happy |
| C7.5 | ⏴ (`stepBackward`): cursor recua uma posição, pausa | P1 | Happy |
| C7.6 | ⏵ (`stepForward`): cursor avança uma posição, pausa | P1 | Happy |
| C7.7 | Botões desabilitam/recuperam visual corretamente quando sem eventos | P2 | Edge |

### F8 — Velocidades

| ID | Descrição | Prioridade | Tipo |
|---|---|---|---|
| C8.1 | 1x: `MOVE_SPEED = 120 px/s`; conversa completa (~4s) dura esperado | P0 | Happy |
| C8.2 | 2x: tempo total ~metade da duração 1x | P1 | Happy |
| C8.3 | 4x: tempo total ~quarto da duração 1x | P1 | Happy |
| C8.4 | 0.5x: tempo total ~dobro da duração 1x | P1 | Happy |
| C8.5 | Mudar velocidade no meio de tween: próximo tween respeita novo fator | P2 | Edge |
| C8.6 | Delay entre eventos `max(100, 300/speed)` — em 4x, mínimo de 100ms | P2 | Edge |

### F9 — Replay

| ID | Descrição | Prioridade | Tipo |
|---|---|---|---|
| C9.1 | Clicar em evento passado + Play: cena reanima a partir daquele ponto (v0.13.8) | P0 | Happy |
| C9.2 | `selectEvent` pausa automaticamente ao posicionar cursor | P0 | Happy |
| C9.3 | ⏮/⏴/⏵/⏭ movem efetivamente o cursor da cena (antes moviam só highlight) | P0 | Regressão (v0.13.8) |
| C9.4 | Regressão #c3eb2ea5: `togglePlayback` não reescreve mais `activeEventId` para o último | P0 | Regressão |
| C9.5 | Replay em sessão com 80+ eventos mantém performance aceitável (sem freeze no browser) | P2 | Edge |

### F10 — Cursor isolado do WS em replay

| ID | Descrição | Prioridade | Tipo |
|---|---|---|---|
| C10.1 | Durante replay (cursor em evento antigo), novo evento WS é adicionado em `events[]` mas cursor não se move | P0 | Happy |
| C10.2 | `pushEvent` inicializa `activeEventId` apenas no primeiro evento (`s.activeEventId ?? event.id`) | P0 | Happy |
| C10.3 | Ao alcançar o tail organicamente (cursor chega no último), novo WS dispara avanço natural | P1 | Edge |

### F11 — Filtros

| ID | Descrição | Prioridade | Tipo |
|---|---|---|---|
| C11.1 | Filtrar por agente X: timeline mostra só eventos onde X é source ou target | P0 | Happy |
| C11.2 | Filtrar por tipo `MESSAGE_SENT`: outros tipos somem | P0 | Happy |
| C11.3 | Filtros combinados (agente + tipo): AND lógico | P1 | Edge |
| C11.4 | Selecionar "Todos os agentes" / "Todos os tipos": limpa filtro correspondente | P1 | Happy |
| C11.5 | Filtro por agente inexistente (race de dropdown): não quebra, retorna zero eventos | P2 | Edge |

### F12/F13 — Adapters

| ID | Descrição | Prioridade | Tipo |
|---|---|---|---|
| C12.1 | `DEMO_ADAPTER=true` (default): Sessão Demo aparece no seletor e emite eventos | P0 | Happy |
| C12.2 | `DEMO_ADAPTER=false`: Sessão Demo some | P1 | Edge |
| C12.3 | `CLAUDE_LOCAL_ADAPTER=true` (default): sessões `claude-<team>` aparecem no seletor | P0 | Happy |
| C12.4 | `CLAUDE_LOCAL_ADAPTER=false`: nenhuma sessão Claude aparece | P1 | Edge |
| C12.5 | Server reiniciado: sessões são perdidas (in-memory) e recriadas após adapters subirem | P1 | Edge |
| C12.6 | Ring buffer de 1000 eventos por sessão: evento 1001 descarta o 1º | P2 | Edge |

### F14 — Fix v0.13.10: lead real emite AGENT_JOINED

| ID | Descrição | Prioridade | Tipo |
|---|---|---|---|
| C14.1 | `claude-forge-labs` emite 19 `AGENT_JOINED` (não mais 18); inclui `lucas-techlead` | P0 | Regressão |
| C14.2 | `claude-signal-ops`: fallback para role lead-like funciona, 15 agents | P1 | Edge |
| C14.3 | Dedup por nome: lead não aparece duplicado se já estiver em `config.members` explícito | P1 | Edge |
| C14.4 | `MESSAGE_SENT` com `targetAgent.name = "lucas-techlead"` encontra sprite existente (sem retry) | P0 | Happy |
| C14.5 | Alias `team-lead` em `config.members` é remapeado para nome real, não filtrado cegamente | P0 | Happy |

### F15 — Guard `pendingRelayout` (v0.13.9)

| ID | Descrição | Prioridade | Tipo |
|---|---|---|---|
| C15.1 | `addAgent` durante `animateConversation` não dispara `relayoutAgents` imediato; flag é setada | P0 | Regressão |
| C15.2 | Ao completar animação, `processEventQueue` dispara relayout se flag estava ativa | P0 | Happy |
| C15.3 | 5 `addAgent` sequenciais durante tween → apenas 1 relayout final (coalescência) | P1 | Edge |
| C15.4 | Relayout chamado fora de tween: guard é falsy, fluxo normal | P1 | Happy |

### F16 — Atalhos de teclado

| ID | Descrição | Prioridade | Tipo |
|---|---|---|---|
| C16.1 | Espaço alterna Play/Pause | P1 | Happy |
| C16.2 | ← / → fazem step backward/forward | P1 | Happy |
| C16.3 | Home / End vão ao primeiro/último | P1 | Happy |
| C16.4 | Teclas 1..4 selecionam velocidade 0.5x/1x/2x/4x | P2 | Happy |
| C16.5 | Foco em INPUT/SELECT/TEXTAREA: atalhos não disparam (evita side-effect em dropdown) | P1 | Edge |

### F17/F18 — Sanitização e filtros de inbox

| ID | Descrição | Prioridade | Tipo |
|---|---|---|---|
| C17.1 | Mensagem com `<info_for_agent>...</info_for_agent>`: bloco removido de `content` | P0 | Regressão |
| C18.1 | `inboxes/user.json`: ignorado, nenhum evento gerado | P0 | Regressão |
| C18.2 | `inboxes/team-lead.json`: ignorado (espelho do time) | P0 | Regressão |
| C18.3 | Heartbeat `{"type":"idle_notification"}` embutido em `text`: ignorado por `isEmbeddedSystemPayload` | P0 | Regressão |
| C18.4 | Auto-mensagem (`from == to`): emitida como broadcast (`targetAgent: null`) | P1 | Edge |
| C18.5 | `msg.from = "user"` ou `msg.to = "user"`: ignorado | P1 | Regressão |

---

## 1.3 Critérios de aceitação (P0/P1)

Critérios objetivos por cenário crítico:

- **C1.1**: após 2s de boot, `GET /api/agents?sessionId=<demo>` retorna ≥4 agentes; Phaser canvas contém ≥4 sprites em coordenadas distintas (diff ≥ `88px` horizontal ou `96px` vertical).
- **C1.2**: `GET /api/agents?sessionId=claude-forge-labs` retorna exatamente 19; escala inspecionada via `calculateLayout(19)` = ~0.75.
- **C2.1**: para cada sprite `s`, `|s.y - (desk(s).y + 16)| < 1px`.
- **C3.1**: `MeetingTable` instanciada em `{820, 300}` e nenhum `deskX` excede 680.
- **C4.1**: ao receber `MESSAGE_SENT` direto, ambos sprites atingem posições `getMeetingSeatPositions(820,300,2)` em ≤ `distance/120 * 1000 + 200ms`; bubble aparece em ≤100ms após ambos chegarem.
- **C4.7**: executar reprodução completa de forge-labs (84 eventos) sem travamento; logs não indicam tween cancelado.
- **C5.1**: broadcast do lead: único sprite se move até `(820, 360)` e retorna; mesa individual some o glow e reaparece.
- **C5.5**: assertir no código que `animateEvent` nunca encaminha broadcast para `animateSimpleEvent` quando `isMessageEvent`.
- **C7.1**: após Play com sessão paused e 10 eventos em fila, no prazo `10 × (~3s/speed)` a cena processa todos.
- **C9.1**: selecionar evento nº 5 de 10 e clicar Play → sprites se movem conforme evento 5 e balão correspondente aparece em ≤3s.
- **C9.4**: após clicar Play em evento selecionado, `activeEventId` permanece igual ao selecionado (não vira `events[last]`).
- **C10.1**: durante replay paused, 5 mensagens novas via WS → `events.length` cresce em 5, `activeEventId` não muda.
- **C11.1**: filtrar por `lucas-techlead` → cada evento mostrado tem `sourceAgent.id === "lucas-techlead"` ou `targetAgent?.id === "lucas-techlead"`.
- **C14.1**: `GET /api/events?sessionId=claude-forge-labs&limit=200` retorna 19 `AGENT_JOINED` distintos por `sourceAgent.id`.
- **C14.4**: primeiro `MESSAGE_SENT` com target `lucas-techlead` reproduz `animateConversation` sem retry (ver ausência de log `addAgent(target)` em console).
- **C15.1**: inspeção visual — spawn on-demand durante tween não interrompe movimento para S1/S4.
- **C17.1**: evento no painel lateral para mensagem que continha `<info_for_agent>bla</info_for_agent>alpha` mostra apenas `alpha` no content.
- **C18.1/2/3**: `GET /api/events?sessionId=claude-forge-labs` não contém mensagens com `sourceAgent.id === "user"` nem `eventType === MESSAGE_SENT` com content sendo JSON de heartbeat.

---

## Estratégia de execução

- **Estática** (feita pela QA): grep de constantes, leitura de switch `animateEvent`, inspeção de `buildAgentList`, cruzamento com PATCH_NOTES. Cobre F2, F3, F5 (código), F10, F14, F15, F17, F18.
- **Visual** (delegar a @ana-frontend ou @bruno-frontend com Playwright): F1 (render com 19 agentes), F4/F5 (movimento), F7/F8/F9/F16 (interação UI), F11 (filtros). Screenshots em `.playwright-mcp/` podem cobrir vários cenários retrospectivamente.
- **Backend** (curl / REST): F12, F13, F14.1 — endpoints `/api/events`, `/api/agents`, `/api/status`.

## Escopo não coberto

- Testes de carga (>1000 eventos/s): fora do MVP.
- A11y DOM-level além do que já existe (`aria-label`, `aria-live`): ver `ui-design:accessibility-audit` em evolução futura.
- Internacionalização: roadmap futuro, não aplicável hoje.
