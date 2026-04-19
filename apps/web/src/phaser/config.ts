/**
 * Configuração do Phaser 3 — resolução 960x540 para texto legível.
 *
 * Resolução dobrada (era 480x270) para dar mais pixels ao texto.
 * pixelArt desabilitado globalmente para permitir antialias no texto.
 * Sprites usam nearest-neighbor via setFilter individual.
 */

import Phaser from 'phaser';
import { TheaterScene } from './TheaterScene.js';

/** Largura interna do canvas */
export const GAME_WIDTH = 960;

/** Altura interna do canvas */
export const GAME_HEIGHT = 540;

/** Cria configuração do Phaser para o palco */
export function createPhaserConfig(
  parent: HTMLElement,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.WEBGL,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,

    // Antialias habilitado para texto legível
    pixelArt: false,
    roundPixels: false,

    // Escalamento responsivo
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },

    // Render com antialias para texto crisp
    render: {
      antialias: true,
      pixelArt: false,
    },

    physics: undefined,

    transparent: false,
    backgroundColor: '#0F1923',

    scene: [TheaterScene],

    banner: false,
  };
}
