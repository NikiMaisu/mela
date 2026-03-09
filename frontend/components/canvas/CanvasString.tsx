'use client';

import { useState } from 'react';
import { StringConnection } from '@types';

type Props = {
  string: StringConnection;
  onDelete: (id: string) => void;
};

const stringPath = (x1: number, y1: number, x2: number, y2: number) => {
  const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const sag = dist * 0.09;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + sag;
  return { d: `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`, mx, my };
};

const STRING_COLOR = '#A81C07';

const CanvasString = ({ string, onDelete }: Props) => {
  const [hovered, setHovered] = useState(false);
  const { id, x1, y1, x2, y2 } = string;
  const { d, mx, my } = stringPath(x1, y1, x2, y2);

  return (
    <g>
      <path
        d={d}
        stroke={STRING_COLOR}
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
        filter="url(#hand-drawn)"
        style={{ pointerEvents: 'none' }}
      />
      <path
        d={d}
        stroke="transparent"
        strokeWidth="16"
        fill="none"
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      />
      <circle cx={x1} cy={y1} r={4.5} fill={STRING_COLOR} filter="url(#hand-drawn)" style={{ pointerEvents: 'none' }} />
      <circle cx={x2} cy={y2} r={4.5} fill={STRING_COLOR} filter="url(#hand-drawn)" style={{ pointerEvents: 'none' }} />
      {hovered && (
        <g
          style={{ pointerEvents: 'all', cursor: 'pointer' }}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onDelete(id); }}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          <circle cx={mx} cy={my - 16} r={9} fill="#ede0d4" stroke="#252422" strokeWidth="2" />
          <text x={mx} y={my - 12} textAnchor="middle" fontSize="11" fill="#252422" style={{ userSelect: 'none' }}>✕</text>
        </g>
      )}
    </g>
  );
};

export { stringPath };
export default CanvasString;
