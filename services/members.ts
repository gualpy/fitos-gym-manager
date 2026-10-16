import { apiRequest } from './api';

export interface MembershipSummary {
  planName: string;
  startsOn: string;
  endsOn: string;
  state: 'scheduled' | 'current' | 'expired' | 'cancelled';
}

/** The customer's own record plus the membership covering today (or the next one), straight from the API. */
export const getCustomerDetail = (token: string, customerId: string) =>
  apiRequest<{ customer: { id: string; name: string }; membership: MembershipSummary | null }>(`/customers/${customerId}`, { token });
