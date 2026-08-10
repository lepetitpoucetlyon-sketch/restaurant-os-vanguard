"use client";

import { FinanceDashboard } from '@/modules/finance';
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

function FinancePage() {
  return <FinanceDashboard />;
}

export default withPageGuard(FinancePage, "finance");
