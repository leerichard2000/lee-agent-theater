/**
 * Área do palco — canvas Phaser 3 ou estado vazio.
 *
 * Renderiza o canvas Phaser quando há agentes ou sessão ativa.
 * Exibe estado vazio quando não há conexão.
 * Integra indicador de pause sobre o canvas.
 */

import { useTheaterStore } from '../stores/theaterStore.js';
import { PhaserGame } from './PhaserGame.js';
import { AgentLabels } from './AgentLabels.js';

export function StagePlaceholder() {
  const sessionId = useTheaterStore((s) => s.sessionId);
  const isPlaying = useTheaterStore((s) => s.playback.playing);
  const agentsCount = useTheaterStore((s) => Object.keys(s.agents).length);

  return (
    <div className="relative w-full h-full bg-[#0A0A14] overflow-hidden">
      {/* Canvas Phaser (sempre montado para receber eventos) */}
      <PhaserGame />

      {/* Labels HTML e baloes de fala sobre o canvas */}
      <AgentLabels />

      {/* Overlay de estado vazio (quando sem sessão e sem agentes) */}
      {!sessionId && agentsCount === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center">
            <p
              className="text-lg mb-2 text-[#555570]"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              Nenhum adapter conectado
            </p>
            <p className="text-sm text-[#555570]">
              Ative o modo demo para ver os agentes em acao
            </p>
          </div>
        </div>
      )}

      {/* Indicador de pause (canto superior direito, semi-transparente) */}
      {!isPlaying && (
        <div
          className="absolute top-3 right-3 text-[#F1C40F] opacity-50 z-10 pointer-events-none"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
          aria-hidden="true"
        >
          PAUSADO
        </div>
      )}
    </div>
  );
}
