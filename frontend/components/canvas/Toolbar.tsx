'use client';

import { Tool } from '@types';

type Props = {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
};

const tools: { id: Tool; label: string }[] = [
  { id: 'pointer', label: 'pointer' },
  { id: 'string', label: 'string' },
  { id: 'pencil', label: 'pencil' },
  { id: 'sticker', label: 'sticker' },
  { id: 'eraser', label: 'stroke eraser' },
  { id: 'eraser-brush', label: 'brush eraser' },
];

const Toolbar = ({ activeTool, onToolChange }: Props) => {
  return (
    <div
      className="fixed bottom-4 left-4 flex gap-2"
      style={{ zIndex: 50 }}
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
    >
      {tools.map(tool => {
        const active = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            style={{
              backgroundColor: active ? '#252422' : '#ede0d4',
              color: active ? '#ede0d4' : '#252422',
              border: '3px solid #252422',
              borderRadius: '2px 4px 3px 4px / 4px 2px 4px 3px',
              boxShadow: active ? '2px 2px 0 0 #252422' : '4px 4px 0 0 #252422',
              filter: 'url(#hand-drawn)',
              padding: '6px 14px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              transform: active ? 'translate(2px, 2px)' : 'none',
              transition: 'none',
            }}
          >
            {tool.label}
          </button>
        );
      })}
    </div>
  );
};

export default Toolbar;
