import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const BodySchema = z.object({
  tenantId: z.string().min(1).optional(),
  name:     z.string().optional(),
  tier:     z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE', 'EMPIRE-LIMITLESS']).optional(),
});

/**
 * POST /api/admin/fleet/seed-demo
 * Écrit un document SiteTelemetry réaliste dans fleet-telemetry/{tenantId}
 * pour rendre une instance démo visible dans le MCC immédiatement.
 * Auth: super_admin
 */
export async function POST(req: NextRequest) {
  const auth = await requireMccLevel(req, 'super_admin');
  if (isDenied(auth)) return auth;

  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }

  const {
    tenantId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'lepetitpoucet',
    name     = process.env.NEXT_PUBLIC_RESTAURANT_NAME   || 'Le Restaurant OS — Démo',
    tier     = 'PREMIUM',
  } = parsed.data;

  const now = new Date().toISOString();

  const siteTelemetry = {
    id:            tenantId,
    key:           tenantId,
    name,
    tenantId,
    status:        'ONLINE',
    tier,
    version:       '4.0.0-NEXUS',
    engineVersion: 'Grade-X-Vanguard',
    createdAt:     now,
    updatedAt:     now,
    lastHeartbeat: now,
    lastSeen:      now,

    activeUsers:     4,
    dailyRevenue:    1840,
    activeOrders:    7,
    healthScore:     94,
    complianceScore: 98,
    lowStockAlerts:  2,

    branding: {
      primaryColor:   process.env.NEXT_PUBLIC_PRIMARY_COLOR   || '#C5A059',
      secondaryColor: process.env.NEXT_PUBLIC_SECONDARY_COLOR || '#1C1C1C',
      logoUrl:        '',
      tagline:        process.env.NEXT_PUBLIC_RESTAURANT_SLOGAN || 'Excellence Opérationnelle',
    },

    security: {
      twoFactorEnabled:         true,
      nf525Certified:           true,
      maintenanceAccessGranted: false,
      supportAccessGranted:     false,
    },

    ragStatus: {
      status:        'online',
      version:       '1.0.0',
      documentCount: 142,
      lastIndexed:   now,
      latencyMs:     82,
    },

    featureFlags: {
      mod_pos:       true,
      mod_kds:       true,
      mod_haccp:     true,
      mod_analytics: true,
      mod_hr:        true,
      mod_treasury:  true,
    },
  };

  try {
    await Nexus.adapter.set(`fleet-telemetry/${tenantId}`, siteTelemetry, { merge: true });
    logger.info(`[SeedDemo] Instance démo enregistrée: ${tenantId}`);
    return NextResponse.json({ success: true, tenantId, name });
  } catch (err) {
    logger.error('[SeedDemo] Échec écriture Firestore', { err });
    return NextResponse.json({ error: 'Firestore write failed' }, { status: 500 });
  }
}
