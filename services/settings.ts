import { apiRequest } from './api';

export interface HoursDay {
  /** ISO weekday: 1 = Monday ... 7 = Sunday. */
  weekday: number;
  /** False when the gym never set this day (it then does not restrict access). */
  configured: boolean;
  isOpen: boolean;
  /** "HH:mm" */
  openTime: string;
  closeTime: string;
}

export interface GymSettings {
  allowWithoutPlan: boolean;
  timezone: string;
  branch: { id: string; name: string } | null;
  hours: HoursDay[];
}

export interface SettingsInput {
  allowWithoutPlan: boolean;
  hours?: Pick<HoursDay, 'weekday' | 'isOpen' | 'openTime' | 'closeTime'>[];
}

export const getSettings = () => apiRequest<GymSettings>('/settings', { auth: true });

export const saveSettings = (input: SettingsInput) =>
  apiRequest<GymSettings>('/settings', { method: 'PUT', body: input, auth: true });

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const weekdayName = (weekday: number): string => WEEKDAYS[weekday - 1] ?? String(weekday);
