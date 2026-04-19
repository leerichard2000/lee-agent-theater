/**
 * Layout principal do Lee Agent Theater.
 *
 * Estrutura: Header + (Palco | Painel lateral) + Controles
 * Layout responsivo com Tailwind CSS: 70/30 desktop, colapsável em mobile.
 * Divisor arrastável entre palco e painel.
 * Segue spec UX seção 1.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTheaterStore } from '../stores/theaterStore.js';
import { SessionHeader } from './SessionHeader.js';
import { StagePlaceholder } from './StagePlaceholder.js';
import { HistoryPanel } from './HistoryPanel.js';
import { PlaybackControls } from './PlaybackControls.js';

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Largura mínima do palco em pixels */
const MIN_STAGE_WIDTH = 640;

/** Largura mínima do painel em pixels */
const MIN_PANEL_WIDTH = 320;

/** Porcentagem padrão do palco (desktop) */
const DEFAULT_STAGE_PERCENT = 70;

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function TheaterLayout() {
  const sidePanelCollapsed = useTheaterStore((s) => s.sidePanelCollapsed);
  const [stagePercent, setStagePercent] = useState(DEFAULT_STAGE_PERCENT);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handler de início de arraste do divisor
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    []
  );

  // Handler de movimento durante arraste
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalWidth = rect.width;
      const mouseX = e.clientX - rect.left;
      const percent = (mouseX / totalWidth) * 100;

      // Respeitar larguras mínimas
      const minStagePercent = (MIN_STAGE_WIDTH / totalWidth) * 100;
      const maxStagePercent = ((totalWidth - MIN_PANEL_WIDTH) / totalWidth) * 100;
      const clamped = Math.max(minStagePercent, Math.min(maxStagePercent, percent));

      setStagePercent(clamped);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="flex flex-col h-screen bg-[#0A0A14] text-[#E8E8F0]">
      {/* Header */}
      <SessionHeader />

      {/* Área principal: Palco + Painel */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden relative">
        {/* Palco */}
        <div
          className="h-full overflow-hidden"
          style={{
            width: sidePanelCollapsed ? '100%' : `${stagePercent}%`,
            minWidth: sidePanelCollapsed ? '100%' : `${MIN_STAGE_WIDTH}px`,
            transition: isDragging ? 'none' : 'width 0.2s ease',
          }}
        >
          <StagePlaceholder />
        </div>

        {/* Divisor arrastável */}
        {!sidePanelCollapsed && (
          <div
            className={`
              w-1 cursor-col-resize flex-shrink-0 relative z-10
              transition-colors duration-150
              ${isDragging ? 'bg-[#4169E1]' : 'bg-[#2D2D44] hover:bg-[#4169E1]'}
            `}
            onMouseDown={handleDragStart}
            role="separator"
            aria-orientation="vertical"
            aria-label="Redimensionar painel lateral"
            aria-valuenow={Math.round(stagePercent)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setStagePercent((p) => Math.max(30, p - 2));
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                setStagePercent((p) => Math.min(85, p + 2));
              }
            }}
          />
        )}

        {/* Painel lateral */}
        {!sidePanelCollapsed && (
          <div
            className="h-full overflow-hidden"
            style={{
              width: `${100 - stagePercent}%`,
              minWidth: `${MIN_PANEL_WIDTH}px`,
              transition: isDragging ? 'none' : 'width 0.2s ease',
            }}
          >
            <HistoryPanel />
          </div>
        )}
      </div>

      {/* Controles de reprodução */}
      <PlaybackControls />

      {/* Cursor override durante arraste */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize" aria-hidden="true" />
      )}
    </div>
  );
}
