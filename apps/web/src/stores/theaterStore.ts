/**
 * Zustand vanilla store — ponte bidirecional React <-> Phaser.
 *
 * Usa createStore (vanilla) para ser acessível tanto por componentes React
 * (via useTheaterStore hook) quanto por Scenes Phaser (via getState/subscribe).
 *
 * Inclui estado de UI do painel lateral: filtros, scroll, controles de reprodução.
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type {
  AgentInfo,
  AgentState,
  AgentPosition,
  TheaterEvent,
  SessionState,
  EventType,
} from '@theater/core';

// ---------------------------------------------------------------------------
// Cores padrão dos agentes (spec UX #e4d80b5e)
// ---------------------------------------------------------------------------

const AGENT_COLORS = [
  '#4169E1', // Azul royal
  '#2ECC71', // Verde esmeralda
  '#E67E22', // Laranja
  '#9B59B6', // Roxo
  '#E74C3C', // Vermelho coral
  '#1ABC9C', // Ciano
  '#E91E90', // Rosa
  '#F1C40F', // Amarelo
] as const;

// ---------------------------------------------------------------------------
// Tipos do store
// ---------------------------------------------------------------------------

/** Direção na qual o balão de fala aparece em relação ao sprite */
export type SpeechDirection = 'top' | 'left' | 'right';

/** Agente enriquecido com posição e estado para o palco */
export interface StageAgent extends Required<Pick<AgentInfo, 'id' | 'name' | 'color'>> {
  role: string;
  position: AgentPosition;
  state: AgentState;
  targetPosition?: AgentPosition;
  /** Texto do balão de fala ativo */
  speechText?: string;
  /** Direção em que o balão é renderizado — sorteada por conversação */
  speechDirection?: SpeechDirection;
}

/** Evento na fila de animação */
export interface AnimationQueueItem {
  event: TheaterEvent;
  processed: boolean;
}

/** Estado de conexão WebSocket */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/** Estado de playback */
export interface PlaybackState {
  playing: boolean;
  speed: number;
}

/** Velocidades de reprodução disponíveis */
export type PlaybackSpeed = 0.5 | 1 | 2 | 4;

/** Filtros ativos no painel lateral */
export interface EventFilters {
  agentIds: string[];
  eventTypes: EventType[];
}

/** Info resumida de uma sessão disponível (vinda de GET /api/status) */
export interface SessionSummary {
  id: string;
  name: string;
  status: string;
  agentCount: number;
  eventCount: number;
  startedAt: string;
}

export interface TheaterState {
  // Agentes no palco
  agents: Record<string, StageAgent>;

  // Fila de eventos para animação
  eventQueue: AnimationQueueItem[];

  // Histórico de todos os eventos recebidos
  events: TheaterEvent[];

  // Sessão ativa
  sessionId: string | null;
  sessionName: string | null;
  sessionStatus: string | null;

  // Sessões disponíveis no server
  availableSessions: SessionSummary[];

  // Status de conexão
  connectionStatus: ConnectionStatus;

  // Controles de playback
  playback: PlaybackState;

  // Evento atualmente sendo animado
  activeEventId: string | null;

  // Flag de carregamento do histórico completo via REST (#9aa38f38)
  historyLoading: boolean;

  // --- UI do painel lateral ---
  filters: EventFilters;
  userScrolledUp: boolean;
  newEventsCount: number;
  sidePanelCollapsed: boolean;

  // --- Ações: Agentes ---
  addAgent: (agent: AgentInfo) => void;
  removeAgent: (agentId: string) => void;
  updateAgentState: (agentId: string, state: AgentState) => void;
  updateAgentPosition: (agentId: string, position: AgentPosition) => void;
  setAgentSpeech: (agentId: string, text: string | undefined) => void;

  // --- Ações: Eventos ---
  pushEvent: (event: TheaterEvent) => void;
  markEventProcessed: (eventId: string) => void;
  setActiveEvent: (eventId: string | null) => void;
  /**
   * Seleciona um evento na timeline para virar o "cursor" do replay.
   * Pausa o playback automaticamente: o user que agora apertar Play vai
   * ver a cena reanimar a partir deste evento (e não do fim da fila).
   */
  selectEvent: (eventId: string) => void;
  /**
   * Popula o histórico completo de uma sessão (vindo do REST `/api/events`).
   * Substitui `events` inteiro, dedup por id, posiciona cursor no último
   * evento (modo live tail). Chamado pelo wsService ao conectar/trocar
   * sessão antes do WS começar a empurrar eventos novos (#9aa38f38).
   */
  loadHistory: (events: TheaterEvent[]) => void;
  setHistoryLoading: (loading: boolean) => void;

  // --- Ações: Sessão ---
  setSessionId: (sessionId: string | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  loadSessionState: (session: SessionState) => void;
  setAvailableSessions: (sessions: SessionSummary[]) => void;

  // --- Ações: Playback ---
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
  togglePlayback: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  goToFirst: () => void;
  goToLast: () => void;

  // --- Ações: Filtros ---
  setAgentFilter: (agentIds: string[]) => void;
  setEventTypeFilter: (types: EventType[]) => void;
  clearFilters: () => void;

  // --- Ações: UI ---
  setUserScrolledUp: (value: boolean) => void;
  resetNewEventsCount: () => void;
  toggleSidePanel: () => void;

  // --- Seletores ---
  filteredEvents: () => TheaterEvent[];

  // --- Reset ---
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Posições-base dos agentes no palco (spec UX: grid 2x4)
// Coordenadas em pixels na resolução interna (480x270)
// ---------------------------------------------------------------------------

const BASE_POSITIONS: AgentPosition[] = [
  { x: 80, y: 80 },
  { x: 190, y: 80 },
  { x: 290, y: 80 },
  { x: 400, y: 80 },
  { x: 80, y: 190 },
  { x: 190, y: 190 },
  { x: 290, y: 190 },
  { x: 400, y: 190 },
];

// ---------------------------------------------------------------------------
// Sorteio de direcao do balao de fala
// ---------------------------------------------------------------------------

/**
 * Limites em coords Phaser (GAME_WIDTH=960, GAME_HEIGHT=540) para filtrar
 * direcoes que fariam o balao sair do palco. Margens estimadas para balao
 * tipico: ~260px horizontais (balao max-width ~240 + gap), ~110px verticais.
 */
const BUBBLE_EDGE_MARGIN_X = 140;
const BUBBLE_EDGE_MARGIN_Y = 110;
const STAGE_WIDTH_PHASER = 960;

/**
 * Sorteia direcao do balao filtrando opcoes que cortariam nas bordas do palco.
 * Fallback: se todas sao invalidas (agente muito preso no canto), usa 'top'.
 */
function pickSpeechDirection(pos: AgentPosition): SpeechDirection {
  const viable: SpeechDirection[] = [];
  if (pos.y > BUBBLE_EDGE_MARGIN_Y) viable.push('top');
  if (pos.x > BUBBLE_EDGE_MARGIN_X) viable.push('left');
  if (pos.x < STAGE_WIDTH_PHASER - BUBBLE_EDGE_MARGIN_X) viable.push('right');
  if (viable.length === 0) return 'top';
  return viable[Math.floor(Math.random() * viable.length)];
}

/** Atribui posição e cor padrão a um agente */
function enrichAgent(agent: AgentInfo, index: number): StageAgent {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role ?? 'agent',
    color: agent.color ?? AGENT_COLORS[index % AGENT_COLORS.length],
    position: agent.position ?? BASE_POSITIONS[index % BASE_POSITIONS.length],
    state: agent.state ?? 'idle',
  };
}

// ---------------------------------------------------------------------------
// Estado inicial
// ---------------------------------------------------------------------------

const initialState = {
  agents: {} as Record<string, StageAgent>,
  eventQueue: [] as AnimationQueueItem[],
  events: [] as TheaterEvent[],
  sessionId: null as string | null,
  sessionName: null as string | null,
  sessionStatus: null as string | null,
  availableSessions: [] as SessionSummary[],
  connectionStatus: 'disconnected' as ConnectionStatus,
  playback: { playing: true, speed: 1 },
  activeEventId: null as string | null,
  historyLoading: false,
  filters: { agentIds: [], eventTypes: [] } as EventFilters,
  userScrolledUp: false,
  newEventsCount: 0,
  sidePanelCollapsed: false,
};

// ---------------------------------------------------------------------------
// Store vanilla — acessível de qualquer lugar
// ---------------------------------------------------------------------------

export const theaterStore = createStore<TheaterState>()((set, get) => ({
  ...initialState,

  // --- Agentes ---
  addAgent: (agent) =>
    set((s) => {
      const index = Object.keys(s.agents).length;
      return {
        agents: { ...s.agents, [agent.id]: enrichAgent(agent, index) },
      };
    }),

  removeAgent: (agentId) =>
    set((s) => {
      const { [agentId]: _, ...rest } = s.agents;
      return { agents: rest };
    }),

  updateAgentState: (agentId, state) =>
    set((s) => {
      const agent = s.agents[agentId];
      if (!agent) return s;
      return {
        agents: { ...s.agents, [agentId]: { ...agent, state } },
      };
    }),

  updateAgentPosition: (agentId, position) =>
    set((s) => {
      const agent = s.agents[agentId];
      if (!agent) return s;
      return {
        agents: { ...s.agents, [agentId]: { ...agent, position } },
      };
    }),

  setAgentSpeech: (agentId, text) =>
    set((s) => {
      const agent = s.agents[agentId];
      if (!agent) return s;

      // Mantem direcao estavel durante a conversa (speechText truthy): sorteia
      // apenas na transicao falsy -> truthy; quando o texto some, limpa a
      // direcao para que a proxima fala sorteie novamente.
      const wasSpeaking = !!agent.speechText && agent.speechText.trim().length > 0;
      const willSpeak = typeof text === 'string' && text.trim().length > 0;
      let speechDirection = agent.speechDirection;
      if (willSpeak && !wasSpeaking) {
        speechDirection = pickSpeechDirection(agent.position);
      } else if (!willSpeak) {
        speechDirection = undefined;
      }

      return {
        agents: {
          ...s.agents,
          [agentId]: { ...agent, speechText: text, speechDirection },
        },
      };
    }),

  // --- Eventos ---
  pushEvent: (event) =>
    set((s) => {
      // Dedup por id: se o evento já veio no fetch inicial do histórico
      // (#9aa38f38) e chega de novo via WS (race rara na hora da subscribe),
      // ignora. `events[]` fica sempre com id único.
      if (s.events.some((e) => e.id === event.id)) return s;
      const events = [...s.events, event];
      // `activeEventId` é o cursor do replay. Eventos novos chegando via WS
      // NÃO devem puxar o cursor pro fim — senão o user perde a seleção
      // quando está revendo histórico (#c3eb2ea5). Inicializa só na primeira
      // vez (quando ainda não havia nenhum evento). O processamento da cena
      // continua via `processEventQueue` varrendo `events[]` sequencialmente.
      return {
        events,
        eventQueue: [...s.eventQueue, { event, processed: false }],
        activeEventId: s.activeEventId ?? event.id,
        newEventsCount: s.userScrolledUp ? s.newEventsCount + 1 : 0,
      };
    }),

  markEventProcessed: (eventId) =>
    set((s) => ({
      eventQueue: s.eventQueue.map((item) =>
        item.event.id === eventId ? { ...item, processed: true } : item,
      ),
    })),

  setActiveEvent: (eventId) => set({ activeEventId: eventId }),

  selectEvent: (eventId) =>
    set((s) => ({
      activeEventId: eventId,
      playback: { ...s.playback, playing: false },
    })),

  loadHistory: (historyEvents) =>
    set(() => {
      // Substitui `events[]` inteiro (cenário: carregar sessão limpa ou
      // trocar de sessão). Dedup defensivo mesmo vindo do REST — o server
      // usa o mesmo id por evento, então duplicatas só aconteceriam em bugs.
      const seen = new Set<string>();
      const events: TheaterEvent[] = [];
      for (const e of historyEvents) {
        if (seen.has(e.id)) continue;
        seen.add(e.id);
        events.push(e);
      }
      // Cursor posicionado no último evento (live tail): o user vê todos os
      // eventos no painel e, ao apertar Play, a cena reanima o estado final.
      // `processEventQueue` só anima eventos cujo `activeEventId` passa pelo
      // branch "precisa animar" — como setamos o cursor no último, ninguém
      // é reanimado automaticamente (o comportamento é equivalente a estar
      // parado no tail pós-animação).
      const lastEventId = events.length > 0 ? events[events.length - 1].id : null;
      return {
        events,
        eventQueue: events.map((event) => ({ event, processed: true })),
        activeEventId: lastEventId,
        newEventsCount: 0,
      };
    }),

  setHistoryLoading: (historyLoading) => set({ historyLoading }),

  // --- Sessão ---
  setSessionId: (sessionId) => set({ sessionId }),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setAvailableSessions: (availableSessions) => set({ availableSessions }),

  loadSessionState: (session) =>
    set((s) => {
      const agents: Record<string, StageAgent> = {};
      let index = 0;
      for (const [id, info] of Object.entries(session.agents)) {
        agents[id] = enrichAgent(info, index++);
      }
      // Preserva `activeEventId` se já foi populado pelo `loadHistory`
      // (fetch REST antes do subscribe, #9aa38f38). Caso contrário,
      // posiciona no último evento (tail live).
      const lastEventId =
        session.events.length > 0
          ? session.events[session.events.length - 1].id
          : null;
      const activeEventId = s.activeEventId ?? lastEventId;
      return {
        sessionId: session.id,
        sessionName: session.name,
        sessionStatus: session.status,
        agents,
        events: session.events,
        eventQueue: session.events.map((e) => ({ event: e, processed: true })),
        activeEventId,
      };
    }),

  // --- Playback ---
  setPlaying: (playing) =>
    set((s) => ({ playback: { ...s.playback, playing } })),

  setSpeed: (speed) =>
    set((s) => ({ playback: { ...s.playback, speed } })),

  togglePlayback: () =>
    set((s) => ({ playback: { ...s.playback, playing: !s.playback.playing } })),

  stepForward: () => {
    const s = get();
    const filtered = s.filteredEvents();
    const currentIdx = s.activeEventId
      ? filtered.findIndex((e) => e.id === s.activeEventId)
      : -1;
    const nextIdx = Math.min(currentIdx + 1, filtered.length - 1);
    const nextEvent = filtered[nextIdx];
    if (nextEvent) {
      set({
        activeEventId: nextEvent.id,
        playback: { ...s.playback, playing: false },
      });
    }
  },

  stepBackward: () => {
    const s = get();
    const filtered = s.filteredEvents();
    const currentIdx = s.activeEventId
      ? filtered.findIndex((e) => e.id === s.activeEventId)
      : filtered.length;
    const prevIdx = Math.max(currentIdx - 1, 0);
    const prevEvent = filtered[prevIdx];
    if (prevEvent) {
      set({
        activeEventId: prevEvent.id,
        playback: { ...s.playback, playing: false },
      });
    }
  },

  goToFirst: () => {
    const s = get();
    const filtered = s.filteredEvents();
    const first = filtered[0];
    if (first) {
      set({
        activeEventId: first.id,
        playback: { ...s.playback, playing: false },
      });
    }
  },

  goToLast: () => {
    const s = get();
    const filtered = s.filteredEvents();
    const last = filtered[filtered.length - 1];
    if (last) {
      set({
        activeEventId: last.id,
        playback: { ...s.playback, playing: false },
      });
    }
  },

  // --- Filtros ---
  setAgentFilter: (agentIds) =>
    set((s) => ({ filters: { ...s.filters, agentIds } })),

  setEventTypeFilter: (eventTypes) =>
    set((s) => ({ filters: { ...s.filters, eventTypes } })),

  clearFilters: () =>
    set({ filters: { agentIds: [], eventTypes: [] } }),

  // --- UI ---
  setUserScrolledUp: (userScrolledUp) => set({ userScrolledUp }),
  resetNewEventsCount: () => set({ newEventsCount: 0 }),
  toggleSidePanel: () =>
    set((s) => ({ sidePanelCollapsed: !s.sidePanelCollapsed })),

  // --- Seletores ---
  filteredEvents: () => {
    const { events, filters } = get();
    return events.filter((event) => {
      if (filters.agentIds.length > 0) {
        const matchesSource = filters.agentIds.includes(event.sourceAgent.id);
        const matchesTarget =
          event.targetAgent && filters.agentIds.includes(event.targetAgent.id);
        if (!matchesSource && !matchesTarget) return false;
      }
      if (filters.eventTypes.length > 0) {
        if (!filters.eventTypes.includes(event.eventType)) return false;
      }
      return true;
    });
  },

  // --- Reset ---
  reset: () => set(initialState),
}));

// ---------------------------------------------------------------------------
// Hook React — para componentes de UI
// ---------------------------------------------------------------------------

export function useTheaterStore<T>(selector: (state: TheaterState) => T): T {
  return useStore(theaterStore, selector);
}
