"use client";

// @wip owner:design-system-team échéance:2026-Q4 — primitive UI shared à adopter (audit orphelins 2026-08-30)
import React, { type ReactNode } from "react";
import { useAuth } from "@/infrastructure/auth/hooks/useAuth";
import { RBAC_ROLES } from "@/kernel/contracts/rbac";

export interface RoleAwareViewProps {
  allowedRoles?: string[];
  minLevel?: number;
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleAwareView({
  allowedRoles,
  minLevel,
  fallback = null,
  children,
}: RoleAwareViewProps) {
  const { currentUser } = useAuth();
  const currentRole = currentUser?.role ?? "guest";

  // MCC super admin has root access
  if (currentRole === "mcc_super_admin" || currentRole === "admin") {
    return <>{children}</>;
  }

  // Check specific allowed roles list
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(currentRole)) {
      return <>{fallback}</>;
    }
  }

  // Check hierarchy minLevel
  if (minLevel !== undefined) {
    const roleDef = RBAC_ROLES[currentRole as keyof typeof RBAC_ROLES];
    const userLevel = roleDef?.level ?? 0;
    if (userLevel < minLevel) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}
