"use client";

import { OperationsDashboard } from '@/modules/ops';
import { withPageGuard } from "@design/rbac/PageGuard";

function OperationsPage() {
  return <OperationsDashboard />;
}

export default withPageGuard(OperationsPage, "operations");
