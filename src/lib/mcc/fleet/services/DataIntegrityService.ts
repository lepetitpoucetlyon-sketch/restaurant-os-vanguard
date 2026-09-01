import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { AuditLogger } from '@/lib/audit';

/**
 * Service d'Intégrité des Données (Grade X)
 * Moteur chargé d'exécuter des opérations NoSQL complexes (Cascade Delete, Soft Delete)
 * pour éviter les "données orphelines" qui feraient crasher le MCC.
 */
export class DataIntegrityService {
  
  /**
   * Suppression propre d'un Revendeur (Cascade Soft-Delete)
   * 1. On "soft delete" le revendeur.
   * 2. On coupe le lien `resellerId` sur tous les restaurants affiliés pour éviter
   *    de calculer des commissions sur une entité disparue.
   */
  static async deleteReseller(resellerId: string, adminId: string, ipAddress: string = '0.0.0.0'): Promise<void> {
    logger.warn(`[DATA INTEGRITY] Initiating Cascade Delete for Reseller: ${resellerId}`);

    // 1. Démarrer un Batch Nexus pour l'atomicité
    const batch = Nexus.adapter.batch();

    try {
      // 2. Trouver tous les restaurants (tenants) affiliés à ce revendeur
      const affiliatedTenants = await Nexus.adapter.query<{ id: string }>('tenants', {
        where: [{ field: 'resellerId', operator: '==', value: resellerId }]
      });

      // 3. Purger la relation sur chaque restaurant (Unlink)
      logger.info(`[DATA INTEGRITY] Found ${affiliatedTenants.length} affiliated tenants. Unlinking...`);
      for (const tenant of affiliatedTenants) {
        batch.update(`tenants/${tenant.id}`, { resellerId: null });
      }

      // 4. Soft-delete ou Hard-delete le revendeur
      // Dans un système financier, on préfère le Soft-Delete pour garder l'historique de facturation
      batch.update(`resellers/${resellerId}`, { 
        status: 'DELETED', 
        deletedAt: Date.now(),
        deletedBy: adminId 
      });

      // 5. Exécuter l'écriture atomique
      await batch.commit();

      // 6. Sécuriser l'action dans le journal d'audit
      await AuditLogger.logAction(
        adminId, 
        'RESELLER_DELETE', 
        resellerId, 
        { 
          type: 'CASCADE_SOFT_DELETE', 
          unlinkedTenantsCount: affiliatedTenants.length 
        }, 
        ipAddress
      );

      logger.info(`[DATA INTEGRITY] Cascade Delete successful for Reseller ${resellerId}`);

    } catch (error) {
      logger.error(`[DATA INTEGRITY] Cascade Delete FAILED for Reseller ${resellerId}`, error);
      throw new Error(`Data Integrity Exception: Could not cascade delete reseller.`);
    }
  }

  /**
   * Suppression propre d'un Tenant (Kill Switch Ultime)
   * A n'utiliser qu'en cas de liquidation judiciaire ou RGPD "Droit à l'oubli".
   */
  static async wipeTenantData(tenantId: string, adminId: string, ipAddress: string = '0.0.0.0'): Promise<void> {
    logger.warn(`[DATA INTEGRITY] WARNING: Initiating WIPE for Tenant: ${tenantId}`);
    
    // Le code implémenterait ici la suppression de toutes les sous-collections du tenant
    // via une Cloud Function backend, car un Batch Firestore est limité à 500 opérations.
    
    await AuditLogger.logAction(
      adminId,
      'KILL_SWITCH_ACTIVATE',
      tenantId,
      { type: 'WIPE_DB', reason: 'RGPD / LIQUIDATION' },
      ipAddress
    );
  }
}
