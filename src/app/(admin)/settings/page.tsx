"use client";

import { PageGuard } from "@design/rbac/PageGuard";
import { SettingsDashboard } from '@design/settings/SettingsDashboard';

export default function SettingsPage() {
  return (
    <PageGuard pageKey="settings">
      <SettingsDashboard />
    </PageGuard>
  );
}
