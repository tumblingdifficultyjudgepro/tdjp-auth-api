import { useCallback, useMemo, useState } from 'react';
import { useLang } from '@/shared/state/lang';
import * as ElementsData from '@/shared/data/elements';
import type { ModeToggle, SortKey, SortOrder, DisplayItem } from '../types';

const MAX_SLOTS = 8;

function pickLabel(e: any, lang: 'he' | 'en', mode: ModeToggle) {
  const nameObj = e?.name ?? e?.title ?? e?.display ?? null;
  const name =
    typeof nameObj === 'string'
      ? nameObj
      : typeof nameObj === 'object'
      ? nameObj?.[lang] ?? nameObj?.he ?? nameObj?.en ?? ''
      : '';
  const symbol = e?.symbol ?? e?.sym ?? e?.code ?? '';
  const fallback = String(e?.id ?? e?.key ?? e?.code ?? '');
  return mode === 'symbol' ? (symbol || name || fallback) : (name || symbol || fallback);
}

function pickValue(e: any) {
  const v = e?.value ?? e?.difficulty ?? e?.points ?? 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalize(raw: any[]) {
  return raw.map((e) => ({
    id: String(e?.id ?? e?.code ?? e?.key ?? Math.random().toString(36).slice(2)),
    name: e?.name ?? e?.title ?? e?.display ?? '',
    symbol: e?.symbol ?? e?.sym ?? e?.code ?? '',
    value: pickValue(e),
    direction: e?.direction ?? e?.dir ?? '',
    usage: Number(e?.usage ?? e?.uses ?? 0),
  }));
}

function getElements(lang: 'he' | 'en', isRTL: boolean) {
  const anyData = ElementsData as any;
  const fns: Array<() => any[] | undefined> = [
    () => anyData.keyboardElementsFor?.(lang, isRTL ? 'rtl' : 'ltr'),
    () => anyData.keyboardElementsFor?.(lang),
    () => anyData.keyboardElementsFor?.(),
    () => anyData.elements,
    () => anyData.ELEMENTS,
    () => anyData.default?.elements,
    () => (Array.isArray(anyData.default) ? anyData.default : undefined),
  ];
  for (const fn of fns) {
    try {
      const res = fn?.();
      if (Array.isArray(res) && res.length) return res;
    } catch {}
  }
  return [];
}

export default function useCalculator() {
  const { lang } = useLang();
  const isRTL = lang === 'he';

  const [mode, setMode] = useState<ModeToggle>('text');
  const [sortKey, setSortKey] = useState<SortKey>('difficulty');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [sequence, setSequence] = useState<Array<{ id: string; value: number }>>([]);
  const [labelFontText, setLabelFontText] = useState<number>(17);
  const [labelFontSymbol, setLabelFontSymbol] = useState<number>(19);

  const elementsRaw = useMemo<any[]>(() => getElements(lang as 'he' | 'en', isRTL), [lang, isRTL]);
  const normalized = useMemo(() => normalize(elementsRaw), [elementsRaw]);

  const byId = useMemo(() => {
    const m = new Map<string, { name: any; symbol: string; value: number }>();
    for (const e of normalized) m.set(e.id, { name: e.name, symbol: e.symbol, value: e.value });
    return m;
  }, [normalized]);

  const elements = useMemo<DisplayItem[]>(() => {
    const mapped = normalized.map((e) => {
      const label =
        mode === 'symbol'
          ? (e.symbol || (typeof e.name === 'object' ? e.name?.[lang] ?? '' : e.name) || e.id)
          : ((typeof e.name === 'object' ? e.name?.[lang] ?? '' : e.name) || e.symbol || e.id);
      return { id: e.id, label, value: e.value, direction: e.direction, usage: e.usage };
    });
    const sorted = [...mapped].sort((a, b) => {
      if (sortKey === 'difficulty') return sortOrder === 'asc' ? a.value - b.value : b.value - a.value;
      if (sortKey === 'direction')
        return sortOrder === 'asc'
          ? String(a.direction).localeCompare(String(b.direction))
          : String(b.direction).localeCompare(String(a.direction));
      return sortOrder === 'asc' ? (a.usage ?? 0) - (b.usage ?? 0) : (b.usage ?? 0) - (a.usage ?? 0);
    });
    return sorted;
  }, [normalized, mode, sortKey, sortOrder, lang]);

  const sequenceDisplay = useMemo(() => {
    return sequence.map(({ id, value }) => {
      const base = byId.get(id);
      const name =
        typeof base?.name === 'object'
          ? base?.name?.[lang] ?? base?.name?.he ?? base?.name?.en ?? ''
          : base?.name ?? '';
      const symbol = base?.symbol ?? '';
      const label = mode === 'symbol' ? (symbol || name || id) : (name || symbol || id);
      return { id, label, value };
    });
  }, [sequence, byId, mode, lang]);

  // תמיד שומרים state בסדר קנוני LTR: מוסיפים לסוף ומוחקים מהסוף
  const insertSide: 'start' | 'end' = 'end';

  const addById = useCallback((id: string, value: number) => {
    setSequence((prev) => {
      if (prev.length >= MAX_SLOTS) return prev;
      const item = { id, value };
      return [...prev, item];
    });
  }, []);

  const deleteLast = useCallback(() => {
    setSequence((prev) => {
      if (!prev.length) return prev;
      return prev.slice(0, -1);
    });
  }, []);

  const clearAll = useCallback(() => setSequence([]), []);

  const toggleMode = useCallback(() => setMode((m) => (m === 'symbol' ? 'text' : 'symbol')), []);
  const toggleOrder = useCallback(() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc')), []);

  const nextSortKey = useMemo<SortKey>(() => {
    if (sortKey === 'difficulty') return 'direction';
    if (sortKey === 'direction') return 'usage';
    return 'difficulty';
  }, [sortKey]);

  const cycleSortKey = useCallback(() => setSortKey(nextSortKey), [nextSortKey]);

  const currentLabelFont = mode === 'symbol' ? labelFontSymbol : labelFontText;

  // RTL בשורת הסלוטים רק במצב טקסט בעברית; בסימבולס תמיד LTR בתצוגה
  const isBarRTL = mode !== 'symbol' && isRTL;

  const total = useMemo(() => sequence.reduce((s, x) => s + x.value, 0), [sequence]);

  return {
    lang,
    isRTL: isBarRTL,
    mode,
    sortKey,
    sortOrder,
    elements,
    sequenceDisplay,
    total,
    addById,
    deleteLast,
    clearAll,
    toggleMode,
    toggleOrder,
    cycleSortKey,
    setSortKey,
    setSortOrder,
    labelFontText,
    labelFontSymbol,
    setLabelFontText,
    setLabelFontSymbol,
    currentLabelFont,
  };
}
