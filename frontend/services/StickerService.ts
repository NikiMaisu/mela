import { Sticker } from '@types';

const base = `${process.env.NEXT_PUBLIC_API_URL}/stickers`;

const normalize = (data: Record<string, unknown>): Sticker => ({
  id: String(data.id),
  x: data.x as number,
  y: data.y as number,
  rotation: typeof data.rotation === 'number' ? data.rotation : 0,
  scale: typeof data.scale === 'number' ? data.scale : 1,
  emoji: data.emoji as string,
});

const getAll = async (): Promise<Sticker[]> => {
  const res = await fetch(base, { credentials: 'include' });
  if (!res.ok) throw new Error('failed to load stickers');
  return (await res.json()).map(normalize);
};

const create = async (s: Omit<Sticker, 'id'>): Promise<Sticker> => {
  const res = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(s),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('failed to create sticker');
  return normalize(await res.json());
};

const update = async (id: string, s: Partial<Sticker>): Promise<Sticker> => {
  const res = await fetch(`${base}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(s),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('failed to update sticker');
  return normalize(await res.json());
};

const remove = async (id: string): Promise<void> => {
  await fetch(`${base}/${id}`, { method: 'DELETE', credentials: 'include' });
};

const StickerService = { getAll, create, update, remove };
export default StickerService;
