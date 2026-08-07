'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { CardImprintStep }        from './widget/CardImprintStep';
import { ReservationStepsABC }    from './widget/ReservationStepsABC';
import { ReservationStepsDEFG }   from './widget/ReservationStepsDEFG';
import { useStripeSetupIntent }   from './widget/useStripeSetupIntent';
import {
  slideVariants,
  slideTransition,
  imprintRequired,
  type Step,
  type FormData,
  type CardImprintConfig,
} from './widget/reservation-widget-types';
import { Calendar, Users, Clock, User, Mail, MessageSquare, CheckCircle2 } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Date',         icon: Calendar },
  { id: 2, label: 'Couverts',     icon: Users },
  { id: 3, label: 'Horaire',      icon: Clock },
  { id: 4, label: 'Identité',     icon: User },
  { id: 5, label: 'Contact',      icon: Mail },
  { id: 6, label: 'Remarques',    icon: MessageSquare },
  { id: 7, label: 'Confirmation', icon: CheckCircle2 },
] as const;

interface Props {
  tenantId: string;
  restaurantName: string;
  cardImprintConfig?: CardImprintConfig;
}

export default function ReservationWidget({ tenantId, restaurantName, cardImprintConfig }: Props) {
  const [step, setStep]         = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [form, setForm]         = useState<FormData>({ date: '', covers: 2, time: '', firstName: '', lastName: '', email: '', phone: '', notes: '' });
  const [slots, setSlots]       = useState<import('./widget/reservation-widget-types').TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingRef, setBookingRef]     = useState<string | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [imprintActive, setImprintActive] = useState(false);

  const go = useCallback((next: Step) => { setDirection(next > step ? 1 : -1); setStep(next); }, [step]);
  const setField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => setForm(f => ({ ...f, [key]: value })), []);

  const handleBook = useCallback(async (paymentMethodId: string | undefined) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/widget/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, ...form, stripePaymentMethodId: paymentMethodId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Erreur de réservation');
      setBookingRef(data.bookingRef);
      setImprintActive(false);
      setDirection(1);
      setStep(7);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  }, [form, tenantId]);

  const { stripeLoading, stripeReady, stripeError, penalty, cardMountRef, handleConfirmCard } = useStripeSetupIntent({
    imprintActive,
    tenantId,
    covers: form.covers,
    defaultPenalty: cardImprintConfig?.penaltyAmount ?? 20,
    setSubmitting,
    onSkipImprint: () => setImprintActive(false),
    onBook: handleBook,
  });

  const fetchSlots = useCallback(async () => {
    if (!form.date || !form.covers) return;
    setLoadingSlots(true);
    try {
      const res  = await fetch(`/api/widget/availability?tenantId=${encodeURIComponent(tenantId)}&date=${encodeURIComponent(form.date)}&covers=${form.covers}`);
      if (!res.ok) throw new Error('Erreur réseau');
      setSlots(await res.json());
    } catch {
      toast.error('Impossible de charger les horaires');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [form.date, form.covers, tenantId]);

  const handleProceedFromNotes = useCallback(() => {
    if (imprintRequired(cardImprintConfig, form.covers)) { setImprintActive(true); }
    else { void handleBook(undefined); }
  }, [cardImprintConfig, form.covers, handleBook]);

  const inputClass    = 'w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-action-primary focus:border-transparent transition';
  const btnPrimary    = 'w-full rounded-2xl bg-action-primary hover:bg-action-primary active:scale-[0.98] text-text-primary font-semibold py-4 text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';
  const btnSecondary  = 'flex items-center gap-1.5 text-sm text-text-muted hover:text-gray-800 transition py-2 px-3 rounded-xl hover:bg-gray-100';

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
      {step < 7 && !imprintActive && (
        <div className="flex gap-1.5 px-6 pt-5">
          {STEPS.slice(0, 6).map((s) => (
            <div key={s.id} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s.id <= step ? 'bg-action-primary' : 'bg-gray-100'}`} />
          ))}
        </div>
      )}

      <div className="px-6 pt-5 pb-6" style={{ minHeight: 340 }}>
        {imprintActive ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <CardImprintStep
              penalty={penalty}
              cardImprintConfig={cardImprintConfig}
              stripeLoading={stripeLoading}
              stripeError={stripeError}
              stripeReady={stripeReady}
              cardMountRef={cardMountRef}
              submitting={submitting}
              btnPrimary={btnPrimary}
              btnSecondary={btnSecondary}
              onBack={() => setImprintActive(false)}
              onConfirmCard={handleConfirmCard}
            />
          </motion.div>
        ) : (
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={step} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition}>
              {step <= 3 && (
                <ReservationStepsABC
                  step={step as 1 | 2 | 3}
                  form={form}
                  slots={slots}
                  loadingSlots={loadingSlots}
                  btnPrimary={btnPrimary}
                  btnSecondary={btnSecondary}
                  go={go}
                  setField={setField}
                  fetchSlots={fetchSlots}
                />
              )}
              {step >= 4 && (
                <ReservationStepsDEFG
                  step={step as 4 | 5 | 6 | 7}
                  form={form}
                  bookingRef={bookingRef}
                  restaurantName={restaurantName}
                  submitting={submitting}
                  cardImprintConfig={cardImprintConfig}
                  inputClass={inputClass}
                  btnPrimary={btnPrimary}
                  btnSecondary={btnSecondary}
                  go={go}
                  setField={setField}
                  handleProceedFromNotes={handleProceedFromNotes}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
