/**
 * API pública dos sprites novos de mobília.
 *
 * @see apps/web/src/phaser/sprites/OfficeDesk.ts
 * @see apps/web/src/phaser/sprites/MeetingTable.ts
 * @see apps/web/src/phaser/sprites/seatPositions.ts
 *
 * Consumo típico pela @ana-frontend em `TheaterScene.ts`:
 *
 * ```ts
 * import {
 *   OfficeDesk,
 *   MeetingTable,
 *   getMeetingSeatPositions,
 *   MEETING_TABLE_DEFAULT_POS,
 * } from './sprites/index.js';
 *
 * // 1. Mesa individual por agente
 * const desk = new OfficeDesk(this, deskX, deskY, {
 *   state: 'occupied',
 *   highlightColor: agent.color,
 * });
 *
 * // 2. Mesa de reunião estática (uma por cena)
 * const meeting = new MeetingTable(this, 820, 300);
 *
 * // 3. Quando uma conversa inicia, pegar posições dos assentos
 * const seats = getMeetingSeatPositions(820, 300, 2);
 * // seats[0] → agente emissor caminha até ali
 * // seats[1] → agente destinatário caminha até ali
 * ```
 */

export { OfficeDesk } from './OfficeDesk.js';
export type { OfficeDeskState, OfficeDeskOptions } from './OfficeDesk.js';

export { MeetingTable } from './MeetingTable.js';
export type { MeetingTableOptions } from './MeetingTable.js';

export {
  getMeetingSeatPositions,
  getAllMeetingSeats,
  MAX_MEETING_SEATS,
} from './seatPositions.js';
export type { SeatPosition, SeatFacing } from './seatPositions.js';

export {
  generateSpriteTextures,
  generateOfficeDeskTextures,
  generateMeetingTableTexture,
  generateMeetingChairTexture,
  TEX_DESK_INDIVIDUAL_IDLE,
  TEX_DESK_INDIVIDUAL_OCCUPIED,
  TEX_DESK_INDIVIDUAL_AWAY,
  TEX_MEETING_TABLE,
  TEX_MEETING_CHAIR,
} from './textures.js';

/**
 * Posição padrão sugerida pela UX spec (#b35c9591 §3.2) para a mesa de
 * reunião isolada no canvas 960x540 do palco. A @ana-frontend pode sobrescrever.
 */
export const MEETING_TABLE_DEFAULT_POS = { x: 820, y: 300 } as const;
