"use client";

import { KitchenDashboard } from '@/src/modules/ops/production/kitchen/components/KitchenDashboard';;
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

function KitchenPage() {
  return <KitchenDashboard />;
}

export default withPageGuard(KitchenPage, "kitchen");
