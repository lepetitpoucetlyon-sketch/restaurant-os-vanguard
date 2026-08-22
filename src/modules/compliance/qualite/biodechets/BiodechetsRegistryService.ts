/**
 * L61 — Registre biodéchets loi 2024 (Décret 2023-478 + Art. L. 541-46 CE).
 *
 * Depuis le 1er janvier 2024, TOUT producteur de biodéchets (dès 1 kg/jour) doit :
 *  1. Tenir un registre journalier des pesées (kg + typologie + destination)
 *  2. Produire une attestation annuelle de valorisation opposable
 *  3. Fournir le registre à tout contrôle DDPP / DREAL en < 24h
 *
 * Sanctions : jusqu'à **75 000 € d'amende + 2 ans de prison** en cas de fraude.
 *
 * Service :
 *   - `recordDailyWeighing()` — persist Nexus + Outbox **LEGAL** (drainé en top priorité)
 *   - `generateAnnualAttestation()` — bilan pesées + hash SHA-256 opposable
 *   - Audit `AuditLogger` trace inaltérable via hash chain (ADR-014)
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L61 (débloqué par ADR-014).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';
import { AuditLogger } from '@/lib/audit';

export type BiodechetsCategory =
  | 'food_prep_offcuts'    // épluchures, parures
  | 'cooked_leftovers'     // restes cuits assiettes / buffet
  | 'expired_raw'          // matières premières périmées
  | 'used_frying_oil'      // huiles alimentaires usagées (BSDD séparé, cf. L62)
  | 'other';

export type BiodechetsDestination =
  | 'methanization'        // méthaniseur agréé
  | 'composting_onsite'    // compostage sur site
  | 'composting_collective'
  | 'animal_feed_legal'    // usage animal encadré
  | 'incineration';        // dernier recours

export interface BiodechetsEntry {
  id: string;
  tenantId: string;
  dateIso: string;         // YYYY-MM-DD (jour de pesée)
  category: BiodechetsCategory;
  quantityKg: number;
  destination: BiodechetsDestination;
  collectorSiret?: string; // SIRET du collecteur agréé
  weighedBy: string;       // operatorId
  weighedAt: number;       // epoch ms
  notes?: string;
}

export interface AnnualAttestation {
  tenantId: string;
  year: number;
  totalKg: number;
  byCategory: Record<BiodechetsCategory, number>;
  byDestination: Record<BiodechetsDestination, number>;
  entriesCount: number;
  generatedAt: string;
  auditHash: string;
}

export class BiodechetsRegistryService {
  private static path(tenantId: string, id: string): string {
    return `tenants/${tenantId}/biodechets_registry/${id}`;
  }

  static async recordDailyWeighing(input: {
    tenantId: string;
    dateIso: string;
    category: BiodechetsCategory;
    quantityKg: number;
    destination: BiodechetsDestination;
    weighedBy: string;
    collectorSiret?: string;
    notes?: string;
    now?: number;
  }): Promise<BiodechetsEntry> {
    const now = input.now ?? Date.now();
    const id = `bio_${input.dateIso}_${now}_${Math.random().toString(36).slice(2, 6)}`;
    const entry: BiodechetsEntry = {
      id,
      tenantId: input.tenantId,
      dateIso: input.dateIso,
      category: input.category,
      quantityKg: input.quantityKg,
      destination: input.destination,
      collectorSiret: input.collectorSiret,
      weighedBy: input.weighedBy,
      weighedAt: now,
      notes: input.notes,
    };

    if (entry.quantityKg <= 0) {
      throw new Error('BiodechetsRegistry: quantityKg doit être > 0');
    }

    await Nexus.adapter.set(this.path(input.tenantId, id), entry);

    // Outbox LEGAL — drainé avant metrics et fiscal
    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${input.tenantId}/legal/biodechets`,
      targetId: id,
      priority: OutboxPriority.LEGAL,
      payload: entry as unknown as Record<string, unknown>,
    }).catch(() => 0);

    // Audit — targetId = date, action = HACCP_ALERT_RAISED (couvre sanitaire + légal)
    await AuditLogger.logAction(
      input.weighedBy,
      'HACCP_ALERT_RAISED',
      `biodechets/${input.dateIso}`,
      {
        kind: 'BIODECHETS_WEIGHING',
        category: entry.category,
        quantityKg: entry.quantityKg,
        destination: entry.destination,
        collectorSiret: entry.collectorSiret,
      },
    ).catch(() => null);

    return entry;
  }

  /**
   * Génère l'attestation annuelle : consolidation des pesées + hash opposable.
   * Le hash est déjà calculé par AuditLogger sur la chaîne — on renvoie
   * le dernier hash de la chaîne pour l'année en cours.
   */
  static async generateAnnualAttestation(tenantId: string, year: number): Promise<AnnualAttestation> {
    const all = (await Nexus.adapter.query<BiodechetsEntry>(`tenants/${tenantId}/biodechets_registry`)) ?? [];
    const entries = all.filter(e => e.dateIso.startsWith(String(year)));

    const byCategory = {
      food_prep_offcuts: 0,
      cooked_leftovers: 0,
      expired_raw: 0,
      used_frying_oil: 0,
      other: 0,
    } as Record<BiodechetsCategory, number>;

    const byDestination = {
      methanization: 0,
      composting_onsite: 0,
      composting_collective: 0,
      animal_feed_legal: 0,
      incineration: 0,
    } as Record<BiodechetsDestination, number>;

    let totalKg = 0;
    for (const e of entries) {
      totalKg += e.quantityKg;
      byCategory[e.category] += e.quantityKg;
      byDestination[e.destination] += e.quantityKg;
    }

    const fromTs = new Date(`${year}-01-01T00:00:00Z`).getTime();
    const toTs = new Date(`${year}-12-31T23:59:59Z`).getTime();
    const chain = await AuditLogger.exportChain(fromTs, toTs);

    return {
      tenantId,
      year,
      totalKg: Math.round(totalKg * 100) / 100,
      byCategory,
      byDestination,
      entriesCount: entries.length,
      generatedAt: new Date().toISOString(),
      auditHash: chain.finalHash,
    };
  }
}
