/**
 * PDF Certificat NF525 téléchargeable — mcc-comp-3
 *
 * GET /api/admin/compliance/nf525-certificate?tenantId
 *   Génère et retourne un PDF minimal certifiant la conformité NF525 du tenant.
 *
 * Le PDF contient :
 *   - Identité du tenant (nom, SIRET, tenantId)
 *   - Période couverte (date de création → aujourd'hui)
 *   - Nombre de JournalEntries et FiscalSeals
 *   - Résultat du dernier audit chaîne (OK / BREACH)
 *   - Hash de génération SHA-256 (fingerprint certificat)
 *
 * Retourne Content-Type: application/pdf
 * (PDF généré en pur JS — pas de dépendance externe)
 *
 * Protégé : mcc_support minimum.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function encodePdfString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildMinimalPdf(lines: string[], title: string): Uint8Array {
  const body = lines.join('\n');
  const now  = new Date().toISOString();

  const content = [
    '%PDF-1.4',
    '1 0 obj',
    '<< /Type /Catalog /Pages 2 0 R >>',
    'endobj',
    '2 0 obj',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    'endobj',
    '3 0 obj',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    'endobj',
    '4 0 obj',
  ];

  const pdfBody = [
    'BT',
    '/F1 14 Tf',
    '50 800 Td',
    `(${encodePdfString(title)}) Tj`,
    '/F1 10 Tf',
    '0 -30 Td',
    `(Generated: ${encodePdfString(now)}) Tj`,
    ...body.split('\n').map((l, i) => i === 0 ? `0 -20 Td\n(${encodePdfString(l)}) Tj` : `0 -15 Td\n(${encodePdfString(l)}) Tj`),
    'ET',
  ].join('\n');

  const streamBytes = new TextEncoder().encode(pdfBody);
  content.push(`<< /Length ${streamBytes.length} >>`);
  content.push('stream');
  content.push(pdfBody);
  content.push('endstream');
  content.push('endobj');
  content.push('5 0 obj');
  content.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  content.push('endobj');
  content.push('xref');
  content.push('0 6');
  content.push('0000000000 65535 f ');
  content.push('trailer');
  content.push('<< /Size 6 /Root 1 0 R >>');
  content.push('startxref');
  content.push('9');
  content.push('%%EOF');

  return new TextEncoder().encode(content.join('\n'));
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });

  const [config, entries, seals, audits] = await Promise.all([
    Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as Promise<{
      name?: string; siret?: string; createdAt?: string;
    } | null>,
    Nexus.adapter.query(`tenants/${tenantId}/journalEntries`),
    Nexus.adapter.query(`tenants/${tenantId}/fiscalSeals`),
    Nexus.adapter.query(`tenants/${tenantId}/complianceAudits`) as Promise<Array<{
      auditedAt?: string; integrity?: string;
    }>>,
  ]);

  const latestAudit = audits.sort((a, b) =>
    new Date(b.auditedAt ?? 0).getTime() - new Date(a.auditedAt ?? 0).getTime()
  )[0];

  const certData = [
    `TenantID: ${tenantId}`,
    `Nom: ${config?.name ?? 'N/A'}`,
    `SIRET: ${config?.siret ?? 'N/A'}`,
    `Depuis: ${config?.createdAt ? new Date(Number(config.createdAt)).toLocaleDateString('fr-FR') : 'N/A'}`,
    `JournalEntries: ${entries.length}`,
    `FiscalSeals: ${seals.length}`,
    `Dernier audit: ${latestAudit?.auditedAt ? new Date(latestAudit.auditedAt).toLocaleDateString('fr-FR') : 'Aucun'}`,
    `Integrite chaine: ${latestAudit?.integrity ?? 'NON AUDITE'}`,
    `Standard: NF525 - Systemes de caisse securises`,
    `Emis par: Restaurant OS MCC`,
  ].join('\n');

  const fingerprint = await sha256(certData + new Date().toISOString());
  const certLines   = [...certData.split('\n'), `Fingerprint: ${fingerprint.slice(0, 32)}...`];

  const pdfBytes = buildMinimalPdf(certLines, 'CERTIFICAT DE CONFORMITE NF525');

  empireAudit.log({
    module: 'fleet',
    action: 'NF525_CERTIFICATE_DOWNLOADED',
    severity: 'medium',
    details: { tenantId, fingerprint: fingerprint.slice(0, 16) } as unknown as import('@/shared/nexus-contract').SovereignData,
    timestamp: new Date(),
  });

  logger.info(`[NF525] Certificat PDF généré pour ${tenantId} — fp ${fingerprint.slice(0, 12)}…`);

  return new NextResponse(pdfBytes.buffer as ArrayBuffer, {
    status: 200,
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="nf525-${tenantId}-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
