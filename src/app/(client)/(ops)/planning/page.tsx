"use client";

import { PlanningDashboard } from '@/src/modules/human/effectifs/hr/components/PlanningDashboard';;
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

function PlanningPage() {
  return <PlanningDashboard />;
}

export default withPageGuard(PlanningPage, "planning");
