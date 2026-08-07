import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { NexusContext, INexusQueryOptions } from '@/lib/nexus/types';
import { TenantPathResolver } from '@/lib/nexus/resolvers/TenantPathResolver';

export interface IBaseRepository<T extends { id: string }> {
  findById(id: string, context: NexusContext): Promise<T | null>;
  findMany(options?: INexusQueryOptions, context?: NexusContext): Promise<T[]>;
  save(entity: T, context: NexusContext): Promise<void>;
  delete(id: string, context: NexusContext): Promise<void>;
}

export abstract class BaseRepository<T extends { id: string }> implements IBaseRepository<T> {
  constructor(protected readonly collectionName: string) {}

  protected getCollectionPath(context: NexusContext): string {
    return TenantPathResolver.resolve(this.collectionName, context);
  }

  protected getDocumentPath(id: string, context: NexusContext): string {
    return TenantPathResolver.resolve(`${this.collectionName}/${id}`, context);
  }

  async findById(id: string, context: NexusContext): Promise<T | null> {
    const path = this.getDocumentPath(id, context);
    return Nexus.adapter.get<T>(path, context);
  }

  async findMany(options?: INexusQueryOptions, context?: NexusContext): Promise<T[]> {
    if (!context) throw new Error(`[Repository] Context required for collection ${this.collectionName}`);
    const path = this.getCollectionPath(context);
    return Nexus.adapter.query<T>(path, options, context);
  }

  async save(entity: T, context: NexusContext): Promise<void> {
    const path = this.getDocumentPath(entity.id, context);
    await Nexus.adapter.set<T>(path, entity, { merge: true }, context);
  }

  async delete(id: string, context: NexusContext): Promise<void> {
    const path = this.getDocumentPath(id, context);
    await Nexus.adapter.delete(path, context);
  }
}
