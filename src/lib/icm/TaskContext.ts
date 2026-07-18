/**
 * ICM-lite — Task Context
 *
 * Chaque route/contexte déclare ce dont elle a besoin.
 * NexusSyncService n'initialise que les modules déclarés HIGH ou MEDIUM.
 * Les modules OFF ne sont jamais chargés.
 */

export type ICMPriority = 'HIGH' | 'MEDIUM' | 'LAZY' | 'OFF';

export interface ICMImportanceMap {
  orders:      ICMPriority;
  tables:      ICMPriority;
  products:    ICMPriority;
  categories:  ICMPriority;
  stocks:      ICMPriority;
  recipes:     ICMPriority;
  finance:     ICMPriority;
  compliance:  ICMPriority;
  marketing:   ICMPriority;
  staff:       ICMPriority;
}

export interface TaskContext {
  taskId: string;
  importance: ICMImportanceMap;
}

// ── Cartes d'importance par route ─────────────────────────────────────────────

const OFF_ALL: ICMImportanceMap = {
  orders: 'OFF', tables: 'OFF', products: 'OFF', categories: 'OFF',
  stocks: 'OFF', recipes: 'OFF', finance: 'OFF', compliance: 'OFF',
  marketing: 'OFF', staff: 'OFF',
};

export const TASK_MAPS: Record<string, TaskContext> = {
  pos: {
    taskId: 'pos',
    importance: {
      ...OFF_ALL,
      orders:     'HIGH',
      tables:     'HIGH',
      products:   'HIGH',
      categories: 'HIGH',
      stocks:     'LAZY',
      recipes:    'LAZY',
    },
  },

  kds: {
    taskId: 'kds',
    importance: {
      ...OFF_ALL,
      orders:   'HIGH',
      tables:   'MEDIUM',
      recipes:  'MEDIUM',
    },
  },

  finance: {
    taskId: 'finance',
    importance: {
      ...OFF_ALL,
      finance:    'HIGH',
      compliance: 'MEDIUM',
      staff:      'LAZY',
    },
  },

  operations: {
    taskId: 'operations',
    importance: {
      ...OFF_ALL,
      orders:     'HIGH',
      tables:     'HIGH',
      stocks:     'HIGH',
      compliance: 'MEDIUM',
    },
  },

  compliance: {
    taskId: 'compliance',
    importance: {
      ...OFF_ALL,
      compliance: 'HIGH',
      stocks:     'MEDIUM',
      orders:     'LAZY',
    },
  },

  commerce: {
    taskId: 'commerce',
    importance: {
      ...OFF_ALL,
      marketing: 'HIGH',
      products:  'MEDIUM',
      orders:    'LAZY',
    },
  },

  bar: {
    taskId: 'bar',
    importance: {
      ...OFF_ALL,
      orders:    'HIGH',
      tables:    'HIGH',
      products:  'MEDIUM',
      categories:'MEDIUM',
      recipes:   'HIGH',
      stocks:    'MEDIUM',
    },
  },

  kitchen: {
    taskId: 'kitchen',
    importance: {
      ...OFF_ALL,
      orders:  'HIGH',
      tables:  'MEDIUM',
      recipes: 'HIGH',
      stocks:  'MEDIUM',
    },
  },

  'floor-plan': {
    taskId: 'floor-plan',
    importance: {
      ...OFF_ALL,
      tables: 'HIGH',
      orders: 'MEDIUM',
    },
  },

  registre: {
    taskId: 'registre',
    importance: {
      ...OFF_ALL,
      compliance: 'HIGH',
      finance:    'MEDIUM',
      orders:     'LAZY',
    },
  },

  groups: {
    taskId: 'groups',
    importance: {
      ...OFF_ALL,
      orders:    'MEDIUM',
      tables:    'MEDIUM',
      marketing: 'LAZY',
    },
  },

  staff: {
    taskId: 'staff',
    importance: { ...OFF_ALL, staff: 'HIGH' },
  },

  inventory: {
    taskId: 'inventory',
    importance: { ...OFF_ALL, stocks: 'HIGH', products: 'MEDIUM', categories: 'MEDIUM' },
  },

  haccp: {
    taskId: 'haccp',
    importance: { ...OFF_ALL, compliance: 'HIGH', stocks: 'MEDIUM' },
  },

  crm: {
    taskId: 'crm',
    importance: { ...OFF_ALL, marketing: 'MEDIUM', orders: 'LAZY' },
  },

  marketing: {
    taskId: 'marketing',
    importance: { ...OFF_ALL, marketing: 'HIGH', products: 'LAZY' },
  },

  analytics: {
    taskId: 'analytics',
    importance: { ...OFF_ALL, finance: 'MEDIUM', compliance: 'LAZY', marketing: 'LAZY', orders: 'LAZY' },
  },

  admin: {
    taskId: 'admin',
    importance: {
      orders: 'HIGH', tables: 'HIGH', products: 'HIGH', categories: 'HIGH',
      stocks: 'HIGH', recipes: 'HIGH', finance: 'HIGH', compliance: 'HIGH',
      marketing: 'HIGH', staff: 'HIGH',
    },
  },

  default: {
    taskId: 'default',
    importance: {
      orders: 'MEDIUM', tables: 'MEDIUM', products: 'MEDIUM', categories: 'MEDIUM',
      stocks: 'LAZY', recipes: 'LAZY', finance: 'LAZY', compliance: 'LAZY',
      marketing: 'OFF', staff: 'LAZY',
    },
  },
};

/** Résout le TaskContext depuis un pathname Next.js */
export function resolveTaskContext(pathname: string): TaskContext {
  if (pathname.includes('/pos'))                                              return TASK_MAPS.pos;
  if (pathname.includes('/kds'))                                              return TASK_MAPS.kds;
  if (pathname.includes('/bar'))                                              return TASK_MAPS.bar;
  if (pathname.includes('/kitchen'))                                          return TASK_MAPS.kitchen;
  if (pathname.includes('/floor-plan'))                                       return TASK_MAPS['floor-plan'];
  if (pathname.includes('/registre'))                                         return TASK_MAPS.registre;
  if (pathname.includes('/groups'))                                           return TASK_MAPS.groups;
  if (pathname.includes('/finance') || pathname.includes('/audit'))           return TASK_MAPS.finance;
  if (pathname.includes('/operations'))                                       return TASK_MAPS.operations;
  if (pathname.includes('/compliance'))                                       return TASK_MAPS.compliance;
  if (pathname.includes('/reservations') || pathname.includes('/commerce'))   return TASK_MAPS.commerce;
  if (pathname.includes('/staff'))                                            return TASK_MAPS.staff;
  if (pathname.includes('/inventory'))                                        return TASK_MAPS.inventory;
  if (pathname.includes('/haccp'))                                            return TASK_MAPS.haccp;
  if (pathname.includes('/crm'))                                              return TASK_MAPS.crm;
  if (pathname.includes('/marketing'))                                        return TASK_MAPS.marketing;
  if (pathname.includes('/analytics'))                                        return TASK_MAPS.analytics;
  if (pathname.includes('/admin'))                                            return TASK_MAPS.admin;
  return TASK_MAPS.default;
}

/** Retourne true si le module doit être initialisé (pas OFF) */
export function shouldLoad(priority: ICMPriority): boolean {
  return priority !== 'OFF';
}

/** Retourne true si le module doit être initialisé immédiatement (HIGH ou MEDIUM) */
export function shouldEagerLoad(priority: ICMPriority): boolean {
  return priority === 'HIGH' || priority === 'MEDIUM';
}
