import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

function findRoutes(dir: string, list: string[] = []): string[] {
  if (!fs.existsSync(dir)) return list;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findRoutes(fullPath, list);
    } else if (entry.name === "route.ts") {
      list.push(fullPath);
    }
  }
  return list;
}

describe("🛡️ Multi-Tenant Isolation Invariant Test", () => {
  const apiDir = path.resolve(__dirname, "../../app/api");
  const routes = findRoutes(apiDir);

  it("devrait trouver des routes API existantes", () => {
    expect(routes.length).toBeGreaterThan(0);
  });

  it("aucune route API ne doit faire de repli non vérifié sur searchParams/body tenantId (anti-spoofing)", () => {
    const violations: string[] = [];

    for (const routePath of routes) {
      const content = fs.readFileSync(routePath, "utf8");
      const relPath = path.relative(path.resolve(__dirname, "../../../"), routePath);

      // Pattern: searchParams.get("tenantId") || auth.tenantId sans assertTenant
      const hasUncheckedParamFallback =
        (content.includes("searchParams.get('tenantId') || auth.tenantId") ||
         content.includes("searchParams.get('tenantId') ?? auth.tenantId")) &&
        !content.includes("assertTenant(");

      // Pattern: { tenantId = auth.tenantId, ... } = body sans assertTenant
      const hasUncheckedBodyDestructureFallback =
        (content.includes("{ tenantId = auth.tenantId") ||
         content.includes("{ tenantId = auth?.tenantId") ||
         content.includes("body.tenantId || auth.tenantId") ||
         content.includes("body?.tenantId || auth.tenantId")) &&
        !content.includes("assertTenant(");

      if (hasUncheckedParamFallback || hasUncheckedBodyDestructureFallback) {
        violations.push(relPath + ": tentative d'usurpation de tenantId non vérifiée par assertTenant()");
      }
    }

    expect(violations).toEqual([]);
  });
});
