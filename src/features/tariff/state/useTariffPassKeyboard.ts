import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLang } from '@/shared/state/lang';
import * as ElementsData from '@/shared/data/elements';
import type { DisplayItem, SortKey, SortOrder } from '@/features/calculator/types';

type Track = 'league' | 'national' | 'international' | null;

type BaseElement = {
  id: string;
  name: any;
  symbol: string;
  value: number;
  direction: string;
  usage: number;
};

type SequenceItem = { id: string; value: number };

function pickValue(e: any) {
  const v = e?.value ?? e?.difficulty ?? e?.points ?? 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalize(raw: any[]): BaseElement[] {
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

export default function useTariffPassKeyboard(track: Track) {
  const { lang } = useLang();
  const isRTL = lang === 'he';

  const [sortKey, setSortKey] = useState<SortKey>('difficulty');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const [activePass, setActivePass] = useState<1 | 2 | null>(null);
  const [pass1, setPass1] = useState<SequenceItem[]>([]);
  const [pass2, setPass2] = useState<SequenceItem[]>([]);

  const maxSlots = track === 'league' ? 5 : 8;

  useEffect(() => {
    setPass1((prev) => prev.slice(0, maxSlots));
    setPass2((prev) => prev.slice(0, maxSlots));
  }, [track, maxSlots]);

  const raw = useMemo(() => getElements(lang as 'he' | 'en', isRTL), [lang, isRTL]);
  const normalized = useMemo(() => normalize(raw), [raw]);

  const byId = useMemo(() => {
    const m = new Map<string, BaseElement>();
    for (const e of normalized) m.set(e.id, e);
    return m;
  }, [normalized]);

  const elements = useMemo<DisplayItem[]>(() => {
    const mapped = normalized.map((e) => {
      const n = typeof e.name === 'object' ? e.name?.[lang] ?? '' : e.name ?? '';
      const label = n || e.symbol || e.id;
      return { id: e.id, label, value: e.value, direction: e.direction, usage: e.usage };
    });
    const sorted = [...mapped].sort((a, b) => {
      if (sortKey === 'difficulty') return sortOrder === 'asc' ? a.value - b.value : b.value - a.value;
      if (sortKey === 'direction') return sortOrder === 'asc'
        ? String(a.direction).localeCompare(String(b.direction))
        : String(b.direction).localeCompare(String(a.direction));
      return sortOrder === 'asc'
        ? (a.usage ?? 0) - (b.usage ?? 0)
        : (b.usage ?? 0) - (a.usage ?? 0);
    });
    return sorted;
  }, [normalized, sortKey, sortOrder, lang]);

  const mapSeq = useCallback(
    (seq: SequenceItem[]) =>
      seq.map(({ id, value }) => {
        const e = byId.get(id);
        const n = typeof e?.name === 'object' ? e.name?.[lang] ?? '' : e?.name ?? '';
        const label = n || e?.symbol || id;
        return { id, label, value };
      }),
    [byId, lang]
  );

  const pass1Display = useMemo(() => mapSeq(pass1), [mapSeq, pass1]);
  const pass2Display = useMemo(() => mapSeq(pass2), [mapSeq, pass2]);

  const addElement = useCallback(
    (id: string, value: number) => {
      if (activePass === 1)
        setPass1((p) => (p.length >= maxSlots ? p : [...p, { id, value }]));
      if (activePass === 2)
        setPass2((p) => (p.length >= maxSlots ? p : [...p, { id, value }]));
    },
    [activePass, maxSlots]
  );

  const deleteLast = useCallback(() => {
    if (activePass === 1) setPass1((p) => p.slice(0, -1));
    if (activePass === 2) setPass2((p) => p.slice(0, -1));
  }, [activePass]);

  const clearAll = useCallback(() => {
    setPass1([]);
    setPass2([]);
  }, []);

  const toggleOrder = useCallback(() => {
    setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
  }, []);

  const nextSortKey = useMemo<SortKey>(() => {
    if (sortKey === 'difficulty') return 'direction';
    if (sortKey === 'direction') return 'usage';
    return 'difficulty';
  }, [sortKey]);

  const cycleSortKey = useCallback(() => setSortKey(nextSortKey), [nextSortKey]);

  return {
    elements,
    sortKey,
    sortOrder,
    cycleSortKey,
    toggleOrder,
    addElement,
    deleteLast,
    clearAll,
    activePass,
    setActivePass,
    maxSlots,
    pass1Display,
    pass2Display,
  };
}
