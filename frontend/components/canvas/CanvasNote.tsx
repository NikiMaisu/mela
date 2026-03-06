'use client';

import { useEffect, useRef, useState } from 'react';
import { DrawingPath, Note, Tool } from '@types';

type Props = {
  note: Note;
  scale: number;
  activeTool: Tool;
  onUpdate: (id: string, changes: Partial<Note>) => void;
  onDelete: (id: string) => void;
};

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
        if (current.length >= 2) result.push({ id: crypto.randomUUID(), points: current });
        current = [];
      }
    }
    if (current.length >= 2) result.push({ id: path.id, points: current });
  }
  return result;
};

const CanvasNote = ({ note, scale, activeTool, onUpdate, onDelete }: Props) => {
  const [pos, setPos] = useState({ x: note.x, y: note.y });
  const [size, setSize] = useState({ width: note.width ?? 208, height: note.height ?? 120 });
  const [paths, setPaths] = useState<DrawingPath[]>(note.drawings ?? []);

  const noteRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeToolRef = useRef<Tool>(activeTool);
  const scaleRef = useRef(scale);
  const sizeRef = useRef(size);

  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { sizeRef.current = size; }, [size]);

  useEffect(() => {
    if (note.content === '') textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const el = noteRef.current;
    if (!el) return;

    const localPoint = (clientX: number, clientY: number) => {
      const rect = contentRef.current?.getBoundingClientRect() ?? el.getBoundingClientRect();
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

      if (tool === 'pencil') {
        const startPt = localPoint(e.clientX, e.clientY);
        const id = crypto.randomUUID();
        let pts: { x: number; y: number }[] = [{ x: jitter(startPt.x), y: jitter(startPt.y) }];
        setPaths(prev => [...prev, { id, points: pts }]);

        const onMove = (ev: PointerEvent) => {
          const pt = localPoint(ev.clientX, ev.clientY);
          pts = [...pts, { x: jitter(pt.x), y: jitter(pt.y) }];
          setPaths(prev => prev.map(p => p.id === id ? { ...p, points: pts } : p));
        };
        const onUp = () => {
          setPaths(p => { onUpdate(note.id, { drawings: p }); return p; });
          el.removeEventListener('pointermove', onMove);
          el.removeEventListener('pointerup', onUp);
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
          setPaths(p => { onUpdate(note.id, { drawings: p }); return p; });
          el.removeEventListener('pointermove', onMove);
          el.removeEventListener('pointerup', onUp);
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
          setPaths(p => { onUpdate(note.id, { drawings: p }); return p; });
          el.removeEventListener('pointermove', onMove);
          el.removeEventListener('pointerup', onUp);
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

  const isDrawingTool = activeTool === 'pencil' || activeTool === 'eraser' || activeTool === 'eraser-brush';
  const noteCursor = activeTool === 'pencil' ? 'crosshair' : isDrawingTool ? 'cell' : 'grab';

  return (
    <div
      ref={noteRef}
      data-note="true"
      className="absolute flex flex-col"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.width,
        height: size.height,
        backgroundColor: '#ede0d4',
        border: '7px solid #252422',
        borderRadius: '2px 4px 3px 5px / 5px 2px 4px 3px',
        boxShadow: '10px 10px 0 0 #252422',
        filter: 'url(#hand-drawn)',
        cursor: noteCursor,
        overflow: 'hidden',
      }}
    >
      <div className="flex justify-end px-2 pt-2 shrink-0">
        <button
          className="text-ink/40 hover:text-ink text-xs leading-none transition-colors"
          onPointerDown={e => e.stopPropagation()}
          onClick={() => onDelete(note.id)}
        >
          ✕
        </button>
      </div>

      <div ref={contentRef} className="relative flex-1 min-h-0">
        <textarea
          ref={textareaRef}
          className="absolute inset-0 bg-transparent resize-none outline-none text-sm text-ink px-3 pb-3 placeholder:text-ink/30 cursor-text"
          placeholder={isDrawingTool ? '' : 'type something...'}
          value={note.content}
          style={{ pointerEvents: isDrawingTool ? 'none' : 'auto' }}
          onChange={e => onUpdate(note.id, { content: e.target.value })}
        />
        {paths.length > 0 && (
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none', overflow: 'visible' }}
          >
            {paths.map(path => (
              <path
                key={path.id}
                d={pointsToPath(path.points)}
                stroke="#252422"
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

      <div
        data-resize="true"
        className="absolute bottom-1.5 right-1.5 cursor-nwse-resize"
        style={{ zIndex: 10 }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <line x1="10" y1="2" x2="2" y2="10" stroke="#252422" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
          <line x1="10" y1="6" x2="6" y2="10" stroke="#252422" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
        </svg>
      </div>
    </div>
  );
};

export default CanvasNote;
