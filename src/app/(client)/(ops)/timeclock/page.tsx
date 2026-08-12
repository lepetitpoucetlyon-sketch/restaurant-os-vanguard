"use client";

import { TimeclockDashboard } from '@/modules/human';
import { withPageGuard } from "@design/rbac/PageGuard";

function TimeclockPage() {
  return <TimeclockDashboard />;
}

export default withPageGuard(TimeclockPage, "timeclock");
