import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';

export interface FiscalTransaction {
  id: string;
  tenantId: string;
  amount: number;
  currency: string;
  vatAmounts: Record<string, number>;
  timestamp: number;
  type: 'SALE' | 'REFUND';
  signature?: string; 
  previousSignature?: string; 
}

export interface FiscalArchiveZ {
  id: string;
  tenantId: string;
  date: string;
  totalSales: number;
  totalVat: number;
  transactionCount: number;
  startSignature: string;
  endSignature: string;
  archiveSignature: string;
  timestamp: number;
}

/**
 * FiscalLedger (Grade X)
 * Moteur cryptographique NF525 pour l'inaltérabilité des données de caisse.
 * Utilise l'API Web Crypto native (compatible Edge, Node 18+, Browser).
 */
export class FiscalLedger {
  
  /**
   * Hashes a string using SHA-256
   */
  private static async hashSHA256(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Scelle une transaction fiscale en la chaînant avec la précédente.
   * C'est l'exigence technique principale de la NF525.
   */
  static async sealTransaction(tx: Omit<FiscalTransaction, 'signature' | 'previousSignature'>): Promise<FiscalTransaction> {
    logger.info(`[FiscalLedger] Sealing transaction ${tx.id} for tenant ${tx.tenantId}`);
    
    // 1. Récupérer la signature de la TOUTE DERNIÈRE transaction de ce tenant
    // Note: Dans une vraie DB, on fait une requête triée par timestamp descendant LIMIT 1
    let previousSignature = 'GENESIS_BLOCK_00000000000000000000000000000000';
    try {
      const lastTx = await Nexus.adapter.query<FiscalTransaction>(`tenants/${tx.tenantId}/fiscal_ledger`, { 
        limit: 1, 
        orderBy: { field: 'timestamp', direction: 'desc' } 
      });
      if (lastTx && lastTx.length > 0 && lastTx[0].signature) {
        previousSignature = lastTx[0].signature;
      }
    } catch (err) {
      logger.warn(`[FiscalLedger] Could not fetch previous transaction for ${tx.tenantId}. Using Genesis block if new tenant.`);
    }

    // 2. Préparer la chaîne de données (Ordre strict)
    // [ID] + [MONTANT] + [DATE] + [PREVIOUS_HASH]
    const dataString = `${tx.id}|${tx.amount}|${tx.timestamp}|${previousSignature}`;
    
    // 3. Hachage SHA-256
    const signature = await this.hashSHA256(dataString);

    const sealedTx: FiscalTransaction = {
      ...tx,
      previousSignature,
      signature
    };

    // 4. Sauvegarde inaltérable
    await Nexus.adapter.set(`tenants/${tx.tenantId}/fiscal_ledger/${tx.id}`, sealedTx);
    
    return sealedTx;
  }

  /**
   * Génère l'Archive Z (Clôture journalière)
   * Cette archive est elle-même signée et fige la journée.
   */
  static async generateZArchive(tenantId: string, dateYYYYMMDD: string): Promise<FiscalArchiveZ> {
    logger.info(`[FiscalLedger] Generating Z-Archive for ${tenantId} on ${dateYYYYMMDD}`);
    
    // 1. Récupérer toutes les transactions de la journée
    const transactions = await Nexus.adapter.query<FiscalTransaction>(`tenants/${tenantId}/fiscal_ledger`);
    // Note: Simulation d'un filtre par date
    const dayTxs = transactions.filter(t => new Date(t.timestamp).toISOString().startsWith(dateYYYYMMDD));

    if (dayTxs.length === 0) {
      throw new Error(`Aucune transaction trouvée pour la clôture du ${dateYYYYMMDD}`);
    }

    // Tri chronologique strict
    dayTxs.sort((a, b) => a.timestamp - b.timestamp);

    const startSignature = dayTxs[0].signature!;
    const endSignature = dayTxs[dayTxs.length - 1].signature!;
    
    let totalSales = 0;
    let totalVat = 0;

    for (const t of dayTxs) {
      if (t.type === 'SALE') totalSales += t.amount;
      if (t.type === 'REFUND') totalSales -= t.amount;
      totalVat += Object.values(t.vatAmounts).reduce((acc: number, val: number) => acc + val, 0);
    }

    // 2. Chiffrement de l'archive Z
    const archiveData = `${tenantId}|${dateYYYYMMDD}|${totalSales}|${startSignature}|${endSignature}`;
    const archiveSignature = await this.hashSHA256(archiveData);

    const archive: FiscalArchiveZ = {
      id: `Z-${dateYYYYMMDD}`,
      tenantId,
      date: dateYYYYMMDD,
      totalSales,
      totalVat,
      transactionCount: dayTxs.length,
      startSignature,
      endSignature,
      archiveSignature,
      timestamp: Date.now()
    };

    // 3. Sauvegarde (Grand Livre d'Archive)
    await Nexus.adapter.set(`tenants/${tenantId}/fiscal_archives/${archive.id}`, archive);
    
    return archive;
  }
}
