"use client";

import { RecruitmentDashboard } from '@/src/modules/human/effectifs/hr/components/RecruitmentDashboard';;
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

function RecruitmentPage() {
  return <RecruitmentDashboard />;
}

export default withPageGuard(RecruitmentPage, "recruitment");
