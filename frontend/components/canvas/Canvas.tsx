'use client';

import { useEffect, useRef, useState } from 'react';
import { CanvasStroke, Note, Sticker, StringConnection, Tool } from '@types';
import CanvasNote from './CanvasNote';
import CanvasString, { stringPath } from './CanvasString';
import CanvasSticker from './CanvasSticker';
import TitleCard from './TitleCard';
import Toolbar from './Toolbar';
import Minimap from './Minimap';
import NoteService from '@services/NoteService';
import StringService from '@services/StringService';
import StickerService from '@services/StickerService';
import CanvasStrokeService from '@services/CanvasStrokeService';
import { useAuth } from '@context/AuthContext';

type Transform = { x: number; y: number; scale: number };

const NOTE_COLORS = ['#ede0d4', '#f9e4b7', '#d4edd4', '#d4e4f0', '#f0d4e4', '#e8d4f0', '#ffd6a5', '#252422'];

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

const randomRotation = () => (Math.random() - 0.5) * 5.5;

const CANVAS_ERASER_RADIUS = 16;

const strokeNearPoint = (stroke: CanvasStroke, wx: number, wy: number, r: number): boolean => {
  const pts = stroke.points;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x, dy = pts[i + 1].y - pts[i].y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) continue;
    const t = Math.max(0, Math.min(1, ((wx - pts[i].x) * dx + (wy - pts[i].y) * dy) / lenSq));
    if (Math.hypot(wx - (pts[i].x + t * dx), wy - (pts[i].y + t * dy)) < r) return true;
  }
  return false;
};

const eraseCanvasBrush = (strokes: CanvasStroke[], wx: number, wy: number, r: number): CanvasStroke[] => {
  const result: CanvasStroke[] = [];
  for (const stroke of strokes) {
    let current: { x: number; y: number }[] = [];
    for (const pt of stroke.points) {
      if (Math.hypot(pt.x - wx, pt.y - wy) > r) {
        current.push(pt);
      } else {
        if (current.length >= 2) result.push({ ...stroke, id: crypto.randomUUID(), points: current });
        current = [];
      }
    }
    if (current.length >= 2) result.push({ ...stroke, id: crypto.randomUUID(), points: current });
  }
  return result;
};

const Canvas = () => {
  const { user } = useAuth();
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [activeTool, setActiveTool] = useState<Tool>('pointer');
  const [pencilColor, setPencilColor] = useState('#252422');
  const [notes, setNotes] = useState<Note[]>([]);
  const [strings, setStrings] = useState<StringConnection[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [bgStrokes, setBgStrokes] = useState<CanvasStroke[]>([]);
  const [liveStroke, setLiveStroke] = useState<CanvasStroke | null>(null);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number; noteId?: string } | null>(null);
  const [cursorWorld, setCursorWorld] = useState<{ x: number; y: number } | null>(null);
  const [isCutting, setIsCutting] = useState(false);
  const [cutTrail, setCutTrail] = useState<{ x: number; y: number }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const lastCutWorld = useRef<{ x: number; y: number } | null>(null);
  const notesRef = useRef<Note[]>([]);
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingPinRef = useRef<{ x: number; y: number; noteId?: string } | null>(null);
  const transformRef = useRef(transform);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const liveStrokeRef = useRef<{ id: string; points: { x: number; y: number }[]; color: string; strokeWidth: number } | null>(null);
  const isDrawingBg = useRef(false);
  const isErasingBg = useRef(false);
  const erasedBgIds = useRef<Set<string>>(new Set());
  const preEraseBgIds = useRef<Set<string>>(new Set());

  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { transformRef.current = transform; }, [transform]);

  useEffect(() => {
    if (!user) { setNotes([]); setStrings([]); setStickers([]); setBgStrokes([]); return; }
    NoteService.getAll().then(setNotes).catch(() => {});
    StringService.getAll().then(setStrings).catch(() => {});
    StickerService.getAll().then(setStickers).catch(() => {});
    CanvasStrokeService.getAll().then(setBgStrokes).catch(() => {});
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
        setSearchOpen(false);
        setSearchQuery('');
      }
      if ((e.key === 'f' || e.key === 'F') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(v => { if (!v) setTimeout(() => searchInputRef.current?.focus(), 50); return !v; });
        return;
      }
      if (searchOpen) return;
      if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.key === 'c' || e.key === 'C') { setIsCutting(true); lastCutWorld.current = null; }
      if (e.key === 'a' || e.key === 'A') { setActiveTool('pointer'); pendingPinRef.current = null; setPendingPin(null); }
      if (e.key === 's' || e.key === 'S') { setActiveTool('string'); }
      if (e.key === 'p' || e.key === 'P') { setActiveTool('pencil'); pendingPinRef.current = null; setPendingPin(null); }
      if (e.key === 'e' || e.key === 'E') { setActiveTool('eraser'); pendingPinRef.current = null; setPendingPin(null); }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
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
  }, [searchOpen]);

  const toWorld = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const t = transformRef.current;
    return {
      x: (clientX - rect.left - t.x) / t.scale,
      y: (clientY - rect.top - t.y) / t.scale,
    };
  };



  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const onNote = !!(e.target as HTMLElement).closest('[data-note]');
    if (isCutting) return;

    if (activeTool === 'pencil' && !onNote) {
      isDrawingBg.current = true;
      const world = toWorld(e.clientX, e.clientY);
      const id = crypto.randomUUID();
      const stroke = { id, points: [{ x: jitter(world.x), y: jitter(world.y) }], color: pencilColor, strokeWidth: 4 };
      liveStrokeRef.current = stroke;
      setLiveStroke({ ...stroke });
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if ((activeTool === 'eraser' || activeTool === 'eraser-brush') && !onNote) {
      isErasingBg.current = true;
      preEraseBgIds.current = new Set(bgStrokes.map(s => s.id));
      erasedBgIds.current = new Set();
      const world = toWorld(e.clientX, e.clientY);
      const r = CANVAS_ERASER_RADIUS / transformRef.current.scale;
      if (activeTool === 'eraser') {
        setBgStrokes(prev => {
          prev.filter(s => strokeNearPoint(s, world.x, world.y, r))
            .forEach(s => { erasedBgIds.current.add(s.id); CanvasStrokeService.remove(s.id).catch(() => {}); });
          return prev.filter(s => !strokeNearPoint(s, world.x, world.y, r));
        });
      } else {
        setBgStrokes(prev => {
          prev.filter(s => strokeNearPoint(s, world.x, world.y, r)).forEach(s => erasedBgIds.current.add(s.id));
          return eraseCanvasBrush(prev, world.x, world.y, r);
        });
      }
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if (onNote) return;
    if (activeTool !== 'pointer' && activeTool !== 'string') return;
    isPanning.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const world = toWorld(e.clientX, e.clientY);
    setCursorWorld(world);

    if (isDrawingBg.current && liveStrokeRef.current) {
      const pt = { x: jitter(world.x), y: jitter(world.y) };
      liveStrokeRef.current = { ...liveStrokeRef.current, points: [...liveStrokeRef.current.points, pt] };
      setLiveStroke({ ...liveStrokeRef.current });
      return;
    }

    if (isErasingBg.current) {
      const r = CANVAS_ERASER_RADIUS / transformRef.current.scale;
      if (activeTool === 'eraser') {
        setBgStrokes(prev => {
          prev.filter(s => strokeNearPoint(s, world.x, world.y, r) && !erasedBgIds.current.has(s.id))
            .forEach(s => { erasedBgIds.current.add(s.id); CanvasStrokeService.remove(s.id).catch(() => {}); });
          return prev.filter(s => !strokeNearPoint(s, world.x, world.y, r));
        });
      } else {
        setBgStrokes(prev => {
          prev.filter(s => strokeNearPoint(s, world.x, world.y, r)).forEach(s => erasedBgIds.current.add(s.id));
          return eraseCanvasBrush(prev, world.x, world.y, r);
        });
      }
      return;
    }

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

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDrawingBg.current && liveStrokeRef.current) {
      isDrawingBg.current = false;
      const stroke = liveStrokeRef.current;
      liveStrokeRef.current = null;
      setLiveStroke(null);
      if (stroke.points.length >= 2 && user) {
        const tempId = stroke.id;
        setBgStrokes(prev => [...prev, stroke]);
        CanvasStrokeService.create({ points: stroke.points, color: stroke.color, strokeWidth: stroke.strokeWidth }).then(saved => {
          setBgStrokes(prev => prev.map(s => s.id === tempId ? saved : s));
        }).catch(() => {
          setBgStrokes(prev => prev.filter(s => s.id !== tempId));
        });
      }
      return;
    }
    if (isErasingBg.current) {
      isErasingBg.current = false;
      if (activeTool === 'eraser-brush') {
        erasedBgIds.current.forEach(id => CanvasStrokeService.remove(id).catch(() => {}));
        setBgStrokes(current => {
          current
            .filter(s => !preEraseBgIds.current.has(s.id))
            .forEach(s => {
              CanvasStrokeService.create({ points: s.points, color: s.color, strokeWidth: s.strokeWidth })
                .then(saved => setBgStrokes(prev => prev.map(p => p.id === s.id ? saved : p)))
                .catch(() => setBgStrokes(prev => prev.filter(p => p.id !== s.id)));
            });
          return current;
        });
      }
      return;
    }

    isPanning.current = false;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isCutting) return;

    if (activeTool === 'sticker') {
      if ((e.target as HTMLElement).closest('[data-note]')) return;
      const world = toWorld(e.clientX, e.clientY);
      if (!user) return;
      const draft = { x: world.x, y: world.y, rotation: randomRotation() * 2, scale: 1, emoji: '🐢' };
      const tempId = crypto.randomUUID();
      setStickers(prev => [...prev, { id: tempId, ...draft }]);
      StickerService.create(draft).then(saved => {
        setStickers(prev => prev.map(s => s.id === tempId ? saved : s));
      }).catch(() => {
        setStickers(prev => prev.filter(s => s.id !== tempId));
      });
      return;
    }

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
    const colorIdx = notes.length % NOTE_COLORS.length;
    const draft = {
      x: world.x - 104,
      y: world.y - 56,
      width: 208,
      height: 120,
      content: '',
      color: NOTE_COLORS[colorIdx],
      rotation: randomRotation(),
      shape: 'rectangle',
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

  const updateSticker = (id: string, changes: Partial<Sticker>) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, ...changes } : s));
    StickerService.update(id, changes).catch(() => {});
  };

  const deleteSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
    StickerService.remove(id).catch(() => {});
  };

  const duplicateNote = (note: Note) => {
    if (!user) return;
    const draft = {
      x: note.x + 28,
      y: note.y + 28,
      width: note.width,
      height: note.height,
      content: note.content,
      color: note.color,
      rotation: note.rotation + (Math.random() - 0.5) * 2,
      shape: note.shape,
      drawings: note.drawings,
    };
    NoteService.create(draft).then(saved => {
      setNotes(prev => [...prev, saved]);
    }).catch(() => {});
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

  const panTo = (worldX: number, worldY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTransform(t => ({
      ...t,
      x: rect.width / 2 - worldX * t.scale,
      y: rect.height / 2 - worldY * t.scale,
    }));
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

  const filteredNotes = searchQuery.trim()
    ? notes.filter(n => n.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const canvasCursor = isCutting
    ? 'crosshair'
    : activeTool === 'pencil'
    ? 'crosshair'
    : activeTool === 'sticker'
    ? 'cell'
    : activeTool === 'eraser' || activeTool === 'eraser-brush'
    ? 'cell'
    : 'default';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden select-none"
      style={{ cursor: canvasCursor }}
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

      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 8 }}
      >
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {bgStrokes.map(stroke => (
            <path
              key={stroke.id}
              d={pointsToPath(stroke.points)}
              stroke={stroke.color}
              strokeWidth={stroke.strokeWidth / transform.scale}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.75"
            />
          ))}
          {liveStroke && (
            <path
              d={pointsToPath(liveStroke.points)}
              stroke={liveStroke.color}
              strokeWidth={liveStroke.strokeWidth / transform.scale}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.75"
            />
          )}
        </g>
      </svg>

      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, zIndex: 20 }}
      >
        <TitleCard scale={transform.scale} />
        {stickers.map(sticker => (
          <CanvasSticker
            key={sticker.id}
            sticker={sticker}
            scale={transform.scale}
            onUpdate={updateSticker}
            onDelete={deleteSticker}
          />
        ))}
        {notes.map(note => (
          <CanvasNote
            key={note.id}
            note={note}
            scale={transform.scale}
            activeTool={activeTool}
            pencilColor={pencilColor}
            onUpdate={updateNote}
            onDelete={deleteNote}
            onDuplicate={duplicateNote}
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
              <path d={preview.d} stroke="#252422" strokeWidth="20" fill="none" strokeLinecap="round" strokeDasharray="10 7" />
              <path d={preview.d} stroke="#A81C07" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray="10 7" />
              <circle cx={cursorWorld.x} cy={cursorWorld.y} r={5} fill="#A81C07" />
            </g>
          )}
        </g>
      </svg>


      {searchOpen && (
        <div
          className="fixed inset-0 flex items-start justify-center pt-24"
          style={{ zIndex: 200, backgroundColor: 'rgba(37,36,34,0.3)' }}
          onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
          onPointerDown={e => e.stopPropagation()}
        >
          <div
            style={{
              backgroundColor: '#ede0d4',
              border: '4px solid #252422',
              borderRadius: '2px 4px 3px 5px / 5px 2px 4px 3px',
              boxShadow: '8px 8px 0 0 #252422',
              filter: 'url(#hand-drawn)',
              width: 420,
              maxWidth: '90vw',
              padding: 16,
            }}
            onClick={e => e.stopPropagation()}
          >
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="search notes..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '1rem',
                color: '#252422',
                fontFamily: 'inherit',
              }}
            />
            {searchQuery.trim() && (
              <div style={{ marginTop: 12, maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredNotes.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: '#252422', opacity: 0.5 }}>nothing found</p>
                ) : filteredNotes.map(n => (
                  <button
                    key={n.id}
                    onClick={() => {
                      panTo(n.x + (n.width ?? 208) / 2, n.y + (n.height ?? 120) / 2);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    style={{
                      textAlign: 'left',
                      background: n.color ?? '#ede0d4',
                      border: '2px solid #252422',
                      borderRadius: 3,
                      padding: '6px 10px',
                      fontSize: '0.8rem',
                      color: n.color === '#252422' ? '#ede0d4' : '#252422',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {n.content || '(empty note)'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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

      <Minimap
        notes={notes}
        strings={strings}
        viewX={transform.x}
        viewY={transform.y}
        viewScale={transform.scale}
        screenW={containerRef.current?.clientWidth ?? window.innerWidth}
        screenH={containerRef.current?.clientHeight ?? window.innerHeight}
        onPanTo={panTo}
      />

      <Toolbar
        activeTool={activeTool}
        pencilColor={pencilColor}
        onToolChange={tool => { setActiveTool(tool); if (tool !== 'string') { pendingPinRef.current = null; setPendingPin(null); } }}
        onPencilColorChange={setPencilColor}
      />

      <p className="fixed bottom-4 left-1/2 -translate-x-1/2 text-xs text-ink/50 pointer-events-none" style={{ zIndex: 50 }}>
        {isCutting
          ? 'slide through strings to cut them'
          : activeTool === 'pointer'
          ? 'double-click to add a note · hold c to cut · ⌘f search · a s p e switch tools'
          : activeTool === 'string'
          ? 'click to pin · click again to connect · esc to cancel'
          : activeTool === 'pencil'
          ? 'draw on canvas or inside notes · pick ink color below'
          : activeTool === 'sticker'
          ? 'click canvas to stamp · pick emoji below'
          : activeTool === 'eraser'
          ? 'click a stroke to remove it entirely'
          : 'drag to erase parts of strokes'}
      </p>
    </div>
  );
};

export default Canvas;
