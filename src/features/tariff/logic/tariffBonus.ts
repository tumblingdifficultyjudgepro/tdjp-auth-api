// src/features/tariff/logic/tariffBonus.ts
export type TrackKey = 'league' | 'national' | 'international';

export type BonusMeta = {
  track?: string | null;
  level?: string | number | null;
  gender?: string | null;
};

export type PassBonusResult = {
  perElement: number[];
  bonusSum: number;
};

function parseNumber(value: number | string | null | undefined): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value;
  const s = String(value).replace(',', '.').trim();
  const n = parseFloat(s);
  if (Number.isNaN(n)) return 0;
  return n;
}

export function normalizeTrackKey(value: string | null | undefined): TrackKey | null {
  if (!value) return null;
  const s = String(value).trim().toLowerCase();
  if (!s) return null;

  if (s === 'league') return 'league';
  if (s === 'national') return 'national';
  if (s === 'international') return 'international';

  if (s.includes('ליגה')) return 'league';
  if (s.startsWith('לאומ')) return 'national';
  if (s.startsWith('בינלאומ')) return 'international';

  return null;
}

function normalizeLeagueLevel(level: string | number | null | undefined): string {
  if (level == null) return '';
  const s = String(level).trim();
  if (!s) return '';

  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    if (n === 4) return 'ד';
    if (n === 3) return 'ג';
    if (n === 2) return 'ב';
    return 'א';
  }

  if (s.includes('ד')) return 'ד';
  if (s.includes('ג')) return 'ג';
  if (s.includes('ב')) return 'ב';
  return 'א';
}

export function computePassBonuses(
  values: (number | string | null | undefined)[],
  meta: BonusMeta,
): PassBonusResult {
  const b: number[] = Array(8).fill(0);
  const presentCount = values.filter(v => v != null && v !== '').length;

  const trackKey = normalizeTrackKey(meta.track);
  if (!trackKey) {
    return { perElement: b, bonusSum: 0 };
  }

  if (trackKey === 'league') {
    const level = normalizeLeagueLevel(meta.level);
    let minIdx = Infinity;
    if (level === 'ד') minIdx = 1;
    else if (level === 'ג') minIdx = 2;
    else if (level === 'ב') minIdx = 3;
    else minIdx = Infinity;

    for (let i = 0; i < presentCount; i++) {
      if (i > minIdx) b[i] = 0.3;
    }
  } else if (trackKey === 'national') {
    if (presentCount >= 6) b[5] = 0.3;
    if (presentCount >= 7) b[6] = 0.3;
    if (presentCount >= 8) b[7] = 0.4;
  } else if (trackKey === 'international') {
    const gender = meta.gender === 'F' || meta.gender === 'M' ? meta.gender : 'M';
    const thr = gender === 'F' ? 2.0 : 4.4;
    let qualifiedSeen = 0;

    for (let i = 0; i < Math.min(8, values.length, presentCount); i++) {
      const v = parseNumber(values[i]);
      const qualifies = Number.isFinite(v) && v >= thr;
      if (qualifies) {
        qualifiedSeen += 1;
        if (qualifiedSeen >= 2) {
          b[i] = 1.0;
        }
      }
    }
  }

  const bonusSum = b.reduce((sum, v) => sum + v, 0);
  return { perElement: b, bonusSum };
}
