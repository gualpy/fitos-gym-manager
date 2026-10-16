import { apiRequest } from './api';

export type AttendanceResult = 'granted' | 'denied';

export interface AttendanceItem {
  id: string;
  customerId: string;
  customerName: string;
  clientCode: number;
  branchId: string;
  checkIn: string;
  checkOut: string | null;
  /** Calendar day in the GYM's time zone (YYYY-MM-DD). */
  date: string;
  /** Wall-clock times in the gym's own zone (HH:mm:ss): no time-zone maths needed here. */
  checkInTime: string;
  checkOutTime: string | null;
  minutes: number | null;
  result: AttendanceResult;
  denyReason: string | null;
  autoClosed: boolean;
}

export interface AttendancePage {
  items: AttendanceItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AttendanceFilters {
  from?: string;
  to?: string;
  result?: AttendanceResult;
  page?: number;
  pageSize?: number;
}

const query = (params: Record<string, string | number | undefined>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
};

/** Every scan of the gym (staff only). */
export const listAttendance = (filters: AttendanceFilters) =>
  apiRequest<AttendancePage>(`/attendance${query({ ...filters })}`, { auth: true });

/** One customer's history: staff, or the customer themself. */
export const listCustomerAttendance = (customerId: string, filters: AttendanceFilters) =>
  apiRequest<AttendancePage>(`/customers/${encodeURIComponent(customerId)}/attendance${query({ ...filters })}`, { auth: true });

export const checkIn = (clientCode: number) =>
  apiRequest<AttendanceItem>('/attendance/check-in', { body: { clientCode }, auth: true });

export const checkOut = (clientCode: number) =>
  apiRequest<AttendanceItem>('/attendance/check-out', { body: { clientCode }, auth: true });

/** "09:05:00" -> "09:05". */
export const shortTime = (time: string | null): string | null => (time ? time.slice(0, 5) : null);

export const denyReasonLabel = (reason: string | null): string => {
  switch (reason) {
    case 'customer_inactive':
      return 'Socio inactivo';
    case 'closed':
      return 'Gimnasio cerrado';
    case 'outside_hours':
      return 'Fuera de horario';
    case 'no_active_membership':
      return 'Sin plan vigente';
    default:
      return 'Denegado';
  }
};
