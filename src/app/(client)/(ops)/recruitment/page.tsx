import { RecruitmentDashboard } from '@/modules/human';
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

function RecruitmentPage() {
  return <RecruitmentDashboard />;
}

export default withPageGuard(RecruitmentPage, "recruitment");
