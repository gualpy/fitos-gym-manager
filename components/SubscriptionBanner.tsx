import React, { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { ApiError } from '../services/api';
import { SubscriptionStatus, getSubscription } from '../services/subscription';

const dateLabel = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });

const whenText = (daysLeft: number) => (daysLeft <= 0 ? 'vence hoy' : daysLeft === 1 ? 'vence mañana' : `vence en ${daysLeft} días`);

/** A gentle, always-visible reminder for the gym's staff in the last days before the subscription ends. */
const SubscriptionBanner: React.FC = () => {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSubscription()
      .then((data) => !cancelled && setStatus(data))
      .catch((err) => {
        // A reminder is never worth interrupting the work: ignore any failure (401 is handled by the session manager).
        if (!(err instanceof ApiError)) return;
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status?.showReminder) return null;

  return (
    <div role="status" className="flex items-center gap-4 mb-8 bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 rounded-2xl px-6 py-4">
      <CalendarClock className="w-6 h-6 shrink-0" />
      <p className="font-bold">
        No olvides renovar tu suscripción, ¡muchas gracias!{' '}
        <span className="font-medium opacity-80">Tu servicio {whenText(status.daysLeft)} ({dateLabel(status.endsOn)}).</span>
      </p>
    </div>
  );
};

export default SubscriptionBanner;
