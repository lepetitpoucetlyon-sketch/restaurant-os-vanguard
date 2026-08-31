import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { LLMManager, AI_MODELS } from '@/modules/intelligence';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { getRateLimiter } from '@/infrastructure/services/rate-limiter';
import { ensureServerNexus } from '@/lib/nexus/serverNexus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { sovereignQuery } from '@/modules/intelligence';
import type { PermissionRole } from '@/shared/nexus/contracts/permissions.types';
import type { UserStatus } from '@/shared/nexus/contracts/auth.types';
import { toError } from "@/lib/toError";
import {
  UniversalSystemPromptBuilder,
  AssistantActionDispatcher,
  OracleIntentAugmenter,
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
        logger.error('[Oracle] Nexus dégradé — vérification statut employé impossible, accès REFUSÉ par précaution', toError(err).message);
        return false; // fail-closed : erreur Nexus = accès bloqué (defense-in-depth)
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

    // P1-B (audit sécurité API 2026-08-31) : rate-limit anti-flood LLM.
    // 60 req/min/utilisateur — protège la facture Gemini/Claude d'un
    // employé authentifié qui aurait un script en boucle.
    const rl = await getRateLimiter().check(`oracle:${caller.tenantId}:${caller.uid}`, 60, 60_000);
    if (!rl.allowed) {
        return NextResponse.json({ error: 'Trop de requêtes — réessayez dans 1 min.' }, { status: 429 });
    }

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

        // ── 3. Détection d'intentions multi-verticales & données opérationnelles ──
        const { operationalData: operationalDataAugmentation, suggestedActions } = OracleIntentAugmenter.augment(
            sanitizedPrompt,
            variant,
            roleLevel
        );

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
