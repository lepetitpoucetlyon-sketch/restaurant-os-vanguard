'use client';

import { EventBusHealthPanel } from '../components/EventBusHealthPanel';
import { ManualTestPanel } from '../components/ManualTestPanel';

export function EventBusTab() {
  return (
    <div className="space-y-10">
      <ManualTestPanel />
      <div className="border-t border-border-subtle pt-8">
        <EventBusHealthPanel />
      </div>
    </div>
  );
}
