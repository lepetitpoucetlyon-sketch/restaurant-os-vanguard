import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/axiom';
import { toError } from "@/lib/toError";

/**
 * 🔗 API: Mock OAuth 2.0 pour la connexion UberEats / Deliveroo
 * 
 * Dans la vraie vie : 
 * 1. Redirige vers https://auth.uber.com/oauth/v2/authorize
 * 2. Reçoit le code de callback
 * 3. Échange le code contre un AccessToken
 * 4. Sauvegarde dans Firestore
 */
export async function POST(req: NextRequest) {
  // Seul un administrateur peut connecter une plateforme
  const caller = await requireTenantRole(req, 'manager');
  if (isDenied(caller)) return caller;

  try {
    const body = await req.json();
    const { platform, storeId } = body; // ex: 'ubereats', 'store_123'

    if (platform !== 'ubereats' && platform !== 'deliveroo') {
        return NextResponse.json({ error: 'Plateforme non supportée.' }, { status: 400 });
    }

    const tenantId = caller.tenantId;

    logger.info(`[OAuth Mock] Connexion de la plateforme ${platform} demandée par ${caller.uid} (Tenant: ${tenantId})`);

    // Génération d'une intégration active (Mock)
    const integrationId = `int_${platform}_${Date.now()}`;
    const integrationData = {
        id: integrationId,
        platform,
        isActive: true,
        storeId: storeId || 'mock_store_999',
        connectedAt: new Date().toISOString(),
        connectedBy: caller.uid,
        mappings: [
            // On injecte un faux mapping pour l'exemple
            { id: 'prod_burger_maison', externalId: `item_${platform}_888` }
        ]
    };

    // Sauvegarde dans la base de données
    await Nexus.adapter.create(`tenants/${tenantId}/integrations`, integrationData);

    logger.info(`[OAuth Mock] Intégration ${platform} réussie et enregistrée.`);

    return NextResponse.json({ 
        success: true, 
        message: `${platform} a été connecté avec succès.`,
        integration: integrationData
    });

  } catch (error) {
    logger.error('[OAuth Mock] Erreur lors de la connexion', { error: toError(error).message });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
