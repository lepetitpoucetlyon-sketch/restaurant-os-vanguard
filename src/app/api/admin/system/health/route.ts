import { NextResponse } from 'next/server';
import { ArchitecturalHealthService } from '@/domain/system/ArchitecturalHealthService';
import { CoreErrorCode } from '@/shared/nexus/contracts/errors.types';
import { NexusTelemetryService } from '@/domain/services/NexusTelemetryService';
import { requireFleetAdmin, isDenied } from '@/lib/server/adminAuthGuard';

export const runtime = 'nodejs';

/**
 * 🏛️ Route: System Health - Grade X+++
 * Auth : fleet_admin uniquement (endpoint de supervision MCC).
 */
export async function GET(request: Request) {
    try {
        const caller = await requireFleetAdmin(request);
        if (isDenied(caller)) return caller;
        const report = await ArchitecturalHealthService.generateReport();

        NexusTelemetryService.emitAuditPulse('CORE', 'HEALTH_REPORT_GENERATED', {
            grade: report.grade,
            timestamp: report.timestamp
        });

        return NextResponse.json({
            success: true,
            data: report,
            metadata: {
                version: 'v2',
                timestamp: new Date().toISOString()
            }
        });
    } catch (_error) {
        return NextResponse.json({
            success: false,
            error: CoreErrorCode.INTERNAL_CRASH,
            metadata: {
                version: 'v2',
                timestamp: new Date().toISOString()
            }
        }, { status: 500 });
    }
}
