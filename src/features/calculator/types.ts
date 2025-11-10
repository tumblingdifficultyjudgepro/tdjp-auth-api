export type ModeToggle = 'text' | 'symbol';
export type SortKey = 'difficulty' | 'direction' | 'usage';
export type SortOrder = 'asc' | 'desc';

export type ElementItem = {
  id: string;
  name: string;
  symbol?: string;
  value: number;
  direction?: string;
  usage?: number;
};

export type DisplayItem = {
  id: string;
  label: string;
  value: number;
  direction?: string;
  usage?: number;
};

export type SequenceItem = {
  id: string;
  label: string;
  value: number;
};
