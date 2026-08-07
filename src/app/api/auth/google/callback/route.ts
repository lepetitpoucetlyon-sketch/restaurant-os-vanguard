import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ??
  `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/auth/google/callback`;

interface GoogleTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
}

interface GoogleIntegrationRecord {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
  connectedAt: number;
}

/**
 * Chiffrement AES-GCM via Web Crypto API.
 * La clé dérivée utilise NEXUS_TENANT_SECRET comme base.
 *
 * TODO: En production, envisager une clé de chiffrement dédiée
 * distincte de NEXUS_TENANT_SECRET pour une meilleure séparation des responsabilités.
 */
async function encryptToken(plaintext: string): Promise<string> {
  const secret = process.env.NEXUS_TENANT_SECRET;
  if (!secret) {
    // Fail-closed : stocker un token OAuth en clair est inacceptable.
    // Configurer NEXUS_TENANT_SECRET dans les variables d'environnement.
    throw new Error('NEXUS_TENANT_SECRET manquant — chiffrement OAuth impossible');
  }

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret.slice(0, 32).padEnd(32, '0')),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    encoder.encode(plaintext)
  );

  // Retourner iv + ciphertext en base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return Buffer.from(combined).toString('base64');
}

/**
 * GET /api/auth/google/callback
 * Reçoit le code OAuth Google, l'échange contre des tokens,
 * chiffre et stocke dans Nexus 'tenantIntegrations/google'.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  // Décodage du tenantId depuis state
  let tenantId: string;
  try {
    if (!state) throw new Error('Paramètre state manquant');
    tenantId = Buffer.from(state, 'base64').toString('utf-8');
    if (!tenantId) throw new Error('tenantId vide après décodage');
  } catch (err) {
    logger.error('[Google OAuth Callback] State invalide', err);
    return NextResponse.redirect(
      new URL('/settings?tab=integrations&error=invalid_state', req.url)
    );
  }

  if (errorParam) {
    logger.warn(`[Google OAuth Callback] Erreur OAuth retournée: ${errorParam}`);
    return NextResponse.redirect(
      new URL(`/settings?tab=integrations&error=${encodeURIComponent(errorParam)}`, req.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings?tab=integrations&error=no_code', req.url)
    );
  }

  try {
    // Échange du code contre des tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokenData: GoogleTokenResponse = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
      logger.error('[Google OAuth Callback] Échange de token échoué', tokenData);
      return NextResponse.redirect(
        new URL('/settings?tab=integrations&error=token_exchange_failed', req.url)
      );
    }

    const expiresAt = Date.now() + (tokenData.expires_in ?? 3600) * 1000;

    // Chiffrement AES-GCM des tokens sensibles
    const [encryptedAccessToken, encryptedRefreshToken] = await Promise.all([
      encryptToken(tokenData.access_token),
      tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : Promise.resolve(null),
    ]);

    const integration: GoogleIntegrationRecord = {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt,
      connectedAt: Date.now(),
    };

    // Stocker dans Nexus
    await Nexus.adapter.update(
      `tenants/${tenantId}/tenantIntegrations/google`,
      integration,
      { vassalId: tenantId, actorId: 'system' }
    );

    logger.info(`[Google OAuth Callback] Tokens stockés pour tenant ${tenantId}`);

    return NextResponse.redirect(
      new URL('/settings?tab=integrations&connected=google', req.url)
    );
  } catch (error) {
    logger.error('[Google OAuth Callback] Erreur inattendue', error);
    return NextResponse.redirect(
      new URL('/settings?tab=integrations&error=internal', req.url)
    );
  }
}
