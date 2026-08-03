'use client';

import { Tool } from '@types';

type Props = {
  activeTool: Tool;
  pencilColor: string;
  uiScale: 'large' | 'compact';
  onToolChange: (tool: Tool) => void;
  onPencilColorChange: (color: string) => void;
};

const tools: { id: Tool; label: string }[] = [
  { id: 'pointer', label: 'pointer' },
  { id: 'string', label: 'string' },
  { id: 'pencil', label: 'pencil' },
  { id: 'eraser', label: 'stroke eraser' },
  { id: 'eraser-brush', label: 'brush eraser' },
];

const INK_COLORS = ['#252422', '#A81C07', '#1c4587', '#1e6b1e', '#7b4f00', '#6b1e6b'];

const btn = (active: boolean, large: boolean) => ({
  backgroundColor: active ? '#252422' : '#ede0d4',
  color: active ? '#ede0d4' : '#252422',
  border: '3px solid #252422',
  borderRadius: '2px 4px 3px 4px / 4px 2px 4px 3px',
  boxShadow: active ? '2px 2px 0 0 #252422' : '4px 4px 0 0 #252422',
  filter: 'url(#hand-drawn)',
  padding: large ? '16px 26px' : '8px 16px',
  fontSize: large ? '1.35rem' : '0.85rem',
  cursor: 'pointer',
  transform: active ? 'translate(2px, 2px)' : 'none',
  transition: 'none',
});

const panelStyle = (large: boolean) => ({
  backgroundColor: '#ede0d4',
  border: '3px solid #252422',
  borderRadius: '2px 4px 3px 4px / 4px 2px 4px 3px',
  boxShadow: '4px 4px 0 0 #252422',
  filter: 'url(#hand-drawn)',
  padding: large ? '12px 16px' : '7px 11px',
});

const Toolbar = ({ activeTool, pencilColor, uiScale, onToolChange, onPencilColorChange }: Props) => {
  const large = uiScale === 'large';
  const swatchSize = large ? 30 : 20;

  return (
    <div
      className="fixed bottom-4 left-4 flex flex-col gap-2 items-start"
      style={{ zIndex: 50 }}
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
    >
      {activeTool === 'pencil' && (
        <div className="flex gap-2 items-center" style={panelStyle(large)}>
          <span style={{ fontSize: large ? '1.15rem' : '0.75rem', color: '#252422', opacity: 0.6, marginRight: 2 }}>ink</span>
          {INK_COLORS.map(c => (
            <button
              key={c}
              onClick={() => onPencilColorChange(c)}
              style={{
                width: swatchSize,
                height: swatchSize,
                borderRadius: '50%',
                backgroundColor: c,
                border: '2px solid #252422',
                cursor: 'pointer',
                outline: pencilColor === c ? '2px solid #A81C07' : 'none',
                outlineOffset: 2,
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={e => { (e.currentTarget as HTMLButtonElement).blur(); onToolChange(tool.id); }}
            style={btn(activeTool === tool.id, large)}
          >
            {tool.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Toolbar;
