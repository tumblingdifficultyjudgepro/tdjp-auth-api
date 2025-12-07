export type Direction = 'forward' | 'backward';

export type Element = {
  id: string;
  name: { he: string; en: string };
  symbol: string;
  value: number;
  direction: Direction;
};

export type ElementItem = {
  id: string;
  name: string;
  symbol?: string;
  value: number;
  direction?: Direction;
  usage?: number;
};

export const ELEMENTS: Element[] = [
  {
    id: 'front_handspring',
    name: { he: 'קפיצת ידיים', en: 'Front Handspring' },
    symbol: 'H',
    value: 0.1,
    direction: 'forward'
  },
  { id: 'front_tuck', name: { he: 'סלטה קדימה בקירוס', en: 'Front Tuck' }, symbol: '.O', value: 0.6, direction: 'forward' },
  { id: 'front_pike', name: { he: 'סלטה קדימה בקיפול', en: 'Front Pike' }, symbol: '.<', value: 0.7, direction: 'forward' },
  { id: 'front_layout', name: { he: 'גוף ישר קדימה', en: 'Front Layout' }, symbol: './', value: 0.7, direction: 'forward' },
  { id: 'barani', name: { he: 'בראני', en: 'Barani' }, symbol: '.1', value: 0.8, direction: 'forward' },
  { id: 'front_full', name: { he: 'בורג קדימה', en: 'Front Full' }, symbol: '.2', value: 1.0, direction: 'forward' },
  { id: 'roundoff', name: { he: 'ערבית', en: 'Round Off' }, symbol: '(', value: 0.1, direction: 'backward' },
  { id: 'back_handspring', name: { he: 'פליק פלאק', en: 'Back Handspring' }, symbol: 'F', value: 0.1, direction: 'backward' },
  { id: 'tempo', name: { he: 'טמפו', en: 'Whip' }, symbol: '^', value: 0.2, direction: 'backward' },
  { id: 'back_tuck', name: { he: 'סלטה אחורה בקירוס', en: 'Back Tuck' }, symbol: 'O', value: 0.5, direction: 'backward' },
  { id: 'back_pike', name: { he: 'סלטה אחורה בקיפול', en: 'Back Pike' }, symbol: '<', value: 0.6, direction: 'backward' },
  { id: 'back_layout', name: { he: 'סלטה אחורה בגוף ישר', en: 'Back Layout' }, symbol: '/', value: 0.6, direction: 'backward' },
  { id: 'half_twist', name: { he: 'חצי בורג', en: 'Half Twist' }, symbol: '1', value: 0.7, direction: 'backward' },
  { id: 'full', name: { he: 'בורג', en: 'Full' }, symbol: '2', value: 0.9, direction: 'backward' },
  { id: 'one_and_half_twist', name: { he: 'בורג וחצי', en: '1.5 Twist' }, symbol: '3', value: 1.1, direction: 'backward' },
  { id: 'double_full', name: { he: 'דאבל בורג', en: 'Double Full' }, symbol: '4', value: 1.3, direction: 'backward' },
  { id: 'double_back_tuck', name: { he: 'דאבל קירוס', en: 'Double Tuck' }, symbol: '--O', value: 2.0, direction: 'backward' },
  { id: 'double_back_pike', name: { he: 'דאבל קיפול', en: 'Double Pike' }, symbol: '--<', value: 2.2, direction: 'backward' },
  { id: 'double_back_layout', name: { he: 'דאבל גוף ישר', en: 'Double Layout' }, symbol: '--/', value: 2.4, direction: 'backward' },
  { id: 'double_back_straddle', name: { he: 'דאבל בשפגאט', en: 'Double Split' }, symbol: '--Y', value: 2.4, direction: 'backward' },
  { id: 'half_out_layout', name: { he: 'האף אאוט גוף ישר', en: 'Half Out Layout' }, symbol: '-1/', value: 2.6, direction: 'backward' },
  {
    id: 'full_in_tuck',
    name: { he: 'פול אין קירוס', en: 'Full In Tuck' },
    symbol: '2-O',
    value: 2.4,
    direction: 'backward'
  },
  { id: 'full_out_tuck', name: { he: 'פול אאוט קירוס', en: 'Full Out Tuck' }, symbol: '-2O', value: 2.4, direction: 'backward' },
  { id: 'full_in_pike', name: { he: 'פול אין קיפול', en: 'Full In Pike' }, symbol: '2-<', value: 2.6, direction: 'backward' },
  { id: 'full_in_layout', name: { he: 'פול אין גוף ישר', en: 'Full In Layout' }, symbol: '2-/', value: 2.8, direction: 'backward' },
  { id: 'full_out_layout', name: { he: 'פול אאוט גוף ישר', en: 'Full Out Layout' }, symbol: '-2/', value: 2.8, direction: 'backward' },
  { id: 'full_full_tuck', name: { he: 'פול פול קירוס', en: 'Full Full Tuck' }, symbol: '22O', value: 3.2, direction: 'backward' },
  { id: 'full_full_layout', name: { he: 'פול פול גוף ישר', en: 'Full Full Layout' }, symbol: '22/', value: 3.6, direction: 'backward' },
  { id: 'full_full_half_tuck', name: { he: 'פול פול וחצי קירוס', en: 'Full In 1.5 Twist Out Tuck' }, symbol: '23O', value: 3.8, direction: 'backward' },
  { id: 'full_full_half_layout', name: { he: 'פול פול וחצי גוף ישר', en: 'Full In 1.5 Twist Out Layout' }, symbol: '23/', value: 4.2, direction: 'backward' },
  { id: 'miller_tuck', name: { he: 'מילר קירוס', en: 'Miller Tuck' }, symbol: '24O', value: 4.4, direction: 'backward' },
  { id: 'miller_layout', name: { he: 'מילר גוף ישר', en: 'Miller Layout' }, symbol: '24/', value: 4.8, direction: 'backward' },
  { id: 'killer', name: { he: 'קילר', en: 'Killer' }, symbol: '44/', value: 6.4, direction: 'backward' },
  { id: 'triple_back_tuck', name: { he: 'טריפל קירוס', en: 'Triple Tuck' }, symbol: '---O', value: 4.5, direction: 'backward' },
  { id: 'triple_back_pike', name: { he: 'טריפל קיפול', en: 'Triple Pike' }, symbol: '---<', value: 5.1, direction: 'backward' },
  { id: 'triple_back_layout', name: { he: 'טריפל גוף ישר', en: 'Triple Layout' }, symbol: '---/', value: 5.7, direction: 'backward' },
  { id: 'full_in_triple_tuck', name: { he: 'פול אין טריפל קירוס', en: 'Full In Triple Tuck' }, symbol: '2--O', value: 6.3, direction: 'backward' },
  { id: 'full_in_triple_pike', name: { he: 'פול אין טריפל קיפול', en: 'Full In Triple Pike' }, symbol: '2--<', value: 6.9, direction: 'backward' },
  { id: 'back_full_full_tuck', name: { he: 'באק פול פול קירוס', en: 'Back Full Full Tuck' }, symbol: '-22O', value: 8.7, direction: 'backward' },
  { id: 'full_full_full_tuck', name: { he: 'פול פול פול', en: 'Full Full Full' }, symbol: '222O', value: 11.1, direction: 'backward' }
];

export const ORDER_HE_FORWARD_IDS: string[] = [
  'front_handspring',
  'front_tuck',
  'front_pike',
  'front_layout',
  'barani',
  'front_full'
];

export const ORDER_HE_BACKWARD_IDS: string[] = [
  'roundoff',
  'back_handspring',
  'tempo',
  'back_tuck',
  'back_pike',
  'back_layout',
  'half_twist',
  'full',
  'one_and_half_twist',
  'double_full',
  'double_back_tuck',
  'double_back_pike',
  'double_back_layout',
  'double_back_straddle',
  'full_in_tuck',
  'full_out_tuck',
  'full_in_pike',
  'half_out_layout',
  'full_in_layout',
  'full_out_layout',
  'full_full_tuck',
  'full_full_layout',
  'full_full_half_tuck',
  'full_full_half_layout',
  'miller_tuck',
  'miller_layout',
  'killer',
  'triple_back_tuck',
  'triple_back_pike',
  'triple_back_layout',
  'full_in_triple_tuck',
  'full_in_triple_pike',
  'back_full_full_tuck',
  'full_full_full_tuck'
];

export const ORDER_EN_FORWARD_IDS: string[] = [
  'front_handspring',
  'front_tuck',
  'front_pike',
  'front_layout',
  'barani',
  'front_full'
];

export const ORDER_EN_BACKWARD_IDS: string[] = [
  'roundoff',
  'back_handspring',
  'tempo',
  'back_tuck',
  'back_pike',
  'back_layout',
  'half_twist',
  'full',
  'one_and_half_twist',
  'double_full',
  'double_back_tuck',
  'double_back_pike',
  'double_back_layout',
  'double_back_straddle',
  'half_out_layout',
  'full_in_tuck',
  'full_out_tuck',
  'full_in_pike',
  'full_in_layout',
  'full_out_layout',
  'full_full_tuck',
  'full_full_layout',
  'full_full_half_tuck',
  'full_full_half_layout',
  'miller_tuck',
  'miller_layout',
  'killer',
  'triple_back_tuck',
  'triple_back_pike',
  'triple_back_layout',
  'full_in_triple_tuck',
  'full_in_triple_pike',
  'back_full_full_tuck',
  'full_full_full_tuck'
];

export function getElementById(id: string): Element | undefined {
  return ELEMENTS.find(e => e.id === id);
}

export function keyboardOrderIds(lang: 'he' | 'en', direction: Direction): string[] {
  if (lang === 'he' && direction === 'forward') return ORDER_HE_FORWARD_IDS;
  if (lang === 'he' && direction === 'backward') return ORDER_HE_BACKWARD_IDS;
  if (lang === 'en' && direction === 'forward') return ORDER_EN_FORWARD_IDS;
  return ORDER_EN_BACKWARD_IDS;
}

export function keyboardElementsFor(lang: 'he' | 'en', direction: Direction): Element[] {
  const order = keyboardOrderIds(lang, direction);
  const set = new Set(order);
  const pool = ELEMENTS.filter(e => e.direction === direction);
  const byId: Record<string, Element> = {};
  for (const e of pool) byId[e.id] = e;
  const sorted: Element[] = [];
  for (const id of order) if (byId[id]) sorted.push(byId[id]);
  for (const e of pool) if (!set.has(e.id)) sorted.push(e);
  return sorted;
}
