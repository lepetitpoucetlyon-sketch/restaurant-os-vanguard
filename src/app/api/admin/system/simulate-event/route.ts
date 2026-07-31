import { NextResponse } from 'next/server';
import { requireFleetAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { NexusEventBus, NexusEventName, NexusEventPayload } from '@/shared/eventBus/NexusEventBus';

export async function POST(req: Request) {
  const caller = await requireFleetAdmin(req);
  if (isDenied(caller)) return caller;

  const body = await req.json();
  const { eventName, payload } = body as { eventName: NexusEventName, payload: any };

  if (!eventName || !payload) {
    return NextResponse.json({ error: 'Missing eventName or payload' }, { status: 400 });
  }

  // Force isSimulation to true
  const simulatedPayload = {
    ...payload,
    isSimulation: true,
  } as NexusEventPayload<typeof eventName>;

  await NexusEventBus.emitDurable(eventName, simulatedPayload);

  return NextResponse.json({ success: true, simulatedPayload });
}
