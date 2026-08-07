/**
 * POST /api/admin/git/push
 * Triggers a git push for deployment synchronization
 *
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireFleetAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { toError } from "@/lib/toError";

interface GitPushResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<GitPushResponse>> {
  try {
    // Outillage dev : fleet_admin uniquement (et bloqué en prod par le middleware).
    const caller = await requireFleetAdmin(request);
    if (isDenied(caller)) return caller as NextResponse<GitPushResponse>;

    logger.info('[GitPush] Push requested — not implemented');

    return NextResponse.json(
      { success: false, error: 'NOT_IMPLEMENTED' },
      { status: 501 }
    );
  } catch (error) {
    logger.error('[GitPush] Failed to execute push', {
      error: toError(error).message
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
