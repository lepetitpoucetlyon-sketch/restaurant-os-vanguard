"use client";

import { KitchenDashboard } from '@/modules/ops';
import { withPageGuard } from "@design/rbac/PageGuard";

function KitchenPage() {
  return <KitchenDashboard />;
}

export default withPageGuard(KitchenPage, "kitchen");
