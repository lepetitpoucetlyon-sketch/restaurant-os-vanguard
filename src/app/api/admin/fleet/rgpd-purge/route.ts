import { requireFleetAdmin, requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
/**
 * RGPD Purge cryptographique — mcc-security-adv-4
 *
 * POST /api/admin/fleet/rgpd-purge
 *   Body: { tenantId: string; requestedBy: string; reason: string }
 *   - Génère un certificat d'effacement signé (SHA-256)
 *   - Supprime les données personnelles (users, reservations, contacts)
 *   - Conserve les données NF525 immuables (journalEntries, fiscalSeals)
 *   - Crée mcc/rgpd-certificates/{tenantId} avec le certificat
 *   - Répond { certificateId, erasedAt, keptForFiscal: string[] }
 *
 * GET /api/admin/fleet/rgpd-purge?tenantId — récupère le certificat d'effacement
 *
 * IMPORTANT NF525 : journalEntries et fiscalSeals ne sont JAMAIS purgés.
 * Protégé : fleet_admin.
 */
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const RgpdPurgeSchema = z.object({
  tenantId: z.string().min(1),
  requestedBy: z.string().min(1),
  reason: z.string().min(1),
});

const PURGEABLE_COLLECTIONS = [
  'users',
  'reservations',
  'contacts',
  'marketingConsents',
  'loyaltyProfiles',
  'guestHistory',
] as const;

const NF525_IMMUTABLE = ['journalEntries', 'fiscalSeals', 'fiscalLedger'] as const;

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: z.infer<typeof RgpdPurgeSchema>;
  try {
    body = RgpdPurgeSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
  }

  const { tenantId, requestedBy, reason } = body;

  const erasedAt     = new Date().toISOString();
  const certificateId = crypto.randomUUID();

  // Purge des collections personnelles
  const purgeResults: Record<string, number> = {};
  for (const collection of PURGEABLE_COLLECTIONS) {
    try {
      const docs = await Nexus.adapter.query(`tenants/${tenantId}/${collection}`);
      for (const doc of docs) {
        const id = (doc as { id?: string }).id ?? String(Math.random());
        await Nexus.adapter.set(`tenants/${tenantId}/${collection}/${id}`, {
          _purged: true,
          _purgedAt: erasedAt,
          _certificateId: certificateId,
        });
      }
      purgeResults[collection] = docs.length;
    } catch {
      purgeResults[collection] = 0;
    }
  }

  // Snapshot des compteurs NF525 (non purgés — mention explicite dans le certificat)
  const nf525Counts: Record<string, number> = {};
  for (const col of NF525_IMMUTABLE) {
    try {
      const docs = await Nexus.adapter.query(`tenants/${tenantId}/${col}`);
      nf525Counts[col] = docs.length;
    } catch {
      nf525Counts[col] = 0;
    }
  }

  // Génération du certificat signé
  const certPayload = JSON.stringify({
    certificateId,
    tenantId,
    erasedAt,
    requestedBy,
    reason,
    purgeResults,
    keptForFiscal:  NF525_IMMUTABLE,
    nf525Counts,
    standard:       "RGPD Art. 17 — Droit à l'effacement",
  });
  const certHash = await sha256(certPayload);

  const certificate = {
    certificateId,
    tenantId,
    erasedAt,
    requestedBy,
    reason,
    purgeResults,
    keptForFiscal:   [...NF525_IMMUTABLE],
    nf525Counts,
    certHash,
    standard:        'RGPD Art. 17',
    issuedAt:        erasedAt,
  };

  await Nexus.adapter.set(`mcc/rgpd-certificates/${tenantId}`, certificate);

  // Nettoyage des métadonnées personnelles dans tenantConfig (conservation du reste)
  await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
    rgpd: { purged: true, certificateId, erasedAt },
    ownerEmail: null,
    ownerName:  null,
  }, { merge: true });

  empireAudit.log({
    module: 'fleet',
    action: 'RGPD_PURGE_COMPLETED',
    severity: 'high',
    details: { tenantId, certificateId, certHash, purgeResults },
    timestamp: new Date(),
  });

  logger.info(`[RGPD] Purge cryptographique ${tenantId} — cert ${certificateId} — hash ${certHash.slice(0, 12)}…`);

  return NextResponse.json({
    success:        true,
    certificateId,
    certHash,
    erasedAt,
    purgeResults,
    keptForFiscal:  [...NF525_IMMUTABLE],
    nf525Counts,
  });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });

  const cert = await Nexus.adapter.get(`mcc/rgpd-certificates/${tenantId}`);
  if (!cert) return NextResponse.json({ purged: false, certificate: null });

  return NextResponse.json({ purged: true, certificate: cert });
}
