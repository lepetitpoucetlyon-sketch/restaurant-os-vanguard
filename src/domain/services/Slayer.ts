/**
 * 🐉 SLAYER - Grade VI
 * Moteur d'ingestion souverain pour la migration de données legacy (Zelty, Lightspeed, SumUp).
 * Raccordement complet à la chaîne de scellage NF525 et validation Zod.
 */

import { logger } from "@/lib/logger";
import { DataDigester } from "./DataDigester";
import { LegacyOrder, Order } from "@nexus/contracts";
import { toMicrounits } from "@/domain/schemas/primitives";
import { FinanceCore } from "./FinanceCore";
import { NexusTransaction } from "@/lib/NexusTransaction";
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { DEFAULT_TENANT_ID } from '@/config/instance';

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
     * Ingestion d'un flux massif avec scellage cryptographique à la volée.
     * GRADE VI: Isolation totale et compliance NF525.
     */
    static async ingestMassive(
        stream: LegacyOrder[], 
        tenantId: string = DEFAULT_TENANT_ID,
        onProgress?: (processed: number) => void
    ): Promise<{ ingested: number; errors: number }> {
        
        logger.info(`[Slayer] OMEGA INGESTION: Initiating phase for ${stream.length} entries on ${tenantId}`);
        
        let ingested = 0;
        let errors = 0;

        // 📦 CHUNKING INDUSTRIEL (Lots de 200 pour Firestore Batch)
        const CHUNK_SIZE = 200;
        
        for (let i = 0; i < stream.length; i += CHUNK_SIZE) {
            const chunk = stream.slice(i, i + CHUNK_SIZE);
            
            try {
                await NexusTransaction.run(
                    {}, 
                    async (batch) => {
                        for (const legacy of chunk) {
                            try {
                                // 1. NORMALISATION & DÉCONTAMINATION
                                const rawOrder: Record<string, unknown> = {
                                    ...legacy,
                                    source: (legacy as Record<string, unknown>).source || 'SLAYER_LEGACY',
                                    tenantId: (legacy as Record<string, unknown>).tenantId || tenantId,
                                    createdAt: legacy.timestamp || new Date().toISOString(),
                                    status: 'PAID', // Archives scellées par défaut
                                    customer: (legacy as Record<string, unknown>).customer || { firstName: 'Legacy', lastName: 'Customer' }
                                };

                                const nexusOrder = await DataDigester.digestOrder(rawOrder as import('@/shared/nexus-contract').SovereignMap, { isLegacy: true });
                                if (!nexusOrder) throw new Error("Validation Failed");

                                // 2. SCELLAGE FISCAL (SHA-256 Post-Quantum)
                                const seal = await FinanceCore.sealRecordWithHash(nexusOrder.id, nexusOrder);
                                
                                // Extension du type pour inclure le scellage fiscal sans cast "unknown"
                                const sealedOrder = {
                                    ...nexusOrder,
                                    _fiscalSeal: seal
                                };

                                // 3. PERSISTANCE NEXUS
                                const path = `${Nexus.getTenantPath('orders', tenantId)}/${nexusOrder.id}`;
                                batch.set(path, sealedOrder);
                                
                                ingested++;
                            } catch (itemError: unknown) {
                                errors++;
                                logger.warn(`[Slayer] Item skip: ${legacy.id}`, { error: itemError instanceof Error ? itemError.message : String(itemError) });
                            }
                        }
                    }
                );

                if (onProgress) onProgress(ingested);
                
            } catch (batchError: unknown) {
                logger.error(`[Slayer] Batch Failure (i=${i})`, { error: batchError instanceof Error ? batchError.message : String(batchError) });
            }
        }

        return { ingested, errors };
    }
}

