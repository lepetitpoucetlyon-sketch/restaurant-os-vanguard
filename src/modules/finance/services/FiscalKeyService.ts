import { logger } from '@/lib/logger';

/**
 * 🔑 FiscalKeyService — source unique de la clé de scellement NF525.
 *
 * AVANT : la « signature » fiscale était SHA-256(hash + instanceId), avec repli
 * sur la constante 'default_instance' — un secret public, forgeable par
 * n'importe qui. Ce service impose une vraie clé :
 *
 *   1. Clé provisionnée par tenant (générée par TenantSeeder, stockée dans
 *      tenantConfig — lisible uniquement par le staff du tenant via les rules,
 *      chargée en mémoire au sync de la config).
 *   2. Fallback serveur : env FISCAL_SIGNING_SECRET (routes API, exports FEC).
 *   3. Sinon : ÉCHEC EXPLICITE. Aucun repli silencieux — un sceau signé avec
 *      une clé devinable est pire qu'un sceau refusé.
 */
export class FiscalKeyService {
  private static keys = new Map<string, string>();

  /** Charge la clé d'un tenant (appelé au sync de tenantConfig / au login). */
  static provision(tenantId: string, signingKey: string): void {
    if (!tenantId || !signingKey) return;
    const existing = this.keys.get(tenantId);
    if (existing && existing !== signingKey) {
      logger.warn(`[FiscalKeyService] Key re-provisioning with different key for tenant ${tenantId}`);
    }
    this.keys.set(tenantId, signingKey);
  }

  /** Génère une clé de scellement aléatoire (provisioning d'un nouveau tenant). */
  static generateKey(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  static hasKey(tenantId?: string): boolean {
    if (tenantId && this.keys.has(tenantId)) return true;
    return typeof process !== 'undefined' && !!process.env?.FISCAL_SIGNING_SECRET;
  }

  /**
   * Retourne la clé de scellement — jette si aucune clé n'est disponible.
   * `tenantId` n'est JAMAIS utilisé comme clé : c'est un index de lookup.
   */
  static requireKey(tenantId?: string): string {
    if (tenantId) {
      const key = this.keys.get(tenantId);
      if (key) return key;
    }
    const envKey = typeof process !== 'undefined' ? process.env?.FISCAL_SIGNING_SECRET : undefined;
    if (envKey) return envKey;
    throw new Error(
      `FISCAL_SIGNING_KEY_MISSING: aucune clé de scellement pour ${tenantId ?? '(tenant inconnu)'}. ` +
      'Provisionner via FiscalKeyService.provision() (tenantConfig.fiscalSigningKey) ' +
      'ou définir FISCAL_SIGNING_SECRET côté serveur.'
    );
  }

  /** Réinitialisation (tests uniquement). */
  static reset(): void {
    this.keys.clear();
  }
}
