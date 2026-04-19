/**
 * Referencia compartilhada a instancia Phaser.Game ativa.
 *
 * Permite que componentes React (como AgentLabels) acessem o canvas
 * Phaser para mapear coordenadas internas do palco (960x540) para
 * coordenadas absolutas do DOM, respeitando o letterboxing do Scale.FIT.
 */

import type Phaser from 'phaser';

let currentGame: Phaser.Game | null = null;
type Listener = (game: Phaser.Game | null) => void;
const listeners = new Set<Listener>();

/** Define (ou limpa) a instancia ativa do Phaser Game. */
export function setPhaserGame(game: Phaser.Game | null): void {
  currentGame = game;
  for (const l of listeners) l(game);
}

/** Retorna a instancia ativa (ou null se Phaser ainda nao foi montado). */
export function getPhaserGame(): Phaser.Game | null {
  return currentGame;
}

/** Assina mudancas na instancia ativa. Retorna funcao de unsubscribe. */
export function subscribePhaserGame(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
