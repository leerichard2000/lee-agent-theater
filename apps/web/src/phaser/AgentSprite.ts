/**
 * Sprite de agente no palco — gerencia estados visuais e animacoes.
 *
 * Cada agente tem: sprite principal, icone de estado e glow de destaque.
 * Labels e baloes de fala foram movidos para HTML overlay (AgentLabels.tsx)
 * para garantir legibilidade em qualquer resolucao.
 *
 * speak()/hideSpeech() atualizam o store Zustand, que e lido pelo React.
 */

import Phaser from 'phaser';
import type { AgentState } from '@theater/core';
import { theaterStore } from '../stores/theaterStore.js';

const GLOW_ALPHA = 0.35;

export class AgentSprite extends Phaser.GameObjects.Container {
  public agentId: string;
  public agentColor: string;

  private sprite: Phaser.GameObjects.Sprite;
  private glowRect: Phaser.GameObjects.Rectangle;
  private statusIcon: Phaser.GameObjects.Image | null = null;
  private currentAgentState: AgentState = 'idle';

  // Tweens ativos
  private breathTween?: Phaser.Tweens.Tween;
  private glowTween?: Phaser.Tweens.Tween;
  private walkTween?: Phaser.Tweens.Tween;
  private bounceTween?: Phaser.Tweens.Tween;
  private iconTween?: Phaser.Tweens.Tween;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    agentId: string,
    _agentName: string,
    agentColor: string,
    textureKey: string,
  ) {
    super(scene, x, y);
    this.agentId = agentId;
    this.agentColor = agentColor;

    // Glow de destaque
    this.glowRect = scene.add.rectangle(
      0, 0, 36, 36,
      Phaser.Display.Color.HexStringToColor(agentColor).color,
      GLOW_ALPHA,
    );
    this.glowRect.setVisible(false);

    // Sprite principal
    this.sprite = scene.add.sprite(0, 0, textureKey);
    this.sprite.setOrigin(0.5, 0.5);

    this.add([this.glowRect, this.sprite]);

    this.setAgentState('idle');
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
  }

  getState(): AgentState {
    return this.currentAgentState;
  }

  /** Altura visual do sprite principal em coords do mundo Phaser (ja considera scale). */
  getSpriteDisplayHeight(): number {
    return this.sprite.displayHeight;
  }

  /**
   * Retorna o bounds do sprite visual interno (Image) em coords do mundo Phaser.
   * Preferivel a `getBounds()` do Container (que depende de `this.width/height`
   * do wrapper, ainda 0 no primeiro frame apos switchSession, causando
   * label/balao colapsados em cima do agente).
   */
  getSpriteWorldBounds(): Phaser.Geom.Rectangle {
    return this.sprite.getBounds();
  }

  setAgentState(newState: AgentState): void {
    if (newState === this.currentAgentState) return;
    this.clearStateAnimations();
    this.currentAgentState = newState;

    switch (newState) {
      case 'idle': this.startIdle(); break;
      case 'active': this.startActive(); break;
      case 'moving': break;
      case 'speaking': this.startSpeaking(); break;
      case 'waiting': this.startWaiting(); break;
      case 'thinking': this.startThinking(); break;
      case 'completed': this.startCompleted(); break;
      case 'error': this.startError(); break;
    }
  }

  // @ts-expect-error — Sobrescrita intencional de Container.setState
  override setState(newState: AgentState): void {
    this.setAgentState(newState);
  }

  moveToPosition(
    targetX: number,
    targetY: number,
    speedPxPerSec: number,
    onComplete?: () => void,
  ): void {
    this.walkTween?.stop();

    const distance = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    const duration = (distance / speedPxPerSec) * 1000;

    if (targetX < this.x) {
      this.sprite.setFlipX(true);
    } else if (targetX > this.x) {
      this.sprite.setFlipX(false);
    }

    this.walkTween = this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: Math.max(duration, 100),
      ease: 'Power1',
      onUpdate: () => {
        // Sincronizar posicao com o store para o overlay HTML acompanhar
        theaterStore.getState().updateAgentPosition(this.agentId, { x: this.x, y: this.y });
      },
      onComplete: () => onComplete?.(),
    });
  }

  // @ts-expect-error — Sobrescrita intencional de Container.moveTo
  override moveTo(targetX: number, targetY: number, speed: number, onComplete?: () => void): void {
    this.moveToPosition(targetX, targetY, speed, onComplete);
  }

  /** Mostra balao de fala via store (renderizado pelo React) */
  speak(text: string): void {
    theaterStore.getState().setAgentSpeech(this.agentId, text);
  }

  /** Esconde balao de fala via store */
  hideSpeech(): void {
    theaterStore.getState().setAgentSpeech(this.agentId, undefined);
  }

  // ---------------------------------------------------------------------------
  // Animacoes de estado
  // ---------------------------------------------------------------------------

  private startIdle(): void {
    this.sprite.setAlpha(1);
    this.glowRect.setVisible(false);
    this.breathTween = this.scene.tweens.add({
      targets: this.sprite,
      y: -1,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private startActive(): void {
    this.glowRect.setVisible(true);
    this.glowTween = this.scene.tweens.add({
      targets: this.glowRect,
      alpha: GLOW_ALPHA,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.breathTween = this.scene.tweens.add({
      targets: this.sprite,
      y: -1,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private startSpeaking(): void {
    this.glowRect.setVisible(true);
    this.glowRect.setAlpha(GLOW_ALPHA);
    this.bounceTween = this.scene.tweens.add({
      targets: this.sprite,
      y: -2,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private startWaiting(): void {
    this.sprite.setAlpha(0.8);
    this.showStatusIcon('icon_waiting');
    if (this.statusIcon) {
      this.iconTween = this.scene.tweens.add({
        targets: this.statusIcon,
        alpha: 0.3,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private startThinking(): void {
    this.showStatusIcon('icon_thinking');
    if (this.statusIcon) {
      this.iconTween = this.scene.tweens.add({
        targets: this.statusIcon,
        angle: 360,
        duration: 2000,
        repeat: -1,
        ease: 'Linear',
      });
    }
  }

  private startCompleted(): void {
    this.showStatusIcon('icon_completed');
    if (this.statusIcon) {
      this.statusIcon.setScale(0);
      this.scene.tweens.add({
        targets: this.statusIcon,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Back.easeOut',
      });
    }
    this.scene.time.delayedCall(2000, () => {
      if (this.currentAgentState === 'completed') {
        this.setAgentState('idle');
      }
    });
  }

  private startError(): void {
    this.showStatusIcon('icon_error');
    let flashCount = 0;
    this.scene.time.addEvent({
      delay: 150,
      repeat: 5,
      callback: () => {
        flashCount++;
        if (flashCount % 2 === 1) {
          this.sprite.setTint(0xe74c3c);
        } else {
          this.sprite.clearTint();
        }
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private showStatusIcon(textureKey: string): void {
    this.removeStatusIcon();
    this.statusIcon = this.scene.add.image(0, -20, textureKey);
    this.statusIcon.setOrigin(0.5, 0.5);
    this.add(this.statusIcon);
  }

  private removeStatusIcon(): void {
    if (this.statusIcon) {
      this.statusIcon.destroy();
      this.statusIcon = null;
    }
  }

  private clearStateAnimations(): void {
    this.breathTween?.stop();
    this.breathTween = undefined;
    this.glowTween?.stop();
    this.glowTween = undefined;
    this.bounceTween?.stop();
    this.bounceTween = undefined;
    this.iconTween?.stop();
    this.iconTween = undefined;

    this.sprite.y = 0;
    this.sprite.setAlpha(1);
    this.sprite.clearTint();
    this.glowRect.setVisible(false);
    this.glowRect.setAlpha(GLOW_ALPHA);
    this.removeStatusIcon();
  }

  override destroy(fromScene?: boolean): void {
    this.clearStateAnimations();
    this.walkTween?.stop();
    // Limpar speech no store ao destruir
    theaterStore.getState().setAgentSpeech(this.agentId, undefined);
    super.destroy(fromScene);
  }
}
