import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';

/**
 * POST /api/gemini-live
 * Session init pour useGeminiLive — retourne la config système (instruction + tools)
 * que GeminiLiveService injecte lors du connect() WebRTC.
 * Guard : admin/manager du tenant.
 */
export async function POST(req: NextRequest) {
    const caller = await requireTenantAdmin(req);
    if (isDenied(caller)) return caller;

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
        role === 'proprietaire' || role === 'directeur' || role === 'manager'
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
