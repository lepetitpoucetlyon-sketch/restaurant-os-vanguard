import { atom } from "jotai";
import { TenantRBACConfig, TenantRBACConfigSchema, DEFAULT_PAGE_ACCESS, DEFAULT_TAB_ACCESS } from "@/modules/compliance/domain/schemas/rbac";
import { Nexus } from "@/lib/nexus/NexusAdapter";

export const rbacConfigAtom = atom<TenantRBACConfig | null>(null);

/** Config RBAC par défaut — utilisée quand Nexus n'a pas encore de config pour ce tenant. */
const buildDefaultRbac = (): TenantRBACConfig =>
  TenantRBACConfigSchema.parse({
    pageOverrides: Object.fromEntries(
      Object.entries(DEFAULT_PAGE_ACCESS).map(([page, roles]) => [page, { allowed: roles }])
    ),
    tabOverrides: Object.fromEntries(
      Object.entries(DEFAULT_TAB_ACCESS).map(([page, tabs]) => [
        page,
        Object.fromEntries(Object.entries(tabs).map(([tab, level]) => [tab, { minLevel: level }])),
      ])
    ),
  });

export const fetchRbacConfigAtom = atom(
  null,
  async (_get, set, tenantId: string) => {
    try {
      const path = `tenants/${tenantId}/config/rbac`;
      const data = await Nexus.adapter.get(path);

      if (data) {
        const parsed = TenantRBACConfigSchema.parse(data);
        // Si le tenant a des overrides vides (ancien provisioning), on injecte les defaults
        const hasOverrides =
          Object.keys(parsed.pageOverrides ?? {}).length > 0 ||
          Object.keys(parsed.tabOverrides ?? {}).length > 0;
        set(rbacConfigAtom, hasOverrides ? parsed : buildDefaultRbac());
      } else {
        // Aucune config en base → defaults restaurant
        set(rbacConfigAtom, buildDefaultRbac());
      }
    } catch (e) {
      console.error("[RBAC] Failed to fetch config", e);
      set(rbacConfigAtom, buildDefaultRbac());
    }
  }
);
