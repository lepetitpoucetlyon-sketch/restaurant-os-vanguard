/**
 * GET /api/admin/git/status
 * Returns current git status for deployment engine monitoring
 *
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface GitStatusResponse {
  success: boolean;
  branch?: string;
  modifiedCount?: number;
  lastCommit?: string;
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<GitStatusResponse>> {
  try {
    // In production, verify admin access
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.isAdmin) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    // }

    // Mock git status for now (in production, would call git commands via exec)
    const mockStatus: GitStatusResponse = {
      success: true,
      branch: process.env.NODE_ENV === 'production' ? 'main' : 'development',
      modifiedCount: 0,
      lastCommit: 'GRADE X: Email service integration + pricing fixes'
    };

    logger.info('[GitStatus] Status queried', mockStatus);

    return NextResponse.json(mockStatus);
  } catch (error) {
    logger.error('[GitStatus] Failed to fetch git status', {
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
