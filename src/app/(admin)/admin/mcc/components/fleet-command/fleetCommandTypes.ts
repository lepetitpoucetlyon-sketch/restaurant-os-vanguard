import { RefreshCw, Wrench, Lock } from 'lucide-react';
import { whiteLabelInstanceConfig } from '@/config/instance';

export const INSTANCE_BASE_DOMAIN = process.env.NEXT_PUBLIC_INSTANCE_BASE_DOMAIN
  ?? whiteLabelInstanceConfig.defaultDomain
  ?? 'restaurant-os.app';

export type StatusFilter = 'ALL' | 'ONLINE' | 'OFFLINE' | 'CRITICAL' | 'MAINTENANCE';

export const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Tous les sites' },
  { value: 'ONLINE', label: 'En ligne' },
  { value: 'OFFLINE', label: 'Hors ligne' },
  { value: 'CRITICAL', label: 'Critique' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
];

export const COMMANDER_ACTIONS = [
  { key: 'RESTART',    label: 'Redémarrer',    icon: RefreshCw, danger: false },
  { key: 'SOFT_LOCK',  label: 'Soft Lock',     icon: Wrench,    danger: false },
  { key: 'HARD_LOCK',  label: 'Hard Lock',     icon: Lock,      danger: true  },
];
