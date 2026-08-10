"use client";

import { OperationsDashboard } from '@/src/modules/ops/workflow/engine/components/OperationsDashboard';;
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

function OperationsPage() {
  return <OperationsDashboard />;
}

export default withPageGuard(OperationsPage, "operations");
