import {
  PAGE_W,
  PAGE_H,
  TariffLang,
  renderTariffBackground,
} from '@/features/tariff/background/tariffBackground';
import {
  TARIFF_LAYOUT,
  FieldPosition,
  TariffLayoutForLang,
} from '@/features/tariff/export/tariffLayout';

export type TariffAthleteForm = {
  athleteName: string;
  club: string;
  gender: string;
  track: string;
  level: string;
  athleteNo: string;
  rotation: string;
};

export type TariffPassRowData = {
  symbols: (string | null)[];
  values: (number | string | null)[];
  bonuses: (number | string | null)[];
};

export type TariffExportData = {
  lang: TariffLang;
  form: TariffAthleteForm;
  pass1: TariffPassRowData;
  pass2: TariffPassRowData;
};

function escapeHtml(str: string | null | undefined): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function place(
  text: string | number | null | undefined,
  pos: FieldPosition,
  fallbackDir: 'ltr' | 'rtl',
): string {
  if (text == null || text === '') return '';
  const x = pos.x;
  const y = pos.y;
  const fs = pos.fs ?? 26;
  const align = pos.align ?? 'left';
  const dir = pos.dir ?? fallbackDir;

  const transform =
    align === 'center'
      ? 'translateX(-50%)'
      : align === 'right'
      ? 'translateX(-100%)'
      : 'none';

  const textAlign =
    align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';

  return `<div style="position:absolute; left:${x}px; top:${y}px; transform:${transform};
    font-size:${fs}px; font-weight:700; line-height:1.1; white-space:nowrap;
    text-align:${textAlign}; direction:${dir};
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,'Noto Sans Hebrew','Noto Sans',sans-serif;">
    ${escapeHtml(String(text))}
  </div>`;
}

function sumNumbers(values: (number | string | null | undefined)[]): number {
  let total = 0;
  for (const v of values) {
    if (v == null || v === '') continue;
    if (typeof v === 'number' && !isNaN(v)) {
      total += v;
      continue;
    }
    const s = String(v).replace(',', '.').trim();
    const n = parseFloat(s);
    if (!isNaN(n)) {
      total += n;
    }
  }
  return total;
}

// תמיד להציג ניקוד בפורמט 0.0
function formatScore(v: number | string | null | undefined): string {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'number') {
    if (!isFinite(v)) return '';
    return v.toFixed(1);
  }
  const s = String(v).replace(',', '.').trim();
  const n = parseFloat(s);
  if (!isFinite(n)) return '';
  return n.toFixed(1);
}

function looksHebrew(str: string | null | undefined): boolean {
  if (!str) return false;
  return /[\u0590-\u05FF]/.test(String(str));
}

type TrackKey = 'league' | 'national' | 'international';

const TRACK_LABELS: Record<TariffLang, Record<TrackKey, string>> = {
  he: {
    league: 'ליגה',
    national: 'לאומי',
    international: 'בינלאומי',
  },
  en: {
    league: 'League',
    national: 'National',
    international: 'International',
  },
};

function normalizeTrackKey(
  value: string | null | undefined,
): TrackKey | null {
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

function buildPassOverlay(
  pass: TariffPassRowData,
  layout: TariffLayoutForLang['passes'][1],
  baseDir: 'ltr' | 'rtl',
): string {
  const parts: string[] = [];

  for (let i = 0; i < 8; i++) {
    const symbolPos = layout.symbols[i];
    const valuePos = layout.values[i];
    const bonusPos = layout.bonus[i];

    const symbol = pass.symbols[i] ?? null;
    const value = pass.values[i] ?? null;
    const bonus = pass.bonuses[i] ?? null;

    if (symbolPos) {
      parts.push(place(symbol, symbolPos, baseDir));
    }
    if (valuePos) {
      const valueText = formatScore(value);
      parts.push(place(valueText, valuePos, baseDir));
    }
    if (bonusPos) {
      const bonusText = formatScore(bonus);
      parts.push(place(bonusText, bonusPos, baseDir));
    }
  }

  const ddTotal = sumNumbers(pass.values);
  const bonusTotal = sumNumbers(pass.bonuses);
  const withBonusTotal = ddTotal + bonusTotal;

  const ddText = formatScore(ddTotal);
  const bonusText = formatScore(bonusTotal);
  const withBonusText = formatScore(withBonusTotal);

  parts.push(place(ddText, layout.totals.dd, baseDir));
  parts.push(place(bonusText, layout.totals.bonus, baseDir));
  parts.push(place(withBonusText, layout.totals.withBonus, baseDir));

  return parts.join('');
}

export function buildTariffOverlayHtml(data: TariffExportData): string {
  const layout = TARIFF_LAYOUT[data.lang];
  const baseDir: 'ltr' | 'rtl' = data.lang === 'he' ? 'rtl' : 'ltr';

  const parts: string[] = [];

  parts.push(
    place(data.form.athleteName, layout.fields.athleteName, baseDir),
  );
  parts.push(place(data.form.club, layout.fields.club, baseDir));
  parts.push(place(data.form.gender, layout.fields.gender, baseDir));

  const rawTrack = data.form.track;
  let trackText = '';
  if (!rawTrack) {
    trackText = '';
  } else if (looksHebrew(rawTrack)) {
    trackText = rawTrack;
  } else {
    const key = normalizeTrackKey(rawTrack);
    const labels = TRACK_LABELS[data.lang] ?? TRACK_LABELS.he;
    trackText = key ? labels[key] : rawTrack;
  }
  parts.push(place(trackText, layout.fields.track, baseDir));

  parts.push(place(data.form.level, layout.fields.level, baseDir));
  parts.push(place(data.form.athleteNo, layout.fields.athleteNo, baseDir));
  parts.push(place(data.form.rotation, layout.fields.rotation, baseDir));

  parts.push(buildPassOverlay(data.pass1, layout.passes[1], baseDir));
  parts.push(buildPassOverlay(data.pass2, layout.passes[2], baseDir));

  return `<div class="tariff-overlay" style="position:absolute; inset:0; z-index:5; pointer-events:none;">
    ${parts.join('\n')}
  </div>`;
}

export function buildTariffPageHtml(data: TariffExportData): string {
  const bg = renderTariffBackground(data.lang, PAGE_W, PAGE_H);
  const overlay = buildTariffOverlayHtml(data);

  return `${bg}
${overlay}`;
}
