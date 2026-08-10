"use client";

import { KDSDashboard } from '@/src/modules/ops/production/kds/components/KDSDashboard';;
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

function KDSPage() {
  return <KDSDashboard />;
}

export default withPageGuard(KDSPage, "kds");
