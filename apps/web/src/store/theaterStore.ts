/**
 * Re-export adaptado do store vanilla consolidado.
 *
 * Expõe a API esperada pelos componentes de UI (TheaterLayout, PlaybackControls,
 * HistoryPanel, SessionHeader, EventCard) que importam de '../store/theaterStore.js',
 * enquanto o store real vive em '../stores/theaterStore.ts' (vanilla, usado
 * também pelo Phaser e WebSocket).
 */

export {
  theaterStore,
  useTheaterStore,
  type TheaterState,
  type StageAgent,
  type AnimationQueueItem,
  type ConnectionStatus,
  type PlaybackState,
  type PlaybackSpeed,
  type EventFilters,
  type SessionSummary,
} from '../stores/theaterStore.js';
