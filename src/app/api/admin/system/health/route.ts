import { NextResponse } from 'next/server';
import { ArchitecturalHealthService } from '@/domain/system/ArchitecturalHealthService';
import { StandardResponseSchema } from '@/shared/nexus/contracts/api/api.contracts';
import { CoreErrorCode } from '@/shared/nexus/contracts/errors.types';
import { NexusTelemetryService } from '@/domain/services/NexusTelemetryService';

export const runtime = 'nodejs';

/**
 * 🏛️ Route: System Health - Grade X+++
 */
export async function GET(request: Request) {
    try {
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
    } catch (error) {
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
