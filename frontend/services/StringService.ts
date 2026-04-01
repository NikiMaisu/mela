import { StringConnection } from '@types';

const base = `${process.env.NEXT_PUBLIC_API_URL}/strings`;

const normalize = (data: Record<string, unknown>): StringConnection => ({
  id: String(data.id),
  x1: data.x1 as number,
  y1: data.y1 as number,
  x2: data.x2 as number,
  y2: data.y2 as number,
  color: (data.color as string) ?? '#A81C07',
  label: data.label as string | undefined,
  noteId1: data.noteId1 != null ? String(data.noteId1) : undefined,
  noteId2: data.noteId2 != null ? String(data.noteId2) : undefined,
  style: (data.style as string) ?? 'thread',
});

const getAll = async (): Promise<StringConnection[]> => {
  const res = await fetch(base, { credentials: 'include' });
  if (!res.ok) throw new Error('failed to load strings');
  const data = await res.json();
  return data.map(normalize);
};

const create = async (s: Omit<StringConnection, 'id'>): Promise<StringConnection> => {
  const res = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(s),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('failed to create string');
  return normalize(await res.json());
};

const updateColor = async (id: string, color: string): Promise<StringConnection> => {
  const res = await fetch(`${base}/${id}/color`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ color }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('failed to update string color');
  return normalize(await res.json());
};

const updateLabel = async (id: string, label: string): Promise<StringConnection> => {
  const res = await fetch(`${base}/${id}/label`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('failed to update string label');
  return normalize(await res.json());
};

const remove = async (id: string): Promise<void> => {
  await fetch(`${base}/${id}`, { method: 'DELETE', credentials: 'include' });
};

const updateStyle = async (id: string, style: string): Promise<StringConnection> => {
  const res = await fetch(`${base}/${id}/style`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ style }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('failed to update string style');
  return normalize(await res.json());
};

const StringService = { getAll, create, updateColor, updateLabel, updateStyle, remove };
export default StringService;
