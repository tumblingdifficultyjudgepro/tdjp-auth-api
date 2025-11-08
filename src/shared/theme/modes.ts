export type Mode = 'light' | 'blue' | 'dark';

export const PALETTES = {
  light: { bg: '#ffffff', text: '#111111', card: '#f5f5f5', tint: '#007aff' },
  blue: { bg: '#0e1a2b', text: '#e8f0ff', card: '#15243b', tint: '#4da3ff' },
  dark: { bg: '#0f1115', text: '#f2f2f2', card: '#171a21', tint: '#4da3ff' }
} as const;

export type Palette = (typeof PALETTES)[keyof typeof PALETTES];
