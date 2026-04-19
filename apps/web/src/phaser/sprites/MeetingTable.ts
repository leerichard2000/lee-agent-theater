/**
 * Sprite da mesa de reunião isolada.
 *
 * `MeetingTable` é um `Phaser.GameObjects.Container` que combina:
 * - a textura da mesa retangular 96x56 (spec #b35c9591 §3.1);
 * - N cadeiras estáticas nos 6 slots ao redor (spec §3.3).
 *
 * As posições dos assentos (para onde os agentes caminham) são expostas
 * pelo helper puro `getMeetingSeatPositions()` em `./seatPositions.ts`,
 * para que a @ana-frontend possa consumir sem instanciar a mesa.
 *
 * Spec: #b35c9591 §3 (dimensões, posição, 6 slots).
 */

import Phaser from 'phaser';
import {
  TEX_MEETING_TABLE,
  TEX_MEETING_CHAIR,
  generateMeetingTableTexture,
  generateMeetingChairTexture,
} from './textures.js';
import { getAllMeetingSeats, MAX_MEETING_SEATS } from './seatPositions.js';

export interface MeetingTableOptions {
  /**
   * Quantidade de cadeiras estáticas a renderizar ao redor da mesa.
   * Default: 6 (todos os slots). Clamp: [0, MAX_MEETING_SEATS].
   */
  seats?: number;
}

export class MeetingTable extends Phaser.GameObjects.Container {
  private tableImage: Phaser.GameObjects.Image;
  private chairImages: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, options: MeetingTableOptions = {}) {
    super(scene, x, y);

    // Garante que as texturas existem (idempotente)
    generateMeetingTableTexture(scene);
    generateMeetingChairTexture(scene);

    const seatCount = clamp(options.seats ?? MAX_MEETING_SEATS, 0, MAX_MEETING_SEATS);

    // Cadeiras renderizadas como filhos em coords locais (relativas ao centro
    // da mesa). Usamos os offsets da mesma fonte da `seatPositions` para
    // garantir que a cadeira visível fique exatamente onde o agente vai parar.
    const seatWorldCoords = getAllMeetingSeats(x, y).slice(0, seatCount);
    for (const seat of seatWorldCoords) {
      const chair = scene.add.image(seat.x - x, seat.y - y, TEX_MEETING_CHAIR);
      chair.setOrigin(0.5, 0.5);
      this.chairImages.push(chair);
    }

    // Mesa renderizada por cima das cadeiras (cobre a parte "dentro" da mesa)
    this.tableImage = scene.add.image(0, 0, TEX_MEETING_TABLE);
    this.tableImage.setOrigin(0.5, 0.5);

    this.add([...this.chairImages, this.tableImage]);

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
  }

  /**
   * Dimensões visuais da mesa (sem contar as cadeiras). Spec §3.1.
   */
  static readonly WIDTH = 96;
  static readonly HEIGHT = 56;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(n)));
}
