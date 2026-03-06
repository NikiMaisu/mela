'use client';

import { useRef, useState } from 'react';

type Props = {
  scale: number;
};

const TitleCard = ({ scale }: Props) => {
  const [pos, setPos] = useState({ x: -220, y: -130 });
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const dx = (e.clientX - lastPointer.current.x) / scale;
    const dy = (e.clientY - lastPointer.current.y) / scale;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    setPos(p => ({ x: p.x + dx, y: p.y + dy }));
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  return (
    <div
      data-note="true"
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: 440,
        backgroundColor: '#ede0d4',
        border: '10px solid #252422',
        borderRadius: '3px 6px 4px 7px / 7px 3px 6px 4px',
        boxShadow: '16px 16px 0 0 #252422',
        filter: 'url(#hand-drawn)',
        padding: '32px 40px 36px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        cursor: 'grab',
        userSelect: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <h1
        style={{
          fontSize: '3rem',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          color: '#252422',
          lineHeight: 1,
          textAlign: 'left',
          margin: 0,
          padding: 0,
        }}
      >
        mela
      </h1>
      <p
        style={{
          fontSize: '1.1rem',
          color: '#252422',
          opacity: 0.6,
          margin: 0,
          fontStyle: 'italic',
        }}
      >
        hello from niki :3
      </p>
    </div>
  );
};

export default TitleCard;
