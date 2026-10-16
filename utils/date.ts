const pad = (n: number) => String(n).padStart(2, '0');

/**
 * YYYY-MM-DD in LOCAL time. toISOString() returns the UTC date, which is already "tomorrow"
 * after 19:00 in Ecuador (UTC-5), so check-ins would be stored with the wrong day.
 */
export const toLocalDateString = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
