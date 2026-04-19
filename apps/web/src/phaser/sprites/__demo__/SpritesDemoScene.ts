/**
 * Cena standalone de demonstração visual dos sprites novos.
 *
 * Não é usada em produção — existe apenas para validar o visual da
 * `OfficeDesk` (3 estados) e da `MeetingTable` (6 cadeiras) sem depender
 * do fluxo completo do palco.
 *
 * Como usar (ex. ad-hoc no browser devtools com Vite HMR, ou trocando
 * `config.ts::scene` temporariamente):
 *
 * ```ts
 * import { SpritesDemoScene } from './sprites/__demo__/SpritesDemoScene.js';
 * // config: scene: [SpritesDemoScene]
 * ```
 */

import Phaser from 'phaser';
import { OfficeDesk, MeetingTable, getMeetingSeatPositions } from '../index.js';

export class SpritesDemoScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SpritesDemoScene' });
  }

  create(): void {
    // Fundo neutro para contraste
    this.cameras.main.setBackgroundColor('#1a2636');

    this.drawLabel(480, 20, 'Sprites Demo — OfficeDesk (3 estados) + MeetingTable');

    // --- OfficeDesk: 3 estados lado a lado --------------------------------

    this.drawLabel(160, 70, 'OfficeDesk.state:');

    // idle
    new OfficeDesk(this, 120, 140, { state: 'idle' });
    this.drawLabel(120, 175, 'idle');

    // occupied (com glow)
    new OfficeDesk(this, 260, 140, {
      state: 'occupied',
      highlightColor: '#4169E1',
    });
    this.drawLabel(260, 175, 'occupied (azul)');

    new OfficeDesk(this, 400, 140, {
      state: 'occupied',
      highlightColor: '#E74C3C',
    });
    this.drawLabel(400, 175, 'occupied (vermelho)');

    // away
    new OfficeDesk(this, 540, 140, { state: 'away' });
    this.drawLabel(540, 175, 'away');

    // --- MeetingTable: 2, 4 e 6 cadeiras -----------------------------------

    this.drawLabel(160, 220, 'MeetingTable.seats:');

    const tA = { x: 170, y: 320 };
    new MeetingTable(this, tA.x, tA.y, { seats: 2 });
    this.drawLabel(tA.x, tA.y + 60, 'seats=2');
    this.drawSeatDots(tA.x, tA.y, 2, 0x2ecc71);

    const tB = { x: 450, y: 320 };
    new MeetingTable(this, tB.x, tB.y, { seats: 4 });
    this.drawLabel(tB.x, tB.y + 60, 'seats=4');
    this.drawSeatDots(tB.x, tB.y, 4, 0x2ecc71);

    const tC = { x: 780, y: 320 };
    new MeetingTable(this, tC.x, tC.y, { seats: 6 });
    this.drawLabel(tC.x, tC.y + 60, 'seats=6');
    this.drawSeatDots(tC.x, tC.y, 6, 0x2ecc71);

    // --- Footer com info sobre o helper ------------------------------------

    this.drawLabel(
      480,
      450,
      'Pontos verdes = getMeetingSeatPositions() — onde o agente caminha.',
    );
  }

  private drawLabel(x: number, y: number, text: string): void {
    this.add
      .text(x, y, text, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0.5);
  }

  /**
   * Sobrepõe marcadores nos assentos calculados pelo helper — valida que
   * as posições retornadas batem com as cadeiras renderizadas.
   */
  private drawSeatDots(tableX: number, tableY: number, n: number, color: number): void {
    const seats = getMeetingSeatPositions(tableX, tableY, n);
    const gfx = this.add.graphics();
    gfx.fillStyle(color, 0.9);
    for (const seat of seats) {
      gfx.fillCircle(seat.x, seat.y, 3);
    }
  }
}
