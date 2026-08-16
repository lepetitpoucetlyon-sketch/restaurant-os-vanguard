"use client";

import React from "react";
import { EquipmentHubView } from "@/modules/facility";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { useTenant } from "@/shared/hooks";

function FacilityPage() {
  const { activeTenantId } = useTenant();

  if (!activeTenantId) return null;

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <EquipmentHubView tenantId={activeTenantId} />
    </div>
  );
}

export default withPageGuard(FacilityPage, "operations");
