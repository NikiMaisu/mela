'use client';

import { Note, StringConnection } from '@types';
import { stringPath } from './CanvasString';

type Props = {
  notes: Note[];
  strings: StringConnection[];
  viewX: number;
  viewY: number;
  viewScale: number;
  screenW: number;
  screenH: number;
  uiScale: 'large' | 'compact';
  onPanTo: (worldX: number, worldY: number) => void;
};

const W = 180;
const H = 110;
const PAD = 10;

const Minimap = ({ notes, strings, viewX, viewY, viewScale, screenW, screenH, uiScale, onPanTo }: Props) => {
  if (notes.length === 0 && strings.length === 0) return null;

  const allX = [
    ...notes.map(n => n.x),
    ...notes.map(n => n.x + (n.width ?? 208)),
    ...strings.flatMap(s => [s.x1, s.x2]),
  ];
  const allY = [
    ...notes.map(n => n.y),
    ...notes.map(n => n.y + (n.height ?? 120)),
    ...strings.flatMap(s => [s.y1, s.y2]),
  ];

  const minX = Math.min(...allX) - 40;
  const maxX = Math.max(...allX) + 40;
  const minY = Math.min(...allY) - 40;
  const maxY = Math.max(...allY) + 40;

  const worldW = maxX - minX || 1;
  const worldH = maxY - minY || 1;
  const scale = Math.min((W - PAD * 2) / worldW, (H - PAD * 2) / worldH);

  const tx = (wx: number) => PAD + (wx - minX) * scale;
  const ty = (wy: number) => PAD + (wy - minY) * scale;

  const vpLeft = (-viewX / viewScale - minX) * scale + PAD;
  const vpTop = (-viewY / viewScale - minY) * scale + PAD;
  const vpW = (screenW / viewScale) * scale;
  const vpH = (screenH / viewScale) * scale;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const worldX = (mx - PAD) / scale + minX;
    const worldY = (my - PAD) / scale + minY;
    onPanTo(worldX, worldY);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: uiScale === 'large' ? 100 : 60,
        right: 16,
        zIndex: 40,
        backgroundColor: '#ede0d4',
        border: '3px solid #252422',
        borderRadius: '2px 4px 3px 4px / 4px 2px 4px 3px',
        boxShadow: '4px 4px 0 0 #252422',
        filter: 'url(#hand-drawn)',
        overflow: 'hidden',
        opacity: 0.85,
      }}
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
    >
      <svg
        width={W}
        height={H}
        style={{ display: 'block', cursor: 'crosshair' }}
        onClick={handleClick}
      >
        {strings.map(s => {
          const { d } = stringPath(tx(s.x1), ty(s.y1), tx(s.x2), ty(s.y2));
          return (
            <path
              key={s.id}
              d={d}
              stroke={s.color ?? '#A81C07'}
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              opacity="0.7"
            />
          );
        })}
        {notes.map(n => (
          <rect
            key={n.id}
            x={tx(n.x)}
            y={ty(n.y)}
            width={Math.max(3, (n.width ?? 208) * scale)}
            height={Math.max(2, (n.height ?? 120) * scale)}
            fill={n.color ?? '#ede0d4'}
            stroke="#252422"
            strokeWidth="1"
            rx="1"
          />
        ))}
        <rect
          x={Math.max(0, vpLeft)}
          y={Math.max(0, vpTop)}
          width={Math.min(W, vpW)}
          height={Math.min(H, vpH)}
          fill="none"
          stroke="#252422"
          strokeWidth="1.5"
          strokeDasharray="3 2"
          opacity="0.5"
        />
      </svg>
    </div>
  );
};

export default Minimap;
