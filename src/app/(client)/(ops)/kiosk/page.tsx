"use client";

import React from "react";
import { KioskPage } from "@/modules/ops";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

function KioskRoute() {
  return <KioskPage />;
}

export default withPageGuard(KioskRoute, "pos");
