/**
 * 🔑 FiscalKeyService — source unique de la clé de scellement NF525.
 *
 * 1. Clé provisionnée par tenant (générée par TenantSeeder, stockée dans
 *    tenantConfig — lisible uniquement par le staff du tenant via les rules,
 *    chargée en mémoire au sync de la config).
 * 2. Fallback serveur : env FISCAL_SIGNING_SECRET (routes API, exports FEC).
 * 3. Sinon : ÉCHEC EXPLICITE. Aucun repli silencieux — un sceau signé avec
 *    une clé devinable est pire qu'un sceau refusé.
 */
export class FiscalKeyService {
  private static keys = new Map<string, string>();

  /** Charge la clé d'un tenant (appelé au sync de tenantConfig / au login). */
  static provision(tenantId: string, signingKey: string): void {
    if (!tenantId || !signingKey) return;
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
      const tenantKey = this.keys.get(tenantId);
      if (tenantKey) return tenantKey;
    }
    const envKey = typeof process !== 'undefined' ? process.env?.FISCAL_SIGNING_SECRET : undefined;
    if (envKey) return envKey;

    throw new Error(
      `[NF525][SCELLAGE_REFUSÉ] Aucune clé de scellement disponible pour le tenant "${tenantId ?? 'inconnu'}". ` +
      `Le scellage exige soit une clé provisionnée (tenantConfig.fiscalSigningKey), ` +
      `soit FISCAL_SIGNING_SECRET dans l'environnement serveur.`
    );
  }

  /** Vide les clés (utilisé dans les tests). */
  static reset(): void {
    this.keys.clear();
  }
}
