/**
 * 🐉 SLAYER - Grade VI
 * Moteur d'ingestion souverain pour la migration de données legacy (Zelty, Lightspeed, SumUp).
 * Raccordement complet à la chaîne de scellage NF525 et validation Zod.
 */

import { logger } from "@/lib/logger";
import { DataDigester } from "./DataDigester";
import { LegacyOrder, Order } from "@/types";
import { FinanceCore } from "./FinanceCore";
import { NexusTransaction } from "@/lib/NexusTransaction";
import { getTenantPath } from "@/lib/firebase";

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
    static mapLegacy(raw: Record<string, unknown>, config: SlayerMappingConfig): any {
        return {
            id: String(raw[config.fields.id]),
            total: typeof raw[config.fields.total] === 'number' 
                ? raw[config.fields.total] as number
                : parseFloat(DataDigester.decontaminate(String(raw[config.fields.total]))),
            timestamp: String(raw[config.fields.date]),
            items: (raw[config.fields.items || 'items'] as any[]) || [],
            source: config.source,
            customer: config.fields.customerName ? { firstName: String(raw[config.fields.customerName]), lastName: '' } : undefined
        };
    }

    /**
     * Ingestion d'un flux massif avec scellage cryptographique à la volée.
     * GRADE VI: Isolation totale et compliance NF525.
     */
    static async ingestMassive(
        stream: LegacyOrder[], 
        tenantId: string = 'lepetitpoucet',
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
                                const rawOrder: any = {
                                    ...legacy,
                                    source: (legacy as any).source || 'SLAYER_LEGACY',
                                    tenantId: (legacy as any).tenantId || tenantId,
                                    createdAt: legacy.timestamp || new Date().toISOString(),
                                    status: 'PAID', // Archives scellées par défaut
                                    customer: (legacy as any).customer || { firstName: 'Legacy', lastName: 'Customer' }
                                };

                                const nexusOrder = await DataDigester.digestOrder(rawOrder, { isLegacy: true });
                                if (!nexusOrder) throw new Error("Validation Failed");

                                // 2. SCELLAGE FISCAL (SHA-256 Post-Quantum)
                                const seal = await FinanceCore.sealRecordWithHash(nexusOrder.id, nexusOrder);
                                
                                // Extension du type pour inclure le scellage fiscal sans cast "any"
                                const sealedOrder = {
                                    ...nexusOrder,
                                    _fiscalSeal: seal
                                };

                                // 3. PERSISTANCE NEXUS
                                const path = `${getTenantPath('orders', tenantId)}/${nexusOrder.id}`;
                                batch.set(path, sealedOrder);
                                
                                ingested++;
                            } catch (itemError) {
                                errors++;
                                logger.warn(`[Slayer] Item skip: ${legacy.id}`, itemError);
                            }
                        }
                    }
                );

                if (onProgress) onProgress(ingested);
                
            } catch (batchError) {
                logger.error(`[Slayer] Batch Failure (i=${i})`, batchError);
            }
        }

        return { ingested, errors };
    }
}

