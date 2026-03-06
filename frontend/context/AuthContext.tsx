'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
  email?: string;
  username?: string;
  role?: string;
  token?: string;
};

type AuthContextType = {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('loggedInUser');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const login = (userData: User) => {
    sessionStorage.setItem('loggedInUser', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem('loggedInUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
