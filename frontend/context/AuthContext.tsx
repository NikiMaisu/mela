'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthService, { AuthUser } from '@services/AuthService';

const CODE_KEY = 'mela_code';

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  generate: () => Promise<string>;
  loginWithCode: (code: string) => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  upgrade: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const me = await AuthService.getMe();
        setUser(me);
      } catch {
        const savedCode = localStorage.getItem(CODE_KEY);
        if (savedCode) {
          try {
            const me = await AuthService.loginWithCode(savedCode);
            setUser(me);
          } catch {
            localStorage.removeItem(CODE_KEY);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const generate = async (): Promise<string> => {
    const result = await AuthService.generate();
    localStorage.setItem(CODE_KEY, result.code);
    setUser(result);
    return result.code;
  };

  const loginWithCode = async (code: string) => {
    const me = await AuthService.loginWithCode(code);
    localStorage.setItem(CODE_KEY, code.replaceAll('-', '').trim());
    setUser(me);
  };

  const loginWithCredentials = async (email: string, password: string) => {
    const me = await AuthService.loginWithCredentials(email, password);
    setUser(me);
  };

  const upgrade = async (username: string, email: string, password: string) => {
    const me = await AuthService.upgrade(username, email, password);
    setUser(me);
  };

  const logout = async () => {
    await AuthService.logout();
    localStorage.removeItem(CODE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, generate, loginWithCode, loginWithCredentials, upgrade, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
