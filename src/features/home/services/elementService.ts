import { ELEMENTS, Element } from '@/shared/data/elements';

export function getDailyElement(): Element {
    // Use current date to determine the index
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Cycle through elements
    const index = dayOfYear % ELEMENTS.length;
    return ELEMENTS[index];
}
