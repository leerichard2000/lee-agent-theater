/**
 * Barra de controles de reprodução fixa no rodapé.
 *
 * Play/Pause, step forward/backward, seleção de velocidade,
 * status de conexão e atalhos de teclado.
 * Segue spec UX seção 7.
 */

import { useEffect, useCallback } from 'react';
import { useTheaterStore, type PlaybackSpeed } from '../stores/theaterStore.js';

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 2, 4];

const SPEED_LABELS: Record<PlaybackSpeed, string> = {
  0.5: '0.5x',
  1: '1x',
  2: '2x',
  4: '4x',
};

// Mapeamento de atalho → velocidade
const SPEED_KEYS: Record<string, PlaybackSpeed> = {
  '1': 0.5,
  '2': 1,
  '3': 2,
  '4': 4,
};

// ---------------------------------------------------------------------------
// Componente de indicador de conexão
// ---------------------------------------------------------------------------

function ConnectionIndicator() {
  const status = useTheaterStore((s) => s.connectionStatus);

  const config = {
    connected: { color: 'bg-[#2ECC71]', label: 'Conectado' },
    connecting: { color: 'bg-[#F1C40F]', label: 'Conectando...' },
    reconnecting: { color: 'bg-[#F1C40F]', label: 'Reconectando...' },
    disconnected: { color: 'bg-[#E74C3C]', label: 'Desconectado' },
  }[status];

  return (
    <div
      className="flex items-center gap-1.5"
      title={config.label}
      aria-live="polite"
      aria-label={`Status da conexão: ${config.label}`}
    >
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${config.color}`}
        aria-hidden="true"
      />
      <span className="text-xs text-[#8888AA] hidden sm:inline">
        {config.label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function PlaybackControls() {
  const isPlaying = useTheaterStore((s) => s.playback.playing);
  const playbackSpeed = useTheaterStore((s) => s.playback.speed);
  const togglePlayback = useTheaterStore((s) => s.togglePlayback);
  const setSpeed = useTheaterStore((s) => s.setSpeed);
  const stepForward = useTheaterStore((s) => s.stepForward);
  const stepBackward = useTheaterStore((s) => s.stepBackward);
  const goToFirst = useTheaterStore((s) => s.goToFirst);
  const goToLast = useTheaterStore((s) => s.goToLast);

  // Atalhos de teclado globais
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignorar quando foco está em input/select/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayback();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          stepBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          stepForward();
          break;
        case 'Home':
          e.preventDefault();
          goToFirst();
          break;
        case 'End':
          e.preventDefault();
          goToLast();
          break;
        default:
          if (e.key in SPEED_KEYS) {
            e.preventDefault();
            setSpeed(SPEED_KEYS[e.key]);
          }
          break;
      }
    },
    [togglePlayback, stepForward, stepBackward, goToFirst, goToLast, setSpeed]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex items-center gap-3 h-14 px-4 bg-[#0D0D1A] border-t border-[#2D2D44]">
      {/* Controles de navegação */}
      <div className="flex items-center gap-1">
        {/* Ir ao primeiro */}
        <button
          className="w-8 h-8 flex items-center justify-center text-[#E8E8F0] hover:text-[#4169E1] rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:ring-offset-1 focus:ring-offset-[#0D0D1A]"
          onClick={goToFirst}
          aria-label="Ir ao primeiro evento"
          title="Primeiro (Home)"
        >
          <span className="text-xs font-bold">|◀</span>
        </button>

        {/* Step backward */}
        <button
          className="w-8 h-8 flex items-center justify-center text-[#E8E8F0] hover:text-[#4169E1] rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:ring-offset-1 focus:ring-offset-[#0D0D1A]"
          onClick={stepBackward}
          aria-label="Evento anterior"
          title="Anterior (←)"
        >
          <span className="text-sm font-bold">◀◀</span>
        </button>

        {/* Play/Pause */}
        <button
          className="w-10 h-10 flex items-center justify-center bg-[#4169E1] hover:bg-[#5A7FE8] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:ring-offset-2 focus:ring-offset-[#0D0D1A]"
          onClick={togglePlayback}
          aria-label={isPlaying ? 'Pausar reprodução' : 'Iniciar reprodução'}
          title={isPlaying ? 'Pausar (Espaço)' : 'Play (Espaço)'}
        >
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <rect x="4" y="3" width="4" height="14" rx="1" />
              <rect x="12" y="3" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M5 3.5L16 10L5 16.5V3.5Z" />
            </svg>
          )}
        </button>

        {/* Step forward */}
        <button
          className="w-8 h-8 flex items-center justify-center text-[#E8E8F0] hover:text-[#4169E1] rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:ring-offset-1 focus:ring-offset-[#0D0D1A]"
          onClick={stepForward}
          aria-label="Próximo evento"
          title="Próximo (→)"
        >
          <span className="text-sm font-bold">▶▶</span>
        </button>

        {/* Ir ao último */}
        <button
          className="w-8 h-8 flex items-center justify-center text-[#E8E8F0] hover:text-[#4169E1] rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:ring-offset-1 focus:ring-offset-[#0D0D1A]"
          onClick={goToLast}
          aria-label="Ir ao último evento"
          title="Último (End)"
        >
          <span className="text-xs font-bold">▶|</span>
        </button>
      </div>

      {/* Separador */}
      <div className="w-px h-8 bg-[#2D2D44]" aria-hidden="true" />

      {/* Velocidade */}
      <div className="flex items-center gap-1" role="group" aria-label="Velocidade de reprodução">
        <span className="text-xs text-[#8888AA] mr-1">Vel:</span>
        {SPEEDS.map((speed, index) => (
          <button
            key={speed}
            className={`
              px-2.5 py-1 text-xs rounded-full transition-colors
              focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:ring-offset-1 focus:ring-offset-[#0D0D1A]
              ${
                playbackSpeed === speed
                  ? 'bg-[#4169E1] text-white font-semibold'
                  : 'border border-[#2D2D44] text-[#8888AA] hover:text-[#E8E8F0] hover:border-[#4169E1]'
              }
            `}
            onClick={() => setSpeed(speed)}
            aria-label={`Velocidade ${SPEED_LABELS[speed]}`}
            aria-pressed={playbackSpeed === speed}
            title={`${SPEED_LABELS[speed]} (${index + 1})`}
          >
            {SPEED_LABELS[speed]}
          </button>
        ))}
      </div>

      {/* Espaço flexível */}
      <div className="flex-1" />

      {/* Status de conexão */}
      <ConnectionIndicator />
    </div>
  );
}
