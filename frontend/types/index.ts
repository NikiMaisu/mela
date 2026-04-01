export type Tool = 'pointer' | 'string' | 'pencil' | 'eraser' | 'eraser-brush';

export type DrawingPath = {
  id: string;
  points: { x: number; y: number }[];
};

export type Note = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  color: string;
  drawings: DrawingPath[];
  createdAt: string;
};

export type StringConnection = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  label?: string;
  noteId1?: string;
  noteId2?: string;
  style?: string;
};

export type StatusMessage = {
  message: string;
  type: 'error' | 'success';
};
