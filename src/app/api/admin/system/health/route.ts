import { NextResponse } from 'next/server';
import { ArchitecturalHealthService } from '@/infrastructure/services/ArchitecturalHealthService';
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

        // P09-K: Notification proactive si des routes admin non protégées sont détectées
        if (report.blockers.length > 0) {
            const { NexusEventBus } = await import('@/shared/eventBus/NexusEventBus');
            NexusEventBus.emitDurable('notification.created', {
                v: 1,
                tenantId: 'fleet',
                id: `health-blockers-${Date.now()}`,
                type: 'error',
                title: `Santé Architecturale : ${report.blockers.length} bloqueur(s) détecté(s)`,
                message: report.blockers.map(b => `[${b.code}] ${b.file}`).join(' | '),
                priority: 'high',
                read: false,
                timestamp: new Date().toISOString(),
            });
        }

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
