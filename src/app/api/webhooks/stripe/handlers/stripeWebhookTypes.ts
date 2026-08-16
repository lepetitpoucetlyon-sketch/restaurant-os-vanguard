import crypto from 'crypto';

export const PLAN_FEATURES: Record<string, string[]> = {
  starter:    ['pos', 'kds'],
  pro:        ['pos', 'kds', 'marketing', 'crm', 'analytics'],
  enterprise: ['pos', 'kds', 'marketing', 'crm', 'analytics', 'rh', 'ia', 'haccp'],
};

export interface StripeEventMetadata {
  tenantId?: string;
}

export interface StripeCustomer {
  id: string;
  metadata?: StripeEventMetadata;
}

export interface StripeSubscription {
  id: string;
  status: string;
  metadata?: StripeEventMetadata;
  customer?: string | StripeCustomer;
  items?: {
    data: Array<{
      price?: {
        id?: string;
        lookup_key?: string;
        product?: string;
        metadata?: Record<string, string>;
      };
    }>;
  };
}

export interface StripeCheckoutSession {
  id: string;
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  customer: string | null;
  customer_details: {
    email: string | null;
    name: string | null;
  } | null;
  metadata: {
    companyName?: string;
    siret?: string;
    ownerName?: string;
    planId?: 'STANDARD' | 'PREMIUM';
    primaryColor?: string;
    logoUrl?: string;
  } | null;
}

export interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: StripeSubscription | StripeCheckoutSession | Record<string, unknown>;
  };
}

export function resolvePlanFromSubscription(subscription: StripeSubscription): string | null {
  const items = subscription.items?.data ?? [];
  for (const item of items) {
    const price = item.price;
    if (!price) continue;
    if (price.lookup_key) {
      const key = price.lookup_key.split('_')[0].toLowerCase();
      if (key in PLAN_FEATURES) return key;
    }
    if (price.metadata?.plan && price.metadata.plan in PLAN_FEATURES) {
      return price.metadata.plan;
    }
  }
  return null;
}

export function extractTenantId(subscription: StripeSubscription): string | undefined {
  return (
    subscription.metadata?.tenantId ??
    (typeof subscription.customer === 'object' && subscription.customer !== null
      ? subscription.customer.metadata?.tenantId
      : undefined)
  );
}

export function verifyStripeSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;

  const parts: Record<string, string> = {};
  for (const part of signatureHeader.split(',')) {
    const [key, value] = part.split('=');
    if (key && value) parts[key] = value;
  }

  const timestamp = parts['t'];
  const v1Signature = parts['v1'];

  if (!timestamp || !v1Signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSig, 'hex'),
      Buffer.from(v1Signature, 'hex')
    );
  } catch {
    return false;
  }
}
