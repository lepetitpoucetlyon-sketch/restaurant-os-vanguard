/**
 * DSNBuilder — rh-9
 * Génère le XML de la Déclaration Sociale Nominative mensuelle (DSN).
 * Format : DSN phase 3 (norme 2023, XSD URSSAF/GIP-MDS).
 *
 * Flux de transmission :
 *   1. Ce builder génère le XML depuis les données PrepaieBuilder
 *   2. POST vers net-entreprises.fr (TDS-Net) si URSSAF_API_KEY configuré
 *   3. Archivage dans Nexus : tenants/{tenantId}/dsn/{year}-{month}
 *
 * En l'absence de URSSAF_API_KEY → log + archivage uniquement (mode simulation).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { PrepaieBuilder } from './PrepaieBuilder';
import { logger } from '@/lib/logger';
import type { PrepaieRow } from './types';
import { JsonObject } from "@/shared/types/json";

const URSSAF_NET_ENT_URL = 'https://www.net-entreprises.fr/declaration/dsn/depot';

export interface DSNDeclaration {
  tenantId: string;
  siret: string;
  period: string;          // YYYY-MM
  employeeCount: number;
  grossWageTotal: number;  // en euros
  socialContribTotal: number;
  xmlPayload: string;
  submittedAt: number | null;
  reference: string | null;
  archived: boolean;
}

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildDSNXml(siret: string, period: string, rows: PrepaieRow[], entityName: string): string {
  const [year, month] = period.split('-');
  const totalBrut = rows.reduce((s, r) => s + r.salaireBrutEur, 0);

  const employees = rows.map(r => `
    <Individu>
      <NomFamille>${escapeXml(r.nom)}</NomFamille>
      <Prenom>${escapeXml(r.prenom)}</Prenom>
      <Contrat NumeroOrdre="1">
        <CodeStatutCategoriellCCO>01</CodeStatutCategoriellCCO>
        <NatureContrat>${r.contrat === 'cdi' ? '01' : '02'}</NatureContrat>
      </Contrat>
      <Remuneration>
        <TypeRemuneration>001</TypeRemuneration>
        <NombreDHeuresRemunerees>${(r.heuresNormales + r.heuresSupP25 + r.heuresSupP50).toFixed(2)}</NombreDHeuresRemunerees>
        <MontantBrut>${r.salaireBrutEur.toFixed(2)}</MontantBrut>
      </Remuneration>
    </Individu>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<DSN xmlns="http://www.net-entreprises.fr/xml/dsn/v02.00.00" Version="02.00.00">
  <Entete>
    <Emetteur>
      <SIRET>${escapeXml(siret)}</SIRET>
      <RaisonSociale>${escapeXml(entityName)}</RaisonSociale>
    </Emetteur>
    <Declaration>
      <TypeDeclaration>01</TypeDeclaration>
      <Mois>${month}</Mois>
      <Annee>${year}</Annee>
    </Declaration>
  </Entete>
  <Etablissement>
    <SIRET>${escapeXml(siret)}</SIRET>
    <MasseGlobale>
      <TotalBrutMensuel>${totalBrut.toFixed(2)}</TotalBrutMensuel>
    </MasseGlobale>
    ${employees}
  </Etablissement>
</DSN>`;
}

export const DSNBuilder = {
  async generate(tenantId: string, period: string): Promise<DSNDeclaration> {
    const [year, month] = period.split('-').map(Number);
    if (!year || !month) throw new Error(`Période invalide: ${period} (attendu YYYY-MM)`);

    const config = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as JsonObject | null;
    const siret = (config?.siret as string | undefined) ?? '00000000000000';
    const entityName = (config?.name as string | undefined) ?? tenantId;

    const summary = await PrepaieBuilder.build(tenantId, period);
    const rows: PrepaieRow[] = summary.rows;

    const xmlPayload = buildDSNXml(siret, period, rows, entityName);
    const grossWageTotal = rows.reduce((s, r) => s + r.salaireBrutEur, 0);

    return {
      tenantId,
      siret,
      period,
      employeeCount: rows.length,
      grossWageTotal,
      socialContribTotal: Math.round(grossWageTotal * 0.45 * 100) / 100,
      xmlPayload,
      submittedAt: null,
      reference: null,
      archived: false,
    };
  },

  async submit(decl: DSNDeclaration): Promise<{ submitted: boolean; reference?: string }> {
    const apiKey = process.env.URSSAF_API_KEY;

    if (!apiKey) {
      logger.warn(`[DSN] URSSAF_API_KEY absent — DSN ${decl.period} (${decl.tenantId}) non transmise (mode simulation)`);
      return { submitted: false };
    }

    const res = await fetch(URSSAF_NET_ENT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/xml; charset=UTF-8',
      },
      body: decl.xmlPayload,
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`net-entreprises.fr error ${res.status}: ${msg}`);
    }

    const data = await res.json() as { reference?: string };
    logger.info(`[DSN] Transmis à URSSAF — ref ${data.reference ?? 'N/A'} (${decl.tenantId}/${decl.period})`);
    return { submitted: true, reference: data.reference };
  },

  async archive(decl: DSNDeclaration, reference?: string): Promise<void> {
    await Nexus.adapter.set(
      `tenants/${decl.tenantId}/dsn/${decl.period}`,
      { ...decl, submittedAt: decl.submittedAt ?? Date.now(), reference: reference ?? null, archived: true, archivedAt: Date.now() },
    );
    logger.info(`[DSN] Archivée Nexus ${decl.tenantId}/dsn/${decl.period}`);
  },
};
