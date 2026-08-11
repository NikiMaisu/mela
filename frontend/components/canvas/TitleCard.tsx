'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  scale: number;
  uiScale: 'large' | 'compact';
  isMobile?: boolean;
};

const SIZES = {
  large: { width: 520, titleFont: '3.75rem', subFont: '1.25rem', padding: '40px 48px 44px', gap: '14px', halfHeight: 89 },
  compact: { width: 380, titleFont: '2.25rem', subFont: '0.9rem', padding: '20px 26px 24px', gap: '8px', halfHeight: 51 },
  mobile: { width: 260, titleFont: '2rem', subFont: '0.8rem', padding: '18px 22px 20px', gap: '6px', halfHeight: 45 },
};

const TitleCard = ({ scale, uiScale, isMobile }: Props) => {
  const sizeKey = isMobile ? 'mobile' : uiScale;
  const [pos, setPos] = useState(() => {
    const s = SIZES[sizeKey];
    return { x: -s.width / 2, y: -s.halfHeight };
  });
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const s = SIZES[sizeKey];

  useEffect(() => {
    if (isMobile) setPos({ x: -s.width / 2, y: -s.halfHeight });
  }, [isMobile]);

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
        width: s.width,
        backgroundColor: '#ede0d4',
        border: '10px solid #252422',
        borderRadius: '3px 6px 4px 7px / 7px 3px 6px 4px',
        boxShadow: '16px 16px 0 0 #252422',
        filter: 'url(#hand-drawn)',
        padding: s.padding,
        display: 'flex',
        flexDirection: 'column',
        gap: s.gap,
        cursor: 'grab',
        userSelect: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <h1
        style={{
          fontSize: s.titleFont,
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
          fontSize: s.subFont,
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
