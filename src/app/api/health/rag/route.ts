/**
 * GET /api/health/rag
 * Endpoint léger sans authentification — chaque instance Vassal l'appelle depuis
 * NexusTelemetryService pour inclure l'état de son RAG dans le pulse heartbeat.
 *
 * Ne révèle aucune donnée métier : juste l'état du sidecar local.
 */
import { NextResponse } from 'next/server';
import { sovereignHealth } from '@/lib/rag/SovereignRAGClient';

export async function GET(): Promise<NextResponse> {
    try {
        const health = await sovereignHealth();
        return NextResponse.json(health);
    } catch {
        return NextResponse.json({ status: 'offline', latencyMs: 0 });
    }
}
