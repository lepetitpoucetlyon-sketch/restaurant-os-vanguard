import type { NexusContext } from '../types';

export class TenantPathResolver {
  /**
   * Resolves and validates a tenant-scoped path.
   * Ensures that cross-tenant leaks are prevented.
   */
  static resolve(path: string, context?: NexusContext): string {
    if (!context?.vassalId) {
      // System paths like 'mcc/*', 'users/*', '_ref_V/*' can bypass if explicit
      if (path.startsWith('mcc/') || path.startsWith('_ref_') || path.startsWith('system/')) {
        return path;
      }
      return path;
    }

    const vassalId = context.vassalId;

    // Already properly scoped
    if (path.startsWith(`tenants/${vassalId}/`)) {
      return path;
    }

    // System-wide global collections
    if (path.startsWith('mcc/') || path.startsWith('system/')) {
      return path;
    }

    // Prepend tenant prefix if simple path
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `tenants/${vassalId}/${cleanPath}`;
  }

  /**
   * Validates if a target path matches the declared vassal context.
   */
  static validate(path: string, context?: NexusContext): boolean {
    if (!context?.vassalId) return true;
    if (path.startsWith('mcc/') || path.startsWith('system/')) return true;

    if (path.startsWith('tenants/')) {
      const parts = path.split('/');
      const pathTenant = parts[1];
      return pathTenant === context.vassalId;
    }

    return true;
  }
}
