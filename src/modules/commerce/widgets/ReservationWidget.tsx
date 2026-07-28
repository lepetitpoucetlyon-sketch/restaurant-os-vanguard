'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { format, addDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar,
  Users,
  Clock,
  User,
  Mail,
  MessageSquare,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarPlus,
  Fingerprint,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Minimal Stripe.js types (no @stripe/stripe-js needed) ────────────────────
declare global {
  interface Window {
    Stripe?: (pk: string) => StripeInstance;
  }
}
interface StripeInstance {
  elements(): StripeElements;
  confirmCardSetup(
    clientSecret: string,
    data: { payment_method: { card: CardElement } }
  ): Promise<{ error?: { message: string }; setupIntent?: { payment_method: unknown } }>;
}
interface StripeElements {
  create(type: 'card', options?: object): CardElement;
}
interface CardElement {
  mount(el: HTMLElement): void;
  destroy(): void;
}

// ── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Date', icon: Calendar },
  { id: 2, label: 'Couverts', icon: Users },
  { id: 3, label: 'Horaire', icon: Clock },
  { id: 4, label: 'Identité', icon: User },
  { id: 5, label: 'Contact', icon: Mail },
  { id: 6, label: 'Remarques', icon: MessageSquare },
  { id: 7, label: 'Confirmation', icon: CheckCircle2 },
] as const;

type Step = (typeof STEPS)[number]['id'];

interface TimeSlot {
  time: string;
  available: boolean;
  tableId: string;
}

interface FormData {
  date: string;
  covers: number;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
}

export interface CardImprintConfig {
  enabled: boolean;
  condition: string;
  groupMin: number;
  penaltyAmount: number;
  cancelHours: number;
}

interface Props {
  tenantId: string;
  restaurantName: string;
  cardImprintConfig?: CardImprintConfig;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildICSLink(form: FormData, restaurantName: string): string {
  if (!form.date || !form.time) return '#';
  const [year, month, day] = form.date.split('-').map(Number);
  const [hour, minute] = form.time.split(':').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');
  const dtStart = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
  const endMs = new Date(year, month - 1, day, hour, minute).getTime() + 90 * 60 * 1000;
  const e = new Date(endMs);
  const dtEnd = `${e.getFullYear()}${pad(e.getMonth() + 1)}${pad(e.getDate())}T${pad(e.getHours())}${pad(e.getMinutes())}00`;
  const uid = `${form.date}T${form.time.replace(':', '')}@restaurant-os`;
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Restaurant OS//Reservation//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:Reservation chez ${restaurantName}`,
    `DESCRIPTION:${form.covers} couvert${form.covers > 1 ? 's' : ''}\\n${form.firstName} ${form.lastName}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

function imprintRequired(cfg: CardImprintConfig | undefined, covers: number): boolean {
  if (!cfg?.enabled) return false;
  if (cfg.condition === 'always') return true;
  if (cfg.condition === 'group' && covers >= cfg.groupMin) return true;
  // 'amount' and 'privatization' are edge cases handled server-side
  return false;
}

// ── Animations ───────────────────────────────────────────────────────────────

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 60 : -60, opacity: 0 }),
};

const transition: Transition = { duration: 0.28, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReservationWidget({ tenantId, restaurantName, cardImprintConfig }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<FormData>({
    date: '',
    covers: 2,
    time: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Card imprint step state ────────────────────────────────────────────────
  const [imprintActive, setImprintActive] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [penalty, setPenalty] = useState(cardImprintConfig?.penaltyAmount ?? 20);
  const stripeRef = useRef<StripeInstance | null>(null);
  const cardElementRef = useRef<CardElement | null>(null);
  const cardMountRef = useRef<HTMLDivElement | null>(null);

  // ── Stripe init when imprint step activates ────────────────────────────────
  useEffect(() => {
    if (!imprintActive) return;

    let mounted = true;

    async function init() {
      setStripeLoading(true);
      setStripeError(null);
      try {
        // 1. Load Stripe.js from CDN if not already present
        if (!window.Stripe) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Stripe.js failed to load'));
            document.head.appendChild(script);
          });
        }

        // 2. Create SetupIntent server-side
        const res = await fetch(
          `/api/widget/setup-intent?tenantId=${encodeURIComponent(tenantId)}&covers=${form.covers}`
        );
        const data: { required: boolean; clientSecret?: string; penaltyAmount?: number } = await res.json();

        if (!data.required) {
          // Server says no imprint needed — skip straight to booking
          if (mounted) { setImprintActive(false); void handleBook(undefined); }
          return;
        }

        if (!mounted) return;
        if (data.penaltyAmount) setPenalty(data.penaltyAmount);
        setClientSecret(data.clientSecret ?? null);

        // 3. Mount Stripe Elements
        const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
        const stripe = window.Stripe!(pk);
        stripeRef.current = stripe;

        const elements = stripe.elements();
        const card = elements.create('card', {
          style: {
            base: {
              fontFamily: 'system-ui, sans-serif',
              fontSize: '16px',
              color: '#1a1a1a',
              '::placeholder': { color: '#9ca3af' },
            },
          },
        });

        // Small delay to ensure DOM is rendered
        await new Promise((r) => setTimeout(r, 100));
        if (mounted && cardMountRef.current) {
          card.mount(cardMountRef.current);
          cardElementRef.current = card;
          setStripeReady(true);
        }
      } catch (err) {
        if (mounted) setStripeError(err instanceof Error ? err.message : 'Erreur Stripe');
      } finally {
        if (mounted) setStripeLoading(false);
      }
    }

    void init();
    return () => {
      mounted = false;
      cardElementRef.current?.destroy();
      cardElementRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imprintActive]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const go = useCallback(
    (next: Step) => {
      setDirection(next > step ? 1 : -1);
      setStep(next);
    },
    [step]
  );

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const dateOptions = Array.from({ length: 90 }, (_, i) => addDays(new Date(), i + 1));

  const fetchSlots = useCallback(async () => {
    if (!form.date || !form.covers) return;
    setLoadingSlots(true);
    try {
      const res = await fetch(
        `/api/widget/availability?tenantId=${encodeURIComponent(tenantId)}&date=${encodeURIComponent(form.date)}&covers=${form.covers}`
      );
      if (!res.ok) throw new Error('Erreur réseau');
      const data: TimeSlot[] = await res.json();
      setSlots(data);
    } catch {
      toast.error('Impossible de charger les horaires');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [form.date, form.covers, tenantId]);

  // ── Book ──────────────────────────────────────────────────────────────────
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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  }, [form, tenantId]);

  // ── Confirm card setup ───────────────────────────────────────────────────
  const handleConfirmCard = useCallback(async () => {
    if (!stripeRef.current || !cardElementRef.current || !clientSecret) return;
    setSubmitting(true);
    try {
      const result = await stripeRef.current.confirmCardSetup(clientSecret, {
        payment_method: { card: cardElementRef.current },
      });
      if (result.error) throw new Error(result.error.message);
      const pmId = result.setupIntent?.payment_method as string | undefined;
      await handleBook(pmId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur de carte');
      setSubmitting(false);
    }
  }, [clientSecret, handleBook]);

  // ── Proceed from step 6 ──────────────────────────────────────────────────
  const handleProceedFromNotes = useCallback(() => {
    if (imprintRequired(cardImprintConfig, form.covers)) {
      setImprintActive(true);
    } else {
      void handleBook(undefined);
    }
  }, [cardImprintConfig, form.covers, handleBook]);

  // ── Shared styles ─────────────────────────────────────────────────────────
  const inputClass =
    'w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-action-primary focus:border-transparent transition';
  const btnPrimary =
    'w-full rounded-2xl bg-action-primary hover:bg-action-primary active:scale-[0.98] text-text-primary font-semibold py-4 text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';
  const btnSecondary =
    'flex items-center gap-1.5 text-sm text-text-muted hover:text-gray-800 transition py-2 px-3 rounded-xl hover:bg-gray-100';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Step indicator */}
      {step < 7 && !imprintActive && (
        <div className="flex gap-1.5 px-6 pt-5">
          {STEPS.slice(0, 6).map((s) => (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                s.id <= step ? 'bg-action-primary' : 'bg-gray-100'
              }`}
            />
          ))}
        </div>
      )}

      <div className="px-6 pt-5 pb-6" style={{ minHeight: 340 }}>
        {/* ── Card imprint step (overlay) ──────────────────────────────── */}
        {imprintActive ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
                <Fingerprint className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-semibold text-gray-900">Garantie de réservation</h2>
                <p className="text-xs text-text-secondary">Aucun débit immédiat</p>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 space-y-1 text-sm text-amber-800">
              <p className="flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                Votre carte est enregistrée comme garantie mais <strong>jamais débitée</strong> si vous venez.
              </p>
              <p className="text-xs text-amber-600 pl-6">
                En cas de no-show, {penalty} € sont prélevés automatiquement le lendemain.
                Annulation gratuite {cardImprintConfig?.cancelHours ?? 24}h avant.
              </p>
            </div>

            {stripeLoading && (
              <div className="flex flex-col items-center gap-3 py-8 text-text-secondary">
                <Loader2 className="w-7 h-7 animate-spin text-action-primary" />
                <p className="text-sm">Chargement du formulaire sécurisé…</p>
              </div>
            )}

            {stripeError && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{stripeError}</span>
              </div>
            )}

            {/* Stripe Card Element mount point */}
            <div
              ref={cardMountRef}
              className={`rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 transition-all ${
                stripeReady ? 'opacity-100' : 'opacity-0 pointer-events-none h-0'
              }`}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setImprintActive(false)}
                disabled={submitting}
                className={btnSecondary}
              >
                <ChevronLeft className="w-4 h-4" /> Retour
              </button>
              <button
                className={btnPrimary}
                disabled={!stripeReady || submitting}
                onClick={() => void handleConfirmCard()}
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Traitement…</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /> Confirmer avec garantie</>
                )}
              </button>
            </div>

            <p className="text-center text-[10px] text-text-secondary">
              Paiement sécurisé par Stripe · PCI DSS Level 1
            </p>
          </motion.div>
        ) : (
          /* ── Normal steps ──────────────────────────────────────────── */
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
            >
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-serif font-semibold text-gray-900">Choisissez une date</h2>
                  <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                    {dateOptions.map((d) => {
                      const iso = format(d, 'yyyy-MM-dd');
                      const label = format(d, 'EEE d MMM', { locale: fr });
                      const selected = form.date === iso;
                      return (
                        <button
                          key={iso}
                          onClick={() => setField('date', iso)}
                          className={`rounded-2xl border px-3 py-4 text-sm font-medium transition-all capitalize ${
                            selected
                              ? 'border-action-primary bg-amber-50 text-amber-700 ring-2 ring-amber-300'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <button className={btnPrimary} disabled={!form.date} onClick={() => go(2)}>
                    Continuer <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-serif font-semibold text-gray-900">Nombre de couverts</h2>
                  <p className="text-sm text-text-muted">
                    {form.date ? format(parseISO(form.date), 'EEEE d MMMM', { locale: fr }) : ''}
                  </p>
                  <div className="flex items-center justify-center gap-6 py-6">
                    <button
                      onClick={() => setField('covers', Math.max(1, form.covers - 1))}
                      className="w-14 h-14 rounded-2xl border-2 border-gray-200 text-2xl font-bold text-gray-700 hover:border-amber-400 hover:bg-amber-50 transition flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="text-5xl font-serif font-bold text-gray-900 w-16 text-center">
                      {form.covers}
                    </span>
                    <button
                      onClick={() => setField('covers', Math.min(20, form.covers + 1))}
                      className="w-14 h-14 rounded-2xl border-2 border-gray-200 text-2xl font-bold text-gray-700 hover:border-amber-400 hover:bg-amber-50 transition flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => go(1)} className={btnSecondary}>
                      <ChevronLeft className="w-4 h-4" /> Retour
                    </button>
                    <button
                      className={btnPrimary}
                      onClick={() => { go(3); fetchSlots(); }}
                    >
                      Continuer <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-serif font-semibold text-gray-900">Choisissez un horaire</h2>
                  {loadingSlots ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-action-primary" />
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-center text-text-muted py-10 text-sm">
                      Aucune disponibilité pour cette date. Essayez un autre jour.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                      {slots.map((s) => (
                        <button
                          key={s.time}
                          disabled={!s.available}
                          onClick={() => setField('time', s.time)}
                          className={`rounded-2xl border py-4 text-sm font-medium transition-all ${
                            !s.available
                              ? 'border-gray-100 bg-gray-50 text-text-secondary cursor-not-allowed'
                              : form.time === s.time
                              ? 'border-action-primary bg-amber-50 text-amber-700 ring-2 ring-amber-300'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50'
                          }`}
                        >
                          {s.time}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => go(2)} className={btnSecondary}>
                      <ChevronLeft className="w-4 h-4" /> Retour
                    </button>
                    <button className={btnPrimary} disabled={!form.time} onClick={() => go(4)}>
                      Continuer <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-serif font-semibold text-gray-900">Vos coordonnées</h2>
                  <input
                    className={inputClass}
                    placeholder="Prénom"
                    value={form.firstName}
                    onChange={(e) => setField('firstName', e.target.value)}
                    autoComplete="given-name"
                  />
                  <input
                    className={inputClass}
                    placeholder="Nom"
                    value={form.lastName}
                    onChange={(e) => setField('lastName', e.target.value)}
                    autoComplete="family-name"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => go(3)} className={btnSecondary}>
                      <ChevronLeft className="w-4 h-4" /> Retour
                    </button>
                    <button
                      className={btnPrimary}
                      disabled={!form.firstName.trim() || !form.lastName.trim()}
                      onClick={() => go(5)}
                    >
                      Continuer <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-serif font-semibold text-gray-900">Email et téléphone</h2>
                  <input
                    className={inputClass}
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    autoComplete="email"
                  />
                  <input
                    className={inputClass}
                    type="tel"
                    placeholder="Téléphone (optionnel)"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    autoComplete="tel"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => go(4)} className={btnSecondary}>
                      <ChevronLeft className="w-4 h-4" /> Retour
                    </button>
                    <button
                      className={btnPrimary}
                      disabled={!form.email.trim() || !form.email.includes('@')}
                      onClick={() => go(6)}
                    >
                      Continuer <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-serif font-semibold text-gray-900">Remarques particulières</h2>
                  <textarea
                    className={`${inputClass} resize-none`}
                    rows={4}
                    placeholder="Allergie, occasion spéciale, besoin d'accessibilité… (optionnel)"
                    value={form.notes}
                    onChange={(e) => setField('notes', e.target.value)}
                    maxLength={500}
                  />
                  {/* Summary recap */}
                  <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Date</span>
                      <span className="font-medium">
                        {form.date ? format(parseISO(form.date), 'EEE d MMM yyyy', { locale: fr }) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Horaire</span>
                      <span className="font-medium">{form.time || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Couverts</span>
                      <span className="font-medium">{form.covers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Nom</span>
                      <span className="font-medium">{form.firstName} {form.lastName}</span>
                    </div>
                  </div>

                  {/* Show imprint badge if it will be required */}
                  {imprintRequired(cardImprintConfig, form.covers) && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
                      <Fingerprint className="w-3.5 h-3.5 flex-shrink-0" />
                      Une garantie bancaire sera demandée à l&apos;étape suivante (aucun débit immédiat).
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => go(5)} className={btnSecondary}>
                      <ChevronLeft className="w-4 h-4" /> Retour
                    </button>
                    <button
                      className={btnPrimary}
                      disabled={submitting}
                      onClick={handleProceedFromNotes}
                    >
                      {submitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Réservation en cours…</>
                      ) : imprintRequired(cardImprintConfig, form.covers) ? (
                        <><Fingerprint className="w-4 h-4" /> Continuer vers la garantie</>
                      ) : (
                        <>Confirmer la réservation <CheckCircle2 className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {step === 7 && (
                <div className="flex flex-col items-center text-center py-6 space-y-5">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </motion.div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-serif font-bold text-gray-900">Réservation confirmée !</h2>
                    <p className="text-text-muted text-sm">
                      Merci {form.firstName}, votre table est réservée chez {restaurantName}.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 px-6 py-4 space-y-1 w-full">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Référence</p>
                    <p className="font-mono text-lg font-bold text-amber-800 tracking-wider">
                      {bookingRef ?? '—'}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      {form.date ? format(parseISO(form.date), 'EEE d MMMM yyyy', { locale: fr }) : ''} • {form.time} • {form.covers} couvert{form.covers > 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Un email de confirmation a été envoyé à {form.email}
                  </p>
                  {bookingRef && form.date && form.time && (
                    <a
                      href={buildICSLink(form, restaurantName)}
                      download={`reservation-${form.date}.ics`}
                      className={btnPrimary}
                    >
                      <CalendarPlus className="w-4 h-4" />
                      Ajouter à mon calendrier
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
