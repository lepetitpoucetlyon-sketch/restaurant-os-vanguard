/**
 * COLLECTIONS — Noms de collections Nexus centralisés.
 *
 * Règles d'usage :
 * - Toujours construire les chemins via ces constantes + getTenantPath() ou en préfixant
 *   manuellement `tenants/${tenantId}/`.
 * - Ne jamais hardcoder un nom de collection en dehors de ce fichier.
 * - Ajouter ici toute nouvelle collection avant de l'utiliser dans le code métier.
 *
 * Format des chemins relatifs (sans préfixe tenant) :
 *   COLLECTIONS.orders → "orders"
 *   chemin complet     → `tenants/${tenantId}/orders`
 */
export const COLLECTIONS = {
  // ── Ops ──────────────────────────────────────────────────────────────────
  orders:           'orders',
  tables:           'tables',
  tableGroups:      'tableGroups',
  tableZones:       'tableZones',
  tableFloors:      'tableFloors',
  reservations:     'reservations',
  printers:         'printers',

  // ── Catalogue ─────────────────────────────────────────────────────────────
  products:         'products',
  categories:       'categories',
  recipes:          'recipes',
  menuSections:     'menuSections',

  // ── Finance ───────────────────────────────────────────────────────────────
  journalEntries:   'journalEntries',
  fiscalSeals:      'fiscalSeals',
  fiscalLedger:     'fiscalLedger',
  fiscalMeta:       'fiscalMeta',
  invoices:         'invoices',
  payments:         'payments',

  // ── Commerce ──────────────────────────────────────────────────────────────
  customers:        'customers',
  loyaltyCards:     'loyaltyCards',
  quotes:           'quotes',
  campaigns:        'campaigns',
  leads:            'leads',

  // ── Human ─────────────────────────────────────────────────────────────────
  staff:            'staff',
  shifts:           'shifts',
  leaves:           'leaves',
  leaveBalances:    'leaveBalances',
  recruitment:      'recruitment',

  // ── Logistics ─────────────────────────────────────────────────────────────
  stock:            'stock',
  stockMovements:   'stockMovements',
  suppliers:        'suppliers',
  purchaseOrders:   'purchaseOrders',

  // ── Compliance ────────────────────────────────────────────────────────────
  haccpChecks:      'haccpChecks',
  haccpReceptions:  'haccpReceptions',
  maintenanceLogs:  'maintenanceLogs',
  auditLogs:        'auditLogs',
  rgpdRequests:     'rgpdRequests',

  // ── Intelligence ──────────────────────────────────────────────────────────
  ragDocuments:     'ragDocuments',
  aiSessions:       'aiSessions',
  anomalies:        'anomalies',
  attendance:       'attendance',

  // ── Facility ──────────────────────────────────────────────────────────────
  floorPlans:       'floorPlans',
  settings:         'settings',
  branding:         'branding',

  // ── Système / MCC (sans préfixe tenant) ──────────────────────────────────
  /** @note Ces collections sont au niveau racine, pas sous tenants/{id}/ */
  system: {
    alerts:         'system_alerts',
    tenants:        'tenants',
    domainMap:      'domain_map',
    masterConfig:   'mcc/config',
    switchboard:    'mcc/switchboard',
  },

  // ── Auth (sous tenants/{id}/) ────────────────────────────────────────────
  users:            'users',
  permissions:      'permissions',
} as const;

/** Type union de tous les noms de collections tenant-scoped */
export type TenantCollection = typeof COLLECTIONS[
  Exclude<keyof typeof COLLECTIONS, 'system'>
];
