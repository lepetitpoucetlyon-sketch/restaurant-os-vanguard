import { TimeclockDashboard } from '@/modules/human';
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

function TimeclockPage() {
  return <TimeclockDashboard />;
}

export default withPageGuard(TimeclockPage, "timeclock");
