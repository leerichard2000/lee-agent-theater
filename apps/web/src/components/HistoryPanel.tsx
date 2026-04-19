/**
 * Painel lateral de histórico de eventos.
 *
 * Lista os eventos filtrados com auto-scroll, destaque do evento ativo,
 * e badge de "novos eventos" quando o usuário faz scroll para cima.
 * Segue spec UX seção 6.
 */

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useTheaterStore } from '../stores/theaterStore.js';
import { EventCard } from './EventCard.js';
import { EventType } from '@theater/core';

// ---------------------------------------------------------------------------
// Opções de filtro por tipo de evento
// ---------------------------------------------------------------------------

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: EventType.MESSAGE_SENT, label: 'Mensagem enviada' },
  { value: EventType.MESSAGE_RECEIVED, label: 'Mensagem recebida' },
  { value: EventType.TOOL_CALL, label: 'Chamada de ferramenta' },
  { value: EventType.TOOL_RESULT, label: 'Resultado de ferramenta' },
  { value: EventType.THINKING, label: 'Pensando' },
  { value: EventType.ERROR, label: 'Erro' },
  { value: EventType.STATUS_CHANGE, label: 'Mudança de status' },
  { value: EventType.AGENT_JOINED, label: 'Agente entrou' },
  { value: EventType.AGENT_LEFT, label: 'Agente saiu' },
];

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function HistoryPanel() {
  // Selecionar dados primitivos/estáveis do store (sem criar novos objetos)
  const events = useTheaterStore((s) => s.events);
  const activeEventId = useTheaterStore((s) => s.activeEventId);
  const agents = useTheaterStore((s) => s.agents);
  const filters = useTheaterStore((s) => s.filters);
  const historyLoading = useTheaterStore((s) => s.historyLoading);

  // Derivar filteredEvents e agentList via useMemo para evitar loop infinito
  const filteredEvents = useMemo(() => {
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
  }, [events, filters]);

  const agentList = useMemo(() => Object.values(agents), [agents]);
  const userScrolledUp = useTheaterStore((s) => s.userScrolledUp);
  const newEventsCount = useTheaterStore((s) => s.newEventsCount);

  const setAgentFilter = useTheaterStore((s) => s.setAgentFilter);
  const setEventTypeFilter = useTheaterStore((s) => s.setEventTypeFilter);
  const setUserScrolledUp = useTheaterStore((s) => s.setUserScrolledUp);
  const resetNewEventsCount = useTheaterStore((s) => s.resetNewEventsCount);

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o final quando novos eventos chegam (se não está scrolled up)
  useEffect(() => {
    if (!userScrolledUp && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredEvents.length, userScrolledUp]);

  // Detectar scroll manual do usuário
  const handleScroll = useCallback(() => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
    if (isNearBottom && userScrolledUp) {
      setUserScrolledUp(false);
      resetNewEventsCount();
    } else if (!isNearBottom && !userScrolledUp) {
      setUserScrolledUp(true);
    }
  }, [userScrolledUp, setUserScrolledUp, resetNewEventsCount]);

  // Scroll até o evento ativo
  const scrollToActive = useCallback(() => {
    if (!listRef.current || !activeEventId) return;
    const activeElement = listRef.current.querySelector(
      `[data-event-id="${activeEventId}"]`
    );
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setUserScrolledUp(false);
      resetNewEventsCount();
    }
  }, [activeEventId, setUserScrolledUp, resetNewEventsCount]);

  return (
    <div className="flex flex-col h-full bg-[#1A1A2E]">
      {/* Barra de filtros */}
      <div className="flex-shrink-0 flex gap-2 px-3 py-2 bg-[#12121F] border-b border-[#2D2D44]">
        {/* Filtro por agente */}
        <select
          className="flex-1 bg-[#1A1A2E] text-[#E8E8F0] text-xs border border-[#2D2D44] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#4169E1]"
          value={filters.agentIds.length === 1 ? filters.agentIds[0] : ''}
          onChange={(e) => {
            const val = e.target.value;
            setAgentFilter(val ? [val] : []);
          }}
          aria-label="Filtrar por agente"
        >
          <option value="">Todos os agentes</option>
          {agentList.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>

        {/* Filtro por tipo */}
        <select
          className="flex-1 bg-[#1A1A2E] text-[#E8E8F0] text-xs border border-[#2D2D44] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#4169E1]"
          value={filters.eventTypes.length === 1 ? filters.eventTypes[0] : ''}
          onChange={(e) => {
            const val = e.target.value as EventType | '';
            setEventTypeFilter(val ? [val] : []);
          }}
          aria-label="Filtrar por tipo de evento"
        >
          <option value="">Todos os tipos</option>
          {EVENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Badge de novos eventos */}
      {userScrolledUp && newEventsCount > 0 && (
        <button
          className="sticky top-0 z-10 mx-3 mt-2 py-1 px-3 bg-[#4169E1] text-white text-xs rounded-full text-center hover:bg-[#5A7FE8] transition-colors"
          onClick={scrollToActive}
        >
          {newEventsCount} {newEventsCount === 1 ? 'novo evento' : 'novos eventos'} ↓
        </button>
      )}

      {/* Lista de eventos */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-2"
        onScroll={handleScroll}
        role="log"
        aria-label="Histórico de eventos"
        aria-live="polite"
      >
        {historyLoading && events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-[#8888AA] text-sm">
            <span
              className="inline-block w-4 h-4 rounded-full border-2 border-[#2D2D44] border-t-[#4169E1] animate-spin"
              aria-hidden="true"
            />
            <span>Carregando histórico...</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#555570] text-sm">
            Nenhum evento ainda
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} data-event-id={event.id}>
              <EventCard
                event={event}
                isActive={event.id === activeEventId}
              />
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Indicador de evento ativo fora de vista */}
      {userScrolledUp && activeEventId && (
        <button
          className="flex-shrink-0 py-1 px-3 bg-[#252540] text-[#4169E1] text-xs text-center border-t border-[#2D2D44] hover:bg-[#2D2D44] transition-colors"
          onClick={scrollToActive}
        >
          Evento ativo ↓
        </button>
      )}
    </div>
  );
}
