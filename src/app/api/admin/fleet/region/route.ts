/**
 * Multi-Region Allocation — mcc-crm-4
 *
 * POST /api/admin/fleet/region  — assigne une région Firestore à un tenant
 * GET  /api/admin/fleet/region?tenantId — lit la région courante
 *
 * Régions supportées (map vers les ids Firestore) :
 *   eu-west   → europe-west1  (Paris — défaut RGPD)
 *   eu-north  → europe-north1 (Finlande)
 *   us-east   → us-east1
 *   us-west   → us-west2
 *   asia      → asia-east1
 *
 * Note: la région est informative à ce stade — Firestore est mono-région à la création.
 * Ce champ est utilisé par le provisioning pour choisir le bucket et par l'UI pour
 * afficher la localisation des données (conformité RGPD).
 *
 * Protégé : fleet_admin.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

const SUPPORTED_REGIONS = {
  'eu-west':  { id: 'europe-west1',  label: 'Europe Ouest (Paris)',     rgpdCompliant: true  },
  'eu-north': { id: 'europe-north1', label: 'Europe Nord (Finlande)',   rgpdCompliant: true  },
  'us-east':  { id: 'us-east1',      label: 'États-Unis Est',           rgpdCompliant: false },
  'us-west':  { id: 'us-west2',      label: 'États-Unis Ouest',         rgpdCompliant: false },
  'asia':     { id: 'asia-east1',    label: 'Asie Est (Taiwan)',        rgpdCompliant: false },
} as const;

type RegionKey = keyof typeof SUPPORTED_REGIONS;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: { tenantId: string; region: RegionKey };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { tenantId, region } = body;
  if (!tenantId || !region) {
    return NextResponse.json({ error: 'tenantId et region requis' }, { status: 400 });
  }

  if (!Object.keys(SUPPORTED_REGIONS).includes(region)) {
    return NextResponse.json({
      error: `Région invalide. Valeurs acceptées: ${Object.keys(SUPPORTED_REGIONS).join(', ')}`,
    }, { status: 400 });
  }

  const regionMeta = SUPPORTED_REGIONS[region];

  await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
    dataRegion: {
      key:          region,
      firestoreId:  regionMeta.id,
      label:        regionMeta.label,
      rgpdCompliant: regionMeta.rgpdCompliant,
      assignedAt:   new Date().toISOString(),
    },
  }, { merge: true });

  empireAudit.log({
    module: 'fleet',
    action: 'REGION_ASSIGNED',
    severity: 'medium',
    details: { tenantId, region, firestoreId: regionMeta.id } as unknown as import('@/shared/nexus-contract').SovereignData,
    timestamp: new Date(),
  });

  logger.info(`[Region] ${tenantId} → ${regionMeta.id} (${regionMeta.label})`);
  return NextResponse.json({ success: true, region, ...regionMeta });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });

  const config = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as
    { dataRegion?: Record<string, unknown> } | null;

  return NextResponse.json({
    dataRegion: config?.dataRegion ?? null,
    availableRegions: SUPPORTED_REGIONS,
  });
}
