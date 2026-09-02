/**
 * 🐉 SLAYER - Grade VI
 * Moteur d'ingestion souverain pour la migration de données legacy (Zelty, Lightspeed, SumUp).
 * Raccordement complet à la chaîne de scellage NF525 et validation Zod.
 */

import { logger } from "@/lib/logger";
// Voisin direct : un fichier n'importe JAMAIS le barrel de son propre pilier
// (cycle index.ts -> Slayer.ts -> index.ts).
import { DataDigester } from "./DataDigester";
import { LegacyOrder, Order } from "@nexus/contracts";
import { toMicrounits } from "@/shared/schemas/primitives";
// FinanceCore est charge a la demande : un import statique de @/modules/finance
// ferme une boucle intelligence -> finance -> ... -> intelligence (3 cycles madge).
// Un seul point d'usage, dans une methode async : le differer suffit.
import { NexusTransaction } from "@/lib/adapters/NexusTransaction";
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { DEFAULT_TENANT_ID } from '@/config/instance';
import { toError } from "@/lib/toError";
import type { JsonObject } from "@/shared/types/json";

export interface SlayerMappingConfig {
    source: string;
    fields: {
        id: string;
        total: string;
        date: string;
        items?: string;
        customerName?: string;
    };
}

export class Slayer {
    /**
     * Traduit un objet brut (CSV/JSON) en structure compatible Nexus via une config.
     */
    static mapLegacy(raw: Record<string, unknown>, config: SlayerMappingConfig): Partial<Order> {
        const legacyTotalInCents = typeof raw[config.fields.total] === 'number'
            ? raw[config.fields.total] as number
            : parseFloat(DataDigester.decontaminate(String(raw[config.fields.total])));
        return {
            id: String(raw[config.fields.id]),
            // Microunits Protocol: write the canonical µ total; keep the cents mirror in parity for legacy readers.
            totalInMicrounits: toMicrounits(Math.round(legacyTotalInCents * 10_000)),
            totalInCents: legacyTotalInCents,
            timestamp: new Date(String(raw[config.fields.date])).toISOString(),
            items: Array.isArray(raw[config.fields.items || 'items']) ? raw[config.fields.items || 'items'] as import('@nexus/contracts').OrderItem[] : [],
            customerName: config.fields.customerName ? String(raw[config.fields.customerName]) : undefined
        };
    }

    /**
     * Ingestion d'un flux massif d'antériorité (Mode SUTURE_TOTALE).
     * GRADE VI / Loi 12 : Les commandes sont stockées dans `legacyOrders/` (origin: 'legacy')
     * sans jamais polluer la chaîne fiscale live `orders/` ni le KDS.
     */
    static async ingestMassive(
        stream: LegacyOrder[], 
        tenantId: string = DEFAULT_TENANT_ID,
        onProgress?: (processed: number) => void
    ): Promise<{ ingested: number; errors: number }> {
        
        logger.info(`[Slayer] SUTURE INGESTION: Initiating phase for ${stream.length} legacy entries on ${tenantId}`);
        
        let ingested = 0;
        let errors = 0;
        const chunkSize = 100; // Batch processing pour performance Firestore
        const sessionId = `slayer_${Date.now()}`;

        for (let i = 0; i < stream.length; i += chunkSize) {
            const chunk = stream.slice(i, i + chunkSize);
            
            try {
                await NexusTransaction.run(
                    {}, 
                    async (batch) => {
                        for (const legacy of chunk) {
                            try {
                                // 1. NORMALISATION & DÉCONTAMINATION
                                const rawOrder: Record<string, unknown> = {
                                    ...legacy,
                                    source: (legacy as JsonObject).source || 'SLAYER_LEGACY',
                                    tenantId: (legacy as JsonObject).tenantId || tenantId,
                                    createdAt: legacy.timestamp || new Date().toISOString(),
                                    status: 'PAID', // Archives scellées par défaut
                                    customer: (legacy as JsonObject).customer || { firstName: 'Legacy', lastName: 'Customer' }
                                };

                                const nexusOrder = await DataDigester.digestOrder(rawOrder as import("@/shared/nexus/contracts").SovereignMap, { isLegacy: true });
                                if (!nexusOrder) throw new Error("Validation Failed");

                                // 2. CHECKSUM D'INTÉGRITÉ
                                const payloadStr = JSON.stringify(nexusOrder);
                                let checksum = `chk_${Date.now().toString(16)}`;
                                try {
                                    const { createHash } = require('node:crypto');
                                    checksum = createHash('sha256').update(payloadStr).digest('hex');
                                } catch {
                                    // Fallback
                                }

                                // 3. STRUCTURE D'ANTÉRIORITÉ CANONIQUE (origin: 'legacy')
                                const legacyOrderDoc = {
                                    ...nexusOrder,
                                    origin: 'legacy' as const,
                                    legacyMeta: {
                                        source: String((legacy as JsonObject).source || 'SLAYER_LEGACY'),
                                        migrationSessionId: sessionId,
                                        originalId: nexusOrder.id,
                                        originalDate: nexusOrder.createdAt,
                                        ingestedAt: new Date().toISOString(),
                                        rawChecksum: checksum,
                                    },
                                    status: 'PAID' as const,
                                };

                                // 4. PERSISTANCE DANS legacyOrders/ (JAMAIS dans orders/ live)
                                const path = `${Nexus.getTenantPath('legacyOrders', tenantId)}/${nexusOrder.id}`;
                                batch.set(path, legacyOrderDoc);
                                
                                ingested++;
                            } catch (itemError) {
                                errors++;
                                logger.warn(`[Slayer] Item skip: ${legacy.id}`, { error: toError(itemError).message });
                            }
                        }
                    }
                );

                if (onProgress) onProgress(ingested);

            } catch (batchError) {
                logger.error(`[Slayer] Batch Failure (i=${i})`, { error: toError(batchError).message });
            }
        }

        logger.info(`[Slayer] SUTURE COMPLETED: Ingested=${ingested}, Errors=${errors}`);
        return { ingested, errors };
    }
}
