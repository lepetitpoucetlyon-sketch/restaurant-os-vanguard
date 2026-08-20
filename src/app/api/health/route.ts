import { NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────────
// GET /api/health — Lightweight liveness probe
// Returns 200 if the application is running
// ─────────────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev',
    uptime: Math.floor(process.uptime()),
  });
}
