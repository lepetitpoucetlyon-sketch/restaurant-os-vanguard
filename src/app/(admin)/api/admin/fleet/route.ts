import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { FleetTelemetryService } from '@/domain/services/FleetTelemetryService';
import { logger } from '@/lib/logger';

/**
 * 🛰️ MASTER FLEET API v2.0
 * Goal: Serve the "Neural Shield" dashboard with real-time site metrics.
 */
export async function GET() {
  try {
    logger.info('[FleetAPI] Fetching real-time telemetry orchestration...');
    
    // 1. Discover the real fleet from centralized telemetry
    const instances = await FleetTelemetryService.discoverRealFleet();
    
    // 2. Compile global fleet-wide metrics
    const stats = FleetTelemetryService.getGlobalMetrics(instances);

    return NextResponse.json({ 
      instances,
      stats,
      total: instances.length,
      timestamp: new Date().toISOString(),
      orchestrationMode: 'reality-welding'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    logger.error('[FleetAPI] Orchestration Failure:', error);
    return NextResponse.json({ 
      error: 'Failed to synchronize fleet reality', 
      details: message
    }, { status: 500 });
  }
}

