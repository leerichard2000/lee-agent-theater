/**
 * Armazenamento em memória do estado da sessão.
 *
 * Gerencia sessões, agentes e eventos com ring buffer.
 * Emite callbacks para notificar o WebSocket de mudanças.
 */

import type {
  SessionState,
  SessionStatus,
  TheaterEvent,
  AgentInfo,
} from '@theater/core';
import { MAX_EVENTS_PER_SESSION } from '@theater/core';

// ---------------------------------------------------------------------------
// Tipos de callback
// ---------------------------------------------------------------------------

export type OnEventCallback = (sessionId: string, event: TheaterEvent) => void;
export type OnAgentUpdateCallback = (sessionId: string, agent: AgentInfo) => void;
export type OnSessionChangeCallback = (session: SessionState) => void;

// ---------------------------------------------------------------------------
// SessionStore
// ---------------------------------------------------------------------------

export class SessionStore {
  private sessions = new Map<string, SessionState>();
  private onEventCallbacks: OnEventCallback[] = [];
  private onAgentUpdateCallbacks: OnAgentUpdateCallback[] = [];
  private onSessionChangeCallbacks: OnSessionChangeCallback[] = [];

  /** Registra callback para novos eventos */
  onEvent(cb: OnEventCallback): void {
    this.onEventCallbacks.push(cb);
  }

  /** Registra callback para atualizações de agente */
  onAgentUpdate(cb: OnAgentUpdateCallback): void {
    this.onAgentUpdateCallbacks.push(cb);
  }

  /** Registra callback para mudanças de sessão */
  onSessionChange(cb: OnSessionChangeCallback): void {
    this.onSessionChangeCallbacks.push(cb);
  }

  /** Cria uma nova sessão ou retorna a existente */
  createSession(id: string, name: string): SessionState {
    if (this.sessions.has(id)) {
      return this.sessions.get(id)!;
    }

    const session: SessionState = {
      id,
      name,
      startedAt: new Date().toISOString(),
      status: 'active',
      agents: {},
      events: [],
      metadata: {},
    };

    this.sessions.set(id, session);
    this.notifySessionChange(session);
    return session;
  }

  /** Retorna uma sessão por ID */
  getSession(id: string): SessionState | undefined {
    return this.sessions.get(id);
  }

  /** Retorna todas as sessões */
  getAllSessions(): SessionState[] {
    return Array.from(this.sessions.values());
  }

  /** Retorna a sessão ativa (a mais recente com status 'active') */
  getActiveSession(): SessionState | undefined {
    const sessions = this.getAllSessions();
    return sessions.find((s) => s.status === 'active');
  }

  /** Atualiza o status de uma sessão */
  setSessionStatus(sessionId: string, status: SessionStatus): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = status;
    this.notifySessionChange(session);
  }

  /** Adiciona um evento à sessão (ring buffer) */
  addEvent(event: TheaterEvent): void {
    const session = this.sessions.get(event.sessionId);
    if (!session) return;

    // Ring buffer: remove o mais antigo se exceder o limite
    if (session.events.length >= MAX_EVENTS_PER_SESSION) {
      session.events.shift();
    }

    session.events.push(event);

    // Atualiza o agente fonte se necessário
    this.upsertAgent(event.sessionId, event.sourceAgent);

    // Atualiza o agente destino se existir
    if (event.targetAgent) {
      this.upsertAgent(event.sessionId, event.targetAgent);
    }

    // Notifica listeners
    for (const cb of this.onEventCallbacks) {
      cb(event.sessionId, event);
    }
  }

  /** Adiciona ou atualiza um agente em uma sessão */
  upsertAgent(sessionId: string, agent: AgentInfo): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const existing = session.agents[agent.id];
    const merged: AgentInfo = {
      ...existing,
      ...agent,
    };

    session.agents[agent.id] = merged;

    // Notifica listeners
    for (const cb of this.onAgentUpdateCallbacks) {
      cb(sessionId, merged);
    }
  }

  /** Retorna todos os agentes de uma sessão */
  getAgents(sessionId: string): AgentInfo[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return Object.values(session.agents);
  }

  /** Retorna eventos de uma sessão com paginação opcional */
  getEvents(
    sessionId: string,
    opts?: { limit?: number; offset?: number },
  ): TheaterEvent[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const limit = opts?.limit ?? 100;
    const offset = opts?.offset ?? 0;

    return session.events.slice(offset, offset + limit);
  }

  // ---------------------------------------------------------------------------
  // Notificações internas
  // ---------------------------------------------------------------------------

  private notifySessionChange(session: SessionState): void {
    for (const cb of this.onSessionChangeCallbacks) {
      cb(session);
    }
  }
}
