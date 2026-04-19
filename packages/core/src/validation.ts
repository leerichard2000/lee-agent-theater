/**
 * Schemas de validação Zod para o Lee Agent Theater.
 *
 * Zod é usado como validador único — runtime + type inference.
 * Todo evento é validado na entrada do server e na saída de cada adapter.
 */

import { z } from 'zod';
import { EventType, EventStatus } from './events.js';
import { AGENT_STATES } from './agents.js';

// ---------------------------------------------------------------------------
// Schemas de agente
// ---------------------------------------------------------------------------

/** Schema de posição 2D do agente */
export const AgentPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

/** Schema de informação de agente */
export const AgentInfoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().optional(),
  avatar: z.string().optional(),
  position: AgentPositionSchema.optional(),
  state: z.enum(AGENT_STATES as unknown as [string, ...string[]]).optional(),
  color: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Schema de evento
// ---------------------------------------------------------------------------

/** Schema principal de TheaterEvent */
export const TheaterEventSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  sessionId: z.string().min(1),
  projectId: z.string().min(1).optional(),
  sourceAgent: AgentInfoSchema,
  targetAgent: AgentInfoSchema.nullable(),
  eventType: z.nativeEnum(EventType),
  summary: z.string().max(280),
  content: z.string(),
  status: z.nativeEnum(EventStatus),
  metadata: z.record(z.unknown()),
});

// ---------------------------------------------------------------------------
// Funções de validação
// ---------------------------------------------------------------------------

/** Valida um evento e retorna o resultado tipado (safe — não lança erro) */
export function validateEvent(data: unknown) {
  return TheaterEventSchema.safeParse(data);
}

/** Valida um evento e lança erro se inválido */
export function parseEvent(data: unknown) {
  return TheaterEventSchema.parse(data);
}

/** Valida informação de agente (safe — não lança erro) */
export function validateAgentInfo(data: unknown) {
  return AgentInfoSchema.safeParse(data);
}
