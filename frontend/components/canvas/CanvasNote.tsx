'use client';

import { useEffect, useRef, useState } from 'react';
import { DrawingPath, Note, Tool } from '@types';

type Props = {
  note: Note;
  scale: number;
  activeTool: Tool;
  pencilColor: string;
  onUpdate: (id: string, changes: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (note: Note) => void;
};

const NOTE_COLORS = [
  '#ede0d4',
  '#f9e4b7',
  '#d4edd4',
  '#d4e4f0',
  '#f0d4e4',
  '#e8d4f0',
  '#ffd6a5',
  '#252422',
];

const TAPE_COLORS = [
  'rgba(255,230,180,0.65)',
  'rgba(200,220,255,0.65)',
  'rgba(200,255,210,0.65)',
  'rgba(255,200,210,0.65)',
  'rgba(230,200,255,0.65)',
  'rgba(255,255,200,0.65)',
];

const MIN_WIDTH = 150;
const MIN_HEIGHT = 80;
const ERASER_RADIUS = 16;

const jitter = (v: number) => v + (Math.random() - 0.5) * 2;

const pointsToPath = (pts: { x: number; y: number }[]): string => {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x} ${pts[i].y} ${mx} ${my}`;
  }
  d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
  return d;
};

const distToSegment = (
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number => {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

const strokeTouchesPoint = (path: DrawingPath, px: number, py: number, r: number): boolean => {
  const pts = path.points;
  for (let i = 0; i < pts.length - 1; i++) {
    if (distToSegment(px, py, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y) < r) return true;
  }
  return false;
};

const eraseSegments = (paths: DrawingPath[], px: number, py: number, r: number): DrawingPath[] => {
  const result: DrawingPath[] = [];
  for (const path of paths) {
    let current: { x: number; y: number }[] = [];
    for (const pt of path.points) {
      if (Math.hypot(pt.x - px, pt.y - py) > r) {
        current.push(pt);
      } else {
        if (current.length >= 2) result.push({ id: crypto.randomUUID(), points: current, color: path.color });
        current = [];
      }
    }
    if (current.length >= 2) result.push({ id: path.id, points: current, color: path.color });
  }
  return result;
};

const hashId = (id: string) => id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

const computeFontSize = (content: string, availW: number, availH: number): number => {
  if (!content || content.trim() === '') return 42;
  const lines = content.split('\n');
  const CHAR_RATIO = 0.54;
  const LINE_H = 1.45;
  let lo = 9, hi = 72;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    const charsPerLine = availW / (mid * CHAR_RATIO);
    let totalLines = 0;
    for (const line of lines) {
      totalLines += Math.max(1, Math.ceil((line.length || 1) / charsPerLine));
    }
    if (totalLines * mid * LINE_H > availH) hi = mid;
    else lo = mid;
  }
  return Math.round(lo);
};

const CanvasNote = ({ note, scale, activeTool, pencilColor, onUpdate, onDelete, onDuplicate }: Props) => {
  const [pos, setPos] = useState({ x: note.x, y: note.y });
  const [size, setSize] = useState({ width: note.width ?? 208, height: note.height ?? 120 });
  const [paths, setPaths] = useState<DrawingPath[]>(note.drawings ?? []);
  const [color, setColor] = useState(note.color ?? '#ede0d4');
  const [collapsed, setCollapsed] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [shape, setShape] = useState(note.shape ?? 'rectangle');

  const noteRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeToolRef = useRef<Tool>(activeTool);
  const pencilColorRef = useRef(pencilColor);
  const scaleRef = useRef(scale);
  const sizeRef = useRef(size);
  const collapsedRef = useRef(collapsed);

  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { pencilColorRef.current = pencilColor; }, [pencilColor]);
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { sizeRef.current = size; }, [size]);
  useEffect(() => { collapsedRef.current = collapsed; }, [collapsed]);

  useEffect(() => {
    if (note.content === '') textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const el = noteRef.current;
    if (!el) return;

    const innerEl = el.querySelector('[data-note-inner]') as HTMLElement | null;

    const localPoint = (clientX: number, clientY: number) => {
      const rect = (contentRef.current ?? innerEl ?? el).getBoundingClientRect();
      const s = scaleRef.current;
      return { x: (clientX - rect.left) / s, y: (clientY - rect.top) / s };
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON') return;

      e.stopPropagation();
      el.setPointerCapture(e.pointerId);

      const tool = activeToolRef.current;

      if (target.closest('[data-resize]')) {
        const origin = { x: e.clientX, y: e.clientY, width: sizeRef.current.width, height: sizeRef.current.height };
        const onMove = (ev: PointerEvent) => {
          const s = scaleRef.current;
          setSize({
            width: Math.max(MIN_WIDTH, origin.width + (ev.clientX - origin.x) / s),
            height: Math.max(MIN_HEIGHT, origin.height + (ev.clientY - origin.y) / s),
          });
        };
        const onUp = () => {
          setSize(s => { onUpdate(note.id, { width: s.width, height: s.height }); return s; });
          el.removeEventListener('pointermove', onMove);
          el.removeEventListener('pointerup', onUp);
        };
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup', onUp);
        return;
      }

      if (tool === 'pencil' && !collapsedRef.current) {
        const startPt = localPoint(e.clientX, e.clientY);
        const id = crypto.randomUUID();
        const inkColor = pencilColorRef.current;
        let pts: { x: number; y: number }[] = [{ x: jitter(startPt.x), y: jitter(startPt.y) }];
        setPaths(prev => [...prev, { id, points: pts, color: inkColor }]);

        const onMove = (ev: PointerEvent) => {
          const pt = localPoint(ev.clientX, ev.clientY);
          pts = [...pts, { x: jitter(pt.x), y: jitter(pt.y) }];
          setPaths(prev => prev.map(p => p.id === id ? { ...p, points: pts } : p));
        };
        const onUp = () => {
          el.removeEventListener('pointermove', onMove);
          el.removeEventListener('pointerup', onUp);
          setPaths(current => { onUpdate(note.id, { drawings: current }); return current; });
        };
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup', onUp);
        return;
      }

      if (tool === 'eraser') {
        const pt = localPoint(e.clientX, e.clientY);
        setPaths(prev => prev.filter(p => !strokeTouchesPoint(p, pt.x, pt.y, ERASER_RADIUS)));
        const onMove = (ev: PointerEvent) => {
          const p = localPoint(ev.clientX, ev.clientY);
          setPaths(prev => prev.filter(s => !strokeTouchesPoint(s, p.x, p.y, ERASER_RADIUS)));
        };
        const onUp = () => {
          el.removeEventListener('pointermove', onMove);
          el.removeEventListener('pointerup', onUp);
          setPaths(current => { onUpdate(note.id, { drawings: current }); return current; });
        };
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup', onUp);
        return;
      }

      if (tool === 'eraser-brush') {
        const pt = localPoint(e.clientX, e.clientY);
        setPaths(prev => eraseSegments(prev, pt.x, pt.y, ERASER_RADIUS));
        const onMove = (ev: PointerEvent) => {
          const p = localPoint(ev.clientX, ev.clientY);
          setPaths(prev => eraseSegments(prev, p.x, p.y, ERASER_RADIUS));
        };
        const onUp = () => {
          el.removeEventListener('pointermove', onMove);
          el.removeEventListener('pointerup', onUp);
          setPaths(current => { onUpdate(note.id, { drawings: current }); return current; });
        };
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup', onUp);
        return;
      }

      if (target.tagName === 'TEXTAREA') return;

      let lastX = e.clientX, lastY = e.clientY;
      const onMove = (ev: PointerEvent) => {
        const s = scaleRef.current;
        const dx = (ev.clientX - lastX) / s;
        const dy = (ev.clientY - lastY) / s;
        lastX = ev.clientX;
        lastY = ev.clientY;
        setPos(p => ({ x: p.x + dx, y: p.y + dy }));
      };
      const onUp = () => {
        setPos(p => { onUpdate(note.id, { x: p.x, y: p.y }); return p; });
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', onUp);
      };
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
    };

    el.addEventListener('pointerdown', onPointerDown);
    return () => el.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const changeColor = (c: string) => {
    setColor(c);
    setShowPalette(false);
    onUpdate(note.id, { color: c });
  };

  const SHAPES = ['rectangle', 'circle', 'speech-bubble'];
  const cycleShape = () => {
    const next = SHAPES[(SHAPES.indexOf(shape) + 1) % SHAPES.length];
    setShape(next);
    onUpdate(note.id, { shape: next });
  };
  const shapeIcon = shape === 'circle' ? '◯' : shape === 'speech-bubble' ? '💬' : '▭';

  const isDrawingTool = activeTool === 'pencil' || activeTool === 'eraser' || activeTool === 'eraser-brush';
  const noteCursor = activeTool === 'pencil' ? 'crosshair' : isDrawingTool ? 'cell' : 'grab';
  const isDark = color === '#252422';
  const inkColor = isDark ? '#ede0d4' : '#252422';
  const rotation = note.rotation ?? 0;
  const isCircle = shape === 'circle';
  const isBubble = shape === 'speech-bubble';
  const noteSize = isCircle ? Math.max(size.width, size.height) : size.width;
  const circleStyle = isCircle ? { borderRadius: '50%', width: noteSize, height: noteSize } : {};
  const tapeColor = TAPE_COLORS[hashId(note.id) % TAPE_COLORS.length];
  const availW = size.width - 28;
  const availH = size.height - 80;
  const fontSize = computeFontSize(note.content, availW, availH);
  const tapeAngle = ((hashId(note.id) % 7) - 3) * 0.6;

  return (
    <div
      ref={noteRef}
      data-note="true"
      data-note-id={note.id}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: noteSize,
        overflow: 'visible',
        transform: `rotate(${rotation}deg)`,
        cursor: noteCursor,
      }}
    >
      {!isCircle && (
        <div
          style={{
            position: 'absolute',
            top: -12,
            left: '25%',
            width: '50%',
            height: 22,
            backgroundColor: tapeColor,
            border: '7px solid #252422',
            boxShadow: '4px 4px 0 0 #252422',
            transform: `rotate(${tapeAngle}deg)`,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      )}


      {isBubble && !collapsed && (
        <>
          <div style={{
            position: 'absolute',
            bottom: -22,
            left: 24,
            width: 0,
            height: 0,
            borderLeft: '24px solid transparent',
            borderRight: '0 solid transparent',
            borderTop: `22px solid ${inkColor}`,
            pointerEvents: 'none',
            zIndex: 1,
          }} />
          <div style={{
            position: 'absolute',
            bottom: -12,
            left: 30,
            width: 0,
            height: 0,
            borderLeft: '16px solid transparent',
            borderRight: '0 solid transparent',
            borderTop: `14px solid ${color}`,
            pointerEvents: 'none',
            zIndex: 2,
          }} />
        </>
      )}

      <div
        data-note-inner="true"
        style={{
          position: 'relative',
          width: noteSize,
          height: collapsed ? 44 : (isCircle ? noteSize : size.height),
          backgroundColor: color,
          border: `10px solid ${inkColor}`,
          borderRadius: isCircle ? '50%' : '2px 4px 3px 5px / 5px 2px 4px 3px',
          boxShadow: `10px 10px 0 0 ${inkColor}`,
          filter: 'url(#hand-drawn)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: 'height 0.15s ease, background-color 0.2s ease',
          ...circleStyle,
        }}
      >
        {isCircle ? (
          <div
            style={{ position: 'absolute', top: '18%', left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, zIndex: 5 }}
            onPointerDown={e => e.stopPropagation()}
          >
            <div style={{ position: 'relative', display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: color, border: `2px solid ${inkColor}`, cursor: 'pointer', flexShrink: 0, opacity: 0.7 }}
                onClick={e => { e.stopPropagation(); setShowPalette(v => !v); }}
              />
              {showPalette && (
                <div
                  style={{ display: 'flex', gap: 4, padding: '4px 6px', backgroundColor: '#ede0d4', border: '2px solid #252422', borderRadius: 4, boxShadow: '3px 3px 0 0 #252422', zIndex: 100, position: 'absolute', top: 20, left: 0 }}
                  onPointerDown={e => e.stopPropagation()}
                >
                  {NOTE_COLORS.map(c => (
                    <button key={c} onClick={e => { e.stopPropagation(); changeColor(c); }}
                      style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: c, border: `2px solid #252422`, cursor: 'pointer', outline: color === c ? '2px solid #A81C07' : 'none', outlineOffset: 1 }}
                    />
                  ))}
                </div>
              )}
            </div>
            <button style={{ fontSize: '0.6rem', color: inkColor, opacity: 0.45, cursor: 'pointer', background: 'none', border: 'none', lineHeight: 1, padding: 0 }}
              onClick={e => { e.stopPropagation(); setCollapsed(v => !v); }}>
              {collapsed ? '▼' : '▲'}
            </button>
            <button style={{ fontSize: '0.6rem', color: `${inkColor}88`, cursor: 'pointer', background: 'none', border: 'none', lineHeight: 1, padding: 0 }}
              onClick={e => { e.stopPropagation(); cycleShape(); }}>
              {shapeIcon}
            </button>
            <button style={{ fontSize: '0.6rem', color: `${inkColor}88`, cursor: 'pointer', background: 'none', border: 'none', lineHeight: 1, padding: 0 }}
              onClick={e => { e.stopPropagation(); onDuplicate({ ...note, x: note.x + 24, y: note.y + 24, id: note.id }); }}>
              ⧉
            </button>
            <button style={{ fontSize: '0.75rem', color: `${inkColor}66`, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => onDelete(note.id)}>
              ✕
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 8px 4px', flexShrink: 0, gap: 4 }}
            onPointerDown={e => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', position: 'relative' }}>
              <button
                style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: color, border: `2px solid ${inkColor}`, cursor: 'pointer', flexShrink: 0, opacity: 0.7 }}
                onClick={e => { e.stopPropagation(); setShowPalette(v => !v); }}
              />
              {showPalette && (
                <div
                  style={{ display: 'flex', gap: 4, padding: '4px 6px', backgroundColor: '#ede0d4', border: '2px solid #252422', borderRadius: 4, boxShadow: '3px 3px 0 0 #252422', zIndex: 100, position: 'absolute', top: 20, left: 0 }}
                  onPointerDown={e => e.stopPropagation()}
                >
                  {NOTE_COLORS.map(c => (
                    <button key={c} onClick={e => { e.stopPropagation(); changeColor(c); }}
                      style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: c, border: `2px solid #252422`, cursor: 'pointer', outline: color === c ? '2px solid #A81C07' : 'none', outlineOffset: 1 }}
                    />
                  ))}
                </div>
              )}
              <button
                style={{ fontSize: '0.6rem', color: inkColor, opacity: 0.45, cursor: 'pointer', background: 'none', border: 'none', lineHeight: 1, padding: 0 }}
                onClick={e => { e.stopPropagation(); setCollapsed(v => !v); }}>
                {collapsed ? '▼' : '▲'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button style={{ fontSize: '0.6rem', color: `${inkColor}88`, cursor: 'pointer', background: 'none', border: 'none', lineHeight: 1, padding: 0 }}
                onClick={e => { e.stopPropagation(); cycleShape(); }}>
                {shapeIcon}
              </button>
              <button style={{ fontSize: '0.6rem', color: `${inkColor}88`, cursor: 'pointer', background: 'none', border: 'none', lineHeight: 1, padding: 0 }}
                onClick={e => { e.stopPropagation(); onDuplicate({ ...note, x: note.x + 24, y: note.y + 24, id: note.id }); }}>
                ⧉
              </button>
              <button style={{ fontSize: '0.75rem', color: `${inkColor}66`, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => onDelete(note.id)}>
                ✕
              </button>
            </div>
          </div>
        )}

        {!collapsed && (
          <div ref={contentRef} style={{ position: 'relative', flex: 1, minHeight: 0 }}>
            <textarea
              ref={textareaRef}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'transparent',
                resize: 'none',
                outline: 'none',
                fontSize: `${fontSize}px`,
                lineHeight: 1.45,
                fontWeight: 500,
                padding: isCircle ? '44px 16px 12px' : '0 12px 12px',
                color: inkColor,
                caretColor: inkColor,
                fontFamily: 'inherit',
                overflow: 'hidden',
                pointerEvents: isDrawingTool ? 'none' : 'auto',
              }}
              placeholder={isDrawingTool ? '' : 'type something...'}
              value={note.content}
              onChange={e => onUpdate(note.id, { content: e.target.value })}
            />
            {paths.length > 0 && (
              <svg
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
              >
                {paths.map(path => (
                  <path
                    key={path.id}
                    d={pointsToPath(path.points)}
                    stroke={path.color ?? '#252422'}
                    strokeWidth={4 / scale}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.85"
                  />
                ))}
              </svg>
            )}
          </div>
        )}

        {activeTool === 'string' && !collapsed && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 12,
            height: 12,
            borderRadius: '50%',
            border: `2px solid ${inkColor}`,
            opacity: 0.25,
            pointerEvents: 'none',
          }} />
        )}

        {!collapsed && note.createdAt && (
          <div style={{ padding: '0 12px 6px', textAlign: 'right' }}>
            <span style={{ fontSize: '0.55rem', color: inkColor, opacity: 0.3, fontFamily: 'inherit' }}>
              {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        )}

        {!collapsed && (
          <div
            data-resize="true"
            style={{ position: 'absolute', bottom: 6, right: 6, cursor: 'nwse-resize', zIndex: 10 }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <line x1="10" y1="2" x2="2" y2="10" stroke={inkColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
              <line x1="10" y1="6" x2="6" y2="10" stroke={inkColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasNote;
