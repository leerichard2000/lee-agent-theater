/**
 * Componente React wrapper para Phaser 3.
 *
 * Encapsula o lifecycle completo: criação, resize e cleanup.
 * React cuida da UI; Phaser cuida exclusivamente do canvas.
 * Segue padrão recomendado pela pesquisa #f75bf0f1.
 */

import { useRef, useEffect } from 'react';
import Phaser from 'phaser';
import { createPhaserConfig } from '../phaser/config.js';
import { setPhaserGame } from '../phaser/gameRef.js';

export function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config = createPhaserConfig(containerRef.current);
    const game = new Phaser.Game(config);
    gameRef.current = game;
    setPhaserGame(game);

    return () => {
      setPhaserGame(null);
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
