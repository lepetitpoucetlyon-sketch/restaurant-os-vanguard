"use client";

import { FECExportPage } from '@/modules/finance';
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

function NF525Page() {
  return <FECExportPage />;
}

export default withPageGuard(NF525Page, "finance");
