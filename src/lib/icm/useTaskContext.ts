'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { resolveTaskContext, TaskContext } from './TaskContext';

/**
 * Retourne le TaskContext ICM-lite résolu depuis le pathname courant.
 * À utiliser dans NexusOpsProvider pour décider quels modules charger.
 */
export function useTaskContext(): TaskContext {
  const pathname = usePathname();
  return useMemo(() => resolveTaskContext(pathname ?? '/'), [pathname]);
}
