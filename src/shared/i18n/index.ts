import he from './he';
import en from './en';

export type Lang = 'he' | 'en';

const dictionaries = { he, en } as const;

export function t(lang: Lang, path: string): string {
  const parts = path.split('.');
  let value: any = dictionaries[lang];
  for (const p of parts) value = value?.[p];
  return typeof value === 'string' ? value : path;
}
