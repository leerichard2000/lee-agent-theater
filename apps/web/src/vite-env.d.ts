/// <reference types="vite/client" />

/**
 * Declaração de variáveis de ambiente customizadas expostas pelo Vite
 * via `import.meta.env.VITE_*`. Apenas o que o projeto consome.
 */
interface ImportMetaEnv {
  /**
   * URL base do WebSocket. Override manual quando o default
   * (dev → `ws://localhost:3001`, prod → `window.location.host`) não serve.
   */
  readonly VITE_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
