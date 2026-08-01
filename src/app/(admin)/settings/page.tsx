"use client";

import { PageGuard } from "@/shared/components/rbac/PageGuard";
import { SettingsDashboard } from '@/shared/components/settings/SettingsDashboard';

export default function SettingsPage() {
  return (
    <PageGuard pageKey="settings">
      <SettingsDashboard />
    </PageGuard>
  );
}
