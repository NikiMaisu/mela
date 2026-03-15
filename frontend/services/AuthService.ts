const base = `${process.env.NEXT_PUBLIC_API_URL}/auth`;

export type AuthUser = {
  id: string;
  username?: string;
  email?: string;
  hasCredentials: boolean;
};

export type GenerateResult = AuthUser & { code: string };

const generate = async (): Promise<GenerateResult> => {
  const res = await fetch(`${base}/generate`, { method: 'POST', credentials: 'include' });
  if (!res.ok) throw new Error('failed to generate account');
  const data = await res.json();
  return { ...data, id: String(data.id) };
};

const loginWithCode = async (code: string): Promise<AuthUser> => {
  const res = await fetch(`${base}/login/code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('invalid code');
  const data = await res.json();
  return { ...data, id: String(data.id) };
};

const loginWithCredentials = async (email: string, password: string): Promise<AuthUser> => {
  const res = await fetch(`${base}/login/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('invalid credentials');
  const data = await res.json();
  return { ...data, id: String(data.id) };
};

const upgrade = async (username: string, email: string, password: string): Promise<AuthUser> => {
  const res = await fetch(`${base}/upgrade`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('failed to save');
  const data = await res.json();
  return { ...data, id: String(data.id) };
};

const getMe = async (): Promise<AuthUser> => {
  const res = await fetch(`${base}/me`, { credentials: 'include' });
  if (!res.ok) throw new Error('not authenticated');
  const data = await res.json();
  return { ...data, id: String(data.id) };
};

const logout = async (): Promise<void> => {
  await fetch(`${base}/logout`, { method: 'POST', credentials: 'include' });
};

const AuthService = { generate, loginWithCode, loginWithCredentials, upgrade, getMe, logout };
export default AuthService;
