"use client";

import { RecruitmentDashboard } from '@/modules/human';
import { PageShell } from "@/shared/components/ui/PageShell";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { UserPlus } from "lucide-react";

function RecruitmentPage() {
  return (
    <PageShell
      kicker="Effectifs"
      title="Recrutement"
      subtitle="Pipeline candidats, entretiens, essais et embauches — RGPD conforme."
      icon={UserPlus}
      breadcrumbs={[{ label: "Opérations" }, { label: "Équipe" }, { label: "Recrutement" }]}
    >
      <RecruitmentDashboard />
    </PageShell>
  );
}

export default withPageGuard(RecruitmentPage, "recruitment");
