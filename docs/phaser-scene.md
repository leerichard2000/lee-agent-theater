# TheaterScene — Cena Phaser

Guia de navegação para `apps/web/src/phaser/TheaterScene.ts` (~820 linhas).
Para o fluxo geral de eventos, ver [architecture.md](architecture.md).

---

## Responsabilidades

1. Desenhar o cenário (tiles + zona de reunião).
2. Criar/remover `AgentSprite` e `OfficeDesk` conforme o `theaterStore`.
3. Consumir a fila de eventos e reproduzir animações **serializadas**
   (um por vez, via lock `processing`).
4. Publicar posições DOM em `labelPositionsStore` a cada `POST_UPDATE`
   para o componente React `AgentLabels` renderizar labels em
   `position: fixed` sincronizadas ao sprite.

A cena é instanciada por `PhaserBridge` (via `gameRef.ts`) e registrada
com key `'TheaterScene'`. Canvas: `GAME_WIDTH × GAME_HEIGHT`
(`960 × 540`, em `config.ts`).

---

## Constantes-chave

Coordenadas todas em px absolutos do world Phaser.

| Constante | Valor | Papel |
|---|---|---|
| `MEETING_TABLE_POS` | `{ x: 820, y: 300 }` | Centro da mesa de reunião isolada (canto direito). Exportada — usada por `animateBroadcast` e `animateConversation`. |
| `AGENT_DESK_Y_OFFSET` | `16` | Offset em y do sprite em relação ao centro da mesa individual. Positivo → agente "em pé à frente da mesa". |
| `DESK_AREA_X_MIN` / `X_MAX` | `60` / `680` | Faixa horizontal dos postos individuais. Limite direito deixa ~140px de respiro até a mesa de reunião. |
| `DESK_AREA_Y_MIN` / `Y_MAX` | `80` / `480` | Faixa vertical dos postos. |
| `MOVE_SPEED` | `120` | px/s em velocidade 1x. Multiplicado por `playback.speed`. |
| `FALLBACK_AGENT_POS` | `{ x: 200, y: 270 }` | Usado quando `calculateLayout` não produz slot. |

`MEETING_SLOTS` não é uma constante exportada; as posições dos 6 slots
(S1..S6) vêm de `getMeetingSeatPositions(tableX, tableY, n)` em
`sprites/seatPositions.ts`. Ordem de preenchimento por N:

- `n=1`: [S1]
- `n=2`: [S1, S4]  ← diagonal frente a frente, usada por `animateConversation`
- `n=3`: [S1, S4, S3]
- `n=4..6`: continua [S6, S2, S5]

`CONVERSATION_OFFSET_X` não existe no código atual. O posicionamento na
conversa é feito diretamente pelos retornos de `getMeetingSeatPositions`.
O broadcast usa offset hard-coded `y = MEETING_TABLE_POS.y + 60`.

---

## Layout dos postos

`calculateLayout(agentCount)` retorna `{ slots, scale }`:

- **Escala** baseada na quantidade:
  - ≤ 8 agentes → `1.0`
  - ≤ 16 → `0.8`
  - 17+ → `max(0.5, min(0.8, 8/√n))`

- **Grid** automático: divide a área útil em células de `88 × 96` (em px
  já escalados) e distribui em linhas/colunas. Cada slot tem `deskX`/`deskY`
  (centro da mesa individual) e `agentX`/`agentY` (centro da mesa + offset).

Ver o bloco `calculateLayout` para a lógica exata (#7f55851a).

---

## Queue de animação e lock

Campo `private processing = false` serializa eventos:

```
processEventQueue()   →  se processing → return
                     →  se !playback.playing → return
                     →  pega state.events[lastProcessedIndex + 1]
                     →  processing = true
                     →  animateEvent(event, onComplete)
                            onComplete = {
                              lastProcessedIndex = nextIndex
                              setActiveEvent(null)
                              processing = false
                              delayedCall(max(100, 300/speed), processEventQueue)
                            }
```

O lock é **a invariante mais importante** da cena: enquanto um evento
estiver animando, novos eventos ficam na fila (cresce `state.events`) e só
são consumidos quando `onComplete` libera `processing`. Qualquer caminho
em `animateEvent` DEVE eventualmente chamar `onComplete`, senão a cena
trava.

---

## Fluxos animados

`animateEvent(event, onComplete)` decide o caminho:

1. **Sprite do emissor faltando** → dispara `addAgent(sourceAgent)` e
   reagenda via `delayedCall(50, …)`. Mantém `processing = true`.
2. **Sprite do alvo faltando** (apenas para eventos de mensagem) →
   mesmo retry simétrico (#73ad746c).
3. **Evento de mensagem** (`MESSAGE_SENT` / `MESSAGE_RECEIVED`):
   - Com `targetAgent` → `animateConversation`.
   - Sem `targetAgent` (broadcast) → `animateBroadcast`.
4. **Outros eventos** (`TOOL_CALL`, `THINKING`, `STATUS_CHANGE`, etc.)
   → `animateSimpleEvent`.

### `animateConversation(source, target, event, speed, onComplete)`

Spec UX #b35c9591 §4.

1. Snapshot de `sourceOriginalPos` e `targetOriginalPos`.
2. `setState('active')` nos dois; mesas individuais entram em `'away'`.
3. `delayedCall(200/speed)` → ambos `setState('moving')`, caminham em
   paralelo até `getMeetingSeatPositions(...,2)` → [S1, S4].
4. Contador `arrived` (0→2) funciona como `Promise.all` — quando ambos
   chegam: source `'speaking'` + `speak(summary)`; target `'waiting'`.
5. `bubbleDuration = clamp(2000, summary.length * 40, 5000) / speed`.
6. Após bubble: `hideSpeech`, ambos `'moving'`, retornam em paralelo.
7. Contador `returned` libera `setDeskState('occupied')`, `setState('idle')`
   nos dois, e chama `onComplete()`.

### `animateBroadcast(source, event, speed, onComplete)`

Introduzido em #a33f5faa (PATCH_NOTES v0.13.6). Diferença fundamental:

- **1 agente só** se move.
- Destino é o "center stage" (`MEETING_TABLE_POS.x`, `MEETING_TABLE_POS.y + 60`),
  **não** um slot S*. Comunica "falando pro time todo".
- Mesa do source → `'away'` durante; volta a `'occupied'` no retorno.

Sem contador: um único `moveTo` por trecho (ida, volta).

### `animateSimpleEvent(source, event, speed, onComplete)`

- Mapeia `eventType → AgentState` via tabela fixa
  (`TOOL_CALL → active`, `THINKING → thinking`, `ERROR → error`, etc.).
- `source.setState(newState)`; se houver `summary`, `source.speak(summary)`.
- `duration = clamp(1500, summary.length * 30, 3000) / speed`.
- Após duração: `hideSpeech`, `setState('idle')`, `onComplete()`.

Sem movimentação.

---

## Sprites do diretório `sprites/`

Barrel em `apps/web/src/phaser/sprites/index.ts`.

| Módulo | Exporta | Função |
|---|---|---|
| `OfficeDesk.ts` | `OfficeDesk`, `OfficeDeskState`, `OfficeDeskOptions` | Container com mesa + glow opcional. Estados: `idle` / `occupied` / `away`. Glow sai da cor do agente (`highlightColor`). |
| `MeetingTable.ts` | `MeetingTable`, `MeetingTableOptions` | Mesa de reunião estática (singleton da cena). Desenhada por `drawMeetingZone`. |
| `seatPositions.ts` | `getMeetingSeatPositions(tableX, tableY, n)`, `getAllMeetingSeats`, `MAX_MEETING_SEATS`, `SeatPosition`, `SeatFacing` | Cálculo puro dos slots S1..S6. Sem dependência de Phaser — testável. |
| `textures.ts` | `generateSpriteTextures(scene)` + constantes `TEX_DESK_*`, `TEX_MEETING_*` | Cria as texturas procedurais na primeira invocação (idempotente). |

### Adicionar um novo sprite

1. Criar `sprites/MeuSprite.ts` com a classe (geralmente um
   `Phaser.GameObjects.Container`).
2. Se precisar de textura nova, adicionar em `textures.ts` e uma função
   `generateMinhaSpriteTexture(scene)`; chamar dentro de
   `generateSpriteTextures(scene)` (idempotente via `scene.textures.exists`).
3. Exportar classe + tipos no barrel `sprites/index.ts`.
4. Em `TheaterScene.create()`, instanciar após `generateSpriteTextures(this)`.
5. Se o sprite deve acompanhar um agente, manter um
   `Map<agentId, MeuSprite>` espelhando `agentSprites`/`deskSprites` e
   fazer cleanup em `removeAgentSprite` e `shutdown`.

---

## Sync de labels DOM

`syncLabelPositions()` roda em `POST_UPDATE` (uma vez por frame, após
tweens). Para cada `AgentSprite`:

1. Lê `getSpriteWorldBounds()` (bounds do Image interno — evita o zero
   do Container no primeiro frame, bug já pego em produção).
2. Converte para viewport usando `canvas.getBoundingClientRect()`.
3. Escreve posição em `labelPositionsStore`.

O componente React `AgentLabels` lê esse store e posiciona labels em
`position: fixed`, fora do canvas Phaser. Isso permite texto nítido
(sem re-render em pixel art) e acessibilidade via DOM.

---

## Interações com o `theaterStore`

Referências em `TheaterScene.ts`:

- `theaterStore.getState()` — leitura síncrona dentro de callbacks.
- `theaterStore.subscribe(cb)` em `create()` — reage a adição/remoção
  de agentes e a crescimento de `state.events`.
- `theaterStore.getState().addAgent(info)` — usado nos retries on-demand
  quando um evento referencia sprite ainda não criado.
- `setActiveEvent(id | null)` — sincroniza o destaque do evento ativo no
  painel lateral React.
