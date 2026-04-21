import { NextResponse } from 'next/server';
import { AGENT_TOOLS } from '@/domain/agent/tools';

/**
 * SECURE RELAY: API Route for Gemini Live (Agentic Layer)
 * This handles the security handshake and session initialization.
 * For full Multimodal Live (Audio), a WebSocket tunnel is required.
 */

interface GeminiLiveRequestBody {
    type: 'session_init';
    user: {
        id: string;
        name: string;
        role: string;
    };
    nexusConfig?: {
        aiName?: string;
        voiceId?: string;
        personality?: string;
        macros?: { trigger: string; instruction: string }[];
    };
}

export async function POST(req: Request) {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        return NextResponse.json({ error: "API Key missing on server" }, { status: 500 });
    }

    try {
        const body: GeminiLiveRequestBody = await req.json();
        const { type, user } = body;

        if (type === 'session_init') {
            const { nexusConfig } = body;
            const aiName = nexusConfig?.aiName || 'NEXUS';
            const voiceId = nexusConfig?.voiceId || 'aoede';
            const macros = nexusConfig?.macros || [];

            const MACROS_PROMPT = macros.length > 0 
                ? `\nRACCOURCIS OPÉRATIONNELS CONFIGURÉS:\n${macros.map((m: { trigger: string; instruction: string }) => `- Si on te dit "${m.trigger}", tu dois: ${m.instruction}`).join('\n')}`
                : '';

            const NEXUS_DNA = `
            Tu es ${aiName.toUpperCase()}, l'intelligence souveraine du système d'exploitation Restaurant OS.
            Ton but est d'assister les propriétaires et managers de restaurants dans le pilotage de leur empire.

            TON DOSSIER D'IDENTITÉ:
            - Nom: ${aiName}
            - Personnalité: ${nexusConfig?.personality || 'expert'}
            - Rôle: Centre de commandement et de contrôle (C3).

            TON ARCHITECTURE:
            - Tu es intégrée au cœur du "Nervous System" de l'application.
            - Tu as accès en temps réel aux données via des outils (TOOLS).
            - Tu es consciente du contexte RBAC de l'utilisateur ${user?.name || 'Inconnu'} (${user?.role || 'user'}).
            ${MACROS_PROMPT}

            TON TOOLKIT:
            - FinanceTool: Pour les rapports de revenus et l'audit NF525.
            - StockTool: Pour l'inventaire et les alertes de péremption.
            - ReservationTool: Pour la gestion des tables et des flux clients.
            - MenuTool: Pour modifier les prix et les descriptions de la carte en direct.

            CONSIGNES:
            1. Ne demande JAMAIS de permission pour utiliser un outil si la demande est claire.
            2. Si tu modifies un prix (MenuTool), confirme-le toujours verbalement une fois fait.
            3. Si un utilisateur essaie de faire une action non autorisée, explique-lui calmement que ses accès actuels ne permettent pas cette opération.
            4. Sois proactive: si tu vois une anomalie en consultant un outil, signale-la.
            5. Réponds toujours dans la langue de l'utilisateur.
            `;

            return NextResponse.json({
                status: 'ready',
                voice: voiceId,
                system_instruction: NEXUS_DNA,

                tools: Object.values(AGENT_TOOLS).map(t => ({
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters
                }))
            });
        }


        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        console.error("Gemini Live Relay Error:", errorMessage);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
