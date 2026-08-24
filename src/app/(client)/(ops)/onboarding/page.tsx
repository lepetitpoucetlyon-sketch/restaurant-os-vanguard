'use client';

import React from 'react';
import { OnboardingWizard } from '@/modules/commerce';
import { withPageGuard } from '@/shared/components/rbac/PageGuard';

function OnboardingPage() {
  return <OnboardingWizard />;
}

export default withPageGuard(OnboardingPage, 'operations');
