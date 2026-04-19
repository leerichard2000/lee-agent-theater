/**
 * Header bar com informações da sessão ativa e seletor de sessão.
 *
 * Exibe logo, dropdown para trocar de sessão, status, contadores e botão de painel.
 * Segue spec UX seção 1 — header bar 48px.
 */

import { useTheaterStore } from '../stores/theaterStore.js';
import { wsService } from '../services/websocket.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSessionStatus(status: string): string {
  const labels: Record<string, string> = {
    active: 'Ativa',
    paused: 'Pausada',
    ended: 'Encerrada',
  };
  return labels[status] ?? status;
}

function sessionStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'text-[#2ECC71]',
    paused: 'text-[#F1C40F]',
    ended: 'text-[#8888AA]',
  };
  return colors[status] ?? 'text-[#8888AA]';
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function SessionHeader() {
  const sessionId = useTheaterStore((s) => s.sessionId);
  const sessionName = useTheaterStore((s) => s.sessionName);
  const sessionStatus = useTheaterStore((s) => s.sessionStatus);
  const availableSessions = useTheaterStore((s) => s.availableSessions);
  const eventsCount = useTheaterStore((s) => s.events.length);
  const agentsCount = useTheaterStore((s) => Object.keys(s.agents).length);
  const sidePanelCollapsed = useTheaterStore((s) => s.sidePanelCollapsed);
  const toggleSidePanel = useTheaterStore((s) => s.toggleSidePanel);

  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    if (newId && newId !== sessionId) {
      wsService.switchSession(newId);
    }
  };

  return (
    <header className="flex items-center h-12 px-4 bg-[#12121F] border-b border-[#2D2D44] flex-shrink-0">
      {/* Logo / Título */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className="text-xs font-bold tracking-wider"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          <span className="text-[#4169E1]">Lee</span>
          <span className="text-[#E8E8F0]"> Agent Theater</span>
        </span>
      </div>

      {/* Separador */}
      <div className="w-px h-6 bg-[#2D2D44] mx-4 flex-shrink-0" aria-hidden="true" />

      {/* Seletor de sessão + info */}
      {availableSessions.length > 0 ? (
        <div className="flex items-center gap-3 text-xs min-w-0">
          {/* Dropdown de sessão */}
          <select
            className="bg-[#1A1A2E] text-[#E8E8F0] text-xs border border-[#2D2D44] rounded px-2 py-1 max-w-[200px] truncate focus:outline-none focus:ring-1 focus:ring-[#4169E1] cursor-pointer"
            value={sessionId ?? ''}
            onChange={handleSessionChange}
            aria-label="Selecionar sessão"
          >
            {!sessionId && (
              <option value="" disabled>
                Selecione uma sessão
              </option>
            )}
            {availableSessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.agentCount} agentes, {s.eventCount} eventos)
              </option>
            ))}
          </select>

          {/* Status da sessão */}
          {sessionStatus && (
            <span className={sessionStatusColor(sessionStatus)}>
              {formatSessionStatus(sessionStatus)}
            </span>
          )}

          <span className="text-[#555570]">|</span>
          <span className="text-[#8888AA]">
            {agentsCount} {agentsCount === 1 ? 'agente' : 'agentes'}
          </span>
          <span className="text-[#555570]">|</span>
          <span className="text-[#8888AA]">
            {eventsCount} {eventsCount === 1 ? 'evento' : 'eventos'}
          </span>
        </div>
      ) : sessionName ? (
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[#E8E8F0] font-medium">
            {sessionName}
          </span>
          {sessionStatus && (
            <span className={sessionStatusColor(sessionStatus)}>
              {formatSessionStatus(sessionStatus)}
            </span>
          )}
          <span className="text-[#555570]">|</span>
          <span className="text-[#8888AA]">
            {agentsCount} {agentsCount === 1 ? 'agente' : 'agentes'}
          </span>
          <span className="text-[#555570]">|</span>
          <span className="text-[#8888AA]">
            {eventsCount} {eventsCount === 1 ? 'evento' : 'eventos'}
          </span>
        </div>
      ) : (
        <span className="text-xs text-[#555570]">
          Nenhuma sessão conectada
        </span>
      )}

      {/* Espaço flexível */}
      <div className="flex-1" />

      {/* Botão de toggle do painel lateral */}
      <button
        className="flex items-center gap-1 px-2 py-1 text-xs text-[#8888AA] hover:text-[#E8E8F0] border border-[#2D2D44] rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[#4169E1] flex-shrink-0"
        onClick={toggleSidePanel}
        aria-label={sidePanelCollapsed ? 'Mostrar painel lateral' : 'Esconder painel lateral'}
        title={sidePanelCollapsed ? 'Mostrar painel' : 'Esconder painel'}
      >
        {sidePanelCollapsed ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
            <path d="M2 2h10v10H2V2zm1 1v8h3V3H3zm4 0v8h4V3H7z" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
            <path d="M2 2h10v10H2V2zm1 1v8h8V3H3z" />
          </svg>
        )}
        <span className="hidden sm:inline">
          {sidePanelCollapsed ? 'Painel' : 'Esconder'}
        </span>
      </button>
    </header>
  );
}
