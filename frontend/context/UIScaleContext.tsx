'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const STORAGE_KEY = 'mela-ui-scale';

type UIScale = 'large' | 'compact';

type UIScaleContextType = {
  uiScale: UIScale;
  toggleUiScale: () => void;
};

const UIScaleContext = createContext<UIScaleContextType | undefined>(undefined);

export const UIScaleProvider = ({ children }: { children: ReactNode }) => {
  const [uiScale, setUiScale] = useState<UIScale>('large');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'compact' || stored === 'large') setUiScale(stored);
  }, []);

  const toggleUiScale = () => {
    setUiScale(prev => {
      const next = prev === 'large' ? 'compact' : 'large';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return (
    <UIScaleContext.Provider value={{ uiScale, toggleUiScale }}>
      {children}
    </UIScaleContext.Provider>
  );
};

export const useUIScale = () => {
  const ctx = useContext(UIScaleContext);
  if (!ctx) throw new Error('useUIScale must be used within UIScaleProvider');
  return ctx;
};
