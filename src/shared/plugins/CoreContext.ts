'use client';

import React from 'react';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import type { ICoreContext } from './IVerticalPlugin';

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

  registerEventHandler<T = unknown>(event: string, handler: (payload: T) => void): void {
    const unsub = NexusEventBus.on(
      event as Parameters<typeof NexusEventBus.on>[0],
      handler as Parameters<typeof NexusEventBus.on>[1],
      { id: `vertical-handler-${event}-${Date.now()}`, priority: 'BACKGROUND' }
    );
    this.unsubscribers.push(unsub);
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
