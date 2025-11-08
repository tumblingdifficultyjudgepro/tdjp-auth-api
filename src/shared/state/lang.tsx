import React, { createContext, useContext, useState, ReactNode } from 'react';
export type Lang = 'he' | 'en';
type Ctx = { lang: Lang; setLang: (l: Lang) => void };
const LangContext = createContext<Ctx | undefined>(undefined);
export function LangProvider({ children, defaultLang = 'he' }: { children: ReactNode; defaultLang?: Lang }) {
  const [lang, setLang] = useState<Lang>(defaultLang);
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}
export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
