'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import AdminService, { AdminUser, UserBoard, AdminDrawingPath } from '../../services/AdminService';

type View = 'checking' | 'login' | 'dashboard';

const drawingToPath = (pts: { x: number; y: number }[], ox: number, oy: number, s: number): string => {
  if (pts.length < 2) return '';
  let d = `M ${ox + pts[0].x * s} ${oy + pts[0].y * s}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${ox + pts[i].x * s} ${oy + pts[i].y * s} ${ox + mx * s} ${oy + my * s}`;
  }
  d += ` L ${ox + pts[pts.length - 1].x * s} ${oy + pts[pts.length - 1].y * s}`;
  return d;
};

const MiniCanvas = ({ board }: { board: UserBoard }) => {
  const W = 520, H = 280, PAD = 20;
  if (board.notes.length === 0 && board.strings.length === 0) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of board.notes) {
    minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width); maxY = Math.max(maxY, n.y + n.height);
  }
  for (const s of board.strings) {
    minX = Math.min(minX, s.x1, s.x2); minY = Math.min(minY, s.y1, s.y2);
    maxX = Math.max(maxX, s.x1, s.x2); maxY = Math.max(maxY, s.y1, s.y2);
  }
  const scale = Math.min((W - PAD * 2) / (maxX - minX || 1), (H - PAD * 2) / (maxY - minY || 1));
  const tx = (x: number) => (x - minX) * scale + PAD;
  const ty = (y: number) => (y - minY) * scale + PAD;

  return (
    <svg
      width={W} height={H}
      style={{ display: 'block', border: '2px solid #252422', borderRadius: '2px', backgroundColor: '#f7efe7', marginTop: '14px', maxWidth: '100%' }}
    >
      <defs>
        {board.notes.map(n => (
          <clipPath key={`clip-${n.id}`} id={`clip-${n.id}`}>
            <rect x={tx(n.x)} y={ty(n.y)} width={n.width * scale} height={n.height * scale} />
          </clipPath>
        ))}
      </defs>

      {board.strings.map(s => {
        const sx1 = tx(s.x1), sy1 = ty(s.y1), sx2 = tx(s.x2), sy2 = ty(s.y2);
        const dist = Math.sqrt((sx2 - sx1) ** 2 + (sy2 - sy1) ** 2);
        const mx = (sx1 + sx2) / 2;
        const my = (sy1 + sy2) / 2 + dist * 0.09;
        return (
          <path key={s.id} d={`M ${sx1} ${sy1} Q ${mx} ${my} ${sx2} ${sy2}`}
            stroke="#A81C07" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        );
      })}

      {board.notes.map(n => {
        const nx = tx(n.x), ny = ty(n.y);
        const nw = n.width * scale, nh = n.height * scale;
        return (
          <g key={n.id}>
            <rect x={nx} y={ny} width={nw} height={nh} fill="#ede0d4" stroke="#252422" strokeWidth={1.5} rx={1} />
            {n.drawings.map((path: AdminDrawingPath) => (
              <path
                key={path.id}
                d={drawingToPath(path.points, nx, ny, scale)}
                stroke="#252422"
                strokeWidth={Math.max(1, 4 * scale)}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
                clipPath={`url(#clip-${n.id})`}
              />
            ))}
            {!n.drawings.length && (
              <text x={nx + 4} y={ny + 11} fontSize={7} fill="#252422" style={{ userSelect: 'none' }}>
                {n.content.slice(0, 24)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

const handDrawn = {
  border: '3px solid #252422',
  boxShadow: '4px 4px 0 0 #252422',
  borderRadius: '2px 4px 3px 4px / 4px 2px 4px 3px',
} as const;

const AdminPage = () => {
  const [view, setView] = useState<View>('checking');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [board, setBoard] = useState<UserBoard | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [credError, setCredError] = useState('');

  const loadUsers = async () => {
    try {
      const data = await AdminService.getUsers();
      setUsers(data);
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => {
    AdminService.getMe()
      .then(() => {
        setView('dashboard');
        loadUsers();
      })
      .catch(() => {
        setView('login');
      });
  }, []);

  const handleLogin = async () => {
    setLoginError('');
    try {
      await AdminService.login(loginUsername, loginPassword);
      setView('dashboard');
      loadUsers();
    } catch {
      setLoginError('wrong username or password');
    }
  };

  const handleLoginKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleLogin();
  };

  const handleLogout = async () => {
    await AdminService.logout();
    setView('login');
    setUsers([]);
    setSelectedUser(null);
    setBoard(null);
  };

  const handleSelectUser = (user: AdminUser) => {
    setSelectedUser(user);
    setBoard(null);
    AdminService.getUserBoard(user.id).then(setBoard).catch(() => setBoard({ notes: [], strings: [] }));
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    const confirmed = window.confirm('delete this account and all their data?');
    if (!confirmed) return;
    await AdminService.deleteUser(selectedUser.id);
    setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
    setSelectedUser(null);
    setBoard(null);
  };

  const handleSaveCredentials = async () => {
    setCredError('');
    try {
      await AdminService.updateCredentials(newUsername, newPassword);
      setShowCredentials(false);
      setNewUsername('');
      setNewPassword('');
    } catch {
      setCredError('failed to update credentials');
    }
  };

  const displayName = (user: AdminUser) =>
    user.username ?? user.email ?? 'anonymous';

  const subLine = (user: AdminUser) => {
    if (user.username && user.email) return user.email;
    if (!user.username && !user.email) return 'no email';
    return null;
  };

  const formatDate = (str: string) => {
    try {
      return new Date(str).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return str;
    }
  };

  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + '…' : text;

  if (view === 'checking') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#ede0d4', color: '#252422', fontFamily: 'serif' }}>
        loading...
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#ede0d4', fontFamily: 'serif' }}>
        <div style={{ ...handDrawn, backgroundColor: '#ede0d4', padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: '14px', minWidth: '280px' }}>
          <div style={{ fontSize: '1.1rem', color: '#252422', marginBottom: '4px' }}>mela admin</div>
          <input
            type="text"
            placeholder="username"
            value={loginUsername}
            onChange={(e) => setLoginUsername(e.target.value)}
            onKeyDown={handleLoginKeyDown}
            style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#ede0d4', border: '2px solid #252422', outline: 'none', padding: '6px 10px', fontFamily: 'serif', fontSize: '0.95rem', color: '#252422', borderRadius: '1px' }}
          />
          <input
            type="password"
            placeholder="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            onKeyDown={handleLoginKeyDown}
            style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#ede0d4', border: '2px solid #252422', outline: 'none', padding: '6px 10px', fontFamily: 'serif', fontSize: '0.95rem', color: '#252422', borderRadius: '1px' }}
          />
          {loginError && (
            <div style={{ color: '#A81C07', fontSize: '0.85rem' }}>{loginError}</div>
          )}
          <button
            onClick={handleLogin}
            onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translate(2px,2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '4px 4px 0 0 #252422'; }}
            style={{ ...handDrawn, backgroundColor: '#ede0d4', color: '#252422', padding: '7px 18px', cursor: 'pointer', fontFamily: 'serif', fontSize: '0.95rem', marginTop: '4px' }}
          >
            log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ede0d4', fontFamily: 'serif', color: '#252422' }}>
      <div style={{ height: '48px', borderBottom: '2px solid #252422', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
        <span style={{ fontSize: '1rem' }}>mela admin</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => { setShowCredentials(true); setCredError(''); }}
            style={{ ...handDrawn, backgroundColor: '#ede0d4', color: '#252422', padding: '4px 12px', cursor: 'pointer', fontFamily: 'serif', fontSize: '0.85rem' }}
          >
            change login
          </button>
          <button
            onClick={handleLogout}
            style={{ ...handDrawn, backgroundColor: '#ede0d4', color: '#252422', padding: '4px 12px', cursor: 'pointer', fontFamily: 'serif', fontSize: '0.85rem' }}
          >
            log out
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: '260px', borderRight: '2px solid #252422', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ padding: '12px 14px', fontSize: '0.85rem', borderBottom: '1px solid #252422', color: '#252422' }}>
            users ({users.length})
          </div>
          {users.map((user) => {
            const sub = subLine(user);
            return (
              <div
                key={user.id}
                onClick={() => handleSelectUser(user)}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  backgroundColor: selectedUser?.id === user.id ? '#d4c8bc' : 'transparent',
                  borderBottom: '1px solid rgba(37,36,34,0.15)',
                }}
              >
                <div style={{ fontSize: '0.9rem' }}>{displayName(user)}</div>
                {sub && (
                  <div style={{ fontSize: '0.75rem', color: '#5a5652', marginTop: '2px' }}>{sub}</div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {!selectedUser ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#5a5652', fontSize: '0.9rem' }}>
              select a user to view their board
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{displayName(selectedUser)}</div>
              <div style={{ fontSize: '0.8rem', color: '#5a5652', marginBottom: '8px' }}>
                joined {formatDate(selectedUser.createdAt)}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#252422' }}>
                {board?.notes.length ?? 0} notes · {board?.strings.length ?? 0} strings
              </div>

              {board && <MiniCanvas board={board} />}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                {board?.notes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      width: '160px',
                      minHeight: '80px',
                      backgroundColor: '#ede0d4',
                      border: '4px solid #252422',
                      boxShadow: '5px 5px 0 0 #252422',
                      borderRadius: '2px 4px 3px 4px / 4px 2px 4px 3px',
                      padding: '10px',
                      fontSize: '0.8rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    {note.content ? (
                      truncate(note.content, 120)
                    ) : (
                      <span style={{ color: '#9a8e85' }}>(empty)</span>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleDeleteUser}
                style={{
                  marginTop: '24px',
                  backgroundColor: '#A81C07',
                  color: '#ede0d4',
                  border: '3px solid #252422',
                  boxShadow: '4px 4px 0 0 #252422',
                  borderRadius: '2px 4px 3px 4px / 4px 2px 4px 3px',
                  padding: '7px 18px',
                  cursor: 'pointer',
                  fontFamily: 'serif',
                  fontSize: '0.9rem',
                }}
              >
                delete account
              </button>
            </div>
          )}
        </div>
      </div>

      {showCredentials && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(37,36,34,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ ...handDrawn, backgroundColor: '#ede0d4', padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: '14px', minWidth: '280px' }}>
            <div style={{ fontSize: '1rem', color: '#252422' }}>change login</div>
            <input
              type="text"
              placeholder="new username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#ede0d4', border: '2px solid #252422', outline: 'none', padding: '6px 10px', fontFamily: 'serif', fontSize: '0.95rem', color: '#252422', borderRadius: '1px' }}
            />
            <input
              type="password"
              placeholder="new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#ede0d4', border: '2px solid #252422', outline: 'none', padding: '6px 10px', fontFamily: 'serif', fontSize: '0.95rem', color: '#252422', borderRadius: '1px' }}
            />
            {credError && (
              <div style={{ color: '#A81C07', fontSize: '0.85rem' }}>{credError}</div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleSaveCredentials}
                style={{ ...handDrawn, backgroundColor: '#ede0d4', color: '#252422', padding: '6px 16px', cursor: 'pointer', fontFamily: 'serif', fontSize: '0.9rem' }}
              >
                save
              </button>
              <button
                onClick={() => { setShowCredentials(false); setCredError(''); }}
                style={{ ...handDrawn, backgroundColor: '#ede0d4', color: '#252422', padding: '6px 16px', cursor: 'pointer', fontFamily: 'serif', fontSize: '0.9rem' }}
              >
                cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
