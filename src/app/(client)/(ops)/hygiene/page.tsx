"use client";

import React from "react";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import HaccpPage from "../haccp/page";

function HygienePage() {
  return <HaccpPage />;
}

export default withPageGuard(HygienePage, "haccp");
