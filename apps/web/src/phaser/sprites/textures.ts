/**
 * Geração procedural das texturas dos novos sprites de mobília.
 *
 * Texturas novas, com chaves distintas das legadas `furniture_*` em
 * SpriteFactory.ts, para permitir coexistência temporária enquanto
 * a integração é feita pela @ana-frontend.
 *
 * Paleta e dimensões seguem a UX spec #b35c9591 §0 e §3.1.
 */

import Phaser from 'phaser';

// ---------------------------------------------------------------------------
// Chaves públicas — use estas ao fazer `scene.add.image(x, y, TEX_*)`
// ---------------------------------------------------------------------------

/**
 * Chaves de textura com prefixo `sprite_*` — distintas das legadas
 * `furniture_*` em SpriteFactory.ts. Evita colisão acidental via
 * `scene.textures.exists()` e sinaliza visualmente a pipeline nova em
 * code review. Ratificado pelo tech lead (#ccf5ad3e).
 */

/** Textura da mesa de escritório individual (40x28, 3 frames: idle/occupied/away) */
export const TEX_DESK_INDIVIDUAL_IDLE = 'sprite_desk_individual_idle';
export const TEX_DESK_INDIVIDUAL_OCCUPIED = 'sprite_desk_individual_occupied';
export const TEX_DESK_INDIVIDUAL_AWAY = 'sprite_desk_individual_away';

/** Textura da mesa de reunião retangular (96x56) */
export const TEX_MEETING_TABLE = 'sprite_meeting_table';

/** Textura da cadeira ao redor da mesa de reunião (12x12 top-down) */
export const TEX_MEETING_CHAIR = 'sprite_meeting_chair';

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

function tempGraphics(scene: Phaser.Scene): Phaser.GameObjects.Graphics | null {
  try {
    if (!scene?.add) return null;
    const gfx = scene.add.graphics();
    gfx.setVisible(false);
    return gfx;
  } catch {
    return null;
  }
}

function hasTextures(scene: Phaser.Scene): boolean {
  try {
    return !!scene?.textures;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Mesa individual — 40x28
// ---------------------------------------------------------------------------

interface DeskParts {
  topColor: number;
  shadowColor: number;
  monitorBezel: number;
  screenColor: number;
  screenAlpha: number;
  keyboardColor: number;
  baseColor: number;
}

// Paleta fiel à spec §0 (madeira clara + monitor)
const DESK_BASE_PARTS: DeskParts = {
  topColor: 0x8b7355,
  shadowColor: 0x6b5540,
  monitorBezel: 0x1a1a2e,
  screenColor: 0x4169e1,
  screenAlpha: 0.6,
  keyboardColor: 0x444444,
  baseColor: 0x555555,
};

/**
 * Desenha a mesa individual no graphics com o estilo fornecido.
 * Coords locais: canto superior esquerdo em (0,0), extent 40x28.
 *
 * Layout (top-down leve 3/4, spec §0):
 *   - Tampo 40x24 com arredondamento 2px e pequena sombra inferior 4px.
 *   - Monitor centrado no topo (14x8 bezel, tela 12x6 com alpha).
 *   - Base do monitor (4x2).
 *   - Teclado (16x2) abaixo do monitor.
 */
function drawDesk(gfx: Phaser.GameObjects.Graphics, parts: DeskParts): void {
  // Tampo
  gfx.fillStyle(parts.topColor);
  gfx.fillRoundedRect(0, 2, 40, 22, 2);

  // Sombra inferior — sensação de volume
  gfx.fillStyle(parts.shadowColor);
  gfx.fillRect(0, 22, 40, 4);

  // Monitor (bezel)
  gfx.fillStyle(parts.monitorBezel);
  gfx.fillRect(13, 4, 14, 10);

  // Tela
  if (parts.screenAlpha > 0) {
    gfx.fillStyle(parts.screenColor, parts.screenAlpha);
    gfx.fillRect(14, 5, 12, 8);
  }

  // Base do monitor
  gfx.fillStyle(parts.baseColor);
  gfx.fillRect(18, 14, 4, 2);

  // Teclado
  gfx.fillStyle(parts.keyboardColor);
  gfx.fillRect(12, 17, 16, 3);
}

/**
 * Gera textura da mesa em um dos 3 estados visuais.
 * Idempotente: se a chave já existe, apenas retorna true.
 */
function generateDeskTexture(
  scene: Phaser.Scene,
  key: string,
  parts: DeskParts,
): boolean {
  if (!hasTextures(scene)) return false;
  if (scene.textures.exists(key)) return true;

  const gfx = tempGraphics(scene);
  if (!gfx) return false;

  drawDesk(gfx, parts);
  gfx.generateTexture(key, 40, 28);
  gfx.destroy();
  return true;
}

/**
 * Gera as 3 texturas da mesa individual (idle, occupied, away).
 * - idle: monitor ligado (tela azul com brilho).
 * - occupied: idêntico ao idle (o glow do agente fica por conta do container,
 *   não da textura — assim não dependemos da cor do agente para gerar textura).
 * - away: tela em standby (sem o brilho azul).
 *
 * Retorna true se todas as texturas estiverem disponíveis.
 */
export function generateOfficeDeskTextures(scene: Phaser.Scene): boolean {
  const idleOk = generateDeskTexture(scene, TEX_DESK_INDIVIDUAL_IDLE, DESK_BASE_PARTS);

  // `occupied` compartilha a textura do `idle` visualmente; mantemos uma chave
  // distinta para permitir variação futura sem mexer nos consumidores.
  const occupiedOk = generateDeskTexture(scene, TEX_DESK_INDIVIDUAL_OCCUPIED, DESK_BASE_PARTS);

  const awayOk = generateDeskTexture(scene, TEX_DESK_INDIVIDUAL_AWAY, {
    ...DESK_BASE_PARTS,
    // Tela escurecida — spec §2.3: comunica "ninguém aqui agora"
    screenAlpha: 0,
  });

  return idleOk && occupiedOk && awayOk;
}

// ---------------------------------------------------------------------------
// Mesa de reunião — 96x56 retangular
// ---------------------------------------------------------------------------

/**
 * Gera textura da mesa de reunião (spec §3.1).
 *
 * Layout (96x56, origin 0.5 no container):
 *   - Sombra inferior achatada (elipse 92x10 deslocada 4px).
 *   - Tampo retangular 96x56 com cantos arredondados 6px, madeira escura.
 *   - Highlight superior central (elipse 64x18 @ 0.5) — madeira polida.
 */
export function generateMeetingTableTexture(scene: Phaser.Scene): boolean {
  if (!hasTextures(scene)) return false;
  if (scene.textures.exists(TEX_MEETING_TABLE)) return true;

  const gfx = tempGraphics(scene);
  if (!gfx) return false;

  // Sombra no chão
  gfx.fillStyle(0x000000, 0.2);
  gfx.fillEllipse(48, 52, 92, 10);

  // Tampo retangular (madeira escura)
  gfx.fillStyle(0x5c4033);
  gfx.fillRoundedRect(0, 0, 96, 56, 6);

  // Highlight central — sensação de verniz
  gfx.fillStyle(0x6b4c3b, 0.5);
  gfx.fillEllipse(48, 20, 64, 18);

  gfx.generateTexture(TEX_MEETING_TABLE, 96, 56);
  gfx.destroy();
  return true;
}

// ---------------------------------------------------------------------------
// Cadeira da mesa de reunião — 12x12 top-down
// ---------------------------------------------------------------------------

/**
 * Cadeira vista de cima. Visualmente compatível com `furniture_chair` legado,
 * mas com chave distinta para permitir tuning independente.
 */
export function generateMeetingChairTexture(scene: Phaser.Scene): boolean {
  if (!hasTextures(scene)) return false;
  if (scene.textures.exists(TEX_MEETING_CHAIR)) return true;

  const gfx = tempGraphics(scene);
  if (!gfx) return false;

  // Sombra no chão
  gfx.fillStyle(0x000000, 0.2);
  gfx.fillEllipse(6, 10, 10, 3);

  // Assento (cinza escuro)
  gfx.fillStyle(0x333333);
  gfx.fillCircle(6, 6, 5);

  // Almofada (cinza mais claro)
  gfx.fillStyle(0x4a4a4a);
  gfx.fillCircle(6, 6, 3);

  gfx.generateTexture(TEX_MEETING_CHAIR, 12, 12);
  gfx.destroy();
  return true;
}

// ---------------------------------------------------------------------------
// Entrypoint conveniente
// ---------------------------------------------------------------------------

/**
 * Gera todas as texturas dos sprites novos. Pode ser chamado no `preload`
 * ou no `create` da scene — é idempotente. Retorna true se tudo OK.
 */
export function generateSpriteTextures(scene: Phaser.Scene): boolean {
  const a = generateOfficeDeskTextures(scene);
  const b = generateMeetingTableTexture(scene);
  const c = generateMeetingChairTexture(scene);
  return a && b && c;
}
