"use client";

import { PlanningDashboard } from '@/modules/human';
import { withPageGuard } from "@design/rbac/PageGuard";

function PlanningPage() {
  return <PlanningDashboard />;
}

export default withPageGuard(PlanningPage, "planning");
