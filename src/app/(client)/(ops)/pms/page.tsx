"use client";

import React from "react";
import { PmsPage } from "@/modules/ops";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

function PmsRoute() {
  return <PmsPage />;
}

export default withPageGuard(PmsRoute, "operations");
