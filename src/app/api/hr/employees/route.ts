/**
 * DPAE automatique à la création d'un employé — rh-5
 *
 * POST /api/hr/employees  — crée un employé ET déclenche la DPAE URSSAF
 * GET  /api/hr/employees  — liste les employés du tenant
 *
 * DPAE (Déclaration Préalable À l'Embauche) :
 *   - Obligatoire 8 jours avant l'embauche (Code du Travail L. 1221-10)
 *   - Transmise à l'URSSAF via l'API net-entreprises.fr (TDS-Net)
 *   - En l'absence de URSSAF_API_KEY : génère le document XML et le log (simulé)
 *
 * Structure Nexus :
 *   tenants/{tenantId}/staff/{employeeId}
 *   tenants/{tenantId}/dpae/{employeeId}
 *
 * Protégé : requireTenantAdmin.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

const EmployeeSchema = z.object({
  firstName:            z.string().min(1).max(80).trim(),
  lastName:             z.string().min(1).max(80).trim(),
  birthDate:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD requis'),
  birthCity:            z.string().min(1).max(100).trim(),
  birthCountry:         z.string().min(1).max(80).trim(),
  socialSecurityNumber: z.string().regex(/^\d{13,15}$/, 'NIR invalide (13-15 chiffres)'),
  contractType:         z.enum(['CDI', 'CDD', 'Interim', 'Apprentissage']),
  startDate:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD requis'),
  role:                 z.string().min(1).max(80).trim(),
  email:                z.string().email().max(254).optional(),
  phone:                z.string().max(30).optional(),
});

type EmployeeInput = z.infer<typeof EmployeeSchema>;

function buildDPAEXml(employee: EmployeeInput, tenantId: string, siret: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<DPAE xmlns="http://www.net-entreprises.fr/xml/dpae/v1.1">
  <Entreprise>
    <Siret>${siret}</Siret>
    <TenantId>${tenantId}</TenantId>
  </Entreprise>
  <Salarie>
    <Nom>${employee.lastName.toUpperCase()}</Nom>
    <Prenom>${employee.firstName}</Prenom>
    <DateNaissance>${employee.birthDate}</DateNaissance>
    <LieuNaissance>${employee.birthCity}</LieuNaissance>
    <PaysNaissance>${employee.birthCountry}</PaysNaissance>
    <NIR>${employee.socialSecurityNumber}</NIR>
  </Salarie>
  <Contrat>
    <TypeContrat>${employee.contractType}</TypeContrat>
    <DateEmbauche>${employee.startDate}</DateEmbauche>
    <Emploi>${employee.role}</Emploi>
  </Contrat>
</DPAE>`;
}

async function sendDPAE(
  employee: EmployeeInput,
  tenantId: string,
  siret: string,
  employeeId: string,
): Promise<{ sent: boolean; method: 'urssaf_api' | 'xml_generated' | 'simulated' }> {
  const xml     = buildDPAEXml(employee, tenantId, siret);
  const apiKey  = process.env.URSSAF_API_KEY;
  const apiUrl  = process.env.URSSAF_API_URL ?? 'https://api.net-entreprises.fr/dpae/v1';

  if (apiKey) {
    try {
      const res = await fetch(`${apiUrl}/submit`, {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/xml' },
        body:    xml,
        signal:  AbortSignal.timeout(10_000),
      });
      if (res.ok) {
        logger.info(`[DPAE] Transmis à l'URSSAF pour employé ${employeeId}`);
        return { sent: true, method: 'urssaf_api' };
      }
    } catch {
      logger.warn('[DPAE] API URSSAF indisponible — XML archivé');
    }
  }

  // Archivage XML local
  await Nexus.adapter.set(`tenants/${tenantId}/dpae/${employeeId}`, {
    employeeId, xml, generatedAt: new Date().toISOString(), status: 'pending_send',
  });

  const method = apiKey ? 'xml_generated' : 'simulated';
  logger.info(`[DPAE] DPAE ${method} pour ${employeeId} — à transmettre manuellement`);
  return { sent: false, method };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  const raw = await req.json().catch(() => null);
  const parsed = EmployeeSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 });
  }
  const body: EmployeeInput = parsed.data;

  const employeeId = crypto.randomUUID();
  const createdAt  = new Date().toISOString();

  const employee = {
    id:                   employeeId,
    firstName:            body.firstName,
    lastName:             body.lastName,
    birthDate:            body.birthDate,
    birthCity:            body.birthCity,
    birthCountry:         body.birthCountry,
    socialSecurityNumber: body.socialSecurityNumber,
    contractType:         body.contractType,
    startDate:            body.startDate,
    role:                 body.role,
    ...(body.email ? { email: body.email } : {}),
    ...(body.phone ? { phone: body.phone } : {}),
    tenantId,
    status:     'active',
    createdAt,
    dpaeStatus: 'pending',
  };

  await Nexus.adapter.set(`tenants/${tenantId}/staff/${employeeId}`, employee);

  // DPAE automatique
  const config  = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as { siret?: string } | null;
  const siret   = config?.siret ?? 'SIRET_INCONNU';
  const dpaeResult = await sendDPAE(body, tenantId, siret, employeeId);

  await Nexus.adapter.set(`tenants/${tenantId}/staff/${employeeId}`, {
    dpaeStatus: dpaeResult.sent ? 'transmitted' : 'pending_manual',
    dpaeSentAt: dpaeResult.sent ? new Date().toISOString() : null,
    dpaeMethod: dpaeResult.method,
  }, { merge: true });

  empireAudit.log({
    module: 'fleet',
    action: 'EMPLOYEE_CREATED',
    severity: 'medium',
    details: { tenantId, employeeId, dpaeMethod: dpaeResult.method } as unknown as import('@/shared/nexus-contract').SovereignData,
    timestamp: new Date(),
  });

  logger.info(`[HR] Employé ${employeeId} créé — DPAE: ${dpaeResult.method}`);
  return NextResponse.json({
    success:    true,
    employeeId,
    dpae:       dpaeResult,
    employee:   { id: employeeId, firstName: body.firstName, lastName: body.lastName, startDate: body.startDate },
  });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  const employees = await Nexus.adapter.query(`tenants/${tenantId}/staff`);
  return NextResponse.json({ employees, total: employees.length });
}
