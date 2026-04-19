/**
 * Helper puro (sem dependência de Phaser) para calcular posições dos assentos
 * ao redor da mesa de reunião.
 *
 * Spec #b35c9591 §3.2: 6 slots fixos com ordem preferencial S1..S6 e
 * pareamento S1+S4 para reuniões de 2 agentes (frente a frente na diagonal
 * para leitura cinematográfica).
 *
 * Todas as coordenadas retornadas são em px absolutos do world Phaser,
 * prontas para `agent.moveToPosition(seat.x, seat.y, ...)`.
 */

/** Lado da mesa que o agente está "encarando" a partir do slot */
export type SeatFacing = 'N' | 'S' | 'E' | 'W';

export interface SeatPosition {
  /** Coordenada x absoluta no world Phaser */
  x: number;
  /** Coordenada y absoluta no world Phaser */
  y: number;
  /** Direção em que o agente deve estar "olhando" para encarar a mesa */
  facing: SeatFacing;
}

/**
 * Offsets fixos dos 6 slots relativos ao centro da mesa.
 * Ordem: S1, S2, S3, S4, S5, S6 (spec §3.2).
 *
 * Layout:
 * ```
 *          [S1]   [S2]
 *   [S6]  [=== mesa ===]  [S3]
 *          [S5]   [S4]
 * ```
 */
const SEAT_OFFSETS: ReadonlyArray<{ dx: number; dy: number; facing: SeatFacing }> = [
  { dx: -24, dy: -40, facing: 'S' }, // S1 — topo esquerda, olhando pra baixo
  { dx: 24, dy: -40, facing: 'S' },  // S2 — topo direita
  { dx: 64, dy: 0, facing: 'W' },    // S3 — direita central, olhando pra esquerda
  { dx: 24, dy: 40, facing: 'N' },   // S4 — base direita
  { dx: -24, dy: 40, facing: 'N' },  // S5 — base esquerda
  { dx: -64, dy: 0, facing: 'E' },   // S6 — esquerda central, olhando pra direita
];

/**
 * Ordem de preenchimento dos slots por quantidade de agentes.
 *
 * - 1 agente: S1 (caso degenerado — mesa sozinho).
 * - 2 agentes: S1 + S4 (diagonal frente a frente, spec §3.2).
 * - 3 agentes: S1 + S4 + S3 (triângulo).
 * - 4..6 agentes: continua S1→S6 em ordem, pulando já preenchidos.
 */
const FILL_ORDER: ReadonlyArray<ReadonlyArray<number>> = [
  [],                    // n=0
  [0],                   // n=1: S1
  [0, 3],                // n=2: S1, S4
  [0, 3, 2],             // n=3: S1, S4, S3
  [0, 3, 2, 5],          // n=4: S1, S4, S3, S6
  [0, 3, 2, 5, 1],       // n=5: +S2
  [0, 3, 2, 5, 1, 4],    // n=6: +S5
];

/** Quantidade máxima de slots disponíveis na mesa */
export const MAX_MEETING_SEATS = SEAT_OFFSETS.length;

/**
 * Retorna as posições dos `n` assentos a serem ocupados ao redor da mesa
 * centrada em `(tableX, tableY)`.
 *
 * Para `n > MAX_MEETING_SEATS`, os excedentes são distribuídos ciclando
 * sobre os mesmos 6 slots (degenera visualmente — aceitável para debug,
 * mas o MVP só usa N ≤ 2).
 *
 * @example
 * const seats = getMeetingSeatPositions(820, 300, 2);
 * // seats = [
 * //   { x: 796, y: 260, facing: 'S' },  // S1
 * //   { x: 844, y: 340, facing: 'N' },  // S4
 * // ]
 */
export function getMeetingSeatPositions(
  tableX: number,
  tableY: number,
  n: number,
): SeatPosition[] {
  if (n <= 0) return [];

  const capped = Math.max(0, Math.floor(n));
  const order =
    capped < FILL_ORDER.length
      ? FILL_ORDER[capped]
      : // Overflow defensivo: cicla sobre os 6 slots
        Array.from({ length: capped }, (_, i) => i % MAX_MEETING_SEATS);

  return order.map((slotIdx) => {
    const offset = SEAT_OFFSETS[slotIdx];
    return {
      x: tableX + offset.dx,
      y: tableY + offset.dy,
      facing: offset.facing,
    };
  });
}

/**
 * Retorna os 6 slots fixos (sem depender de N), útil para renderizar
 * cadeiras estáticas ao redor da mesa.
 */
export function getAllMeetingSeats(
  tableX: number,
  tableY: number,
): SeatPosition[] {
  return SEAT_OFFSETS.map((offset) => ({
    x: tableX + offset.dx,
    y: tableY + offset.dy,
    facing: offset.facing,
  }));
}
