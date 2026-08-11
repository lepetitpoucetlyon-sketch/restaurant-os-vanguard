"use client";

import { IntegrationsPage } from '@/modules/intelligence';
import { withPageGuard } from '@/shared/components/rbac/PageGuard';

export default withPageGuard(IntegrationsPage, 'settings');
