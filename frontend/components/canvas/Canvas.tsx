'use client';

import { useEffect, useRef, useState } from 'react';
import { Note, StringConnection, Tool } from '@types';
import CanvasNote from './CanvasNote';
import CanvasString, { stringPath } from './CanvasString';
import TitleCard from './TitleCard';
import Toolbar from './Toolbar';
import NoteService from '@services/NoteService';
import StringService from '@services/StringService';
import { useAuth } from '@context/AuthContext';

type Transform = { x: number; y: number; scale: number };

const NOTE_COLORS = ['#ede0d4'];

const segmentsIntersect = (
  ax: number, ay: number, bx: number, by: number,
  cx: number, cy: number, dx: number, dy: number,
): boolean => {
  const d1x = bx - ax, d1y = by - ay;
  const d2x = dx - cx, d2y = dy - cy;
  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-10) return false;
  const t = ((cx - ax) * d2y - (cy - ay) * d2x) / cross;
  const u = ((cx - ax) * d1y - (cy - ay) * d1x) / cross;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
};

const bezierIntersectsCut = (
  x1: number, y1: number, mx: number, my: number, x2: number, y2: number,
  cx1: number, cy1: number, cx2: number, cy2: number,
): boolean => {
  const SAMPLES = 20;
  let px = x1, py = y1;
  for (let i = 1; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const bx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2;
    const by = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2;
    if (segmentsIntersect(px, py, bx, by, cx1, cy1, cx2, cy2)) return true;
    px = bx;
    py = by;
  }
  return false;
};

const Canvas = () => {
  const { user } = useAuth();
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [activeTool, setActiveTool] = useState<Tool>('pointer');
  const [notes, setNotes] = useState<Note[]>([]);
  const [strings, setStrings] = useState<StringConnection[]>([]);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number; noteId?: string } | null>(null);
  const [cursorWorld, setCursorWorld] = useState<{ x: number; y: number } | null>(null);
  const [isCutting, setIsCutting] = useState(false);
  const [cutTrail, setCutTrail] = useState<{ x: number; y: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const lastCutWorld = useRef<{ x: number; y: number } | null>(null);
  const notesRef = useRef<Note[]>([]);
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingPinRef = useRef<{ x: number; y: number; noteId?: string } | null>(null);

  useEffect(() => { notesRef.current = notes; }, [notes]);

  useEffect(() => {
    if (!user) { setNotes([]); setStrings([]); return; }
    NoteService.getAll().then(setNotes).catch(() => {});
    StringService.getAll().then(setStrings).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const factor = e.deltaY > 0 ? 0.95 : 1.05;
      setTransform(t => {
        const newScale = Math.min(Math.max(t.scale * factor, 0.1), 5);
        const ratio = newScale / t.scale;
        return { scale: newScale, x: mouseX - ratio * (mouseX - t.x), y: mouseY - ratio * (mouseY - t.y) };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        pendingPinRef.current = null;
        setPendingPin(null);
      }
      if (e.key === 'c' || e.key === 'C') {
        setIsCutting(true);
        lastCutWorld.current = null;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        setIsCutting(false);
        setCutTrail([]);
        lastCutWorld.current = null;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const toWorld = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - transform.x) / transform.scale,
      y: (clientY - rect.top - transform.y) / transform.scale,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-note]')) return;
    if (isCutting) return;
    if (activeTool !== 'pointer' && activeTool !== 'string') return;
    isPanning.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const world = toWorld(e.clientX, e.clientY);
    setCursorWorld(world);

    if (isCutting) {
      setCutTrail(prev => [...prev.slice(-40), { x: e.clientX, y: e.clientY }]);
      if (lastCutWorld.current) {
        const { x: cx1, y: cy1 } = lastCutWorld.current;
        setStrings(prev => {
          const kept: typeof prev = [];
          const cut: typeof prev = [];
          prev.forEach(s => {
            const { mx, my } = stringPath(s.x1, s.y1, s.x2, s.y2);
            bezierIntersectsCut(s.x1, s.y1, mx, my, s.x2, s.y2, cx1, cy1, world.x, world.y)
              ? cut.push(s)
              : kept.push(s);
          });
          cut.forEach(s => StringService.remove(s.id).catch(() => {}));
          return kept;
        });
      }
      lastCutWorld.current = world;
      return;
    }

    if (!isPanning.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
  };

  const handlePointerUp = () => {
    isPanning.current = false;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isCutting) return;
    if (activeTool !== 'string') return;
    const world = toWorld(e.clientX, e.clientY);

    const noteEl = (e.target as HTMLElement).closest('[data-note-id]') as HTMLElement | null;
    let pinNoteId: string | undefined;
    if (noteEl) {
      const id = noteEl.getAttribute('data-note-id') ?? undefined;
      const note = notesRef.current.find(n => n.id === id);
      if (note && id) {
        pinNoteId = id;
        world.x = note.x + (note.width ?? 208) / 2;
        world.y = note.y + (note.height ?? 120) / 2;
      }
    }

    const prev = pendingPinRef.current;
    if (!prev) {
      pendingPinRef.current = { ...world, noteId: pinNoteId };
      setPendingPin({ ...world, noteId: pinNoteId });
    } else {
      pendingPinRef.current = null;
      setPendingPin(null);
      if (!user) return;
      const draft = { x1: prev.x, y1: prev.y, x2: world.x, y2: world.y, color: '#A81C07', noteId1: prev.noteId, noteId2: pinNoteId };
      const tempId = crypto.randomUUID();
      setStrings(s => [...s, { id: tempId, ...draft }]);
      StringService.create(draft).then(saved => {
        setStrings(s => s.map(c => c.id === tempId ? saved : c));
      }).catch(() => {
        setStrings(s => s.filter(c => c.id !== tempId));
      });
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isCutting) return;
    if (activeTool !== 'pointer') return;
    if ((e.target as HTMLElement).closest('[data-note]')) return;
    const world = toWorld(e.clientX, e.clientY);
    if (!user) return;
    const draft = {
      x: world.x - 104,
      y: world.y - 56,
      width: 208,
      height: 120,
      content: '',
      color: NOTE_COLORS[0],
      drawings: [],
    };
    NoteService.create(draft).then(saved => {
      setNotes(prev => [...prev, saved]);
    }).catch(() => {});
  };

  const updateNote = (id: string, changes: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...changes } : n));
    clearTimeout(saveTimers.current.get(id));
    saveTimers.current.set(id, setTimeout(() => {
      const note = notesRef.current.find(n => n.id === id);
      if (note) NoteService.update(id, { ...note, ...changes }).catch(() => {});
      saveTimers.current.delete(id);
    }, 600));
  };

  const updateString = (id: string, changes: Partial<StringConnection>) => {
    setStrings(prev => prev.map(s => s.id === id ? { ...s, ...changes } : s));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    NoteService.remove(id).catch(() => {});
  };

  const resetCamera = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTransform({ x: rect.width / 2, y: rect.height / 2, scale: 1 });
  };

  const resolveCoords = (s: StringConnection) => {
    let { x1, y1, x2, y2 } = s;
    if (s.noteId1) {
      const n = notes.find(n => n.id === s.noteId1);
      if (n) { x1 = n.x + (n.width ?? 208) / 2; y1 = n.y + (n.height ?? 120) / 2; }
    }
    if (s.noteId2) {
      const n = notes.find(n => n.id === s.noteId2);
      if (n) { x2 = n.x + (n.width ?? 208) / 2; y2 = n.y + (n.height ?? 120) / 2; }
    }
    return { x1, y1, x2, y2 };
  };

  const dotSpacing = 40 * transform.scale;
  const preview = pendingPin && cursorWorld
    ? stringPath(pendingPin.x, pendingPin.y, cursorWorld.x, cursorWorld.y)
    : null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden select-none"
      style={{ cursor: isCutting ? 'crosshair' : activeTool === 'pencil' ? 'crosshair' : activeTool === 'eraser' || activeTool === 'eraser-brush' ? 'cell' : 'default' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: '#ede0d4',
          backgroundImage: 'radial-gradient(circle, #252422 2px, transparent 2px)',
          backgroundSize: `${dotSpacing}px ${dotSpacing}px`,
          backgroundPosition: `${transform.x % dotSpacing}px ${transform.y % dotSpacing}px`,
        }}
      />

      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, zIndex: 20 }}
      >
        <TitleCard scale={transform.scale} />
        {notes.map(note => (
          <CanvasNote
            key={note.id}
            note={note}
            scale={transform.scale}
            activeTool={activeTool}
            onUpdate={updateNote}
            onDelete={deleteNote}
          />
        ))}
      </div>

      {isCutting && cutTrail.length > 1 && (
        <svg className="fixed inset-0 w-full h-full pointer-events-none">
          <polyline
            points={cutTrail.map(p => `${p.x},${p.y}`).join(' ')}
            stroke="#252422"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.5"
          />
        </svg>
      )}

      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 5 }}
      >
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`} style={{ pointerEvents: 'all' }}>
          {strings.map(s => (
            <CanvasString
              key={s.id}
              string={{ ...s, ...resolveCoords(s) }}
              onUpdate={updateString}
              onDelete={id => {
                setStrings(prev => prev.filter(s => s.id !== id));
                StringService.remove(id).catch(() => {});
              }}
            />
          ))}
          {pendingPin && (
            <circle cx={pendingPin.x} cy={pendingPin.y} r={5} fill="#A81C07" filter="url(#hand-drawn)" />
          )}
          {preview && pendingPin && cursorWorld && (
            <g opacity={0.55}>
              <path
                d={preview.d}
                stroke="#A81C07"
                strokeWidth="14"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="8 6"
              />
              <circle cx={cursorWorld.x} cy={cursorWorld.y} r={5} fill="#A81C07" />
            </g>
          )}
        </g>
      </svg>

      <button
        className="fixed bottom-4 right-4"
        style={{
          backgroundColor: '#ede0d4',
          border: '3px solid #252422',
          borderRadius: '2px 4px 3px 4px / 4px 2px 4px 3px',
          boxShadow: '4px 4px 0 0 #252422',
          filter: 'url(#hand-drawn)',
          padding: '6px 14px',
          fontSize: '0.75rem',
          color: '#252422',
          cursor: 'pointer',
          zIndex: 50,
        }}
        onClick={resetCamera}
      >
        back to start
      </button>

      <Toolbar activeTool={activeTool} onToolChange={tool => { setActiveTool(tool); if (tool !== 'string') { pendingPinRef.current = null; setPendingPin(null); } }} />

      <p className="fixed bottom-4 left-1/2 -translate-x-1/2 text-xs text-ink/50 pointer-events-none" style={{ zIndex: 50 }}>
        {isCutting
          ? 'slide through strings to cut them'
          : activeTool === 'pointer'
          ? 'double-click to add a note · hold c to cut'
          : activeTool === 'string'
          ? 'click to pin · click again to connect · esc to cancel'
          : activeTool === 'pencil'
          ? 'draw inside notes'
          : activeTool === 'eraser'
          ? 'click a stroke to remove it entirely'
          : 'drag to erase parts of strokes'}
      </p>
    </div>
  );
};

export default Canvas;
