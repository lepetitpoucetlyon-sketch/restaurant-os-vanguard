import { AsyncLocalStorage } from "node:async_hooks";

export interface ServerTenantContext {
  tenantId: string;
  role?: string;
  userId?: string;
  isMcc?: boolean;
}

export const ServerTenantStorage = new AsyncLocalStorage<ServerTenantContext>();
