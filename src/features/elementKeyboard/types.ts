export type SortKey = 'difficulty' | 'direction' | 'usage';

export type SortOrder = 'asc' | 'desc';

export type DisplayItem = {
  id: string;
  label: string;
  value: number;
  direction?: string;
  usage?: number;
};
