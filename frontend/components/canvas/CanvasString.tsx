'use client';

import { useRef, useState } from 'react';
import { StringConnection } from '@types';
import StringService from '@services/StringService';

type Props = {
  string: StringConnection;
  onUpdate: (id: string, changes: Partial<StringConnection>) => void;
  onDelete: (id: string) => void;
};

const stringPath = (x1: number, y1: number, x2: number, y2: number) => {
  const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const sag = dist * 0.09;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + sag;
  return { d: `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`, mx, my };
};

const STRING_COLORS = ['#A81C07', '#1c4587', '#1e6b1e', '#7b4f00', '#6b1e6b'];
const STRING_STYLES = ['thread', 'rope', 'dashed'];

const styleProps = (style: string, color: string) => {
  if (style === 'rope') return {
    outerWidth: 36, outerColor: '#252422',
    innerWidth: 14, innerDash: '8 4',
  };
  if (style === 'dashed') return {
    outerWidth: 0, outerColor: 'transparent',
    innerWidth: 8, innerDash: '20 12',
  };
  return {
    outerWidth: 30, outerColor: '#252422',
    innerWidth: 10, innerDash: undefined,
  };
};

const CanvasString = ({ string, onUpdate, onDelete }: Props) => {
  const [hovered, setHovered] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(string.label ?? '');
  const labelRef = useRef<HTMLInputElement>(null);

  const { id, x1, y1, x2, y2, color, label, style = 'thread' } = string;
  const { d, mx, my } = stringPath(x1, y1, x2, y2);

  const cycleColor = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = STRING_COLORS.indexOf(color ?? '#A81C07');
    const next = STRING_COLORS[(idx + 1) % STRING_COLORS.length];
    onUpdate(id, { color: next });
    StringService.updateColor(id, next).catch(() => {});
  };

  const cycleStyle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = STRING_STYLES.indexOf(style);
    const next = STRING_STYLES[(idx + 1) % STRING_STYLES.length];
    onUpdate(id, { style: next });
    StringService.updateStyle(id, next).catch(() => {});
  };

  const openLabel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLabelDraft(label ?? '');
    setEditingLabel(true);
    setTimeout(() => { labelRef.current?.focus(); labelRef.current?.select(); }, 30);
  };

  const commitLabel = () => {
    setEditingLabel(false);
    const trimmed = labelDraft.trim();
    onUpdate(id, { label: trimmed || undefined });
    StringService.updateLabel(id, trimmed).catch(() => {});
  };

  const stringColor = color ?? '#A81C07';
  const hasLabel = label && label.trim().length > 0;
  const sp = styleProps(style, stringColor);
  const btnY = my - (hasLabel ? 26 : 16);

  return (
    <g>
      {sp.outerWidth > 0 && (
        <path
          d={d}
          stroke={sp.outerColor}
          strokeWidth={sp.outerWidth}
          fill="none"
          strokeLinecap="round"
          filter="url(#hand-drawn)"
          style={{ pointerEvents: 'none' }}
        />
      )}
      <path
        d={d}
        stroke={stringColor}
        strokeWidth={sp.innerWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={sp.innerDash}
        filter="url(#hand-drawn)"
        style={{ pointerEvents: 'none' }}
      />
      <path
        d={d}
        stroke="transparent"
        strokeWidth="20"
        fill="none"
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      />
      <circle cx={x1} cy={y1} r={5} fill={stringColor} filter="url(#hand-drawn)" style={{ pointerEvents: 'none' }} />
      <circle cx={x2} cy={y2} r={5} fill={stringColor} filter="url(#hand-drawn)" style={{ pointerEvents: 'none' }} />

      {hasLabel && !editingLabel && (
        <g style={{ pointerEvents: 'all', cursor: 'text' }} onClick={openLabel}>
          <rect
            x={mx - 30}
            y={my - 10}
            width={60}
            height={18}
            rx={3}
            fill="#ede0d4"
            stroke={stringColor}
            strokeWidth="1.5"
            opacity="0.92"
          />
          <text
            x={mx}
            y={my + 3}
            textAnchor="middle"
            fontSize="9"
            fill={stringColor}
            style={{ userSelect: 'none', fontFamily: 'inherit' }}
          >
            {label}
          </text>
        </g>
      )}

      {hovered && !editingLabel && (
        <g
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          <g style={{ pointerEvents: 'all', cursor: 'pointer' }} onPointerDown={e => e.stopPropagation()} onClick={openLabel}>
            <circle cx={mx - 42} cy={btnY} r={9} fill="#ede0d4" stroke="#252422" strokeWidth="2" />
            <text x={mx - 42} y={btnY + 4} textAnchor="middle" fontSize="10" fill="#252422" style={{ userSelect: 'none' }}>✎</text>
          </g>
          <g style={{ pointerEvents: 'all', cursor: 'pointer' }} onPointerDown={e => e.stopPropagation()} onClick={cycleColor}>
            <circle cx={mx - 14} cy={btnY} r={9} fill={stringColor} stroke="#252422" strokeWidth="2" />
            <text x={mx - 14} y={btnY + 4} textAnchor="middle" fontSize="9" fill="#ede0d4" style={{ userSelect: 'none' }}>⟳</text>
          </g>
          <g style={{ pointerEvents: 'all', cursor: 'pointer' }} onPointerDown={e => e.stopPropagation()} onClick={cycleStyle}>
            <circle cx={mx + 14} cy={btnY} r={9} fill="#ede0d4" stroke="#252422" strokeWidth="2" />
            <text x={mx + 14} y={btnY + 4} textAnchor="middle" fontSize="8" fill="#252422" style={{ userSelect: 'none' }}>{style === 'thread' ? '~' : style === 'rope' ? '≈' : '- -'}</text>
          </g>
          <g style={{ pointerEvents: 'all', cursor: 'pointer' }} onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onDelete(id); }}>
            <circle cx={mx + 42} cy={btnY} r={9} fill="#ede0d4" stroke="#252422" strokeWidth="2" />
            <text x={mx + 42} y={btnY + 4} textAnchor="middle" fontSize="11" fill="#252422" style={{ userSelect: 'none' }}>✕</text>
          </g>
        </g>
      )}

      {editingLabel && (
        <foreignObject x={mx - 50} y={my - 14} width={100} height={26}>
          <input
            ref={labelRef}
            style={{
              width: '100%',
              fontSize: '0.7rem',
              fontFamily: 'inherit',
              border: `2px solid ${stringColor}`,
              borderRadius: 3,
              padding: '2px 5px',
              background: '#ede0d4',
              color: stringColor,
              outline: 'none',
            }}
            value={labelDraft}
            onChange={e => setLabelDraft(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') { (e.target as HTMLInputElement).blur(); } }}
          />
        </foreignObject>
      )}
    </g>
  );
};

export { stringPath };
export default CanvasString;
