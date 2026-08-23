"use client";

import React from "react";
import { EquipmentHubView } from "@/modules/facility";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { useTenant } from "@/shared/hooks";
import { PageShell } from "@/shared/components/ui/PageShell";
import { Wrench } from "lucide-react";

function FacilityPage() {
  const { activeTenantId } = useTenant();

  if (!activeTenantId) return null;

  return (
    <PageShell
      kicker="Maintenance"
      title="GMAO & Matériel"
      subtitle="Gestion des équipements, capteurs IoT et interventions préventives."
      icon={Wrench}
      breadcrumbs={[{ label: "Opérations" }, { label: "GMAO & Matériel" }]}
    >
      <div className="p-6">
        <EquipmentHubView tenantId={activeTenantId} />
      </div>
    </PageShell>
  );
}

export default withPageGuard(FacilityPage, "operations");

