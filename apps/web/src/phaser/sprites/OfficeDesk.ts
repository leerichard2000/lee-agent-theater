/**
 * Sprite da mesa de escritório individual (1 por agente).
 *
 * `OfficeDesk` é um `Phaser.GameObjects.Container` que combina a textura da
 * mesa com um glow opcional atrás dela, controlado pelo estado do agente.
 *
 * Agnóstico de agente: recebe apenas `state` e `highlightColor` por prop,
 * não conhece nenhuma identidade. Quem integra (@ana-frontend) conecta
 * `state` ao ciclo de vida do agente.
 *
 * Spec: #b35c9591 §2 (dimensões, paleta) e #ccf5ad3e (API).
 */

import Phaser from 'phaser';
import {
  TEX_DESK_INDIVIDUAL_IDLE,
  TEX_DESK_INDIVIDUAL_OCCUPIED,
  TEX_DESK_INDIVIDUAL_AWAY,
  generateOfficeDeskTextures,
} from './textures.js';

/**
 * Estado visual da mesa:
 * - `idle`: mesa vazia (monitor aceso). Sem glow.
 * - `occupied`: agente presente no posto. Glow sutil da cor do agente.
 * - `away`: agente em reunião, mesa em standby (monitor escurecido).
 */
export type OfficeDeskState = 'idle' | 'occupied' | 'away';

export interface OfficeDeskOptions {
  /** Estado inicial. Default: `'idle'` */
  state?: OfficeDeskState;
  /** Cor do glow quando `state === 'occupied'`. Default: sem glow. */
  highlightColor?: string;
}

const GLOW_WIDTH = 48;
const GLOW_HEIGHT = 36;
const GLOW_ALPHA_OCCUPIED = 0.25;

export class OfficeDesk extends Phaser.GameObjects.Container {
  private glow: Phaser.GameObjects.Rectangle;
  private deskImage: Phaser.GameObjects.Image;
  private currentState: OfficeDeskState;
  private highlightColor: string | undefined;

  constructor(scene: Phaser.Scene, x: number, y: number, options: OfficeDeskOptions = {}) {
    super(scene, x, y);

    // Garante que as texturas existem antes de montar (idempotente)
    generateOfficeDeskTextures(scene);

    this.currentState = options.state ?? 'idle';
    this.highlightColor = options.highlightColor;

    // Glow atrás da mesa (fica invisível enquanto state !== 'occupied')
    const glowColor = this.highlightColor
      ? Phaser.Display.Color.HexStringToColor(this.highlightColor).color
      : 0xffffff;
    this.glow = scene.add.rectangle(0, 0, GLOW_WIDTH, GLOW_HEIGHT, glowColor, 0);
    this.glow.setVisible(false);

    // Imagem principal da mesa
    this.deskImage = scene.add.image(0, 0, this.textureKeyFor(this.currentState));
    this.deskImage.setOrigin(0.5, 0.5);

    this.add([this.glow, this.deskImage]);
    this.applyState();

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
  }

  /** Estado atual da mesa */
  getDeskState(): OfficeDeskState {
    return this.currentState;
  }

  /**
   * Atualiza o estado visual da mesa. Chamado pela @ana-frontend em resposta
   * ao agente entrar/sair do posto.
   */
  setDeskState(newState: OfficeDeskState): void {
    if (newState === this.currentState) return;
    this.currentState = newState;
    this.applyState();
  }

  /**
   * Atualiza a cor do glow usada quando `state === 'occupied'`.
   * Aplica imediatamente se a mesa já está nesse estado.
   */
  setHighlightColor(color: string | undefined): void {
    this.highlightColor = color;
    const glowColor = color
      ? Phaser.Display.Color.HexStringToColor(color).color
      : 0xffffff;
    this.glow.fillColor = glowColor;
    if (this.currentState === 'occupied') this.applyState();
  }

  /**
   * Largura/altura visual usada para cálculos de layout. Constantes — os
   * tamanhos são fixos pela spec (40x28).
   */
  static readonly WIDTH = 40;
  static readonly HEIGHT = 28;

  // ---------------------------------------------------------------------------
  // Internos
  // ---------------------------------------------------------------------------

  private textureKeyFor(state: OfficeDeskState): string {
    switch (state) {
      case 'idle': return TEX_DESK_INDIVIDUAL_IDLE;
      case 'occupied': return TEX_DESK_INDIVIDUAL_OCCUPIED;
      case 'away': return TEX_DESK_INDIVIDUAL_AWAY;
    }
  }

  private applyState(): void {
    this.deskImage.setTexture(this.textureKeyFor(this.currentState));

    const showGlow = this.currentState === 'occupied' && !!this.highlightColor;
    this.glow.setVisible(showGlow);
    this.glow.setAlpha(showGlow ? GLOW_ALPHA_OCCUPIED : 0);

    // Pequena dessaturação na tela quando `away` já é feita pela textura;
    // aqui só ajustamos alpha global para reforçar a leitura "ninguém aqui".
    this.deskImage.setAlpha(this.currentState === 'away' ? 0.85 : 1);
  }
}
