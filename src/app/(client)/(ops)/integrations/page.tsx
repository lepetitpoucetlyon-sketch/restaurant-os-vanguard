"use client";

import { IntegrationsPage } from '@/modules/intelligence';
import { withPageGuard } from '@design/rbac/PageGuard';

export default withPageGuard(IntegrationsPage, 'settings');
