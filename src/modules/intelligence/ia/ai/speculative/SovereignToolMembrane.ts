/**
 * 🛡️ SovereignToolMembrane — Sécurité & Inaltérabilité NF525 (Spec-PTC)
 * 
 * Garantit qu'AUCUN appel d'outil à effet de bord (mutation de BDD, écriture comptable,
 * débit de carte bancaire, scellement fiscal) ne peut être exécuté de manière spéculative.
 * Seules les requêtes de lecture idempotentes et sans effet de bord sont autorisées.
 */

export interface ToolSafetyVerdict {
  isSafeForSpeculation: boolean;
  reason?: string;
  category: 'READ_ONLY' | 'MUTATING' | 'FINANCIAL_TRANSACTION' | 'UNKNOWN';
}

export class SovereignToolMembrane {
  /**
   * Liste blanche explicite des outils autorisés pour l'exécution spéculative (Strict Read-Only).
   */
  private static readonly SPECULATIVE_ALLOWLIST = new Set<string>([
    'query_stock_level',
    'query_location_inventory',
    'query_financial_snapshot',
    'query_table_status',
    'query_haccp_alerts',
    'query_reservations',
    'query_repair_order',
    'query_room_rack',
    'query_practitioner_agenda',
    'get_latest_supplier_invoices',
    'get_stock_by_location',
  ]);

  /**
   * Liste noire explicite des outils strictement interdits en spéculation (Effets de bord / Fiscalité).
   */
  private static readonly MUTATING_BLOCKLIST = new Set<string>([
    'order_paid',
    'charge_payment_terminal',
    'seal_fiscal_transaction',
    'deduct_stock_item',
    'close_ticket_z',
    'fire_course_sequence',
    'create_maintenance_ticket',
    'schedule_baking_batch',
    'lock_space_or_table',
    'book_client_treatment',
  ]);

  /**
   * Évalue si un outil peut être exécuté de manière spéculative dans le Shadow REPL.
   */
  public static evaluateTool(toolId: string): ToolSafetyVerdict {
    if (this.MUTATING_BLOCKLIST.has(toolId)) {
      return {
        isSafeForSpeculation: false,
        category: 'MUTATING',
        reason: `L'outil "${toolId}" modifie l'état système ou la fiscalité NF525. Exécution spéculative strictement interdite.`,
      };
    }

    if (this.SPECULATIVE_ALLOWLIST.has(toolId)) {
      return {
        isSafeForSpeculation: true,
        category: 'READ_ONLY',
      };
    }

    // Par défaut, refus strict (Zero-Trust)
    return {
      isSafeForSpeculation: false,
      category: 'UNKNOWN',
      reason: `L'outil "${toolId}" n'est pas dans la liste blanche de lecture seule. Refus par précaution.`,
    };
  }
}
