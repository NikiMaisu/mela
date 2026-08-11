'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@context/AuthContext';
import { useUIScale } from '@context/UIScaleContext';

type View = 'menu' | 'code-input' | 'credentials-input' | 'code-shown' | 'upgrade';

const MOBILE_BREAKPOINT = 768;

const cardStyle: React.CSSProperties = {
  backgroundColor: '#ede0d4',
  border: '3px solid #252422',
  borderRadius: '2px 4px 3px 4px / 4px 2px 4px 3px',
  boxShadow: '6px 6px 0 0 #252422',
  filter: 'url(#hand-drawn)',
  color: '#252422',
};

const inputStyle = (large: boolean): React.CSSProperties => ({
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: 'transparent',
  border: '2px solid #252422',
  borderRadius: '2px 3px 2px 3px / 3px 2px 3px 2px',
  padding: large ? '12px 16px' : '6px 10px',
  fontSize: large ? '1.2rem' : '0.8rem',
  color: '#252422',
  outline: 'none',
  fontFamily: 'inherit',
});

const btnStyle = (large: boolean, active = true): React.CSSProperties => ({
  ...cardStyle,
  boxShadow: active ? '4px 4px 0 0 #252422' : 'none',
  padding: large ? '13px 20px' : '6px 14px',
  fontSize: large ? '1.2rem' : '0.75rem',
  cursor: 'pointer',
  width: '100%',
  textAlign: 'left' as const,
  display: 'block',
});

const linkStyle = (large: boolean): React.CSSProperties => ({
  fontSize: large ? '1.1rem' : '0.72rem',
  color: '#252422',
  opacity: 0.6,
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: 0,
  fontFamily: 'inherit',
  textDecoration: 'underline',
});

const formatCode = (raw: string) =>
  raw.replace(/(.{4})/g, '$1-').replace(/-$/, '');

const AccountMenu = () => {
  const { user, loading, generate, loginWithCode, loginWithCredentials, upgrade, logout } = useAuth();
  const { uiScale } = useUIScale();
  const large = uiScale === 'large';
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('menu');
  const [codeInput, setCodeInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [shownCode, setShownCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
  }, []);

  const reset = () => {
    setView('menu');
    setCodeInput('');
    setEmail('');
    setPassword('');
    setUsername('');
    setError('');
    setCopied(false);
  };

  const close = () => { setOpen(false); reset(); };

  const handleGenerate = async () => {
    setError('');
    try {
      const code = await generate();
      setShownCode(code);
      setView('code-shown');
    } catch {
      setError('something went wrong, try again');
    }
  };

  const handleLoginCode = async () => {
    setError('');
    try {
      await loginWithCode(codeInput);
      close();
    } catch {
      setError('that code doesn\'t match any account');
    }
  };

  const handleLoginCredentials = async () => {
    setError('');
    try {
      await loginWithCredentials(email, password);
      close();
    } catch {
      setError('wrong email or password');
    }
  };

  const handleUpgrade = async () => {
    setError('');
    try {
      await upgrade(username, email, password);
      setView('menu');
      setError('');
    } catch {
      setError('something went wrong, try again');
    }
  };

  const handleLogout = async () => {
    await logout();
    close();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(formatCode(shownCode));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buttonLabel = loading ? '...' : user ? (user.username ?? 'account') : 'sign in';
  const labelSize = large ? '1.25rem' : '0.8rem';
  const smallSize = large ? '1.05rem' : '0.72rem';

  return (
    <div
      className="fixed top-4 right-4"
      style={{ zIndex: 50 }}
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
    >
      <button
        style={btnStyle(large)}
        onClick={() => { setOpen(o => !o); if (open) reset(); }}
      >
        {buttonLabel}
      </button>

      {open && (
        <div style={{ ...cardStyle, marginTop: 8, padding: large ? '26px 30px' : '18px 20px', width: large ? 360 : 280, display: 'flex', flexDirection: 'column', gap: large ? 16 : 12 }}>

          {view === 'menu' && !user && (
            <>
              <p style={{ fontSize: labelSize, fontWeight: 700, margin: 0 }}>your account</p>
              {!isMobile && <button style={btnStyle(large)} onClick={handleGenerate}>generate a new id</button>}
              {!isMobile && <button style={linkStyle(large)} onClick={() => { setView('code-input'); setError(''); }}>i already have an id</button>}
              <button style={isMobile ? btnStyle(large) : linkStyle(large)} onClick={() => { setView('credentials-input'); setError(''); }}>sign in with email</button>
              {error && <p style={{ fontSize: smallSize, color: '#A81C07', margin: 0 }}>{error}</p>}
            </>
          )}

          {view === 'code-input' && (
            <>
              <p style={{ fontSize: labelSize, fontWeight: 700, margin: 0 }}>enter your id</p>
              <input
                style={{ ...inputStyle(large), fontFamily: 'monospace', letterSpacing: '0.05em' }}
                placeholder="xxxx-xxxx-xxxx-xxxx-xxxx"
                value={codeInput}
                onChange={e => setCodeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLoginCode()}
              />
              <button style={btnStyle(large)} onClick={handleLoginCode}>log in</button>
              {error && <p style={{ fontSize: smallSize, color: '#A81C07', margin: 0 }}>{error}</p>}
              <button style={linkStyle(large)} onClick={() => { setView('menu'); setError(''); }}>back</button>
            </>
          )}

          {view === 'credentials-input' && (
            <>
              <p style={{ fontSize: labelSize, fontWeight: 700, margin: 0 }}>sign in</p>
              <input style={inputStyle(large)} placeholder="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              <input style={inputStyle(large)} placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLoginCredentials()} />
              <button style={btnStyle(large)} onClick={handleLoginCredentials}>sign in</button>
              {error && <p style={{ fontSize: smallSize, color: '#A81C07', margin: 0 }}>{error}</p>}
              <button style={linkStyle(large)} onClick={() => { setView('menu'); setError(''); }}>back</button>
            </>
          )}

          {view === 'code-shown' && (
            <>
              <p style={{ fontSize: labelSize, fontWeight: 700, margin: 0 }}>your new id</p>
              <p style={{ fontFamily: 'monospace', fontSize: large ? '1.3rem' : '0.9rem', letterSpacing: '0.08em', background: 'rgba(37,36,34,0.07)', padding: '10px 12px', borderRadius: 2, margin: 0, wordBreak: 'break-all' }}>
                {formatCode(shownCode)}
              </p>
              <button style={{ ...btnStyle(large), fontSize: smallSize }} onClick={copyCode}>
                {copied ? 'copied' : 'copy to clipboard'}
              </button>
              <p style={{ fontSize: smallSize, opacity: 0.6, margin: 0 }}>
                save this somewhere safe, it's the only way back in to your account
              </p>
              <button style={btnStyle(large)} onClick={close}>done</button>
            </>
          )}

          {view === 'menu' && user && (
            <>
              <p style={{ fontSize: labelSize, fontWeight: 700, margin: 0 }}>
                {user.username ? user.username : 'code account'}
              </p>
              {user.email && <p style={{ fontSize: smallSize, opacity: 0.6, margin: 0 }}>{user.email}</p>}
              {!user.hasCredentials && (
                <button style={linkStyle(large)} onClick={() => { setView('upgrade'); setError(''); }}>
                  add email and password
                </button>
              )}
              <button style={{ ...btnStyle(large), marginTop: 4 }} onClick={handleLogout}>sign out</button>
            </>
          )}

          {view === 'upgrade' && (
            <>
              <p style={{ fontSize: labelSize, fontWeight: 700, margin: 0 }}>add email and password</p>
              <input style={inputStyle(large)} placeholder="username (optional)" value={username} onChange={e => setUsername(e.target.value)} />
              <input style={inputStyle(large)} placeholder="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              <input style={inputStyle(large)} placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              <button style={btnStyle(large)} onClick={handleUpgrade}>save</button>
              {error && <p style={{ fontSize: smallSize, color: '#A81C07', margin: 0 }}>{error}</p>}
              <button style={linkStyle(large)} onClick={() => { setView('menu'); setError(''); }}>back</button>
            </>
          )}

        </div>
      )}
    </div>
  );
};

export default AccountMenu;
