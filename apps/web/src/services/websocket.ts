/**
 * Serviço WebSocket — conecta ao server e alimenta o Zustand store.
 *
 * Fluxo: connect → fetch /api/status → auto-subscribe na sessão ativa → receber eventos
 * Suporte a reconnect com backoff exponencial e troca de sessão.
 */

import type { TheaterEvent, WsServerMessage, WsClientMessage } from '@theater/core';
import {
  WS_PATH,
  WS_PING_INTERVAL_MS,
  WS_RECONNECT_BASE_DELAY_MS,
  WS_RECONNECT_MAX_DELAY_MS,
} from '@theater/core';
import { theaterStore } from '../stores/theaterStore.js';

/**
 * Limite alto para trazer o ring buffer inteiro (#9aa38f38). O server mantém
 * `MAX_EVENTS_PER_SESSION = 1000` em memória, então 1000 cobre tudo.
 */
const HISTORY_FETCH_LIMIT = 1000;

/** Intervalo de polling para atualizar lista de sessões (ms) */
const SESSION_POLL_INTERVAL_MS = 10_000;

class WebSocketService {
  private ws: WebSocket | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private sessionPollInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private intentionalClose = false;
  private currentUrl = '';

  /** Conecta ao server WebSocket */
  connect(serverUrl = `ws://${window.location.host}`, sessionId?: string): void {
    this.intentionalClose = false;
    this.currentUrl = serverUrl;

    const wsUrl = `${serverUrl}${WS_PATH}`;

    theaterStore.getState().setConnectionStatus('connecting');

    try {
      this.ws = new WebSocket(wsUrl);
    } catch {
      theaterStore.getState().setConnectionStatus('disconnected');
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      theaterStore.getState().setConnectionStatus('connected');

      // Se já tem sessionId, carrega o histórico completo via REST e então
      // faz subscribe. O fetch acontece primeiro para que o painel já
      // mostre tudo que o server tem em buffer quando os eventos WS começam
      // a chegar (#9aa38f38).
      if (sessionId) {
        void this.loadHistoryAndSubscribe(sessionId);
      } else {
        // Auto-descoberta: busca sessão ativa via REST
        this.discoverAndSubscribe();
      }

      // Iniciar polling de sessões disponíveis e ping keepalive
      this.startSessionPoll();
      this.startPing();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsServerMessage;
        this.handleMessage(msg);
      } catch {
        // Mensagem inválida
      }
    };

    this.ws.onclose = () => {
      this.stopPing();
      this.stopSessionPoll();
      if (!this.intentionalClose) {
        theaterStore.getState().setConnectionStatus('reconnecting');
        this.scheduleReconnect();
      } else {
        theaterStore.getState().setConnectionStatus('disconnected');
      }
    };

    this.ws.onerror = () => {
      // onclose será chamado em seguida
    };
  }

  /**
   * Troca para outra sessão: unsubscribe da atual, reset do store, carrega
   * histórico via REST, subscribe na nova.
   */
  switchSession(newSessionId: string): void {
    const currentId = theaterStore.getState().sessionId;
    if (currentId === newSessionId) return;

    // Unsubscribe da sessão atual
    if (currentId) {
      this.send({ type: 'unsubscribe', sessionId: currentId });
    }

    // Limpar estado do store antes de carregar nova sessão
    theaterStore.getState().reset();
    theaterStore.getState().setConnectionStatus('connected');

    // Fixar sessionId imediatamente para que mensagens tardias da sessao
    // anterior sejam descartadas pelo filtro em handleMessage (senao,
    // com sessionId=null o filtro deixaria qualquer coisa passar).
    theaterStore.getState().setSessionId(newSessionId);

    // Carrega histórico via REST e só então subscribe (#9aa38f38).
    void this.loadHistoryAndSubscribe(newSessionId);
  }

  /**
   * Busca lista de sessões disponíveis no server via REST.
   * Atualiza o store com a lista.
   */
  async fetchSessions(): Promise<void> {
    try {
      const resp = await fetch('/api/status');
      if (!resp.ok) return;

      const data = await resp.json();
      const sessions = data?.sessions?.list;
      if (Array.isArray(sessions)) {
        theaterStore.getState().setAvailableSessions(sessions);
      }
    } catch {
      // Silencioso — lista será atualizada no próximo poll
    }
  }

  /** Desconecta intencionalmente */
  disconnect(): void {
    this.intentionalClose = true;
    this.stopPing();
    this.stopSessionPoll();
    this.clearReconnect();
    this.ws?.close();
    this.ws = null;
    theaterStore.getState().setConnectionStatus('disconnected');
  }

  /** Envia mensagem para o server */
  send(message: WsClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Descobre a sessão ativa via REST /api/status e faz subscribe automaticamente.
   * Também carrega a lista de sessões disponíveis no store.
   */
  private async discoverAndSubscribe(): Promise<void> {
    try {
      const resp = await fetch('/api/status');
      if (!resp.ok) return;

      const data = await resp.json();
      const activeSessionId = data?.sessions?.active as string | null;

      // Atualizar lista de sessões disponíveis
      const sessions = data?.sessions?.list;
      if (Array.isArray(sessions)) {
        theaterStore.getState().setAvailableSessions(sessions);
      }

      if (activeSessionId) {
        void this.loadHistoryAndSubscribe(activeSessionId);
      } else {
        // Nenhuma sessão ativa ainda — retry após 2s
        setTimeout(() => {
          if (this.ws?.readyState === WebSocket.OPEN && !this.intentionalClose) {
            this.discoverAndSubscribe();
          }
        }, 2000);
      }
    } catch {
      // Fetch falhou — server pode não estar pronto, retry em 2s
      setTimeout(() => {
        if (this.ws?.readyState === WebSocket.OPEN && !this.intentionalClose) {
          this.discoverAndSubscribe();
        }
      }, 2000);
    }
  }

  /**
   * Carrega o histórico completo da sessão via REST `/api/events` e em
   * seguida assina o WebSocket (#9aa38f38). O fetch vem primeiro para que
   * o painel apareça já populado; eventos novos chegando via WS durante o
   * fetch ficam pendentes no server até o subscribe, e se algum race raro
   * entregar o mesmo evento duas vezes (REST + WS), `pushEvent` dedup por id.
   *
   * Falha graciosa: se o fetch retornar erro ou for abortado, o subscribe
   * acontece igual — o painel volta a se encher só com eventos novos,
   * comportamento equivalente ao antigo (sem histórico).
   */
  private async loadHistoryAndSubscribe(sessionId: string): Promise<void> {
    const state = theaterStore.getState();
    state.setHistoryLoading(true);
    try {
      const resp = await fetch(
        `/api/events?sessionId=${encodeURIComponent(sessionId)}&limit=${HISTORY_FETCH_LIMIT}`,
      );
      if (resp.ok) {
        const data = (await resp.json()) as { events?: TheaterEvent[] };
        if (Array.isArray(data.events)) {
          theaterStore.getState().loadHistory(data.events);
        }
      }
    } catch {
      // Silencioso — o subscribe abaixo ainda vai popular o painel com
      // eventos novos, o user só não vê o backfill.
    } finally {
      theaterStore.getState().setHistoryLoading(false);
      // Agora sim: entra no fluxo de live.
      this.send({ type: 'subscribe', sessionId });
    }
  }

  /** Processa mensagem recebida do server */
  private handleMessage(msg: WsServerMessage): void {
    const state = theaterStore.getState();
    const currentSessionId = state.sessionId;

    switch (msg.type) {
      case 'event':
        // Filtrar eventos que vazaram de outra sessao (ex: unsubscribe em
        // voo, broadcast tardio apos troca de sessao no frontend).
        if (currentSessionId && msg.payload.sessionId !== currentSessionId) {
          return;
        }
        state.pushEvent(msg.payload);
        break;

      case 'session_state':
        state.loadSessionState(msg.payload);
        break;

      case 'agent_update':
        // Descartar atualizacoes de agentes de outras sessoes. Sem isso,
        // agentes da sessao anterior vazavam ao trocar no dropdown enquanto
        // o server ainda enviava updates pendentes.
        if (currentSessionId && msg.sessionId !== currentSessionId) {
          return;
        }
        if (state.agents[msg.payload.id]) {
          if (msg.payload.state) {
            state.updateAgentState(msg.payload.id, msg.payload.state);
          }
        } else {
          state.addAgent(msg.payload);
        }
        break;

      case 'error':
        console.error(`[WebSocket] Erro do server: ${msg.payload.code} — ${msg.payload.message}`);
        break;

      case 'pong':
        break;
    }
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, WS_PING_INTERVAL_MS);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /** Inicia polling periódico para atualizar lista de sessões */
  private startSessionPoll(): void {
    this.stopSessionPoll();
    this.sessionPollInterval = setInterval(() => {
      this.fetchSessions();
    }, SESSION_POLL_INTERVAL_MS);
  }

  /** Para o polling de sessões */
  private stopSessionPoll(): void {
    if (this.sessionPollInterval) {
      clearInterval(this.sessionPollInterval);
      this.sessionPollInterval = null;
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnect();
    const delay = Math.min(
      WS_RECONNECT_BASE_DELAY_MS * Math.pow(2, this.reconnectAttempts),
      WS_RECONNECT_MAX_DELAY_MS,
    );
    this.reconnectAttempts++;
    this.reconnectTimeout = setTimeout(() => {
      const sessionId = theaterStore.getState().sessionId ?? undefined;
      this.connect(this.currentUrl, sessionId);
    }, delay);
  }

  private clearReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

export const wsService = new WebSocketService();
