/**
 * Cena principal do palco — TheaterScene.
 *
 * Responsável por: cenário em tiles, sprites dos agentes, animações
 * de movimentação emissor→destinatário, balões de fala, e processamento
 * da fila de eventos do Zustand store.
 *
 * Segue spec UX #e4d80b5e e pesquisa Phaser #f75bf0f1.
 */

import Phaser from 'phaser';
import type { TheaterEvent, AgentState } from '@theater/core';
import type { AgentInfo } from '@theater/core';
import { EventType } from '@theater/core';
import { theaterStore } from '../stores/theaterStore.js';
import { labelPositionsStore, type LabelPosition } from './labelPositions.js';
import { AgentSprite } from './AgentSprite.js';
import { GAME_WIDTH, GAME_HEIGHT } from './config.js';
import {
  generateAgentTexture,
  generateWalkTexture,
  generateStatusIcons,
  generateTileTextures,
  generateOfficeTextures,
  generateBubbleTexture,
} from './SpriteFactory.js';
import {
  OfficeDesk,
  MeetingTable,
  getMeetingSeatPositions,
  generateSpriteTextures,
} from './sprites/index.js';

/** Velocidade de movimentação base em px/s (spec: 120px/s na velocidade 1x) */
const MOVE_SPEED = 120;

/**
 * Posição da mesa de reunião isolada no palco (spec UX #b35c9591 §3.2).
 * Canto direito do canvas 960x540, separada visualmente da área dos postos.
 */
export const MEETING_TABLE_POS = { x: 820, y: 300 } as const;

/**
 * Offset (em y) do agente em relação à mesa individual.
 *
 * Sinal positivo: agente fica ABAIXO da mesa (na frente dela, em pé).
 * Leitura visual "agente encostado à mesa pelo lado da frente" — definida
 * em #ee71e889, invertendo o §2.2 original. Valor 16 deixa a cabeça do
 * agente levemente sobreposta à base da mesa (origin do sprite em 0.5).
 */
const AGENT_DESK_Y_OFFSET = 16;

/** Cores padrão dos agentes (spec UX) */
const AGENT_COLORS = [
  '#4169E1', '#2ECC71', '#E67E22', '#9B59B6',
  '#E74C3C', '#1ABC9C', '#E91E90', '#F1C40F',
];

/**
 * Área útil reservada aos postos de trabalho dos agentes.
 *
 * Margem esquerda reduzida a 60 e limite direito empurrado para 680 para
 * acomodar 17+ agentes sem sobreposição (#7f55851a). A mesa de reunião
 * fica em x=820 com raio de ~100px, então 680 ainda deixa ~40px de respiro
 * entre os postos e o glow dos balões.
 */
const DESK_AREA_X_MIN = 60;
const DESK_AREA_X_MAX = 680;
const DESK_AREA_Y_MIN = 80;
const DESK_AREA_Y_MAX = 480;

/** Posição de fallback quando não há slot disponível (raríssimo) */
const FALLBACK_AGENT_POS = { x: 200, y: 270 } as const;

/**
 * Posição de um posto de trabalho — inclui coord do centro da mesa individual
 * e a coord derivada onde o agente se posiciona (atrás da mesa).
 */
interface DeskSlot {
  /** Centro da mesa individual */
  deskX: number;
  deskY: number;
  /** Posição do agente (atrás da mesa) */
  agentX: number;
  agentY: number;
}

/**
 * Calcula posições dos postos de trabalho para N agentes na área restrita
 * da esquerda do palco (spec #b35c9591 §2.2). Escalas: 1.0 (≤8), 0.8 (≤16),
 * clamp em 0.5 (17+). Cada slot traz a coord da mesa + a coord derivada
 * do agente (atrás da mesa).
 */
function calculateLayout(agentCount: number): { slots: DeskSlot[]; scale: number } {
  if (agentCount <= 0) return { slots: [], scale: 1 };

  let scale: number;
  if (agentCount <= 8) scale = 1;
  else if (agentCount <= 16) scale = 0.8;
  else scale = Math.max(0.5, Math.min(0.8, 8 / Math.sqrt(agentCount)));

  const areaW = DESK_AREA_X_MAX - DESK_AREA_X_MIN;
  const areaH = DESK_AREA_Y_MAX - DESK_AREA_Y_MIN;

  // Tamanho mínimo de célula para evitar sobreposição de sprites. Aumentado
  // em relação ao spec original (#7f55851a): 17+ agentes com 64x72 encavalavam
  // visualmente. Agora a célula comporta confortavelmente mesa 40 + agente 32 +
  // ~24px de respiro horizontal e ~24px vertical. O `scale` reduz proporcio-
  // nalmente para que o grid ainda caiba na área útil em counts altos.
  const minCellW = 88 * scale;
  const minCellH = 96 * scale;
  const maxCols = Math.max(1, Math.floor(areaW / minCellW));
  const maxRows = Math.max(1, Math.floor(areaH / minCellH));

  // Escolhe a menor quantidade de linhas que ainda cabe N itens em maxCols
  let cols = Math.min(agentCount, maxCols);
  let rows = Math.ceil(agentCount / cols);
  if (rows > maxRows) {
    rows = maxRows;
    cols = Math.ceil(agentCount / rows);
  }

  const cellW = areaW / cols;
  const cellH = areaH / rows;

  const slots: DeskSlot[] = [];
  for (let i = 0; i < agentCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const deskX = DESK_AREA_X_MIN + cellW * col + cellW / 2;
    const deskY = DESK_AREA_Y_MIN + cellH * row + cellH / 2;
    slots.push({
      deskX,
      deskY,
      agentX: deskX,
      agentY: deskY + AGENT_DESK_Y_OFFSET,
    });
  }

  return { slots, scale };
}

export class TheaterScene extends Phaser.Scene {
  /** Map de sprites de agentes ativos */
  private agentSprites = new Map<string, AgentSprite>();

  /**
   * Mesa individual de cada agente, spawnada em paralelo ao `AgentSprite`
   * (spec #b35c9591 §2 — 1 mesa por agente).
   */
  private deskSprites = new Map<string, OfficeDesk>();

  /** Mesa de reunião isolada (singleton por cena) */
  private meetingTable?: MeetingTable;

  /** Unsubscribe do Zustand store */
  private unsubscribe?: () => void;

  /** Flag para evitar processamento duplo de eventos */
  private processing = false;

  /**
   * Flag de "há relayout pendente" (mitigação da #a33f5faa). Quando agentes
   * são adicionados via `addAgent` on-demand (retry do source/target em
   * `animateEvent`) durante uma animação em vôo, o `relayoutAgents` dispararia
   * no mesmo frame e cancelaria os tweens dos sprites que estão indo pra mesa
   * de reunião. Ao invés disso, marcamos essa flag e drenamos no `onComplete`
   * da animação atual, quando os sprites já estão em suas `originalPos`.
   */
  private pendingRelayout = false;

  /**
   * ID do último evento animado com sucesso. Usado em conjunto com
   * `activeEventId` do store para saber se o cursor atual já foi processado
   * ou ainda precisa ser animado. Permite que, quando o playback está
   * paralizado no tail e um evento novo chega, o subscribe dispare
   * `processEventQueue` avançando o cursor para o novo evento sem re-animar
   * o último (#c3eb2ea5).
   */
  private lastAnimatedEventId: string | null = null;

  /** Posições atribuídas (para novos agentes) */
  private positionIndex = 0;

  constructor() {
    super({ key: 'TheaterScene' });
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  create(): void {
    // Gerar todas as texturas procedurais
    generateTileTextures(this);
    generateOfficeTextures(this);
    generateStatusIcons(this);
    generateBubbleTexture(this);
    // Texturas novas dos sprites de mobília dinâmica (#T2 / @bruno-frontend)
    generateSpriteTextures(this);

    // Desenhar cenário + zona de reunião estática (uma mesa isolada)
    this.drawStage();
    this.drawMeetingZone();

    // Criar sprites para agentes já existentes no store
    const initialState = theaterStore.getState();
    for (const agent of Object.values(initialState.agents) as AgentInfo[]) {
      this.createAgentSprite(agent);
    }

    // Sync de posicoes DOM dos labels: roda uma vez por frame apos o render
    // do Phaser, garantindo que lemos sprite.x/y/displayHeight ja estabilizados
    // (tweens aplicados, Scale.FIT aplicado). O canvas rect e medido 1x por
    // frame e os valores sao escritos no labelPositionsStore, que o
    // componente React AgentLabels le para posicionar labels em `position: fixed`.
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncLabelPositions, this);

    // Subscrever a mudanças no store
    this.unsubscribe = theaterStore.subscribe(
      (state, prevState) => {
        // Guard: não operar se a scene não está pronta
        if (!this.isReady()) return;

        // Novos agentes
        for (const [id, agent] of Object.entries(state.agents)) {
          if (!this.agentSprites.has(id)) {
            this.createAgentSprite(agent as AgentInfo);
          }
        }

        // Agentes removidos
        for (const id of this.agentSprites.keys()) {
          if (!state.agents[id]) {
            this.removeAgentSprite(id);
          }
        }

        // Re-processar em qualquer transição relevante:
        //  - chegou evento novo na fila,
        //  - user apertou Play (playing false -> true),
        //  - user clicou num evento antigo da timeline (activeEventId mudou).
        // O `processing` guard evita concorrência quando mais de um dispara
        // no mesmo tick (#c3eb2ea5).
        const eventsGrew = state.events.length > prevState.events.length;
        const playbackStarted = !prevState.playback.playing && state.playback.playing;
        const cursorChanged = state.activeEventId !== prevState.activeEventId;
        if (eventsGrew || playbackStarted || cursorChanged) {
          this.processEventQueue();
        }
      },
    );
  }

  shutdown(): void {
    this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncLabelPositions, this);
    this.unsubscribe?.();
    this.agentSprites.forEach((sprite) => sprite.destroy());
    this.agentSprites.clear();
    this.deskSprites.forEach((desk) => desk.destroy());
    this.deskSprites.clear();
    this.meetingTable?.destroy();
    this.meetingTable = undefined;
    labelPositionsStore.getState().replaceAll({});
  }

  /**
   * Calcula e publica a posicao DOM de cada label/balao com base na posicao
   * REAL do sprite Phaser no frame atual. Chamado em POST_UPDATE, apos tweens
   * aplicarem seus deltas e antes do render. Coords de viewport (fixed).
   */
  private syncLabelPositions(): void {
    const canvas = this.game.canvas;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const scaleX = rect.width / GAME_WIDTH;
    const scaleY = rect.height / GAME_HEIGHT;

    const next: Record<string, LabelPosition> = {};
    for (const [agentId, sprite] of this.agentSprites) {
      // Usamos `getSpriteWorldBounds()` — bounds do sprite Image interno, nao
      // do Container wrapper. Motivo: `Container.getBounds()` depende de
      // `this.width/height` do Container, que fica 0 no primeiro frame apos
      // `switchSession` (ate algo forcar resize), colapsando top==bottom e
      // deixando label+balao em cima do sprite. O Image interno tem width/
      // height validos desde o construtor via textureFrame.
      const bounds = sprite.getSpriteWorldBounds();

      // Guard defensivo: se bounds ainda vier zerado por qualquer motivo
      // (ex. sprite trocando de textura), pula neste frame.
      if (bounds.width === 0 || bounds.height === 0) continue;

      // Converte para viewport. `rect.left/top` ja sao viewport coords.
      const spriteLeft = rect.left + bounds.left * scaleX;
      const spriteRight = rect.left + bounds.right * scaleX;
      const spriteTop = rect.top + bounds.top * scaleY;
      const spriteBottom = rect.top + bounds.bottom * scaleY;
      const spriteWidthDom = spriteRight - spriteLeft;
      const spriteHeightDom = spriteBottom - spriteTop;
      const centerX = (spriteLeft + spriteRight) / 2;

      next[agentId] = {
        spriteHeightDom,
        spriteWidthDom,
        centerX,
        spriteTop,
        spriteBottom,
        spriteLeft,
        spriteRight,
        visible: true,
      };
    }

    labelPositionsStore.getState().replaceAll(next);
  }

  // ---------------------------------------------------------------------------
  // Cenário
  // ---------------------------------------------------------------------------

  /**
   * Desenha o "shell" do escritório (cena limpa, sem postos de trabalho).
   *
   * Mesas individuais e mesa de reunião NÃO são desenhadas aqui — são
   * renderizadas dinamicamente: 1 `OfficeDesk` por agente spawnado
   * (ver `createAgentSprite`) e 1 `MeetingTable` isolada (ver
   * `drawMeetingZone`). Spec UX #b35c9591 §1.
   */
  private drawStage(): void {
    const { width, height } = this.scale;
    const tileSize = 32;
    const tilesX = Math.ceil(width / tileSize) + 1;
    const tilesY = Math.ceil(height / tileSize) + 1;

    // Fundo escuro (paredes do escritório)
    this.cameras.main.setBackgroundColor('#0F1923');

    // Piso uniforme em tiles de escritório. Sem `tile_highlight` central:
    // o carpete central foi removido junto com a mesa de reunião embutida
    // (spec §1). A zona de reunião isolada ganha seu próprio destaque em
    // `drawMeetingZone`.
    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        const px = x * tileSize;
        const py = y * tileSize;

        // Parede superior (primeira linha)
        if (y === 0) {
          const wall = this.add.image(px, py, 'tile_wall');
          wall.setOrigin(0, 0);
          wall.setDepth(-5);
          continue;
        }

        const variant = (x + y) % 4;
        const tile = this.add.image(px, py, `tile_floor_${variant}`);
        tile.setOrigin(0, 0);
        tile.setDepth(-5);
      }
    }

    // --- Decoração ambiente (sem postos de trabalho) ---
    const cx = width / 2;
    const d = -3; // Depth base para decoração (acima do piso, abaixo dos agentes)

    // Sofás nos cantos inferiores
    const sofaPositions = [
      { x: 48, y: height - 40 },
      { x: width - 48, y: height - 40 },
    ];
    for (const pos of sofaPositions) {
      const sofa = this.add.image(pos.x, pos.y, 'furniture_sofa');
      sofa.setDepth(d);
    }

    // Plantas decorativas (4 cantos + 2 no topo central)
    const plantPositions = [
      { x: 24, y: 50 }, { x: width - 24, y: 50 },
      { x: 24, y: height - 50 }, { x: width - 24, y: height - 50 },
      { x: cx - 100, y: 50 }, { x: cx + 100, y: 50 },
    ];
    for (const pos of plantPositions) {
      const plant = this.add.image(pos.x, pos.y, 'furniture_plant');
      plant.setDepth(d);
    }

    // Estantes encostadas na parede superior
    const shelfPositions = [
      { x: 80, y: 20 }, { x: 160, y: 20 },
      { x: width - 80, y: 20 }, { x: width - 160, y: 20 },
    ];
    for (const pos of shelfPositions) {
      const shelf = this.add.image(pos.x, pos.y, 'furniture_bookshelf');
      shelf.setDepth(d);
    }

    // Iluminação ambiente sutil (luz fluorescente do escritório)
    const ambientLight = this.add.rectangle(
      cx, 0,
      width * 0.8, height * 0.4,
      0xffffff, 0.02,
    );
    ambientLight.setOrigin(0.5, 0);
    ambientLight.setDepth(-4);
  }

  /**
   * Desenha a zona da mesa de reunião isolada no canto direito do palco
   * (spec §3). A `MeetingTable` renderiza internamente a mesa retangular 96x56
   * + 6 cadeiras estáticas nos slots S1..S6. Carpete opcional embaixo para
   * reforçar "sala separada".
   */
  private drawMeetingZone(): void {
    // Carpete sinalizando "sala de reunião" (reuso do tile_highlight existente).
    const carpetTileSize = 32;
    const carpetCols = 7; // ~220px
    const carpetRows = 6; // ~190px
    const carpetStartX = MEETING_TABLE_POS.x - (carpetCols * carpetTileSize) / 2;
    const carpetStartY = MEETING_TABLE_POS.y - (carpetRows * carpetTileSize) / 2;
    for (let row = 0; row < carpetRows; row++) {
      for (let col = 0; col < carpetCols; col++) {
        const tile = this.add.image(
          carpetStartX + col * carpetTileSize,
          carpetStartY + row * carpetTileSize,
          'tile_highlight',
        );
        tile.setOrigin(0, 0);
        tile.setDepth(-5);
      }
    }

    // Mesa + cadeiras (container cuida do seu próprio setDepth relativo)
    this.meetingTable = new MeetingTable(this, MEETING_TABLE_POS.x, MEETING_TABLE_POS.y);
    this.meetingTable.setDepth(MEETING_TABLE_POS.y);
  }

  // ---------------------------------------------------------------------------
  // Sprites de agentes
  // ---------------------------------------------------------------------------

  /** Verifica se a scene está ativa e pode criar objetos */
  private isReady(): boolean {
    try {
      return !!(this.sys && this.add && this.textures);
    } catch {
      return false;
    }
  }

  /**
   * Cria sprite do agente + mesa individual 1:1.
   *
   * Layout vertical (após #ee71e889): mesa em cima, agente logo abaixo em
   * `deskY + 16`. Z-order: agente por cima da mesa (a cabeça do agente
   * sobrepõe a base da mesa).
   */
  private createAgentSprite(agent: AgentInfo): boolean {
    if (this.agentSprites.has(agent.id)) return true;
    if (!this.isReady()) return false;

    try {
      const color = agent.color ?? AGENT_COLORS[this.positionIndex % AGENT_COLORS.length];

      // Layout é recalculado a cada novo agente (scale + posições dos slots).
      const totalAgents = Object.keys(theaterStore.getState().agents).length;
      const layout = calculateLayout(totalAgents);
      const slot =
        layout.slots[this.positionIndex] ??
        layout.slots[layout.slots.length - 1] ??
        {
          deskX: FALLBACK_AGENT_POS.x,
          deskY: FALLBACK_AGENT_POS.y - AGENT_DESK_Y_OFFSET,
          agentX: FALLBACK_AGENT_POS.x,
          agentY: FALLBACK_AGENT_POS.y,
        };

      // Layout é sempre ditado pelo frontend (#a2c89d02): ignoramos
      // `agent.position` do adapter. A decisão de layout depende de canvas
      // size, N agentes, meeting zone bounds e escala dinâmica — tudo
      // conhecido aqui, nada disso no adapter. Sem isso, sessões do
      // Claude Local entregavam coords circulares (`centerX=400, radius=200`
      // em `buildAgentList`) que bypassavam o grid e causavam labels
      // sobrepostos intermitentes ao trocar de sessão.
      const agentPos = { x: slot.agentX, y: slot.agentY };

      const textureKey = `agent_${agent.id}`;
      if (!generateAgentTexture(this, textureKey, color)) return false;
      generateWalkTexture(this, `${textureKey}_walk`, color);

      // 1. Mesa individual (atrás do agente, spawnada antes para ficar em
      // ordem Z correta: agent.depth > desk.depth).
      const desk = new OfficeDesk(this, slot.deskX, slot.deskY, {
        state: 'occupied',
        highlightColor: color,
      });
      if (layout.scale < 1) desk.setScale(layout.scale);
      // Mesa ATRÁS do agente no eixo Z (#ee71e889): agente fica logo abaixo
      // da mesa e sua cabeça cobre a base da mesa. Depth da mesa = agentY - 2
      // para ficar imediatamente atrás do sprite do agente (que fica em
      // agentY).
      desk.setDepth(slot.agentY - 2);
      this.deskSprites.set(agent.id, desk);

      // 2. Sprite do agente (em `deskY + 16`, ~16px abaixo da mesa)
      const sprite = new AgentSprite(
        this,
        agentPos.x, agentPos.y,
        agent.id,
        agent.name,
        color,
        textureKey,
      );
      if (layout.scale < 1) sprite.setScale(layout.scale);
      sprite.setDepth(agentPos.y);
      this.agentSprites.set(agent.id, sprite);
      this.positionIndex++;

      // Sincroniza posição com o store (labels HTML e overlay)
      theaterStore.getState().updateAgentPosition(agent.id, agentPos);

      // Relayout geral se o grid mudou (novo agente pode ter alterado scale
      // ou a distribuição de colunas/linhas)
      if (this.agentSprites.size > 1) {
        this.relayoutAgents();
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reposiciona todos os agentes + suas mesas individuais quando o grid muda
   * (mais agentes entraram, scale alterado). Tween em paralelo em cada par.
   *
   * Defesa em profundidade (#a33f5faa): se há animação em vôo (`processing`
   * true), o relayout é adiado via `pendingRelayout` e drenado no
   * `onComplete` da animação. Sem isso, um `addAgent` on-demand para o
   * lead faltante no meio de um `animateConversation` cancelaria o tween
   * do source/target que estão indo para S1/S4.
   */
  private relayoutAgents(): void {
    if (this.processing) {
      this.pendingRelayout = true;
      return;
    }
    this.pendingRelayout = false;

    const agentIds = Array.from(this.agentSprites.keys());
    const layout = calculateLayout(agentIds.length);

    agentIds.forEach((id, index) => {
      const sprite = this.agentSprites.get(id);
      const desk = this.deskSprites.get(id);
      if (!sprite) return;

      const slot = layout.slots[index];
      if (!slot) return;

      sprite.setScale(layout.scale);
      desk?.setScale(layout.scale);

      const targetAgent = { x: slot.agentX, y: slot.agentY };
      const targetDesk = { x: slot.deskX, y: slot.deskY };

      if (Math.abs(sprite.x - targetAgent.x) > 2 || Math.abs(sprite.y - targetAgent.y) > 2) {
        this.tweens.add({
          targets: sprite,
          x: targetAgent.x,
          y: targetAgent.y,
          duration: 300,
          ease: 'Power2',
          onUpdate: () => {
            sprite.setDepth(sprite.y);
            theaterStore.getState().updateAgentPosition(id, { x: sprite.x, y: sprite.y });
          },
        });
      }

      if (desk && (Math.abs(desk.x - targetDesk.x) > 2 || Math.abs(desk.y - targetDesk.y) > 2)) {
        this.tweens.add({
          targets: desk,
          x: targetDesk.x,
          y: targetDesk.y,
          duration: 300,
          ease: 'Power2',
          onUpdate: () => {
            // Mesmo raciocínio do spawn (#ee71e889): mesa atrás do agente.
            // `agentY = desk.y + 16`, então `desk.depth = agentY - 2 = desk.y + 14`.
            desk.setDepth(desk.y + 14);
          },
        });
      }
    });
  }

  /** Remove sprite do agente + sua mesa individual */
  private removeAgentSprite(agentId: string): void {
    const sprite = this.agentSprites.get(agentId);
    if (sprite) {
      sprite.destroy();
      this.agentSprites.delete(agentId);
    }
    const desk = this.deskSprites.get(agentId);
    if (desk) {
      desk.destroy();
      this.deskSprites.delete(agentId);
    }
  }

  // ---------------------------------------------------------------------------
  // Processamento de eventos (fila de animação)
  // ---------------------------------------------------------------------------

  /**
   * Processa o evento na posição do cursor (`activeEventId`).
   *
   * Regras de cursor (#c3eb2ea5):
   *  - `activeEventId` é a ÚNICA fonte de verdade. Scene não mantém índice.
   *  - Quando o user clica num evento passado (`selectEvent`), o cursor vai
   *    para lá e o playback é pausado. O próximo Play reanima a partir daí.
   *  - Em modo Play: ao terminar de animar `events[cursor]`, avança o cursor
   *    para `events[cursor + 1]`. Se `cursor` já é o último, para e aguarda.
   *  - `lastAnimatedEventId` distingue "cursor recém-movido (preciso animar)"
   *    de "cursor já animado, só parado no tail". Quando um evento novo chega
   *    enquanto estamos parados no tail, este handler é chamado pelo subscribe
   *    e avança o cursor para o novo evento sem re-animar o último.
   */
  private processEventQueue(): void {
    if (this.processing) return;

    const state = theaterStore.getState();
    if (!state.playback.playing) return;
    if (state.activeEventId === null) return;

    const cursor = state.events.findIndex((e) => e.id === state.activeEventId);
    if (cursor < 0) return;

    // Cursor atual já animado — estávamos parados no tail e algo chamou
    // processEventQueue de novo (ex. pushEvent de um evento novo). Avança
    // o cursor em vez de re-animar.
    if (this.lastAnimatedEventId === state.activeEventId) {
      const nextIdx = cursor + 1;
      if (nextIdx >= state.events.length) return;
      theaterStore.getState().setActiveEvent(state.events[nextIdx].id);
      return; // subscribe vai chamar processEventQueue de novo com cursor movido
    }

    const event = state.events[cursor];
    this.processing = true;

    this.animateEvent(event, () => {
      this.processing = false;
      this.lastAnimatedEventId = event.id;

      // Drena qualquer relayout adiado enquanto a animação rodava (#a33f5faa).
      // Agora os sprites estão em suas posições originais, então reorganizar
      // o grid não cancela tweens em vôo.
      if (this.pendingRelayout) {
        this.relayoutAgents();
      }

      // Re-ler estado — `playing` pode ter sido pausado durante a animação,
      // ou o user pode ter clicado em outro evento (cursor mudou enquanto
      // animávamos; o subscribe vai nos chamar de novo no próximo tick).
      const after = theaterStore.getState();
      if (!after.playback.playing) return;
      if (after.activeEventId !== event.id) return;

      const nextCursor = cursor + 1;
      if (nextCursor >= after.events.length) {
        // Fim do buffer. Cursor fica no último animado; pushEvent de um
        // evento futuro dispara subscribe → processEventQueue → branch
        // `lastAnimatedEventId === activeEventId` avança sem re-animar.
        return;
      }

      const speed = after.playback.speed;
      const delay = Math.max(100, 300 / speed);
      this.time.delayedCall(delay, () => {
        theaterStore.getState().setActiveEvent(after.events[nextCursor].id);
      });
    });
  }

  /** Anima um evento individual no palco */
  private animateEvent(event: TheaterEvent, onComplete: () => void): void {
    const sourceSprite = this.agentSprites.get(event.sourceAgent.id);
    const targetSprite = event.targetAgent
      ? this.agentSprites.get(event.targetAgent.id)
      : null;

    // Se não encontrar o sprite do emissor, criar sob demanda
    if (!sourceSprite) {
      theaterStore.getState().addAgent(event.sourceAgent);
      this.time.delayedCall(50, () => this.animateEvent(event, onComplete));
      return;
    }

    // Mesmo tratamento para o destinatário em eventos de mensagem: se o target
    // ainda não tem sprite (ex.: adapter emitiu `MESSAGE_SENT` antes do
    // `AGENT_JOINED` correspondente, ou o target foi criado com id diferente
    // do que o store recebeu no AgentInfo), spawna on-demand e tenta de novo.
    // Sem isso a chamada caía em `animateSimpleEvent` e a animação de reunião
    // nunca disparava (#73ad746c).
    if (this.isMessageEvent(event) && event.targetAgent && !targetSprite) {
      theaterStore.getState().addAgent(event.targetAgent);
      this.time.delayedCall(50, () => this.animateEvent(event, onComplete));
      return;
    }

    const speed = theaterStore.getState().playback.speed;

    // Eventos de mensagem: dois caminhos.
    //  - Mensagem direta (targetAgent não-nulo) → `animateConversation`,
    //    ambos agentes se encontram nos slots S1/S4 da mesa de reunião.
    //  - Broadcast (targetAgent null) → `animateBroadcast`, apenas o emissor
    //    caminha até o centro da mesa, fala, volta. Comunica "falando pro
    //    time todo" sem puxar 20 agentes pra mesa ao mesmo tempo (#a33f5faa).
    if (this.isMessageEvent(event)) {
      if (targetSprite) {
        this.animateConversation(sourceSprite, targetSprite, event, speed, onComplete);
      } else {
        this.animateBroadcast(sourceSprite, event, speed, onComplete);
      }
    } else {
      this.animateSimpleEvent(sourceSprite, event, speed, onComplete);
    }
  }

  /** Verifica se o evento é de comunicação (mensagem) */
  private isMessageEvent(event: TheaterEvent): boolean {
    return (
      event.eventType === EventType.MESSAGE_SENT ||
      event.eventType === EventType.MESSAGE_RECEIVED
    );
  }

  /**
   * Animação de conversa com encontro na mesa de reunião isolada
   * (spec UX #b35c9591 §4). Ambos agentes caminham em paralelo até seus
   * slots (S1 para emissor, S4 para destinatário — diagonal frente a frente),
   * o emissor fala, e ambos retornam às mesas individuais também em paralelo.
   * Mesas individuais entram em `away` enquanto o agente está fora.
   */
  private animateConversation(
    source: AgentSprite,
    target: AgentSprite,
    event: TheaterEvent,
    speed: number,
    onComplete: () => void,
  ): void {
    const sourceOriginalPos = { x: source.x, y: source.y };
    const targetOriginalPos = { x: target.x, y: target.y };
    const moveSpeed = MOVE_SPEED * speed;

    const seats = getMeetingSeatPositions(MEETING_TABLE_POS.x, MEETING_TABLE_POS.y, 2);
    const sourceSeat = seats[0]; // S1
    const targetSeat = seats[1]; // S4

    // Estados iniciais: ambos em active; mesas entram em standby.
    source.setState('active');
    target.setState('active');
    this.deskSprites.get(source.agentId)?.setDeskState('away');
    this.deskSprites.get(target.agentId)?.setDeskState('away');

    this.time.delayedCall(200 / speed, () => {
      source.setState('moving');
      target.setState('moving');

      // Caminham em paralelo até os slots; o speak só dispara quando ambos
      // chegaram (counter de dois onComplete faz o papel de Promise.all).
      let arrived = 0;
      const onArrive = () => {
        arrived++;
        if (arrived < 2) return;

        source.setDepth(sourceSeat.y);
        target.setDepth(targetSeat.y);

        source.setState('speaking');
        source.speak(event.summary);
        target.setState('waiting');

        const bubbleDuration = Math.max(2000, Math.min(5000, event.summary.length * 40)) / speed;

        this.time.delayedCall(bubbleDuration, () => {
          source.hideSpeech();
          source.setState('moving');
          target.setState('moving');

          // Retornam em paralelo às mesas individuais; onComplete da cena é
          // chamado quando os dois terminaram a caminhada de volta.
          let returned = 0;
          const onReturn = () => {
            returned++;
            if (returned < 2) return;
            source.setDepth(sourceOriginalPos.y);
            target.setDepth(targetOriginalPos.y);
            source.setState('idle');
            target.setState('idle');
            this.deskSprites.get(source.agentId)?.setDeskState('occupied');
            this.deskSprites.get(target.agentId)?.setDeskState('occupied');
            onComplete();
          };

          source.moveTo(sourceOriginalPos.x, sourceOriginalPos.y, moveSpeed, onReturn);
          target.moveTo(targetOriginalPos.x, targetOriginalPos.y, moveSpeed, onReturn);
        });
      };

      source.moveTo(sourceSeat.x, sourceSeat.y, moveSpeed, onArrive);
      target.moveTo(targetSeat.x, targetSeat.y, moveSpeed, onArrive);
    });
  }

  /**
   * Animação de mensagem broadcast (`MESSAGE_SENT` com `targetAgent == null`,
   * #a33f5faa). Um único agente — tipicamente o lead — caminha até um ponto
   * em frente à mesa de reunião, fala, e volta à sua mesa individual.
   *
   * Diferença visual-chave em relação a `animateConversation`:
   *  - Apenas 1 sprite se move (não há `target`).
   *  - O destino é o "center stage" (x = mesa, y = mesa + 60), NÃO um slot S*.
   *    Comunica "falando pro time todo" em vez de "conversa entre dois".
   *  - Mesa individual do source entra em `away` durante a fala; volta a
   *    `occupied` quando ele retorna.
   */
  private animateBroadcast(
    source: AgentSprite,
    event: TheaterEvent,
    speed: number,
    onComplete: () => void,
  ): void {
    const originalPos = { x: source.x, y: source.y };
    const moveSpeed = MOVE_SPEED * speed;
    const centerPos = {
      x: MEETING_TABLE_POS.x,
      y: MEETING_TABLE_POS.y + 60,
    };

    source.setState('active');
    this.deskSprites.get(source.agentId)?.setDeskState('away');

    this.time.delayedCall(200 / speed, () => {
      source.setState('moving');

      source.moveTo(centerPos.x, centerPos.y, moveSpeed, () => {
        source.setDepth(centerPos.y);
        source.setState('speaking');
        source.speak(event.summary);

        const bubbleDuration = Math.max(2000, Math.min(5000, event.summary.length * 40)) / speed;

        this.time.delayedCall(bubbleDuration, () => {
          source.hideSpeech();
          source.setState('moving');

          source.moveTo(originalPos.x, originalPos.y, moveSpeed, () => {
            source.setDepth(originalPos.y);
            source.setState('idle');
            this.deskSprites.get(source.agentId)?.setDeskState('occupied');
            onComplete();
          });
        });
      });
    });
  }

  /** Animação simples: estado + balão, sem movimentação */
  private animateSimpleEvent(
    source: AgentSprite,
    event: TheaterEvent,
    speed: number,
    onComplete: () => void,
  ): void {
    const stateMap: Partial<Record<EventType, AgentState>> = {
      [EventType.TOOL_CALL]: 'active',
      [EventType.TOOL_RESULT]: 'completed',
      [EventType.THINKING]: 'thinking',
      [EventType.ERROR]: 'error',
      [EventType.STATUS_CHANGE]: 'active',
      [EventType.AGENT_JOINED]: 'active',
      [EventType.AGENT_LEFT]: 'idle',
    };

    const newState = stateMap[event.eventType] ?? 'active';
    source.setState(newState);

    if (event.summary) {
      source.speak(event.summary);
    }

    const duration = Math.max(1500, Math.min(3000, event.summary.length * 30)) / speed;

    this.time.delayedCall(duration, () => {
      source.hideSpeech();
      source.setState('idle');
      onComplete();
    });
  }
}
