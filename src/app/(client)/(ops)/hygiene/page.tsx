"use client";

import React from "react";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { PageShell } from "@/shared/components/ui/PageShell";
import { ShieldCheck } from "lucide-react";
import HaccpPage from "../haccp/page";

function HygienePage() {
  return <HaccpPage />;
}

export default withPageGuard(HygienePage, "haccp");
