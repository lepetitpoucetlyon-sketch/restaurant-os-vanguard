"use client";

import { FECExportPage } from '@/modules/finance/comptabilite/fec';
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

function NF525Page() {
  return <FECExportPage />;
}

export default withPageGuard(NF525Page, "finance");
