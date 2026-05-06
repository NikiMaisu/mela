'use client';

import { useEffect, useRef, useState } from 'react';
import { Sticker } from '@types';

type Props = {
  sticker: Sticker;
  scale: number;
  onUpdate: (id: string, changes: Partial<Sticker>) => void;
  onDelete: (id: string) => void;
};

const CanvasSticker = ({ sticker, scale, onUpdate, onDelete }: Props) => {
  const [pos, setPos] = useState({ x: sticker.x, y: sticker.y });
  const [hovered, setHovered] = useState(false);
  const scaleRef = useRef(scale);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scaleRef.current = scale; }, [scale]);

  useEffect(() => {
    const el = divRef.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest('button')) return;
      e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      let lastX = e.clientX, lastY = e.clientY;

      const onMove = (ev: PointerEvent) => {
        const dx = (ev.clientX - lastX) / scaleRef.current;
        const dy = (ev.clientY - lastY) / scaleRef.current;
        lastX = ev.clientX;
        lastY = ev.clientY;
        setPos(p => ({ x: p.x + dx, y: p.y + dy }));
      };
      const onUp = () => {
        setPos(p => { onUpdate(sticker.id, { x: p.x, y: p.y }); return p; });
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', onUp);
      };
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
    };

    el.addEventListener('pointerdown', onPointerDown);
    return () => el.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const size = 38 * (sticker.scale ?? 1);

  return (
    <div
      ref={divRef}
      data-note="true"
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        transform: `translate(-50%, -50%) rotate(${sticker.rotation ?? 0}deg)`,
        cursor: 'grab',
        userSelect: 'none',
        lineHeight: 1,
        zIndex: 15,
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <span style={{ fontSize: size, display: 'block', filter: 'url(#hand-drawn)' }}>{sticker.emoji}</span>
      {hovered && (
        <button
          style={{
            position: 'absolute',
            top: -10,
            right: -10,
            width: 18,
            height: 18,
            borderRadius: '50%',
            backgroundColor: '#ede0d4',
            border: '2px solid #252422',
            fontSize: '0.55rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            padding: 0,
          }}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onDelete(sticker.id); }}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default CanvasSticker;
