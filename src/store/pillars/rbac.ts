import { atom } from "jotai";
import { TenantRBACConfig, TenantRBACConfigSchema } from "@/domain/schemas/rbac";
import { Nexus } from "@/lib/nexus/NexusAdapter";

export const rbacConfigAtom = atom<TenantRBACConfig | null>(null);

export const fetchRbacConfigAtom = atom(
  null,
  async (get, set, tenantId: string) => {
    try {
      const path = `tenants/${tenantId}/config/rbac`;
      const data = await Nexus.adapter.get(path);
      
      if (data) {
        const parsed = TenantRBACConfigSchema.parse(data);
        set(rbacConfigAtom, parsed);
      } else {
        // Fallback defaults
        set(rbacConfigAtom, TenantRBACConfigSchema.parse({}));
      }
    } catch (e) {
      console.error("[RBAC] Failed to fetch config", e);
      set(rbacConfigAtom, TenantRBACConfigSchema.parse({}));
    }
  }
);
