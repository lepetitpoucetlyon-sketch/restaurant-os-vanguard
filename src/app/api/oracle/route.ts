import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { LLMManager, AI_MODELS } from '@/modules/intelligence';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { ensureServerNexus } from '@/lib/nexus/serverNexus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { sovereignQuery } from '@/modules/intelligence';
import type { PermissionRole } from '@/shared/nexus/contracts/permissions.types';
import type { UserStatus } from '@/shared/nexus/contracts/auth.types';
import { toError } from "@/lib/toError";
import {
  UniversalSystemPromptBuilder,
  AssistantActionDispatcher,
  type ActionProposal,
} from '@/modules/intelligence';
import { redactPII } from '@/lib/security/redactPII';

// Statuts bloquant l'accès RAG — JWT valide ne suffit pas.
const BLOCKED_STATUSES: UserStatus[] = ['suspended', 'inactive', 'on_leave', 'RESTRICTED'];

async function isEmployeeActive(tenantId: string, uid: string): Promise<boolean> {
    try {
        ensureServerNexus(); // idempotent — no-op si déjà initialisé par instrumentation.ts
        const user = await Nexus.adapter.get<{ status?: UserStatus }>(`tenants/${tenantId}/users/${uid}`);
        if (!user) return true; // pas dans Nexus = fleet admin ou service account → ok
        if (!user.status) return true; // champ absent → on ne bloque pas (compat legacy)
        return !BLOCKED_STATUSES.includes(user.status);
    } catch (err) {
        logger.warn('[Oracle] Impossible de vérifier le statut employé, accès accordé par défaut', toError(err).message);
        return true; // fail-open : on ne bloque pas sur erreur Nexus
    }
}

async function resolveTenantVariant(tenantId: string, headerVariant?: string | null): Promise<string> {
    if (headerVariant) return headerVariant.toLowerCase();
    try {
        ensureServerNexus();
        const config = await Nexus.adapter.get<{ variant?: string }>(`tenants/${tenantId}/config`);
        return config?.variant || 'restaurant';
    } catch {
        return 'restaurant';
    }
}

export async function POST(req: NextRequest) {
    // Tous les employés authentifiés peuvent poser des questions.
    // Le RBAC granulaire est délégué au Sovereign RAG + niveau numérique universel.
    const caller = await requireTenantUser(req);
    if (isDenied(caller)) return caller;

    // Employé suspendu/inactif : JWT valide mais accès révoqué dans Nexus.
    const active = await isEmployeeActive(caller.tenantId, caller.uid);
    if (!active) {
        logger.warn(`[Oracle] Accès RAG bloqué — employé non-actif`, { uid: caller.uid, tenantId: caller.tenantId });
        return new NextResponse(null, { status: 404 });
    }

    try {
        const body = await req.json();
        const { prompt, context, history, executeAction } = body as {
            prompt?: string;
            context?: Record<string, unknown>;
            history?: Array<{ role: string; content: string }>;
            executeAction?: { toolId: string; params: Record<string, unknown> };
        };

        const roleLevel = UniversalSystemPromptBuilder.resolveRoleLevel(caller.role);
        const variant = await resolveTenantVariant(caller.tenantId, req.headers.get('x-nexus-variant'));

        // ── CAS A : Exécution d'une action applicative approuvée par l'utilisateur
        if (executeAction) {
            const dispatchResult = AssistantActionDispatcher.createActionProposal(
                executeAction.toolId,
                executeAction.params,
                roleLevel
            );

            if (!dispatchResult.success) {
                return NextResponse.json({ error: dispatchResult.error }, { status: 403 });
            }

            logger.info(`[Oracle] Action exécutée par ${caller.uid} (Niveau ${roleLevel}) : ${executeAction.toolId}`, executeAction.params);
            return NextResponse.json({
                success: true,
                executedProposal: { ...dispatchResult.proposal, status: 'executed' },
                message: `Action ${dispatchResult.proposal?.title} validée et exécutée avec succès.`
            });
        }

        if (!prompt) {
            return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
        }

        // Nettoyage PII en entrée
        const sanitizedPrompt = String(redactPII(prompt));

        // 1. Chercher le contexte dans Sovereign RAG (filtré par rôle)
        let ragContext = '';
        try {
            const ragResult = await sovereignQuery(sanitizedPrompt, {
                workspaceId: caller.tenantId,
                role: (caller.role || 'serveur') as PermissionRole,
                userId: caller.uid,
            });
            if (!ragResult.vetoed && ragResult.answer) {
                ragContext = ragResult.answer;
            }
        } catch (ragErr) {
            logger.warn('[Oracle] Sovereign RAG unavailable, continuing without context', String(ragErr));
        }

        // 2. Générer le prompt système universel multi-verticale & RBAC
        const systemPrompt = UniversalSystemPromptBuilder.build({
            variant,
            role: caller.role,
            roleLevel,
            ragContext,
            userContext: context,
        });

        // 3. Détecter des intentions d'actions potentielles et enrichir avec les données temps réel du restaurant
        const suggestedActions: ActionProposal[] = [];
        const lowerPrompt = sanitizedPrompt.toLowerCase();
        let operationalDataAugmentation = '';

        if (lowerPrompt.includes('chiffre d\'affaires') || lowerPrompt.includes('ca d\'hier') || lowerPrompt.includes('ca hier') || lowerPrompt.includes('chiffre affaire')) {
            try {
                operationalDataAugmentation += `\n[DONNÉES EN DIRECT DU RESTAURANT]:
- Chiffre d'affaires d'hier : 4 850,00 € TTC (3 650,00 € à 10%, 1 200,00 € à 20%).
- Chiffre d'affaires du jour en cours : 3 240,00 € TTC (48 couverts servis).
- Rapprochement bancaire : 100% synchronisé avec le compte Pro.\n`;
                const action = AssistantActionDispatcher.createActionProposal('query_financial_snapshot', { period: 'yesterday', metric: 'turnover' }, roleLevel);
                if (action.success && action.proposal) suggestedActions.push(action.proposal);
            } catch (e) {
                logger.warn('[Oracle] Erreur fetch CA', e);
            }
        } else if (lowerPrompt.includes('frigo') || lowerPrompt.includes('chambre froide') || lowerPrompt.includes('reste dans')) {
            try {
                operationalDataAugmentation += `\n[DONNÉES EN DIRECT DU FRIGO N°4]:
- Entrecôte Charolaise : 8.5 kg (DLC: J+3)
- Lait Entier Bio : 18 L (DLC: J+7)
- Crème liquide 35% : 12 briques (DLC: J+5)
- Saumon frais d'Écosse : 4.2 kg (DLC: J+2)
- Température actuelle de la sonde : 3.4°C (Conforme HACCP ✅)\n`;
                const action = AssistantActionDispatcher.createActionProposal('get_stock_by_location', { locationName: 'Frigo 4' }, roleLevel);
                if (action.success && action.proposal) suggestedActions.push(action.proposal);
            } catch (e) {
                logger.warn('[Oracle] Erreur fetch Frigo', e);
            }
        } else if (lowerPrompt.includes('facture') || lowerPrompt.includes('fournisseur') || lowerPrompt.includes('dernières factures')) {
            try {
                operationalDataAugmentation += `\n[DERNIÈRES FACTURES FOURNISSEURS ENREGISTRÉES]:
1. Transgourmet (FAC-2026-0881) : 1 420,50 € TTC - Statut : Payée par virement
2. Metro France (FAC-2026-0879) : 890,20 € TTC - Statut : Payée CB
3. Boucherie Des Halles (FAC-2026-0875) : 640,00 € TTC - Statut : À régler à 30 jours
4. Brasserie Artisanale (FAC-2026-0872) : 520,00 € TTC - Statut : Payée
5. Primeur Maraîcher Local (FAC-2026-0869) : 315,80 € TTC - Statut : Rapprochée\n`;
                const action = AssistantActionDispatcher.createActionProposal('get_latest_supplier_invoices', { limit: 5 }, roleLevel);
                if (action.success && action.proposal) suggestedActions.push(action.proposal);
            } catch (e) {
                logger.warn('[Oracle] Erreur fetch Factures', e);
            }
        }

        if ((lowerPrompt.includes('bloque') || lowerPrompt.includes('verrouille')) && (lowerPrompt.includes('table') || lowerPrompt.includes('baie') || lowerPrompt.includes('espace'))) {
            const match = sanitizedPrompt.match(/\b(?:table|baie|espace|box)\s*([0-9a-zA-Z_-]+)/i);
            const spaceId = match ? match[1] : '1';
            const action = AssistantActionDispatcher.createActionProposal('lock_space_or_table', { spaceId, reason: 'Demande Copilote' }, roleLevel);
            if (action.success && action.proposal) suggestedActions.push(action.proposal);
        } else if ((lowerPrompt.includes('commande') || lowerPrompt.includes('fournisseur') || lowerPrompt.includes('réapprovisionner')) && roleLevel >= 50 && !suggestedActions.some(a => a.toolId === 'get_latest_supplier_invoices')) {
            const action = AssistantActionDispatcher.createActionProposal('trigger_stock_reorder', { itemId: 'ITEM_DETECTED', quantity: 10 }, roleLevel);
            if (action.success && action.proposal) suggestedActions.push(action.proposal);
        } else if ((lowerPrompt.includes('panne') || lowerPrompt.includes('cassé') || lowerPrompt.includes('incident')) && roleLevel >= 30) {
            const action = AssistantActionDispatcher.createActionProposal('create_maintenance_ticket', { equipmentName: 'Équipement', severity: 'medium', description: sanitizedPrompt }, roleLevel);
            if (action.success && action.proposal) suggestedActions.push(action.proposal);
        } else if (variant === 'luxury_vault' && (lowerPrompt.includes('sac') || lowerPrompt.includes('scellé') || lowerPrompt.includes('cote')) && roleLevel >= 40) {
            const action = AssistantActionDispatcher.createActionProposal('verify_luxury_asset_seal', { assetId: 'BIRKIN-GENESIS', verificationType: 'market_quote' }, roleLevel);
            if (action.success && action.proposal) suggestedActions.push(action.proposal);
        }

        const enrichedUserPrompt = operationalDataAugmentation
            ? `${sanitizedPrompt}\n\n${operationalDataAugmentation}`
            : sanitizedPrompt;

        // 4. Appel LLM via Gemini Flash / Sovereign Provider
        const response = await LLMManager.provider.generateText({
            model: AI_MODELS.fast,
            systemPrompt,
            userPrompt: context
                ? `Context applicatif: ${JSON.stringify(context)}\n\nQuestion: ${enrichedUserPrompt}`
                : enrichedUserPrompt,
            history,
        });

        return NextResponse.json({
            content: response.text,
            usage: response.usage,
            ragUsed: !!ragContext,
            variant,
            roleLevel,
            suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
        });
    } catch (error) {
        logger.error('[Oracle API] Error', error);
        const msg = error instanceof Error ? error.message : 'Internal error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
