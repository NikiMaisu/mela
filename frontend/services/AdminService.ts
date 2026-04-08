const base = `${process.env.NEXT_PUBLIC_API_URL}/admin`;

export type AdminUser = {
  id: string;
  username: string | null;
  email: string | null;
  createdAt: string;
};

export type AdminDrawingPath = { id: string; points: { x: number; y: number }[] };

export type UserBoard = {
  notes: Array<{ id: string; content: string; x: number; y: number; width: number; height: number; drawings: AdminDrawingPath[] }>;
  strings: Array<{ id: string; x1: number; y1: number; x2: number; y2: number }>;
};

const login = async (username: string, password: string): Promise<void> => {
  const res = await fetch(`${base}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('invalid credentials');
};

const logout = async (): Promise<void> => {
  await fetch(`${base}/logout`, { method: 'POST', credentials: 'include' });
};

const getMe = async (): Promise<void> => {
  const res = await fetch(`${base}/me`, { credentials: 'include' });
  if (!res.ok) throw new Error('not authenticated');
};

const getUsers = async (): Promise<AdminUser[]> => {
  const res = await fetch(`${base}/users`, { credentials: 'include' });
  if (!res.ok) throw new Error('failed to fetch users');
  const data = await res.json();
  return data.map((u: { id: string | number; username: string | null; email: string | null; createdAt: string }) => ({
    id: String(u.id),
    username: u.username,
    email: u.email,
    createdAt: u.createdAt,
  }));
};

const getUserBoard = async (id: string): Promise<UserBoard> => {
  const res = await fetch(`${base}/users/${id}`, { credentials: 'include' });
  if (!res.ok) throw new Error('failed to fetch board');
  const data = await res.json();
  return {
    notes: (data.notes ?? []).map((n: { id: string | number; content?: string; x: number; y: number; width?: number; height?: number; drawings?: AdminDrawingPath[] }) => ({
      id: String(n.id),
      content: n.content ?? '',
      x: n.x,
      y: n.y,
      width: n.width ?? 208,
      height: n.height ?? 120,
      drawings: Array.isArray(n.drawings) ? n.drawings : [],
    })),
    strings: (data.strings ?? []).map((s: { id: string | number; x1: number; y1: number; x2: number; y2: number }) => ({
      id: String(s.id),
      x1: s.x1,
      y1: s.y1,
      x2: s.x2,
      y2: s.y2,
    })),
  };
};

const deleteUser = async (id: string): Promise<void> => {
  await fetch(`${base}/users/${id}`, { method: 'DELETE', credentials: 'include' });
};

const updateCredentials = async (username: string, password: string): Promise<void> => {
  const res = await fetch(`${base}/credentials`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('failed to update credentials');
};

const AdminService = { login, logout, getMe, getUsers, getUserBoard, deleteUser, updateCredentials };
export default AdminService;
