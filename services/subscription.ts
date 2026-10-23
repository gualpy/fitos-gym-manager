import { apiRequest } from './api';

export interface SubscriptionStatus {
  /** Last day with service (yyyy-mm-dd). */
  endsOn: string;
  daysLeft: number;
  /** True from a few days before the end: time to remind the gym to renew. */
  showReminder: boolean;
}

export const getSubscription = () => apiRequest<SubscriptionStatus>('/subscription', { auth: true });
