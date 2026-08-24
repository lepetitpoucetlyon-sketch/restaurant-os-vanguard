"use client";

import { FECExportPage } from '@/modules/finance';
import { PageShell } from "@/shared/components/ui/PageShell";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { ShieldCheck } from "lucide-react";

function NF525Page() {
  return (
    <PageShell
      kicker="Conformité"
      title="NF525 & Export FEC"
      subtitle="Génération du Fichier des Écritures Comptables (FEC) conforme aux exigences DGFIP."
      icon={ShieldCheck}
      breadcrumbs={[{ label: "Opérations" }, { label: "Finance" }, { label: "NF525" }]}
    >
      <FECExportPage />
    </PageShell>
  );
}

export default withPageGuard(NF525Page, "finance");
