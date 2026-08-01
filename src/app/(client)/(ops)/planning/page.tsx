"use client";

import { PlanningDashboard } from '@/modules/human';
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

function PlanningPage() {
  return <PlanningDashboard />;
}

export default withPageGuard(PlanningPage, "planning");
