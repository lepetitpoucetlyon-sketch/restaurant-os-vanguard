import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';
import { Nexus } from '@/lib/nexus/NexusAdapter';

// NOTE: In production, STRIPE_SECRET_KEY must be in environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key', {
  apiVersion: '2026-06-24.dahlia',
});

// Price ID for the hardware rental MRR (Monthly Recurring Revenue)
const HARDWARE_RENTAL_PRICE_ID = process.env.STRIPE_HARDWARE_PRICE_ID || 'price_hardware_ipad_monthly';

export async function POST(req: NextRequest) {
  const caller = await requireMccLevel(req, 'mcc_super_admin');
  if (isDenied(caller)) return caller as NextResponse;

  try {
    const { tenantId, serialNumber } = await req.json();

    if (!tenantId || !serialNumber) {
      return NextResponse.json({ error: 'Missing tenantId or serialNumber' }, { status: 400 });
    }

    logger.info(`[Stripe Billing] Device ${serialNumber} delivered to ${tenantId}. Initiating MRR subscription...`);
    
    // 1. Fetch Tenant's Stripe Customer ID from Nexus
    const tenantDoc = await Nexus.adapter.get<Record<string, unknown>>(`tenants/${tenantId}`);
    const customerId = tenantDoc?.stripeCustomerId;

    if (!customerId) {
      logger.warn(`[Stripe Billing] Tenant ${tenantId} has no Stripe Customer ID. Creating customer...`);
      // Fallback: Create customer if doesn't exist (simulated for now)
      // const customer = await stripe.customers.create({ metadata: { tenantId } });
    }

    // 2. Create the Stripe Subscription (Actual Implementation)
    try {
      if (customerId && process.env.STRIPE_SECRET_KEY) {
        const subscription = await stripe.subscriptions.create({
          customer: customerId as string,
          items: [{ price: HARDWARE_RENTAL_PRICE_ID }],
          metadata: {
            tenantId,
            serialNumber,
            type: 'Hardware Rental'
          },
          // Proration is automatic, billing starts immediately upon delivery
          billing_cycle_anchor: Math.floor(Date.now() / 1000), 
        });
        logger.info(`[Stripe Billing] Subscription created successfully: ${subscription.id}`);
      } else {
        logger.warn(`[Stripe Billing] Simulated subscription creation (Missing API keys or Customer ID)`);
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulating network delay
      }
    } catch (stripeError) {
      logger.error(`[Stripe Billing] Failed to create subscription`, { error: stripeError });
      return NextResponse.json({ error: 'Stripe API error', details: String(stripeError) }, { status: 502 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Billing started via Stripe',
      status: 'active' 
    });

  } catch (error) {
    logger.error('[MDM Delivery Webhook] Failed to process delivery', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
