import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';
import { LLMManager } from '@/lib/ai/LLMManager';
import { AI_MODELS } from '@/lib/ai/types';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { initFirebaseAdmin } from '@/lib/firebase-admin-init';
import { sovereignQuery } from '@/lib/rag/SovereignRAGClient';
import type { PermissionRole } from '@/shared/nexus/contracts/permissions.types';
import type { UserStatus } from '@/shared/nexus/contracts/auth.types';

// Statuts bloquant l'accès RAG — JWT valide ne suffit pas.
const BLOCKED_STATUSES: UserStatus[] = ['suspended', 'inactive', 'on_leave', 'RESTRICTED'];

async function isEmployeeActive(tenantId: string, uid: string): Promise<boolean> {
    try {
        initFirebaseAdmin();
        const doc = await getFirestore().doc(`tenants/${tenantId}/users/${uid}`).get();
        if (!doc.exists) return true; // pas dans Nexus = fleet admin ou service account → ok
        const status = doc.data()?.status as UserStatus | undefined;
        if (!status) return true; // champ absent → on ne bloque pas (compat legacy)
        return !BLOCKED_STATUSES.includes(status);
    } catch (err) {
        logger.warn('[Oracle] Impossible de vérifier le statut employé, accès accordé par défaut', String(err));
        return true; // fail-open : on ne bloque pas sur erreur Nexus
    }
}

const VALID_ROLES: PermissionRole[] = [
    'super_admin', 'directeur', 'manager', 'comptable', 'chef_rang',
    'serveur', 'chef_cuisinier', 'cuisinier', 'barman', 'hotesse', 'plongeur',
];

function normalizeRole(raw: string | undefined): PermissionRole {
    if (raw && (VALID_ROLES as string[]).includes(raw)) return raw as PermissionRole;
    return 'serveur'; // fallback safe : accès minimum
}

export async function POST(req: NextRequest) {
    // Tous les employés authentifiés peuvent poser des questions.
    // Le RBAC granulaire est délégué au Sovereign RAG (veto membrane par rôle).
    const caller = await requireTenantUser(req);
    if (isDenied(caller)) return caller;

    // Cas 1 — Employé suspendu/inactif : JWT valide mais accès révoqué dans Nexus.
    const active = await isEmployeeActive(caller.tenantId, caller.uid);
    if (!active) {
        logger.warn(`[Oracle] Accès RAG bloqué — employé non-actif`, { uid: caller.uid, tenantId: caller.tenantId });
        return new NextResponse(null, { status: 404 });
    }

    try {
        const body = await req.json();
        const { prompt, context, history } = body as {
            prompt?: string;
            context?: Record<string, unknown>;
            history?: Array<{ role: string; content: string }>;
        };

        if (!prompt) {
            return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
        }

        const role = normalizeRole(caller.role);

        // 1. Chercher le contexte dans Sovereign RAG (filtré par rôle)
        let ragContext = '';
        try {
            const ragResult = await sovereignQuery(prompt, {
                workspaceId: caller.tenantId,
                role,
                userId: caller.uid,
            });
            if (!ragResult.vetoed && ragResult.answer) {
                ragContext = ragResult.answer;
            }
        } catch (ragErr) {
            // RAG indisponible → on continue sans contexte
            logger.warn('[Oracle] Sovereign RAG unavailable, continuing without context', String(ragErr));
        }

        // 2. Générer la réponse avec Gemini + contexte RAG
        const systemPrompt = buildSystemPrompt(role, ragContext);

        const response = await LLMManager.provider.generateText({
            model: AI_MODELS.fast,
            systemPrompt,
            userPrompt: context
                ? `Context applicatif: ${JSON.stringify(context)}\n\nQuestion: ${prompt}`
                : prompt,
            history,
        });

        return NextResponse.json({
            content: response.text,
            usage: response.usage,
            ragUsed: !!ragContext,
        });
    } catch (error: unknown) {
        logger.error('[Oracle API] Error', error);
        const msg = error instanceof Error ? error.message : 'Internal error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

function buildSystemPrompt(role: PermissionRole, ragContext: string): string {
    const roleInstructions: Record<PermissionRole, string> = {
        super_admin:    'Tu as accès à toutes les informations du système.',
        directeur:      'Tu as accès à toutes les informations du restaurant.',
        manager:        'Tu as accès aux données opérationnelles, RH et financières.',
        comptable:      'Tu peux répondre sur la finance, les factures et les fournisseurs.',
        chef_rang:      'Tu peux répondre sur le service, les réservations et l\'équipe de salle.',
        chef_cuisinier: 'Tu peux répondre sur les recettes, les coûts matières et la cuisine.',
        serveur:        'Tu peux répondre sur le menu, les allergènes et les promotions.',
        cuisinier:      'Tu peux répondre sur les recettes, les allergènes et les fiches techniques.',
        barman:         'Tu peux répondre sur la carte bar, les cocktails et le stock bar.',
        hotesse:        'Tu peux répondre sur le menu et le plan de salle.',
        plongeur:       'Tu peux répondre sur les tâches de nettoyage et le planning.',
    };

    const lines = [
        'Tu es NEXUS, l\'assistant IA du Restaurant OS. Réponds toujours dans la langue de l\'utilisateur.',
        `Rôle de l'utilisateur : ${role}. ${roleInstructions[role]}`,
        'Ne révèle jamais d\'informations qui dépassent les droits de l\'utilisateur.',
    ];

    if (ragContext) {
        lines.push('', 'Contexte issu de la base de connaissances du restaurant :', ragContext);
    }

    return lines.join('\n');
}
