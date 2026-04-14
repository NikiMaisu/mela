import { Note } from '@types';

const base = `${process.env.NEXT_PUBLIC_API_URL}/notes`;

const normalize = (data: Record<string, unknown>): Note => ({
  ...(data as unknown as Note),
  id: String(data.id),
  drawings: Array.isArray(data.drawings) ? data.drawings : [],
  width: typeof data.width === 'number' ? data.width : 208,
  height: typeof data.height === 'number' ? data.height : 120,
  rotation: typeof data.rotation === 'number' ? data.rotation : 0,
  shape: typeof data.shape === 'string' ? data.shape : 'rectangle',
});

const getAll = async (): Promise<Note[]> => {
  const res = await fetch(base, { credentials: 'include' });
  if (!res.ok) throw new Error('failed to load notes');
  const data = await res.json();
  return data.map(normalize);
};

const create = async (note: Omit<Note, 'id' | 'createdAt'>): Promise<Note> => {
  const res = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('failed to create note');
  return normalize(await res.json());
};

const update = async (id: string, note: Partial<Note>): Promise<void> => {
  await fetch(`${base}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
    credentials: 'include',
  });
};

const remove = async (id: string): Promise<void> => {
  await fetch(`${base}/${id}`, { method: 'DELETE', credentials: 'include' });
};

const NoteService = { getAll, create, update, remove };
export default NoteService;
