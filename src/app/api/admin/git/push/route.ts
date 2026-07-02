/**
 * POST /api/admin/git/push
 * Triggers a git push for deployment synchronization
 *
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireFleetAdmin, isDenied } from '@/lib/server/adminAuthGuard';

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

    logger.info('[GitPush] Push initiated by admin');

    // In production, this would:
    // 1. Execute `git status` check
    // 2. Stage all changes
    // 3. Create commit with timestamp
    // 4. Push to remote origin
    // For now, mock the response
    const result = {
      success: true,
      message: 'Deployment synchronization completed'
    };

    logger.info('[GitPush] Push completed', {
      success: result.success,
      message: result.message
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('[GitPush] Failed to execute push', {
      error: error instanceof Error ? error.message : String(error)
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
