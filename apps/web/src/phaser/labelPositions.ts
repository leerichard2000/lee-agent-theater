/**
 * Posicoes DOM dos labels/baloes sincronizadas com sprites Phaser.
 *
 * Zustand-vanilla store preenchido pelo `postrender` da TheaterScene com
 * coordenadas de viewport (ja em pixels DOM, relativas a janela) para cada
 * agente. Componentes React renderizam labels em `position: fixed` lendo
 * esses valores — evita RAF burst e medicao stale no React.
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

export interface LabelPosition {
  /** Altura efetiva do sprite em DOM px (ja multiplicada pelo scale do canvas) */
  spriteHeightDom: number;
  /** Largura efetiva do sprite em DOM px */
  spriteWidthDom: number;
  /** Coordenada X do centro do sprite em viewport px (position: fixed) */
  centerX: number;
  /** Coordenada Y do topo do sprite em viewport px */
  spriteTop: number;
  /** Coordenada Y da base do sprite em viewport px */
  spriteBottom: number;
  /** Coordenada X da borda esquerda do sprite em viewport px */
  spriteLeft: number;
  /** Coordenada X da borda direita do sprite em viewport px */
  spriteRight: number;
  /** Indica se o agente esta visivel (sprite existe na cena) */
  visible: boolean;
}

interface LabelPositionsState {
  positions: Record<string, LabelPosition>;
  setPosition: (agentId: string, pos: LabelPosition) => void;
  removePosition: (agentId: string) => void;
  /** Substitui o mapa inteiro — usado pelo sync em lote do postrender. */
  replaceAll: (positions: Record<string, LabelPosition>) => void;
}

export const labelPositionsStore = createStore<LabelPositionsState>()((set) => ({
  positions: {},
  setPosition: (agentId, pos) =>
    set((s) => ({ positions: { ...s.positions, [agentId]: pos } })),
  removePosition: (agentId) =>
    set((s) => {
      const { [agentId]: _, ...rest } = s.positions;
      return { positions: rest };
    }),
  replaceAll: (positions) => set({ positions }),
}));

export function useLabelPositions<T>(selector: (state: LabelPositionsState) => T): T {
  return useStore(labelPositionsStore, selector);
}
