"use client";

import { TimeclockDashboard } from '@/src/modules/human/effectifs/hr/components/TimeclockDashboard';;
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

function TimeclockPage() {
  return <TimeclockDashboard />;
}

export default withPageGuard(TimeclockPage, "timeclock");
