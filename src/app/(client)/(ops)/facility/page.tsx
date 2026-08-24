"use client";

import React, { useState } from "react";
import { EquipmentHubView } from "@/modules/facility";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { useTenant } from "@/shared/hooks";
import { PageShell } from "@/shared/components/ui/PageShell";
import { Wrench, ShieldAlert } from "lucide-react";
import { DeviceFleetInventoryModal } from "@/shared/components/fleet/DeviceFleetInventoryModal";

function FacilityPage() {
  const { activeTenantId } = useTenant();
  const [fleetModalOpen, setFleetModalOpen] = useState(false);

  if (!activeTenantId) return null;

  return (
    <>
      <PageShell
        kicker="Maintenance & Sécurité"
        title="GMAO & Matériel"
        subtitle="Gestion des équipements, capteurs IoT et inventaire de flotte sécurisée."
        icon={Wrench}
        breadcrumbs={[{ label: "Opérations" }, { label: "GMAO & Matériel" }]}
        actions={
          <button
            onClick={() => setFleetModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-98"
          >
            <ShieldAlert className="w-4 h-4" />
            Flotte MDM & Kill-Switch
          </button>
        }
      >
        <div className="p-6">
          <EquipmentHubView tenantId={activeTenantId} />
        </div>
      </PageShell>

      <DeviceFleetInventoryModal
        open={fleetModalOpen}
        onClose={() => setFleetModalOpen(false)}
      />
    </>
  );
}

export default withPageGuard(FacilityPage, "operations");

