import { QUOTES, Quote } from '../data/quotes';

export const getDailyQuote = (): Quote => {
    // Get current date set to midnight to ensure consistency throughout the day
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate days since a fixed epoch (e.g., Jan 1, 2024)
    // This ensures the index increments once every 24 hours
    const epoch = new Date(2025, 0, 1).getTime();
    const diff = startOfDay.getTime() - epoch;
    const daysSinceEpoch = Math.floor(diff / (1000 * 60 * 60 * 24));

    // Use modulo arithmetic to cycle through quotes
    // We use Math.abs to handle potential negative dates relative to epoch (though unlikely here)
    const index = Math.abs(daysSinceEpoch) % QUOTES.length;

    return QUOTES[index];
};
