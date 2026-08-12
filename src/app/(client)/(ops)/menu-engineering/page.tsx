"use client";

import { MenuEngineeringDashboard } from '@/verticals/restaurant/presentation/MenuEngineeringDashboard';
import { withPageGuard } from "@design/rbac/PageGuard";

function MenuEngineeringPage() {
  return <MenuEngineeringDashboard />;
}

export default withPageGuard(MenuEngineeringPage, "analytics");
