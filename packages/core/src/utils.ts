/**
 * Utilitários de normalização de payload do Lee Agent Theater.
 *
 * Funções auxiliares para que adapters criem TheaterEvents consistentes.
 */

import type { TheaterEvent } from './events.js';
import type { AgentInfo } from './agents.js';
import { EventType, EventStatus } from './events.js';

// ---------------------------------------------------------------------------
// Normalização de payload
// ---------------------------------------------------------------------------

/** Campos obrigatórios para criar um evento via helper */
export interface CreateEventInput {
  sessionId: string;
  sourceAgent: AgentInfo;
  targetAgent?: AgentInfo | null;
  eventType: EventType;
  summary: string;
  content?: string;
  status?: EventStatus;
  projectId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Cria um TheaterEvent normalizado com defaults seguros.
 * O adapter ou server deve fornecer o `id` (UUID) externamente.
 */
export function createEvent(
  id: string,
  input: CreateEventInput,
): TheaterEvent {
  return {
    id,
    timestamp: new Date().toISOString(),
    sessionId: input.sessionId,
    projectId: input.projectId,
    sourceAgent: normalizeAgentInfo(input.sourceAgent),
    targetAgent: input.targetAgent ? normalizeAgentInfo(input.targetAgent) : null,
    eventType: input.eventType,
    summary: truncateSummary(input.summary),
    content: input.content ?? '',
    status: input.status ?? EventStatus.COMPLETED,
    metadata: input.metadata ?? {},
  };
}

/**
 * Normaliza informação de agente, garantindo que campos opcionais
 * tenham valores consistentes.
 */
export function normalizeAgentInfo(agent: AgentInfo): AgentInfo {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    avatar: agent.avatar,
    position: agent.position,
    state: agent.state ?? 'idle',
    color: agent.color,
  };
}

/**
 * Trunca o summary para no máximo 280 caracteres, adicionando
 * reticências se necessário.
 */
export function truncateSummary(summary: string, maxLength = 280): string {
  if (summary.length <= maxLength) return summary;
  return summary.slice(0, maxLength - 3) + '...';
}

/**
 * Normaliza metadados, removendo valores undefined.
 */
export function normalizeMetadata(
  metadata: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}
