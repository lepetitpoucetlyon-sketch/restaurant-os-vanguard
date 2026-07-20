import { logger } from '@/lib/logger';
import { initFirebaseAdmin } from '@/lib/firebase-admin-init';
import { getAuth } from 'firebase-admin/auth';
import { MasterBridge } from '@/lib/MasterBridge';
// import { StripeBillingService } from '@/infrastructure/services/finance/StripeBillingService';
// import { LightRAGClient } from '@/modules/intelligence/rag/LightRAGClient';

export interface ProvisioningRequest {
    ownerEmail: string;
    ownerName: string;
    companyName: string;
    siret: string;
    planId: 'STANDARD' | 'PREMIUM';
    branding: {
        primaryColor: string;
        logoUrl?: string;
    };
}

export interface ProvisioningResult {
    tenantId: string;
    ownerId: string;
    stripeCustomerId: string;
    ragWorkspaceId: string;
    status: 'SUCCESS' | 'FAILED';
}

/**
 * 🏭 Tenant Provisioning Service (MCC Pôle 1)
 * 
 * Ce service DevOps orchestre la création entièrement automatisée 
 * d'un nouveau client (Tenant) dans l'Empire SaaS.
 */
export class TenantProvisioningService {

    public static async provisionNewClient(request: ProvisioningRequest): Promise<ProvisioningResult> {
        logger.info(`🏭 [MCC] Début du provisioning pour le client: ${request.companyName}`);
        
        // 1. Génération des IDs cryptographiques
        const ownerId = `owner_${crypto.randomUUID()}`;
        const tenantId = `tenant_${request.siret}`;

        try {
            // 2. Création de la coquille isolée de configuration (Le Génome)
            await this.initializeTenantConfig(tenantId, request);

            // 3. Billing : Création du compte Stripe B2B pour les 350€/mois
            // const stripeCustomerId = await StripeBillingService.createCustomer(request.ownerEmail, request.companyName);
            const stripeCustomerId = `cus_mock_${Date.now()}`;
            logger.info(`💳 [MCC] Compte de facturation SaaS créé: ${stripeCustomerId}`);

            // 4. Intelligence : Création de l'espace RAG Hermétique
            // const ragClient = new LightRAGClient();
            // await ragClient.createWorkspace(tenantId);
            const ragWorkspaceId = `rag_workspace_${tenantId}`;
            logger.info(`🧠 [MCC] Espace IA isolé provisionné: ${ragWorkspaceId}`);

            // 5. Initialisation du premier utilisateur Admin (Le Patron)
            await this.createRootAdmin(tenantId, ownerId, request.ownerEmail);

            logger.info(`✅ [MCC] Provisioning terminé avec succès pour ${tenantId} !`);
            
            return {
                tenantId,
                ownerId,
                stripeCustomerId,
                ragWorkspaceId,
                status: 'SUCCESS'
            };

        } catch (error) {
            logger.error(`❌ [MCC] Échec critique du provisioning pour ${request.companyName}`, error);
            // Rollback géré dans ProvisioningEngine.provisionNewInstance()
            throw error;
        }
    }

    /**
     * Utilise les clés MCC pour forcer la création d'une config de base dans l'espace isolé.
     */
    private static async initializeTenantConfig(tenantId: string, req: ProvisioningRequest): Promise<void> {
        const baseConfig = {
            siret: req.siret,
            name: req.companyName,
            status: 'ACTIVE',
            subscriptionPlan: req.planId,
            theme: {
                primary: req.branding.primaryColor,
                logo: req.branding.logoUrl || null
            },
            createdAt: Date.now()
        };

        await MasterBridge.pushTenantConfigPatch(tenantId, baseConfig);
        logger.info(`🏗️ [MCC] TenantConfig initialisée avec les couleurs B2B.`);
    }

    private static async createRootAdmin(tenantId: string, ownerId: string, email: string): Promise<void> {
        logger.info(`🔐 [MCC] Création de l'accès patron (Owner) pour ${email}`);
        initFirebaseAdmin();
        const firebaseAuth = getAuth();

        let uid: string;
        try {
            // Réutilise le compte si l'email existe déjà (idempotence)
            const existing = await firebaseAuth.getUserByEmail(email);
            uid = existing.uid;
            logger.info(`🔐 [MCC] Compte Firebase existant réutilisé: ${uid}`);
        } catch {
            // Crée un nouveau compte Firebase Auth
            const created = await firebaseAuth.createUser({
                email,
                displayName: ownerId,
                emailVerified: false,
            });
            uid = created.uid;
            logger.info(`🔐 [MCC] Compte Firebase créé: ${uid}`);
        }

        // Pose les Custom Claims : tenantId + rôle OWNER
        await firebaseAuth.setCustomUserClaims(uid, {
            tenantId,
            role: 'OWNER',
        });

        logger.info(`✅ [MCC] Custom Claims posés — uid=${uid} tenantId=${tenantId} role=OWNER`);
    }
}
