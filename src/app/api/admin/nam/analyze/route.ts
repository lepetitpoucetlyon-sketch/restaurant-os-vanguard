import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GatewayErrorCode, CoreErrorCode } from '@/shared/nexus/contracts/errors.types';
import { NexusTelemetryService } from '@/domain/services/NexusTelemetryService';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';

const TicketSchema_v1 = z.object({
  id: z.string().uuid(),
  title: z.string().min(5),
  description: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  forensicData: z.object({
    jotaiSnapshot: z.string().optional(),
    screenshot: z.string().optional(),
    logs: z.array(z.string()).optional()
  }).optional()
});

const TicketSchema_v2 = TicketSchema_v1.extend({
  tenantId: z.string(),
  userStatus: z.enum(['ACTIVE', 'RESTRICTED', 'ADMIN']).optional()
});

export type StandardResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    version: 'v1' | 'v2';
    timestamp: string;
    latency?: number;
  };
};

export async function POST(request: Request) {
  try {
    // Auth : JWT vérifié — le tenant vient du token.
    const caller = await requireTenantAdmin(request);
    if (isDenied(caller)) {
      const errorResponse: StandardResponse<never> = {
        success: false,
        error: GatewayErrorCode.ACCESS_DENIED,
        metadata: { version: 'v1', timestamp: new Date().toISOString() }
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }
    const tenantId = caller.tenantId;

    const url = new URL(request.url);
    const version = url.searchParams.get('v') === 'v2' ? 'v2' : 'v1';
    
    const body = await request.json();
    
    let parsedData;
    if (version === 'v2') {
      parsedData = TicketSchema_v2.parse(body);
    } else {
      parsedData = TicketSchema_v1.parse(body);
    }

    NexusTelemetryService.emitAuditPulse('INTELLIGENCE', 'NAM_ANALYSIS_REQUESTED', {
      ticketId: parsedData.id,
      tenantId
    });

    // NAM AI analysis not yet implemented — return honest 501.
    return NextResponse.json(
      {
        success: false,
        error: 'NOT_IMPLEMENTED',
        metadata: { version: version as 'v1' | 'v2', timestamp: new Date().toISOString() }
      },
      { status: 501 }
    );
  } catch (error) {
    NexusTelemetryService.emitAuditPulse('INTELLIGENCE', 'NAM_ANALYSIS_FAILED', {
      error: error instanceof Error ? error.message : 'Unknown validation error'
    });

    const errorResponse: StandardResponse<never> = {
      success: false,
      error: CoreErrorCode.MAPPING_FAILURE,
      metadata: {
        version: 'v1',
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(errorResponse, { status: 400 });
  }
}
