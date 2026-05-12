import { CanvasStroke } from '@types';

const base = `${process.env.NEXT_PUBLIC_API_URL}/canvas-strokes`;

const normalize = (data: Record<string, unknown>): CanvasStroke => ({
  id: String(data.id),
  points: Array.isArray(data.points) ? data.points : [],
  color: (data.color as string) ?? '#252422',
  strokeWidth: typeof data.strokeWidth === 'number' ? data.strokeWidth : 4,
});

const getAll = async (): Promise<CanvasStroke[]> => {
  const res = await fetch(base, { credentials: 'include' });
  if (!res.ok) throw new Error('failed to load strokes');
  return (await res.json()).map(normalize);
};

const create = async (s: Omit<CanvasStroke, 'id'>): Promise<CanvasStroke> => {
  const res = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(s),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('failed to save stroke');
  return normalize(await res.json());
};

const remove = async (id: string): Promise<void> => {
  await fetch(`${base}/${id}`, { method: 'DELETE', credentials: 'include' });
};

const removeAll = async (): Promise<void> => {
  await fetch(base, { method: 'DELETE', credentials: 'include' });
};

const CanvasStrokeService = { getAll, create, remove, removeAll };
export default CanvasStrokeService;
