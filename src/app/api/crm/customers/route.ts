import { NextResponse } from 'next/server';
import { withTenantRoute } from '@/lib/server/routeWrapper';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const POST = withTenantRoute(
  async (req, { tenantId }) => {
    const body = await req.json();
    const { customerId, email, phone, source } = body;

    await NexusEventBus.emitDurable('crm.customer_created', {
      v: 1,
      tenantId,
      customerId,
      email,
      phone,
      source,
    });

    return NextResponse.json({ success: true });
  },
  { minRole: 'manager' },
);

