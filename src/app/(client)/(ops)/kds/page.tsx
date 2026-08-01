"use client";

import { KDSDashboard } from '@/modules/ops';
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

function KDSPage() {
  return <KDSDashboard />;
}

export default withPageGuard(KDSPage, "kds");
