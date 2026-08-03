'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@context/AuthContext';
import { stringPath } from './CanvasString';

type Props = {
  onFinish: () => void;
};

const STAGE_W = 760;
const STAGE_H = 440;

const NOTE1_POS = { x: 60, y: 90 };
const NOTE1_SMALL = { width: 230, height: 135 };
const NOTE1_BIG = { width: 350, height: 205 };
const NOTE2_POS = { x: 520, y: 250 };
const NOTE2_SIZE = { width: 230, height: 135 };

type Point = { x: number; y: number };
type Size = { width: number; height: number };
type Phase = 'playing' | 'cta';

const center = (pos: Point, size: Size): Point => ({
  x: pos.x + size.width / 2,
  y: pos.y + size.height / 2,
});

const corner = (pos: Point, size: Size): Point => ({
  x: pos.x + size.width,
  y: pos.y + size.height,
});

const TYPED_TEXT = 'double-click anywhere\non the board to add a note';
const TYPE_INTERVAL = 55;

const DOODLE_W = 300;
const DOODLE_H = 160;
const DOODLE_PATH = 'M0,95 C10,35 20,130 32,75 C42,28 50,138 64,65 C76,18 86,135 100,60 '
  + 'C112,22 122,130 138,63 C150,28 160,125 176,65 C188,32 198,115 214,60 '
  + 'C224,28 234,105 250,55 C260,35 270,68 285,50';

const SMALL_NOTES = [
  { left: 12, top: 66, width: 92, height: 62, color: '#d4edd4', rotate: 6 },
  { left: 58, top: 15, width: 84, height: 56, color: '#ffd6a5', rotate: -8 },
  { left: 90, top: 60, width: 86, height: 58, color: '#f9e4b7', rotate: 5 },
  { left: 6, top: 32, width: 78, height: 54, color: '#d4e4f0', rotate: -5 },
];

const noteStyle = (pos: Point, size: Size, color: string): React.CSSProperties => ({
  position: 'absolute',
  left: pos.x,
  top: pos.y,
  width: size.width,
  height: size.height,
  backgroundColor: color,
  border: '8px solid #252422',
  borderRadius: '2px 4px 3px 5px / 5px 2px 4px 3px',
  boxShadow: '8px 8px 0 0 #252422',
  filter: 'url(#hand-drawn)',
  transition: 'width 0.8s ease, height 0.8s ease, opacity 0.4s ease, transform 0.4s ease',
  padding: '10px 14px',
  color: '#252422',
  fontSize: '1.1rem',
  lineHeight: 1.4,
  whiteSpace: 'pre-wrap',
  overflow: 'hidden',
});

const IntroDemo = ({ onFinish }: Props) => {
  const { generate } = useAuth();
  const [phase, setPhase] = useState<Phase>('playing');
  const [cursorPos, setCursorPos] = useState<Point>({ x: 30, y: 30 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [pulseOn, setPulseOn] = useState(false);
  const [note1Visible, setNote1Visible] = useState(false);
  const [note1Size, setNote1Size] = useState<Size>(NOTE1_SMALL);
  const [note2Visible, setNote2Visible] = useState(false);
  const [typed, setTyped] = useState('');
  const [stringDrawn, setStringDrawn] = useState(false);
  const [caption, setCaption] = useState('');
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [cornerStringDrawn, setCornerStringDrawn] = useState(false);
  const [doodleDrawn, setDoodleDrawn] = useState(false);
  const [topRightNoteVisible, setTopRightNoteVisible] = useState(false);
  const [smallNotesShown, setSmallNotesShown] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [viewport, setViewport] = useState({ width: 1440, height: 900 });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervals = useRef<ReturnType<typeof setInterval>[]>([]);
  const finishedRef = useRef(false);

  const schedule = (fn: () => void, delay: number) => {
    timers.current.push(setTimeout(fn, delay));
  };

  const pulseAt = (delay: number) => {
    schedule(() => { setPulseKey(k => k + 1); setPulseOn(true); }, delay);
    schedule(() => setPulseOn(false), delay + 450);
  };

  const goToCta = () => {
    timers.current.forEach(clearTimeout);
    intervals.current.forEach(clearInterval);
    setCaption('');
    setPulseOn(false);
    setPhase('cta');
  };

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    timers.current.forEach(clearTimeout);
    intervals.current.forEach(clearInterval);
    localStorage.setItem('mela-intro-seen', '1');
    onFinish();
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError('');
    try {
      await generate();
      finish();
    } catch {
      setGenError('something went wrong, try again');
      setGenerating(false);
    }
  };

  useEffect(() => {
    setViewport({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  useEffect(() => {
    schedule(() => setOverlayVisible(true), 30);

    schedule(() => setCornerStringDrawn(true), 900);

    schedule(() => setCursorVisible(true), 500);
    schedule(() => setCursorPos(center(NOTE1_POS, NOTE1_SMALL)), 1100);

    pulseAt(2000);
    schedule(() => setNote1Visible(true), 2000);
    schedule(() => setCaption('double-click anywhere to add a note'), 2200);

    const typingStart = 2700;
    schedule(() => {
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setTyped(TYPED_TEXT.slice(0, i));
        if (i >= TYPED_TEXT.length) clearInterval(iv);
      }, TYPE_INTERVAL);
      intervals.current.push(iv);
    }, typingStart);

    const typingEnd = typingStart + TYPED_TEXT.length * TYPE_INTERVAL;

    schedule(() => {
      setCaption('drag the corner to resize');
      setCursorPos(corner(NOTE1_POS, NOTE1_SMALL));
    }, typingEnd + 2400);

    schedule(() => {
      setCursorPos(corner(NOTE1_POS, NOTE1_BIG));
      setNote1Size(NOTE1_BIG);
    }, typingEnd + 3600);

    schedule(() => setDoodleDrawn(true), typingEnd + 2100);
    schedule(() => setTopRightNoteVisible(true), typingEnd + 2900);
    SMALL_NOTES.forEach((_, i) => {
      schedule(() => setSmallNotesShown(n => Math.max(n, i + 1)), typingEnd + 1300 + i * 550);
    });

    schedule(() => {
      setCaption('add another note');
      setCursorPos(center(NOTE2_POS, NOTE2_SIZE));
    }, typingEnd + 5600);

    schedule(() => setNote2Visible(true), typingEnd + 6500);

    schedule(() => {
      setCaption('connect notes with a string');
      setCursorPos(center(NOTE1_POS, NOTE1_BIG));
    }, typingEnd + 8300);
    pulseAt(typingEnd + 9000);

    schedule(() => setCursorPos(center(NOTE2_POS, NOTE2_SIZE)), typingEnd + 9600);
    schedule(() => { setPulseKey(k => k + 1); setPulseOn(true); setStringDrawn(true); }, typingEnd + 10400);
    schedule(() => { setPulseOn(false); setCaption(''); }, typingEnd + 10900);

    schedule(() => goToCta(), typingEnd + 14800);

    return () => {
      timers.current.forEach(clearTimeout);
      intervals.current.forEach(clearInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const note1Center = center(NOTE1_POS, note1Size);
  const note2Center = center(NOTE2_POS, NOTE2_SIZE);
  const path = stringPath(note1Center.x, note1Center.y, note2Center.x, note2Center.y);

  const cornerStart: Point = { x: viewport.width * 0.07, y: viewport.height * 0.52 };
  const cornerEnd: Point = { x: viewport.width * 0.4, y: viewport.height * 0.14 };
  const cornerDist = Math.hypot(cornerEnd.x - cornerStart.x, cornerEnd.y - cornerStart.y);
  const cornerSag = cornerDist * 0.09;
  const cornerMx = (cornerStart.x + cornerEnd.x) / 2;
  const cornerMy = (cornerStart.y + cornerEnd.y) / 2 - cornerSag;
  const cornerString = { d: `M ${cornerStart.x} ${cornerStart.y} Q ${cornerMx} ${cornerMy} ${cornerEnd.x} ${cornerEnd.y}` };

  return (
    <div
      className="fixed inset-0"
      style={{
        zIndex: 300,
        backgroundColor: 'rgba(37,36,34,0.35)',
        opacity: overlayVisible ? 1 : 0,
        transition: 'opacity 0.5s ease',
        cursor: phase === 'playing' ? 'pointer' : 'default',
      }}
      onClick={() => { if (phase === 'playing') goToCta(); }}
    >
      {phase === 'playing' && (
        <button
          onClick={e => { e.stopPropagation(); goToCta(); }}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            backgroundColor: '#ede0d4',
            border: '3px solid #252422',
            borderRadius: '2px 4px 3px 4px / 4px 2px 4px 3px',
            boxShadow: '3px 3px 0 0 #252422',
            padding: '8px 16px',
            fontSize: '0.9rem',
            color: '#252422',
            cursor: 'pointer',
          }}
        >
          skip
        </button>
      )}

      <svg
        style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'visible', pointerEvents: 'none' }}
      >
        <path
          d={cornerString.d}
          pathLength={1}
          stroke="#252422"
          strokeWidth="18"
          fill="none"
          strokeLinecap="round"
          filter="url(#hand-drawn)"
          strokeDasharray={1}
          strokeDashoffset={cornerStringDrawn ? 0 : 1}
          style={{ transition: 'stroke-dashoffset 1.8s ease' }}
        />
        <path
          d={cornerString.d}
          pathLength={1}
          stroke="#A81C07"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          filter="url(#hand-drawn)"
          strokeDasharray={1}
          strokeDashoffset={cornerStringDrawn ? 0 : 1}
          style={{ transition: 'stroke-dashoffset 1.8s ease' }}
        />
        <circle cx={cornerStart.x} cy={cornerStart.y} r="4" fill="#A81C07" filter="url(#hand-drawn)" />
        <circle cx={cornerEnd.x} cy={cornerEnd.y} r="4" fill="#A81C07" filter="url(#hand-drawn)" />
      </svg>

      <svg
        style={{
          position: 'fixed',
          left: '75vw',
          top: '84vh',
          transform: 'translate(-50%, -50%)',
          width: DOODLE_W,
          height: DOODLE_H,
          overflow: 'visible',
          pointerEvents: 'none',
          animation: doodleDrawn ? 'intro-scribble-wiggle 7.0s steps(1, end) infinite' : 'none',
        }}
      >
        <path
          d={DOODLE_PATH}
          pathLength={1}
          stroke="#252422"
          strokeWidth="5.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#hand-drawn)"
          opacity="0.9"
          strokeDasharray={1}
          strokeDashoffset={doodleDrawn ? 0 : 1}
          style={{ transition: 'stroke-dashoffset 1.8s ease' }}
        />
      </svg>

      <div
        style={{
          position: 'fixed',
          left: '78vw',
          top: '22vh',
          width: 260,
          height: 150,
          backgroundColor: '#e8d4f0',
          border: '8px solid #252422',
          borderRadius: '2px 4px 3px 5px / 5px 2px 4px 3px',
          boxShadow: '8px 8px 0 0 #252422',
          filter: 'url(#hand-drawn)',
          transform: `translate(-50%, -50%) rotate(-7deg) scale(${topRightNoteVisible ? 1 : 0.4})`,
          opacity: topRightNoteVisible ? 1 : 0,
          transition: 'opacity 0.5s ease, transform 0.5s ease',
          animation: phase === 'cta' ? 'intro-note-wiggle 11.0s steps(1, end) infinite' : 'none',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -12,
            left: '25%',
            width: '50%',
            height: 20,
            backgroundColor: 'rgba(200,220,255,0.65)',
            border: '6px solid #252422',
            boxShadow: '3px 3px 0 0 #252422',
            transform: 'rotate(-2deg)',
          }}
        />
      </div>

      {SMALL_NOTES.map((n, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            left: `${n.left}vw`,
            top: `${n.top}vh`,
            width: n.width,
            height: n.height,
            backgroundColor: n.color,
            border: '6px solid #252422',
            borderRadius: '2px 4px 3px 5px / 5px 2px 4px 3px',
            boxShadow: '5px 5px 0 0 #252422',
            filter: 'url(#hand-drawn)',
            transform: `translate(-50%, -50%) rotate(${n.rotate}deg) scale(${smallNotesShown > i ? 1 : 0.4})`,
            opacity: smallNotesShown > i ? 1 : 0,
            transition: 'opacity 0.45s ease, transform 0.45s ease',
            animation: phase === 'cta' ? `intro-note-wiggle ${9.0 + i * 2.0}s steps(1, end) infinite` : 'none',
            pointerEvents: 'none',
          }}
        />
      ))}

      <div
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: STAGE_W,
          height: STAGE_H,
          maxWidth: '92vw',
          maxHeight: '70vh',
          opacity: phase === 'cta' ? 0.35 : 1,
          transition: 'opacity 0.5s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {caption && (
          <div
            style={{
              position: 'absolute',
              top: -84,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#ede0d4',
              border: '4px solid #252422',
              borderRadius: '3px 6px 4px 7px / 7px 3px 6px 4px',
              boxShadow: '6px 6px 0 0 #252422',
              filter: 'url(#hand-drawn)',
              padding: '14px 26px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            <p
              style={{
                textAlign: 'center',
                color: '#252422',
                fontSize: '1.3rem',
                margin: 0,
              }}
            >
              {caption}
            </p>
          </div>
        )}

        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
        >
          {note1Visible && note2Visible && (
            <>
              <path
                d={path.d}
                pathLength={1}
                stroke="#252422"
                strokeWidth="14"
                fill="none"
                strokeLinecap="round"
                filter="url(#hand-drawn)"
                strokeDasharray={1}
                strokeDashoffset={stringDrawn ? 0 : 1}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
              <path
                d={path.d}
                pathLength={1}
                stroke="#A81C07"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                filter="url(#hand-drawn)"
                strokeDasharray={1}
                strokeDashoffset={stringDrawn ? 0 : 1}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
              <circle cx={note1Center.x} cy={note1Center.y} r="4" fill="#A81C07" filter="url(#hand-drawn)" />
              <circle cx={note2Center.x} cy={note2Center.y} r="4" fill="#A81C07" filter="url(#hand-drawn)" />
            </>
          )}
        </svg>

        <div
          style={{
            ...noteStyle(NOTE1_POS, note1Size, '#f9e4b7'),
            opacity: note1Visible ? 1 : 0,
            transform: note1Visible ? 'scale(1)' : 'scale(0.5)',
            animation: phase === 'cta' ? 'intro-note-wiggle 10.0s steps(1, end) infinite' : 'none',
            pointerEvents: 'none',
          }}
        >
          {typed}
          <span style={{ animation: 'intro-caret-blink 1s step-start infinite' }}>|</span>
        </div>

        <div
          style={{
            ...noteStyle(NOTE2_POS, NOTE2_SIZE, '#d4e4f0'),
            opacity: note2Visible ? 1 : 0,
            transform: note2Visible ? 'scale(1)' : 'scale(0.5)',
            animation: phase === 'cta' ? 'intro-note-wiggle 9.6s steps(1, end) infinite' : 'none',
            pointerEvents: 'none',
          }}
        />

        {cursorVisible && phase === 'playing' && (
          <div
            style={{
              position: 'absolute',
              left: cursorPos.x,
              top: cursorPos.y,
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: '#252422',
              border: '2px solid #ede0d4',
              transform: 'translate(-50%, -50%)',
              transition: 'left 0.7s cubic-bezier(0.4, 0, 0.2, 1), top 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 2,
            }}
          />
        )}

        {pulseOn && phase === 'playing' && (
          <div
            key={pulseKey}
            style={{
              position: 'absolute',
              left: cursorPos.x,
              top: cursorPos.y,
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: '2px solid #ede0d4',
              animation: 'intro-cursor-pulse 0.45s ease-out',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {phase === 'cta' && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#ede0d4',
            border: '4px solid #252422',
            borderRadius: '3px 6px 4px 7px / 7px 3px 6px 4px',
            boxShadow: '10px 10px 0 0 #252422',
            filter: 'url(#hand-drawn)',
            padding: '44px 48px',
            width: 460,
            maxWidth: '92vw',
            textAlign: 'center',
            zIndex: 2,
          }}
          onClick={e => e.stopPropagation()}
        >
          <h2 style={{ fontSize: '2.1rem', margin: '0 0 14px', color: '#252422' }}>ready to make this yours?</h2>
          <p style={{ fontSize: '1.25rem', color: '#252422', opacity: 0.75, margin: '0 0 10px' }}>
            generate a free id to start adding your own notes and strings
          </p>
          <p style={{ fontSize: '1.05rem', color: '#252422', opacity: 0.6, margin: '0 0 26px', fontStyle: 'italic' }}>
            it's completely anonymous, no email or personal info needed
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              width: '100%',
              backgroundColor: '#252422',
              color: '#ede0d4',
              border: '3px solid #252422',
              borderRadius: '2px 4px 3px 4px / 4px 2px 4px 3px',
              boxShadow: '5px 5px 0 0 #252422',
              padding: '16px 24px',
              fontSize: '1.4rem',
              cursor: generating ? 'default' : 'pointer',
              opacity: generating ? 0.6 : 1,
            }}
          >
            {generating ? 'generating...' : 'generate my id'}
          </button>
          {genError && <p style={{ fontSize: '0.95rem', color: '#A81C07', margin: '12px 0 0' }}>{genError}</p>}
          <button
            onClick={finish}
            style={{
              display: 'block',
              margin: '20px auto 0',
              fontSize: '1.05rem',
              color: '#252422',
              opacity: 0.65,
              background: 'none',
              border: 'none',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            I already have an id
          </button>
        </div>
      )}
    </div>
  );
};

export default IntroDemo;
