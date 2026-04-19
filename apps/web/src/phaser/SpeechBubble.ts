/**
 * Balão de fala — Container Phaser com NineSlice + Text.
 *
 * Segue spec UX: max 240px largura, 2 linhas, fonte pixel art,
 * animação de entrada (escala 0→1 em 0.2s), duração proporcional ao texto.
 */

import Phaser from 'phaser';

/** Configurações do balão (adaptado para resolução 960x540) */
const BUBBLE_MAX_WIDTH = 220;
const BUBBLE_PADDING = 8;
const BUBBLE_OFFSET_X = 12;
const BUBBLE_OFFSET_Y = -32;
const ARROW_SIZE = 6;
const MIN_DURATION_MS = 2000;
const MAX_DURATION_MS = 5000;

export class SpeechBubble extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.NineSlice;
  private text: Phaser.GameObjects.Text;
  private arrow: Phaser.GameObjects.Triangle;
  private fadeTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Fundo NineSlice
    this.bg = scene.add.nineslice(
      0, 0, 'bubble_bg',
      undefined,
      BUBBLE_MAX_WIDTH, 24,
      4, 4, 4, 4,
    );
    this.bg.setOrigin(0.5, 1);

    // Texto — fonte do sistema para legibilidade
    this.text = scene.add.text(0, 0, '', {
      fontFamily: 'Inter, Arial, Helvetica, sans-serif',
      fontSize: '11px',
      color: '#1A1A2E',
      wordWrap: { width: BUBBLE_MAX_WIDTH - BUBBLE_PADDING * 2 },
      align: 'center',
      lineSpacing: 3,
    });
    this.text.setOrigin(0.5, 1);

    // Seta do balão
    this.arrow = scene.add.triangle(
      0, 0,
      -ARROW_SIZE, 0,
      ARROW_SIZE, 0,
      0, ARROW_SIZE,
      0xffffff, 0.95,
    );
    this.arrow.setOrigin(0.5, 0);

    this.add([this.bg, this.text, this.arrow]);
    this.setVisible(false);
    this.setScale(0);

    scene.add.existing(this);
  }

  /** Mostra o balão com texto e duração automática */
  show(message: string): void {
    // Truncar em 80 caracteres (spec)
    const truncated = message.length > 80
      ? message.substring(0, 77) + '...'
      : message;

    this.text.setText(truncated);

    // Ajustar tamanho do fundo
    const textWidth = Math.min(this.text.width + BUBBLE_PADDING * 2, BUBBLE_MAX_WIDTH);
    const textHeight = this.text.height + BUBBLE_PADDING * 2;

    this.bg.setSize(textWidth, textHeight);
    this.bg.setPosition(BUBBLE_OFFSET_X, BUBBLE_OFFSET_Y);
    this.text.setPosition(BUBBLE_OFFSET_X, BUBBLE_OFFSET_Y - BUBBLE_PADDING);
    this.arrow.setPosition(0, BUBBLE_OFFSET_Y);

    this.setVisible(true);
    this.setScale(0);

    // Animação de entrada (spec: escala 0→1 em 0.2s, ease-out)
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });

    // Calcular duração: max(2, min(5, length * 0.04)) segundos
    const duration = Math.max(
      MIN_DURATION_MS,
      Math.min(MAX_DURATION_MS, truncated.length * 40),
    );

    // Agendar desaparecimento
    this.fadeTimer?.destroy();
    this.fadeTimer = this.scene.time.delayedCall(duration, () => {
      this.hide();
    });
  }

  /** Esconde o balão com fade out */
  hide(): void {
    this.fadeTimer?.destroy();
    this.fadeTimer = undefined;

    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.setVisible(false);
        this.setAlpha(1);
      },
    });
  }

  /** Destrói o balão e limpa timers */
  override destroy(fromScene?: boolean): void {
    this.fadeTimer?.destroy();
    super.destroy(fromScene);
  }
}
