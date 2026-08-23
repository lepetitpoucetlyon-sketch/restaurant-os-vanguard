"use client";

import React from "react";
import { SupplierHubDashboard } from "@/modules/logistics";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { PageShell } from "@/shared/components/ui/PageShell";
import { Truck } from "lucide-react";

function SuppliersPage() {
  return (
    <PageShell
      kicker="Approvisionnement"
      title="Fournisseurs"
      subtitle="Gestion des mercuriales, réassort automatique prédictif, litiges et RFA."
      icon={Truck}
      breadcrumbs={[{ label: "Opérations" }, { label: "Fournisseurs" }]}
    >
      <SupplierHubDashboard />
    </PageShell>
  );
}

export default withPageGuard(SuppliersPage, "inventory");
