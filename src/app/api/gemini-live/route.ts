import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { getRateLimiter } from '@/infrastructure/services/rate-limiter';

/**
 * POST /api/gemini-live
 * Session init pour useGeminiLive — retourne la config système (instruction + tools)
 * que GeminiLiveService injecte lors du connect() WebRTC.
 * Guard : admin/manager du tenant.
 */
export async function POST(req: NextRequest) {
    const caller = await requireTenantAdmin(req);
    if (isDenied(caller)) return caller;

    // P1-B (audit sécurité API 2026-08-31) : rate-limit sessions Gemini Live.
    // 10 sessions/heure/utilisateur — protège la facture WebRTC LLM.
    const rl = await getRateLimiter().check(`gemini-live:${caller.tenantId}:${caller.uid}`, 10, 60 * 60 * 1000);
    if (!rl.allowed) {
        return NextResponse.json({ error: 'Trop de sessions — réessayez dans 1h.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const user = body.user ?? {};
    const role = (user.role as string) ?? 'staff';

    const system_instruction = buildSystemInstruction(role, caller.tenantId);

    return NextResponse.json({
        system_instruction,
        tools: NEXUS_LIVE_TOOLS,
    });
}

function buildSystemInstruction(role: string, tenantId: string): string {
    return [
        `Tu es NEXUS, l'assistant vocal IA de Restaurant OS pour le tenant ${tenantId}.`,
        `Tu réponds exclusivement en français et en anglais selon la langue de l'utilisateur.`,
        `Rôle de l'utilisateur : ${role}.`,
        role === 'admin' || role === 'manager'
            ? `Tu peux accéder à toutes les commandes de gestion (stock, réservations, finances, équipe).`
            : `Tu réponds aux questions opérationnelles courantes (commandes, tables, plats).`,
        `Sois concis, précis, et ne divulgue jamais de données d'autres tenants.`,
    ].join(' ');
}

const NEXUS_LIVE_TOOLS = [
    {
        name: 'get_table_status',
        description: 'Retourne le statut actuel de toutes les tables (occupées, libres, en attente).',
    },
    {
        name: 'get_pending_orders',
        description: 'Liste les commandes en cours par table.',
    },
    {
        name: 'get_stock_alerts',
        description: 'Retourne les articles en stock bas.',
    },
];
