/**
 * Geração procedural de sprites de agentes em pixel art.
 *
 * Cria sprites 32x32 diretamente no canvas para evitar dependência
 * de assets externos. Estilo RPG clássico 16-bit simplificado.
 *
 * Todas as funções verificam se a scene está ativa antes de criar objetos,
 * retornando false se a scene não está pronta (evita TypeError: null 'add').
 */

import Phaser from 'phaser';

// ---------------------------------------------------------------------------
// Tipos e helpers de cor
// ---------------------------------------------------------------------------

interface SpriteColors {
  primary: number;
  dark: number;
  skin: number;
}

function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

function darken(hex: string, amount: number): number {
  const num = hexToNum(hex);
  const r = Math.max(0, ((num >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((num >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (num & 0xff) * (1 - amount));
  return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
}

function getColors(agentColor: string): SpriteColors {
  return {
    primary: hexToNum(agentColor),
    dark: darken(agentColor, 0.35),
    skin: 0xf5d0a9,
  };
}

// ---------------------------------------------------------------------------
// Guard e helper de graphics
// ---------------------------------------------------------------------------

/**
 * Cria um graphics temporário para geração de textura.
 * Usa try/catch como defesa final contra race conditions onde scene.add
 * fica null entre o check e o uso (Vite HMR, React StrictMode).
 */
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

/** Verifica se a scene pode usar o texture manager */
function hasTextures(scene: Phaser.Scene): boolean {
  try {
    return !!scene?.textures;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Geração de texturas
// ---------------------------------------------------------------------------

/**
 * Gera textura de sprite de agente (frame idle, 32x32).
 * Retorna true se criou com sucesso, false se a scene não estava pronta.
 */
export function generateAgentTexture(
  scene: Phaser.Scene,
  textureKey: string,
  agentColor: string,
): boolean {
  if (!hasTextures(scene)) return false;
  if (scene.textures.exists(textureKey)) return true;

  const c = getColors(agentColor);
  const gfx = tempGraphics(scene);
  if (!gfx) return false;

  // Sombra no chão
  gfx.fillStyle(0x000000, 0.25);
  gfx.fillEllipse(16, 30, 16, 4);

  // Pés
  gfx.fillStyle(c.dark);
  gfx.fillRect(10, 26, 4, 3);
  gfx.fillRect(18, 26, 4, 3);

  // Corpo (roupa)
  gfx.fillStyle(c.primary);
  gfx.fillRect(9, 16, 14, 11);
  gfx.fillStyle(c.dark);
  gfx.fillRect(9, 16, 14, 1);
  gfx.fillRect(15, 17, 2, 9);

  // Braços
  gfx.fillStyle(c.primary);
  gfx.fillRect(6, 17, 3, 8);
  gfx.fillRect(23, 17, 3, 8);

  // Mãos
  gfx.fillStyle(c.skin);
  gfx.fillRect(6, 24, 3, 2);
  gfx.fillRect(23, 24, 3, 2);

  // Cabeça
  gfx.fillStyle(c.skin);
  gfx.fillRoundedRect(10, 4, 12, 13, 3);
  gfx.fillStyle(c.dark);
  gfx.fillRoundedRect(9, 3, 14, 6, 2);

  // Olhos
  gfx.fillStyle(0xffffff);
  gfx.fillRect(13, 9, 3, 3);
  gfx.fillRect(18, 9, 3, 3);
  gfx.fillStyle(0x1a1a2e);
  gfx.fillRect(14, 10, 2, 2);
  gfx.fillRect(19, 10, 2, 2);

  // Boca
  gfx.fillStyle(0xc4956a);
  gfx.fillRect(14, 14, 4, 1);

  gfx.generateTexture(textureKey, 32, 32);
  gfx.destroy();
  return true;
}

/**
 * Gera textura de sprite de caminhada (2 frames: 64x32).
 * Retorna true se criou com sucesso.
 */
export function generateWalkTexture(
  scene: Phaser.Scene,
  textureKey: string,
  agentColor: string,
): boolean {
  if (!hasTextures(scene)) return false;
  if (scene.textures.exists(textureKey)) return true;

  const c = getColors(agentColor);
  const gfx = tempGraphics(scene);
  if (!gfx) return false;

  drawWalkFrame(gfx, 0, c, -2, 2);
  drawWalkFrame(gfx, 32, c, 2, -2);

  gfx.generateTexture(textureKey, 64, 32);
  gfx.destroy();
  return true;
}

function drawWalkFrame(
  gfx: Phaser.GameObjects.Graphics,
  ox: number,
  c: SpriteColors,
  leftOff: number,
  rightOff: number,
): void {
  gfx.fillStyle(0x000000, 0.25);
  gfx.fillEllipse(ox + 16, 30, 16, 4);

  gfx.fillStyle(c.dark);
  gfx.fillRect(ox + 10 + leftOff, 26, 4, 3);
  gfx.fillRect(ox + 18 + rightOff, 26, 4, 3);

  gfx.fillStyle(c.primary);
  gfx.fillRect(ox + 9, 16, 14, 11);
  gfx.fillStyle(c.dark);
  gfx.fillRect(ox + 9, 16, 14, 1);
  gfx.fillRect(ox + 15, 17, 2, 9);

  gfx.fillStyle(c.primary);
  gfx.fillRect(ox + 6, 17 + leftOff, 3, 8);
  gfx.fillRect(ox + 23, 17 + rightOff, 3, 8);

  gfx.fillStyle(c.skin);
  gfx.fillRect(ox + 6, 24 + leftOff, 3, 2);
  gfx.fillRect(ox + 23, 24 + rightOff, 3, 2);

  gfx.fillStyle(c.skin);
  gfx.fillRoundedRect(ox + 10, 4, 12, 13, 3);
  gfx.fillStyle(c.dark);
  gfx.fillRoundedRect(ox + 9, 3, 14, 6, 2);
  gfx.fillStyle(0xffffff);
  gfx.fillRect(ox + 13, 9, 3, 3);
  gfx.fillRect(ox + 18, 9, 3, 3);
  gfx.fillStyle(0x1a1a2e);
  gfx.fillRect(ox + 14, 10, 2, 2);
  gfx.fillRect(ox + 19, 10, 2, 2);
}

/** Gera texturas para ícones de estado. Retorna true se OK. */
export function generateStatusIcons(scene: Phaser.Scene): boolean {
  if (!hasTextures(scene)) return false;
  if (scene.textures.exists('icon_thinking')) return true;

  // Engrenagem (thinking)
  let gfx = tempGraphics(scene);
  if (!gfx) return false;
  gfx.fillStyle(0xf1c40f);
  gfx.fillCircle(6, 6, 5);
  gfx.fillStyle(0x0a0a14);
  gfx.fillCircle(6, 6, 2);
  gfx.fillStyle(0xf1c40f);
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    gfx.fillRect(6 + Math.cos(angle) * 5 - 1, 6 + Math.sin(angle) * 5 - 1, 3, 3);
  }
  gfx.generateTexture('icon_thinking', 12, 12);
  gfx.destroy();

  // Checkmark (completed)
  gfx = tempGraphics(scene)!;
  if (!gfx) return false;
  gfx.fillStyle(0x2ecc71);
  gfx.fillCircle(6, 6, 6);
  gfx.lineStyle(2, 0xffffff);
  gfx.beginPath();
  gfx.moveTo(3, 6);
  gfx.lineTo(5, 9);
  gfx.lineTo(9, 3);
  gfx.strokePath();
  gfx.generateTexture('icon_completed', 12, 12);
  gfx.destroy();

  // X (error)
  gfx = tempGraphics(scene)!;
  if (!gfx) return false;
  gfx.fillStyle(0xe74c3c);
  gfx.fillCircle(6, 6, 6);
  gfx.lineStyle(2, 0xffffff);
  gfx.beginPath();
  gfx.moveTo(3, 3);
  gfx.lineTo(9, 9);
  gfx.moveTo(9, 3);
  gfx.lineTo(3, 9);
  gfx.strokePath();
  gfx.generateTexture('icon_error', 12, 12);
  gfx.destroy();

  // Três pontos (waiting)
  gfx = tempGraphics(scene)!;
  if (!gfx) return false;
  gfx.fillStyle(0x8888aa);
  gfx.fillCircle(3, 4, 2);
  gfx.fillCircle(8, 4, 2);
  gfx.fillCircle(13, 4, 2);
  gfx.generateTexture('icon_waiting', 16, 8);
  gfx.destroy();

  return true;
}

/** Gera texturas de tiles do cenário de escritório. Retorna true se OK. */
export function generateTileTextures(scene: Phaser.Scene): boolean {
  if (!hasTextures(scene)) return false;
  if (scene.textures.exists('tile_floor_0')) return true;

  const s = 32;

  // Piso de escritório — azul/cinza claro com grid quadriculado
  for (let i = 0; i < 4; i++) {
    const gfx = tempGraphics(scene);
    if (!gfx) return false;
    // Cores alternadas de piso corporativo
    const base = i % 2 === 0 ? 0x2b3a4a : 0x263545;
    gfx.fillStyle(base);
    gfx.fillRect(0, 0, s, s);
    // Juntas do piso (linhas finas)
    gfx.fillStyle(0x1e2d3d, 0.5);
    gfx.fillRect(0, 0, s, 1);
    gfx.fillRect(0, 0, 1, s);
    // Reflexo sutil no piso
    if (i === 0 || i === 3) {
      gfx.fillStyle(0x344a5c, 0.3);
      gfx.fillRect(4, 4, 8, 8);
    }
    gfx.generateTexture(`tile_floor_${i}`, s, s);
    gfx.destroy();
  }

  // Tile de área de reunião (mais claro, carpete)
  let gfx = tempGraphics(scene);
  if (!gfx) return false;
  gfx.fillStyle(0x3a4f63);
  gfx.fillRect(0, 0, s, s);
  gfx.fillStyle(0x344a5c, 0.4);
  gfx.fillRect(0, 0, s, 1);
  gfx.fillRect(0, 0, 1, s);
  gfx.generateTexture('tile_highlight', s, s);
  gfx.destroy();

  // Parede do escritório (topo, cinza escuro com rodapé)
  gfx = tempGraphics(scene);
  if (!gfx) return false;
  gfx.fillStyle(0x1a2636);
  gfx.fillRect(0, 0, s, s);
  // Rodapé
  gfx.fillStyle(0x3a4f63);
  gfx.fillRect(0, s - 3, s, 3);
  // Textura de parede sutil
  gfx.fillStyle(0x1e2a3a, 0.5);
  gfx.fillRect(0, 8, s, 1);
  gfx.fillRect(0, 16, s, 1);
  gfx.generateTexture('tile_wall', s, s);
  gfx.destroy();

  return true;
}

/**
 * Gera texturas de mobília ambiente do escritório (sofás, plantas, estantes,
 * cadeira genérica). A mesa individual e a mesa de reunião ficaram fora
 * desta função a partir da #537bd1b5 — agora são geradas por
 * `apps/web/src/phaser/sprites/textures.ts` e consumidas pelos containers
 * `OfficeDesk` / `MeetingTable` spawnados dinamicamente.
 */
export function generateOfficeTextures(scene: Phaser.Scene): boolean {
  if (!hasTextures(scene)) return false;
  if (scene.textures.exists('furniture_sofa')) return true;

  // Sofá (32x16, azul)
  let gfx = tempGraphics(scene);
  if (!gfx) return false;
  // Base
  gfx.fillStyle(0x2c5f8a);
  gfx.fillRoundedRect(0, 4, 32, 12, 3);
  // Encosto
  gfx.fillStyle(0x2a5580);
  gfx.fillRoundedRect(2, 0, 28, 6, 2);
  // Almofadas
  gfx.fillStyle(0x3470a0, 0.7);
  gfx.fillRoundedRect(3, 6, 12, 8, 2);
  gfx.fillRoundedRect(17, 6, 12, 8, 2);
  gfx.generateTexture('furniture_sofa', 32, 16);
  gfx.destroy();

  // Planta (16x20, vaso com folhas)
  gfx = tempGraphics(scene);
  if (!gfx) return false;
  // Vaso
  gfx.fillStyle(0x8b5e3c);
  gfx.fillRect(4, 12, 8, 8);
  gfx.fillStyle(0x7a5232);
  gfx.fillRect(3, 12, 10, 2);
  // Folhas
  gfx.fillStyle(0x2d8a4e);
  gfx.fillCircle(8, 8, 6);
  gfx.fillStyle(0x3ca55e);
  gfx.fillCircle(5, 6, 4);
  gfx.fillCircle(11, 6, 4);
  gfx.fillCircle(8, 3, 3);
  gfx.generateTexture('furniture_plant', 16, 20);
  gfx.destroy();

  // Estante (20x28, prateleiras com livros)
  gfx = tempGraphics(scene);
  if (!gfx) return false;
  // Estrutura
  gfx.fillStyle(0x5c4033);
  gfx.fillRect(0, 0, 20, 28);
  // Prateleiras
  gfx.fillStyle(0x6b4c3b);
  gfx.fillRect(0, 0, 20, 2);
  gfx.fillRect(0, 9, 20, 2);
  gfx.fillRect(0, 18, 20, 2);
  gfx.fillRect(0, 26, 20, 2);
  // Livros coloridos
  const bookColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6];
  for (let shelf = 0; shelf < 3; shelf++) {
    const shelfY = 2 + shelf * 9;
    for (let b = 0; b < 4; b++) {
      gfx.fillStyle(bookColors[(shelf * 4 + b) % bookColors.length]);
      gfx.fillRect(2 + b * 4, shelfY + 1, 3, 6);
    }
  }
  gfx.generateTexture('furniture_bookshelf', 20, 28);
  gfx.destroy();

  // Cadeira (12x12, vista de cima)
  gfx = tempGraphics(scene);
  if (!gfx) return false;
  gfx.fillStyle(0x333333);
  gfx.fillCircle(6, 6, 5);
  gfx.fillStyle(0x444444);
  gfx.fillCircle(6, 6, 3);
  gfx.generateTexture('furniture_chair', 12, 12);
  gfx.destroy();

  return true;
}

/** Gera textura do balão de fala. Retorna true se OK. */
export function generateBubbleTexture(scene: Phaser.Scene): boolean {
  if (!hasTextures(scene)) return false;
  if (scene.textures.exists('bubble_bg')) return true;

  const gfx = tempGraphics(scene);
  if (!gfx) return false;
  gfx.fillStyle(0xffffff, 0.95);
  gfx.fillRoundedRect(0, 0, 24, 24, 4);
  gfx.lineStyle(1, 0x333333);
  gfx.strokeRoundedRect(0, 0, 24, 24, 4);
  gfx.generateTexture('bubble_bg', 24, 24);
  gfx.destroy();

  return true;
}
