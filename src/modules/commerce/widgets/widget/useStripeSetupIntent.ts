'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// ── Minimal Stripe.js types (no @stripe/stripe-js dependency) ────────────────
declare global {
  interface Window { Stripe?: (pk: string) => StripeInstance; }
}
interface StripeInstance {
  elements(): StripeElements;
  confirmCardSetup(
    clientSecret: string,
    data: { payment_method: { card: CardElement } }
  ): Promise<{ error?: { message: string }; setupIntent?: { payment_method: unknown } }>;
}
interface StripeElements { create(type: 'card', options?: object): CardElement; }
interface CardElement { mount(el: HTMLElement): void; destroy(): void; }

interface Params {
  imprintActive: boolean;
  tenantId: string;
  covers: number;
  defaultPenalty: number;
  setSubmitting(v: boolean): void;
  onSkipImprint(): void;
  onBook(pmId: string | undefined): Promise<void>;
}

export function useStripeSetupIntent({
  imprintActive,
  tenantId,
  covers,
  defaultPenalty,
  setSubmitting,
  onSkipImprint,
  onBook,
}: Params) {
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeReady, setStripeReady]     = useState(false);
  const [stripeError, setStripeError]     = useState<string | null>(null);
  const [clientSecret, setClientSecret]   = useState<string | null>(null);
  const [penalty, setPenalty]             = useState(defaultPenalty);
  const stripeRef      = useRef<StripeInstance | null>(null);
  const cardElementRef = useRef<CardElement | null>(null);
  const cardMountRef   = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!imprintActive) return;
    let mounted = true;

    async function init() {
      setStripeLoading(true);
      setStripeError(null);
      try {
        if (!window.Stripe) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Stripe.js failed to load'));
            document.head.appendChild(script);
          });
        }
        const res  = await fetch(`/api/widget/setup-intent?tenantId=${encodeURIComponent(tenantId)}&covers=${covers}`);
        const data: { required: boolean; clientSecret?: string; penaltyAmount?: number } = await res.json();
        if (!data.required) {
          if (mounted) { onSkipImprint(); void onBook(undefined); }
          return;
        }
        if (!mounted) return;
        if (data.penaltyAmount) setPenalty(data.penaltyAmount);
        setClientSecret(data.clientSecret ?? null);
        const pk     = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
        const stripe = window.Stripe!(pk);
        stripeRef.current = stripe;
        const card = stripe.elements().create('card', {
          style: { base: { fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#1a1a1a', '::placeholder': { color: '#9ca3af' } } },
        });
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

  const handleConfirmCard = useCallback(async () => {
    if (!stripeRef.current || !cardElementRef.current || !clientSecret) return;
    setSubmitting(true);
    try {
      const result = await stripeRef.current.confirmCardSetup(clientSecret, {
        payment_method: { card: cardElementRef.current },
      });
      if (result.error) throw new Error(result.error.message);
      const pmId = result.setupIntent?.payment_method as string | undefined;
      await onBook(pmId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur de carte');
      setSubmitting(false);
    }
  }, [clientSecret, onBook, setSubmitting]);

  return { stripeLoading, stripeReady, stripeError, penalty, cardMountRef, handleConfirmCard };
}
