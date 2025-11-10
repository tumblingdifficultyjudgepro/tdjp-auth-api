import React, { createContext, useContext, useMemo, useState } from 'react';

export type Mode = 'light' | 'blue' | 'dark';

export type Colors = {
  bg: string;
  text: string;
  card: string;
  tint: string;
  border: string;
};

type Ctx = {
  mode: Mode;
  setMode: (m: Mode) => void;
  colors: Colors;
};

const PALETTES: Record<Mode, Colors> = {
  light: { bg: '#ffffff', text: '#111111', card: '#f5f5f5', tint: '#007aff', border: '#007aff' },
  blue: { bg: '#0e1a2b', text: '#e8f0ff', card: '#15243b', tint: '#4da3ff', border: '#1f3b61' },
  dark: { bg: '#111111', text: '#f2f2f2', card: '#1b1b1b', tint: '#8ab4ff', border: '#2a2f3a' }
};

const ThemeCtx = createContext<Ctx | undefined>(undefined);

type ProviderProps = {
  children: React.ReactNode;
  defaultMode?: Mode;
};

export function AppThemeProvider({ children, defaultMode = 'light' }: ProviderProps) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const colors = useMemo(() => PALETTES[mode], [mode]);
  const value = useMemo(() => ({ mode, setMode, colors }), [mode, colors]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useAppTheme must be used within AppThemeProvider');
  return ctx;
}
