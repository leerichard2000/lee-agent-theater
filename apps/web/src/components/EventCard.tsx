/**
 * Card de evento individual no painel de histórico.
 *
 * Exibe timestamp, tipo, agentes envolvidos, resumo e conteúdo expandível.
 * Segue spec UX seção 6 — cards de evento.
 */

import { useState, memo } from 'react';
import type { TheaterEvent } from '@theater/core';
import { EventType } from '@theater/core';
import { useTheaterStore } from '../stores/theaterStore.js';

// ---------------------------------------------------------------------------
// Ícones por tipo de evento (emoji como placeholder, substituir por SVG depois)
// ---------------------------------------------------------------------------

const EVENT_ICONS: Record<string, string> = {
  [EventType.MESSAGE_SENT]: '💬',
  [EventType.MESSAGE_RECEIVED]: '📩',
  [EventType.TOOL_CALL]: '🔧',
  [EventType.TOOL_RESULT]: '✅',
  [EventType.AGENT_JOINED]: '▶',
  [EventType.AGENT_LEFT]: '⏹',
  [EventType.SESSION_STARTED]: '🎬',
  [EventType.SESSION_ENDED]: '🏁',
  [EventType.THINKING]: '💭',
  [EventType.ERROR]: '⚠',
  [EventType.STATUS_CHANGE]: '🔄',
  [EventType.CUSTOM]: '⚙',
};

// Cores de badge por categoria de tipo
const BADGE_COLORS: Record<string, string> = {
  [EventType.MESSAGE_SENT]: 'bg-blue-600/80 text-blue-100',
  [EventType.MESSAGE_RECEIVED]: 'bg-blue-600/80 text-blue-100',
  [EventType.TOOL_CALL]: 'bg-green-600/80 text-green-100',
  [EventType.TOOL_RESULT]: 'bg-green-600/80 text-green-100',
  [EventType.ERROR]: 'bg-red-600/80 text-red-100',
  [EventType.THINKING]: 'bg-purple-600/80 text-purple-100',
  [EventType.STATUS_CHANGE]: 'bg-yellow-600/80 text-yellow-100',
  [EventType.AGENT_JOINED]: 'bg-teal-600/80 text-teal-100',
  [EventType.AGENT_LEFT]: 'bg-gray-600/80 text-gray-100',
  [EventType.SESSION_STARTED]: 'bg-teal-600/80 text-teal-100',
  [EventType.SESSION_ENDED]: 'bg-gray-600/80 text-gray-100',
  [EventType.CUSTOM]: 'bg-gray-600/80 text-gray-100',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Formata timestamp ISO para HH:MM:SS */
function formatTime(isoTimestamp: string): string {
  try {
    const date = new Date(isoTimestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '--:--:--';
  }
}

/** Formata o nome do tipo de evento para exibição */
function formatEventType(type: string): string {
  return type.replace(/_/g, ' ');
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

interface EventCardProps {
  event: TheaterEvent;
  isActive: boolean;
}

export const EventCard = memo(function EventCard({
  event,
  isActive,
}: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const selectEvent = useTheaterStore((s) => s.selectEvent);

  const icon = EVENT_ICONS[event.eventType] ?? '⚙';
  const badgeClass = BADGE_COLORS[event.eventType] ?? 'bg-gray-600/80 text-gray-100';
  const agentColor = event.sourceAgent.color ?? '#4169E1';

  return (
    <div
      className={`
        rounded border transition-colors duration-150 cursor-pointer
        ${
          isActive
            ? 'border-l-[3px] bg-[#252540]'
            : 'border-[#2D2D44] bg-[#1A1A2E] hover:bg-[#222238]'
        }
      `}
      style={isActive ? { borderLeftColor: agentColor } : undefined}
      onClick={() => selectEvent(event.id)}
      role="article"
      aria-label={`Evento ${formatEventType(event.eventType)} de ${event.sourceAgent.name}. Clique para posicionar o cursor de reprodução aqui.`}
    >
      {/* Header: ícone + timestamp + badge tipo */}
      <div className="flex items-center gap-2 px-3 pt-2 pb-1">
        <span className="text-sm" aria-hidden="true">
          {icon}
        </span>
        <span className="font-mono text-[10px] text-[#8888AA]">
          {formatTime(event.timestamp)}
        </span>
        <span
          className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}
        >
          {formatEventType(event.eventType)}
        </span>
      </div>

      {/* Agentes: emissor → receptor */}
      <div className="flex items-center gap-1.5 px-3 pb-1 text-xs">
        {/* Avatar mini emissor */}
        <span
          className="inline-block w-4 h-4 rounded-sm border"
          style={{
            backgroundColor: event.sourceAgent.color ?? '#4169E1',
            borderColor: event.sourceAgent.color ?? '#4169E1',
          }}
          aria-hidden="true"
        />
        <span className="text-[#E8E8F0] font-medium">
          {event.sourceAgent.name}
        </span>

        {event.targetAgent && (
          <>
            <span className="text-[#555570]">→</span>
            <span
              className="inline-block w-4 h-4 rounded-sm border"
              style={{
                backgroundColor: event.targetAgent.color ?? '#8888AA',
                borderColor: event.targetAgent.color ?? '#8888AA',
              }}
              aria-hidden="true"
            />
            <span className="text-[#E8E8F0] font-medium">
              {event.targetAgent.name}
            </span>
          </>
        )}
      </div>

      {/* Resumo */}
      <div className="px-3 pb-2">
        <p className="text-sm text-[#E8E8F0] leading-snug">
          {event.summary || '(sem resumo)'}
        </p>
      </div>

      {/* Conteúdo expandido */}
      {expanded && event.content && (
        <div className="border-t border-[#2D2D44] px-3 py-2">
          <pre className="text-xs font-mono text-[#E8E8F0] whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
            {event.content}
          </pre>
        </div>
      )}

      {/* Indicador de expansão */}
      {event.content && (
        <div className="px-3 pb-2">
          <button
            className="text-[10px] text-[#4169E1] hover:text-[#5A7FE8] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            aria-expanded={expanded}
            aria-label={expanded ? 'Recolher conteúdo' : 'Expandir conteúdo'}
          >
            {expanded ? '▲ Recolher' : '▼ Expandir'}
          </button>
        </div>
      )}
    </div>
  );
});
