/**
 * ICM-lite — Task Context
 *
 * Chaque route/contexte déclare ce dont elle a besoin.
 * NexusSyncService n'initialise que les modules déclarés HIGH ou MEDIUM.
 * Les modules OFF ne sont jamais chargés.
 */

export type ICMPriority = 'HIGH' | 'MEDIUM' | 'LAZY' | 'OFF';

export interface ICMImportanceMap {
  orders:       ICMPriority;
  tables:       ICMPriority;
  products:     ICMPriority;
  categories:   ICMPriority;
  stocks:       ICMPriority;
  recipes:      ICMPriority;
  finance:      ICMPriority;
  compliance:   ICMPriority;
  marketing:    ICMPriority;
  staff:        ICMPriority;
  intelligence: ICMPriority;
}

export interface TaskContext {
  taskId: string;
  importance: ICMImportanceMap;
}

// ── Cartes d'importance par route ─────────────────────────────────────────────

const OFF_ALL: ICMImportanceMap = {
  orders: 'OFF', tables: 'OFF', products: 'OFF', categories: 'OFF',
  stocks: 'OFF', recipes: 'OFF', finance: 'OFF', compliance: 'OFF',
  marketing: 'OFF', staff: 'OFF', intelligence: 'OFF',
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

  'pos-mobile': {
    taskId: 'pos-mobile',
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

  reservations: {
    taskId: 'reservations',
    importance: {
      ...OFF_ALL,
      tables:    'HIGH',
      orders:    'MEDIUM',
      marketing: 'MEDIUM',
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

  'mon-espace': {
    taskId: 'mon-espace',
    importance: { ...OFF_ALL, staff: 'HIGH', orders: 'LAZY' },
  },

  planning: {
    taskId: 'planning',
    importance: { ...OFF_ALL, staff: 'HIGH', orders: 'LAZY' },
  },

  timeclock: {
    taskId: 'timeclock',
    importance: { ...OFF_ALL, staff: 'HIGH' },
  },

  recruitment: {
    taskId: 'recruitment',
    importance: { ...OFF_ALL, staff: 'HIGH' },
  },

  analytics: {
    taskId: 'analytics',
    importance: { ...OFF_ALL, finance: 'MEDIUM', intelligence: 'MEDIUM', compliance: 'LAZY', marketing: 'LAZY', orders: 'LAZY' },
  },

  admin: {
    taskId: 'admin',
    importance: {
      orders: 'HIGH', tables: 'HIGH', products: 'HIGH', categories: 'HIGH',
      stocks: 'HIGH', recipes: 'HIGH', finance: 'HIGH', compliance: 'HIGH',
      marketing: 'HIGH', staff: 'HIGH', intelligence: 'HIGH',
    },
  },

  default: {
    taskId: 'default',
    importance: {
      orders: 'MEDIUM', tables: 'MEDIUM', products: 'MEDIUM', categories: 'MEDIUM',
      stocks: 'LAZY', recipes: 'LAZY', finance: 'LAZY', compliance: 'LAZY',
      marketing: 'OFF', staff: 'LAZY', intelligence: 'OFF',
    },
  },
};

// Ordre important : les routes plus spécifiques (pos-mobile) avant les générales (pos).
const ROUTE_SEGMENTS: [string, keyof typeof TASK_MAPS][] = [
  ['/pos-mobile',  'pos-mobile'],
  ['/pos',         'pos'],
  ['/kds',         'kds'],
  ['/bar',         'bar'],
  ['/kitchen',     'kitchen'],
  ['/floor-plan',  'floor-plan'],
  ['/registre',    'registre'],
  ['/groups',      'groups'],
  ['/audit',       'finance'],
  ['/finance',     'finance'],
  ['/operations',  'operations'],
  ['/compliance',  'compliance'],
  ['/reservations','reservations'],
  ['/commerce',    'commerce'],
  ['/planning',    'planning'],
  ['/timeclock',   'timeclock'],
  ['/recruitment', 'recruitment'],
  ['/staff',       'staff'],
  ['/inventory',   'inventory'],
  ['/haccp',       'haccp'],
  ['/crm',         'crm'],
  ['/mon-espace',  'mon-espace'],
  ['/marketing',   'marketing'],
  ['/analytics',   'analytics'],
  ['/admin',       'admin'],
];

/** Résout le TaskContext depuis un pathname Next.js */
export function resolveTaskContext(pathname: string): TaskContext {
  const match = ROUTE_SEGMENTS.find(([segment]) => pathname.includes(segment));
  return match ? TASK_MAPS[match[1]] : TASK_MAPS.default;
}

/** Retourne true si le module doit être initialisé (pas OFF) */
export function shouldLoad(priority: ICMPriority): boolean {
  return priority !== 'OFF';
}

/** Retourne true si le module doit être initialisé immédiatement (HIGH ou MEDIUM) */
export function shouldEagerLoad(priority: ICMPriority): boolean {
  return priority === 'HIGH' || priority === 'MEDIUM';
}
