"use client";

import { FinanceDashboard } from '@/src/modules/finance/components/FinanceDashboard';;
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

function FinancePage() {
  return <FinanceDashboard />;
}

export default withPageGuard(FinancePage, "finance");
