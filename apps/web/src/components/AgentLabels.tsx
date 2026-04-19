/**
 * Overlay HTML para labels dos agentes e baloes de fala.
 *
 * Le posicoes DOM ja computadas do `labelPositionsStore`, que e atualizado
 * pelo POST_UPDATE da TheaterScene a cada frame. Esse design evita RAF burst
 * e medicao stale: o Phaser e a fonte da verdade, publica a posicao real do
 * sprite (ja com tweens e Scale.FIT aplicados) em coords de viewport, e o
 * React apenas renderiza com `position: fixed`.
 *
 * Label fica logo abaixo da base do sprite; balao de fala logo acima do topo.
 */

import type { CSSProperties } from 'react';
import { useTheaterStore, type StageAgent, type SpeechDirection } from '../stores/theaterStore.js';
import { useLabelPositions, type LabelPosition } from '../phaser/labelPositions.js';

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Gap em DOM px entre a base do sprite e o topo do label. */
const LABEL_GAP_PX = 4;

/** Distancia da ponta da setinha ao sprite (em DOM px) — pequena para "encostar". */
const BUBBLE_TAIL_GAP_PX = 2;

/** Tamanho da setinha (half-base e altura). */
const TAIL_HALF_BASE = 6;
const TAIL_HEIGHT = 8;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Trunca nome longo */
function truncateName(name: string, max = 16): string {
  return name.length > max ? name.substring(0, max - 1) + '\u2026' : name;
}

/** Verifica se a speechText e exibivel (string com conteudo nao-vazio). */
function hasVisibleSpeech(text: string | undefined): text is string {
  return typeof text === 'string' && text.trim().length > 0;
}

// ---------------------------------------------------------------------------
// Label individual
// ---------------------------------------------------------------------------

function AgentLabel({ agent, pos }: { agent: StageAgent; pos: LabelPosition }) {
  return (
    <div
      style={{
        position: 'fixed',
        left: `${pos.centerX}px`,
        top: `${pos.spriteBottom + LABEL_GAP_PX}px`,
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <span
        className="inline-block whitespace-nowrap rounded-md px-2 py-0.5"
        style={{
          fontFamily: 'Inter, Arial, Helvetica, sans-serif',
          fontSize: '13px',
          fontWeight: 700,
          color: '#FFFFFF',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
          border: `1px solid ${agent.color}44`,
          lineHeight: '1.3',
        }}
      >
        {truncateName(agent.name)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Balao de fala individual
// ---------------------------------------------------------------------------

/**
 * Calcula a posicao do balao em viewport e os estilos CSS para a setinha
 * dependendo da direcao sorteada (top/left/right).
 *
 * Estrategia: a ponta da setinha encosta no sprite (spriteTop, spriteLeft ou
 * spriteRight conforme a direcao), e o balao se estende na direcao oposta.
 * Isso garante gap minimo entre sprite e setinha, e sem sobreposicao no corpo.
 */
function bubbleLayoutFor(
  direction: SpeechDirection,
  pos: LabelPosition,
): {
  containerStyle: CSSProperties;
  tailStyle: CSSProperties;
} {
  if (direction === 'top') {
    // Balao acima do sprite. Setinha aponta pra baixo (base do balao).
    // A setinha extrapola o corpo do balao por `TAIL_HEIGHT` (via
    // `bottom: -TAIL_HEIGHT`), entao o ancoramento do container (base do
    // balao) precisa ficar `TAIL_HEIGHT + BUBBLE_TAIL_GAP_PX` ACIMA de
    // `spriteTop`. Assim a ponta da setinha cai em `spriteTop - GAP`,
    // encostando no sprite sem sobrepor.
    return {
      containerStyle: {
        position: 'fixed',
        left: `${pos.centerX}px`,
        top: `${pos.spriteTop - BUBBLE_TAIL_GAP_PX - TAIL_HEIGHT}px`,
        transform: 'translate(-50%, -100%)',
      },
      tailStyle: {
        position: 'absolute',
        left: '50%',
        bottom: `-${TAIL_HEIGHT}px`,
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: `${TAIL_HALF_BASE}px solid transparent`,
        borderRight: `${TAIL_HALF_BASE}px solid transparent`,
        borderTop: `${TAIL_HEIGHT}px solid rgba(255, 255, 255, 0.95)`,
      },
    };
  }

  if (direction === 'left') {
    // Balao a esquerda do sprite. Setinha a direita do balao, apontando
    // pra direita (ponta no sprite). Setinha extrapola o lado direito do
    // balao em `TAIL_HEIGHT`, entao o lado direito do container tem que
    // ficar `TAIL_HEIGHT + GAP` antes de `spriteLeft` para a ponta cair
    // em `spriteLeft - GAP`.
    return {
      containerStyle: {
        position: 'fixed',
        left: `${pos.spriteLeft - BUBBLE_TAIL_GAP_PX - TAIL_HEIGHT}px`,
        top: `${(pos.spriteTop + pos.spriteBottom) / 2}px`,
        transform: 'translate(-100%, -50%)',
      },
      tailStyle: {
        position: 'absolute',
        top: '50%',
        right: `-${TAIL_HEIGHT}px`,
        transform: 'translateY(-50%)',
        width: 0,
        height: 0,
        borderTop: `${TAIL_HALF_BASE}px solid transparent`,
        borderBottom: `${TAIL_HALF_BASE}px solid transparent`,
        borderLeft: `${TAIL_HEIGHT}px solid rgba(255, 255, 255, 0.95)`,
      },
    };
  }

  // direction === 'right': balao a direita do sprite. Setinha a esquerda.
  // Simetrica da 'left': lado esquerdo do container fica
  // `TAIL_HEIGHT + GAP` DEPOIS de `spriteRight`.
  return {
    containerStyle: {
      position: 'fixed',
      left: `${pos.spriteRight + BUBBLE_TAIL_GAP_PX + TAIL_HEIGHT}px`,
      top: `${(pos.spriteTop + pos.spriteBottom) / 2}px`,
      transform: 'translateY(-50%)',
    },
    tailStyle: {
      position: 'absolute',
      top: '50%',
      left: `-${TAIL_HEIGHT}px`,
      transform: 'translateY(-50%)',
      width: 0,
      height: 0,
      borderTop: `${TAIL_HALF_BASE}px solid transparent`,
      borderBottom: `${TAIL_HALF_BASE}px solid transparent`,
      borderRight: `${TAIL_HEIGHT}px solid rgba(255, 255, 255, 0.95)`,
    },
  };
}

function SpeechBubbleOverlay({ agent, pos }: { agent: StageAgent; pos: LabelPosition }) {
  if (!hasVisibleSpeech(agent.speechText)) return null;

  const text = agent.speechText;
  const truncated = text.length > 100 ? text.substring(0, 97) + '...' : text;
  const direction: SpeechDirection = agent.speechDirection ?? 'top';
  const { containerStyle, tailStyle } = bubbleLayoutFor(direction, pos);

  return (
    <div
      style={{
        ...containerStyle,
        pointerEvents: 'none',
        zIndex: 30,
        maxWidth: '240px',
      }}
    >
      <div
        className="relative rounded-lg px-3 py-2 shadow-lg"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #ccc',
          fontFamily: 'Inter, Arial, Helvetica, sans-serif',
          fontSize: '12px',
          fontWeight: 500,
          color: '#1A1A2E',
          lineHeight: '1.4',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          whiteSpace: 'normal',
          minWidth: '80px',
        }}
      >
        {truncated}
        <div style={tailStyle} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal: overlay de labels e baloes
// ---------------------------------------------------------------------------

export function AgentLabels() {
  const agents = useTheaterStore((s) => s.agents);
  const positions = useLabelPositions((s) => s.positions);

  const agentList = Object.values(agents);
  if (agentList.length === 0) return null;

  return (
    <>
      {agentList.map((agent) => {
        const pos = positions[agent.id];
        if (!pos || !pos.visible) return null;
        return <AgentLabel key={`label-${agent.id}`} agent={agent} pos={pos} />;
      })}
      {agentList.map((agent) => {
        const pos = positions[agent.id];
        if (!pos || !pos.visible) return null;
        if (!hasVisibleSpeech(agent.speechText)) return null;
        return <SpeechBubbleOverlay key={`bubble-${agent.id}`} agent={agent} pos={pos} />;
      })}
    </>
  );
}
