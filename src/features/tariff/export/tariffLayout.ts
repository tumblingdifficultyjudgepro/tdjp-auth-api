import { TariffLang } from '@/features/tariff/background/tariffBackground';

export type Align = 'left' | 'center' | 'right';

export type FieldPosition = {
  x: number;
  y: number;
  fs?: number;
  align?: Align;
  dir?: 'ltr' | 'rtl';
};

export type PassTotalsLayout = {
  dd: FieldPosition;
  bonus: FieldPosition;
  withBonus: FieldPosition;
};

export type PassLayout = {
  symbols: FieldPosition[];
  values: FieldPosition[];
  bonus: FieldPosition[];
  totals: PassTotalsLayout;
};

export type TariffLayoutForLang = {
  fields: {
    athleteName: FieldPosition;
    club: FieldPosition;
    gender: FieldPosition;
    track: FieldPosition;
    level: FieldPosition;
    athleteNo: FieldPosition;
    rotation: FieldPosition;
  };
  passes: {
    1: PassLayout;
    2: PassLayout;
  };
};

export const TARIFF_LAYOUT: Record<TariffLang, TariffLayoutForLang> = {
  he: {
    fields: {
      athleteName: { x: 2100, y: 262, fs: 70, align: 'center' },
      club: { x: 1100, y: 262, fs: 70, align: 'center' },
      gender: { x: 2935, y: 410, fs: 70, align: 'center' },
      track: { x: 2330, y: 410, fs: 70, align: 'center' },
      level: { x: 1780, y: 410, fs: 70, align: 'center' },
      athleteNo: { x: 950, y: 410, fs: 70, align: 'center' },
      rotation: { x: 520, y: 410, fs: 70, align: 'center' },
    },
    passes: {
      1: {
        symbols: [
          { x: 2561, y: 1000, fs: 70, align: 'center', dir: 'ltr' },
          { x: 2561, y: 1150, fs: 70, align: 'center', dir: 'ltr' },
          { x: 2561, y: 1300, fs: 70, align: 'center', dir: 'ltr' },
          { x: 2561, y: 1450, fs: 70, align: 'center', dir: 'ltr' },
          { x: 2561, y: 1600, fs: 70, align: 'center', dir: 'ltr' },
          { x: 2561, y: 1750, fs: 70, align: 'center', dir: 'ltr' },
          { x: 2561, y: 1900, fs: 70, align: 'center', dir: 'ltr' },
          { x: 2561, y: 2050, fs: 70, align: 'center', dir: 'ltr' },
        ],
        values: [
          { x: 2070, y: 1000, fs: 70, align: 'center' },
          { x: 2070, y: 1150, fs: 70, align: 'center' },
          { x: 2070, y: 1300, fs: 70, align: 'center' },
          { x: 2070, y: 1450, fs: 70, align: 'center' },
          { x: 2070, y: 1600, fs: 70, align: 'center' },
          { x: 2070, y: 1750, fs: 70, align: 'center' },
          { x: 2070, y: 1900, fs: 70, align: 'center' },
          { x: 2070, y: 2050, fs: 70, align: 'center' },
        ],
        bonus: [
          { x: 1690, y: 1000, fs: 70, align: 'center' },
          { x: 1690, y: 1150, fs: 70, align: 'center' },
          { x: 1690, y: 1300, fs: 70, align: 'center' },
          { x: 1690, y: 1450, fs: 70, align: 'center' },
          { x: 1690, y: 1600, fs: 70, align: 'center' },
          { x: 1690, y: 1750, fs: 70, align: 'center' },
          { x: 1690, y: 1900, fs: 70, align: 'center' },
          { x: 1690, y: 2050, fs: 70, align: 'center' },
        ],
        totals: {
          dd: { x: 2070, y: 2200, fs: 70, align: 'center' },
          bonus: { x: 1690, y: 2200, fs: 70, align: 'center' },
          withBonus: { x: 1310, y: 2350, fs: 70, align: 'center' },
        },
      },
      2: {
        symbols: [
          { x: 2561, y: 3050, fs: 70, align: 'center', dir: 'ltr' },
          { x: 2561, y: 3200, fs: 70, align: 'center', dir: 'ltr' },
          { x: 2561, y: 3350, fs: 70, align: 'center', dir: 'ltr' },
          { x: 2561, y: 3500, fs: 70, align: 'center', dir: 'ltr' },
          { x: 2561, y: 3650, fs: 70, align: 'center', dir: 'ltr' },
          { x: 2561, y: 3800, fs: 70, align: 'center', dir: 'ltr' },
          { x: 2561, y: 3950, fs: 70, align: 'center', dir: 'ltr' },
          { x: 2561, y: 4100, fs: 70, align: 'center', dir: 'ltr' },
        ],
        values: [
          { x: 2070, y: 3050, fs: 70, align: 'center' },
          { x: 2070, y: 3200, fs: 70, align: 'center' },
          { x: 2070, y: 3350, fs: 70, align: 'center' },
          { x: 2070, y: 3500, fs: 70, align: 'center' },
          { x: 2070, y: 3650, fs: 70, align: 'center' },
          { x: 2070, y: 3800, fs: 70, align: 'center' },
          { x: 2070, y: 3950, fs: 70, align: 'center' },
          { x: 2070, y: 4100, fs: 70, align: 'center' },
        ],
        bonus: [
          { x: 1690, y: 3050, fs: 70, align: 'center' },
          { x: 1690, y: 3200, fs: 70, align: 'center' },
          { x: 1690, y: 3350, fs: 70, align: 'center' },
          { x: 1690, y: 3500, fs: 70, align: 'center' },
          { x: 1690, y: 3650, fs: 70, align: 'center' },
          { x: 1690, y: 3800, fs: 70, align: 'center' },
          { x: 1690, y: 3950, fs: 70, align: 'center' },
          { x: 1690, y: 4100, fs: 70, align: 'center' },
        ],
        totals: {
          dd: { x: 2070, y: 4250, fs: 70, align: 'center' },
          bonus: { x: 1690, y: 4250, fs: 70, align: 'center' },
          withBonus: { x: 1310, y: 4400, fs: 70, align: 'center' },
        },
      },
    },
  },

  en: {
    fields: {
      athleteName: { x: 1250, y: 280, fs: 70, align: 'center' },
      club: { x: 2200, y: 280, fs: 70, align: 'center' },
      gender: { x: 410, y: 426, fs: 70, align: 'center' },
      track: { x: 1050, y: 426, fs: 70, align: 'center' },
      level: { x: 1640, y: 426, fs: 70, align: 'center' },
      athleteNo: { x: 2440, y: 426, fs: 70, align: 'center' },
      rotation: { x: 3000, y: 426, fs: 70, align: 'center' },
    },
    passes: {
      1: {
        symbols: [
          { x: 749, y: 1000, fs: 70, align: 'center', dir: 'ltr' },
          { x: 749, y: 1150, fs: 70, align: 'center', dir: 'ltr' },
          { x: 749, y: 1300, fs: 70, align: 'center', dir: 'ltr' }, 
          { x: 749, y: 1450, fs: 70, align: 'center', dir: 'ltr' },
          { x: 749, y: 1600, fs: 70, align: 'center', dir: 'ltr' },
          { x: 749, y: 1750, fs: 70, align: 'center', dir: 'ltr' },
          { x: 749, y: 1900, fs: 70, align: 'center', dir: 'ltr' },
          { x: 749, y: 2050, fs: 70, align: 'center', dir: 'ltr' },
        ],
        values: [
          { x: 1240, y: 1000, fs: 70, align: 'center' },
          { x: 1240, y: 1150, fs: 70, align: 'center' },
          { x: 1240, y: 1300, fs: 70, align: 'center' },
          { x: 1240, y: 1450, fs: 70, align: 'center' },
          { x: 1240, y: 1600, fs: 70, align: 'center' },
          { x: 1240, y: 1750, fs: 70, align: 'center' },
          { x: 1240, y: 1900, fs: 70, align: 'center' },
          { x: 1240, y: 2050, fs: 70, align: 'center' },
        ],
        bonus: [
          { x: 1620, y: 1000, fs: 70, align: 'center' },
          { x: 1620, y: 1150, fs: 70, align: 'center' },
          { x: 1620, y: 1300, fs: 70, align: 'center' },
          { x: 1620, y: 1450, fs: 70, align: 'center' },
          { x: 1620, y: 1600, fs: 70, align: 'center' },
          { x: 1620, y: 1750, fs: 70, align: 'center' },
          { x: 1620, y: 1900, fs: 70, align: 'center' },
          { x: 1620, y: 2050, fs: 70, align: 'center' },
        ],
        totals: {
          dd: { x: 1240, y: 2200, fs: 70, align: 'center' },
          bonus: { x: 1620, y: 2200, fs: 70, align: 'center' },
          withBonus: { x: 2000, y: 2350, fs: 70, align: 'center' },
        },
      },
      2: {
        symbols: [
          { x: 749, y: 3030, fs: 70, align: 'center', dir: 'ltr' },
          { x: 749, y: 3180, fs: 70, align: 'center', dir: 'ltr' },
          { x: 749, y: 3330, fs: 70, align: 'center', dir: 'ltr' },
          { x: 749, y: 3480, fs: 70, align: 'center', dir: 'ltr' },
          { x: 749, y: 3630, fs: 70, align: 'center', dir: 'ltr' },
          { x: 749, y: 3780, fs: 70, align: 'center', dir: 'ltr' },
          { x: 749, y: 3930, fs: 70, align: 'center', dir: 'ltr' },
          { x: 749, y: 4080, fs: 70, align: 'center', dir: 'ltr' },
        ],
        values: [
          { x: 1240, y: 3030, fs: 70, align: 'center' },
          { x: 1240, y: 3180, fs: 70, align: 'center' },
          { x: 1240, y: 3330, fs: 70, align: 'center' },
          { x: 1240, y: 3480, fs: 70, align: 'center' },
          { x: 1240, y: 3630, fs: 70, align: 'center' },
          { x: 1240, y: 3780, fs: 70, align: 'center' },
          { x: 1240, y: 3930, fs: 70, align: 'center' },
          { x: 1240, y: 4080, fs: 70, align: 'center' },
        ],
        bonus: [
          { x: 1620, y: 3030, fs: 70, align: 'center' },
          { x: 1620, y: 3180, fs: 70, align: 'center' },
          { x: 1620, y: 3330, fs: 70, align: 'center' },
          { x: 1620, y: 3480, fs: 70, align: 'center' },
          { x: 1620, y: 3630, fs: 70, align: 'center' },
          { x: 1620, y: 3780, fs: 70, align: 'center' },
          { x: 1620, y: 3930, fs: 70, align: 'center' },
          { x: 1620, y: 4080, fs: 70, align: 'center' },
        ],
        totals: {
          dd: { x: 1240, y: 4230, fs: 70, align: 'center' },
          bonus: { x: 1620, y: 4230, fs: 70, align: 'center' },
          withBonus: { x: 2000, y: 4380, fs: 70, align: 'center' },
        },
      },
    },
  },
};
