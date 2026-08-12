'use client';

import React from 'react';
import { getDefaultStore } from 'jotai';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { rbacConfigAtom } from '@/store/pillars/rbac';
import type { TenantRBACConfig } from '@nexus/contracts';
import type { ICoreContext } from './IVerticalPlugin';

import type { NexusEventName, NexusEventPayload } from '@orchestration/NexusEventBus';

export class CoreContext implements ICoreContext {
  private routes = new Map<string, React.ComponentType<unknown>>();
  private atoms = new Map<string, unknown>();
  private unsubscribers: Array<() => void> = [];

  registerRoute(path: string, component: React.ComponentType<unknown>): void {
    this.routes.set(path, component);
  }

  registerStoreAtom<T>(key: string, atom: T): void {
    this.atoms.set(key, atom);
  }

  registerEventHandler<E extends NexusEventName>(
    event: E,
    handler: (payload: NexusEventPayload<E>) => void | Promise<void>
  ): void;
  registerEventHandler<T = unknown>(
    event: string,
    handler: (payload: T) => void | Promise<void>
  ): void;
  registerEventHandler(
    event: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: (payload: any) => void | Promise<void>
  ): void {
    const unsub = NexusEventBus.on(
      event as NexusEventName,
      handler,
      { id: `vertical-handler-${event}-${Date.now()}`, priority: 'BACKGROUND' }
    );
    this.unsubscribers.push(unsub);
  }

  registerRbacConfig(config: TenantRBACConfig): void {
    getDefaultStore().set(rbacConfigAtom, config);
  }

  getRegisteredRoutes(): string[] {
    return Array.from(this.routes.keys());
  }

  getRegisteredAtoms(): string[] {
    return Array.from(this.atoms.keys());
  }

  destroy(): void {
    this.unsubscribers.forEach(fn => fn());
    this.unsubscribers = [];
    this.routes.clear();
    this.atoms.clear();
  }
}
