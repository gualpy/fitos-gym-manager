import { apiRequest } from './api';

export interface DashboardSummary {
  /** Today's date in the gym's own calendar (YYYY-MM-DD). */
  today: string;
  totalCustomers: number;
  /** Active customers with a membership covering today. */
  activeMembers: number;
  expiringSoon: number;
  expiringWithinDays: number;
  attendanceToday: number;
  insideNow: number;
  /** Active customers by gender; gender is null for those who never gave one. */
  genders: { gender: 'M' | 'F' | 'O' | null; count: number }[];
  /** Last 7 gym days, oldest first. */
  attendance: { date: string; count: number }[];
  /** Null when the caller is not allowed to see money (reception). */
  sales: { today: number; last7Days: number; daily: { date: string; amount: number }[] } | null;
}

export interface Insights {
  text: string;
  generatedAt: string;
}

export const getDashboardSummary = () => apiRequest<DashboardSummary>('/dashboard/summary', { auth: true });

/** Owner/admin only. The server calls the AI provider (the key never reaches the browser) and caches the answer. */
export const getInsights = () => apiRequest<Insights>('/dashboard/insights', { auth: true });

/** "2026-10-18" -> "dom". */
export const weekdayShort = (date: string): string =>
  new Date(`${date}T00:00:00`).toLocaleDateString('es-EC', { weekday: 'short' }).replace('.', '');
