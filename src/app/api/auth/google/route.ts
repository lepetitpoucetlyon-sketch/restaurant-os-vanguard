import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { logger } from '@/lib/logger';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ??
  `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/auth/google/callback`;

/**
 * GET /api/auth/google
 * Redirige vers l'URL OAuth Google avec le scope business.manage.
 * Le tenantId est encodé en base64 dans le paramètre state.
 */
export async function GET(req: NextRequest) {
  try {
    const caller = await requireTenantAdmin(req);
    if (isDenied(caller)) return caller;

    const { tenantId } = caller;

    if (!GOOGLE_CLIENT_ID) {
      logger.error('[Google OAuth] GOOGLE_CLIENT_ID non configuré');
      return NextResponse.json(
        { error: 'Configuration OAuth Google manquante (GOOGLE_CLIENT_ID).' },
        { status: 500 }
      );
    }

    // Encoder le tenantId en base64 pour le paramètre state
    const state = Buffer.from(tenantId).toString('base64');

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/business.manage',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    logger.info(`[Google OAuth] Redirection OAuth pour tenant ${tenantId}`);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    logger.error('[Google OAuth] Erreur', error);
    const msg = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
