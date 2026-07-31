import { NextResponse } from 'next/server';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export async function POST(req: Request) {
  const caller = await requireTenantRole(req, 'manager');
  if (isDenied(caller)) return caller;

  const body = await req.json();
  const { customerId, email, phone, source } = body;

  await NexusEventBus.emitDurable('crm.customer_created', {
    v: 1,
    tenantId: caller.tenantId,
    customerId,
    email,
    phone,
    source
  });

  return NextResponse.json({ success: true });
}
