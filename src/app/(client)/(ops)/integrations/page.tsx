"use client";

import { IntegrationsPage } from '@/modules/intelligence/connectors/hub/components/IntegrationsPage';
import { withPageGuard } from '@/shared/components/rbac/PageGuard';

export default withPageGuard(IntegrationsPage, 'settings');
