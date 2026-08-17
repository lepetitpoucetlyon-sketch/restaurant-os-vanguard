/**
 * GET /api/admin/git/status
 * Returns current git status for deployment engine monitoring
 *
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireFleetAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { toError } from "@/lib/toError";

interface GitStatusResponse {
  success: boolean;
  branch?: string;
  modifiedCount?: number;
  lastCommit?: string;
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<GitStatusResponse>> {
  try {
    // Outillage dev : super_admin uniquement (et bloqué en prod par le middleware).
    const caller = await requireFleetAdmin(request);
    if (isDenied(caller)) return caller as NextResponse<GitStatusResponse>;

    // Mock git status for now (in production, would call git commands via exec)
    const mockStatus: GitStatusResponse = {
      success: true,
      branch: process.env.NODE_ENV === 'production' ? 'main' : 'development',
      modifiedCount: 0,
      lastCommit: 'GRADE X: Email service integration + pricing fixes'
    };

    logger.info('[GitStatus] Status queried', {
      branch: mockStatus.branch,
      modifiedCount: mockStatus.modifiedCount,
      lastCommit: mockStatus.lastCommit
    });

    return NextResponse.json(mockStatus);
  } catch (error) {
    logger.error('[GitStatus] Failed to fetch git status', {
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
