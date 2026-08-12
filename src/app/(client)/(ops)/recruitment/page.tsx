"use client";

import { RecruitmentDashboard } from '@/modules/human';
import { withPageGuard } from "@design/rbac/PageGuard";

function RecruitmentPage() {
  return <RecruitmentDashboard />;
}

export default withPageGuard(RecruitmentPage, "recruitment");
