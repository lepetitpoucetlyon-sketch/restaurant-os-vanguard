import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────
// Signup Schemas — Shared between frontend & backend
// ─────────────────────────────────────────────────────────────────

export const SignupIntentSchema = z.object({
  email: z.string().email('Email invalide'),
  businessName: z.string().min(2, 'Nom trop court').max(100),
  city: z.string().min(2, 'Ville requise').max(100),
  vertical: z.string().min(2),
  plan: z.enum(['starter', 'pro', 'enterprise']).default('pro'),
});

export type SignupIntent = z.infer<typeof SignupIntentSchema>;

export const SignupIntentResponseSchema = z.object({
  intentId: z.string(),
  checkoutUrl: z.string().url().nullable(),
  status: z.enum(['pending_checkout', 'provisioning', 'ready', 'error']),
});

export type SignupIntentResponse = z.infer<typeof SignupIntentResponseSchema>;
