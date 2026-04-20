// @ts-nocheck
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * 🌌 NEXUS ORACLE API (Industrial Grade)
 * Central AI bridge for fleet intelligence and restaurant assistance.
 */

// Local fallback responses for high-availability / no-key mode
const LOCAL_RESPONSES: Record<string, string> = {
    default: "Je suis l'Oracle Nexus. Mon mode cloud est restreint, mais je reste opérationnel en local. Comment puis-je vous aider ?",
    bonjour: "Bonjour ! 👋 Je suis Nexus, votre assistant de gestion unifiée. Comment puis-je vous assister aujourd'hui ?",
    salut: "Salut ! Je suis prêt à optimiser vos opérations. Que souhaitez-vous faire ?",
    aide: "Je peux vous aider avec :\n• 📊 Analyse de la flotte (MCC)\n• 📋 Gestion des stocks et Marketplace\n• 🍳 Fiches techniques et recettes\n• 👥 Planning et RH\n• 🧾 Conformité fiscale NF525",
    stock: "Pour vos stocks, consultez le module Inventaire ou l'onglet Treasury du MCC pour les transferts inter-sites.",
    config: "Vos configurations de DNA sont centralisées dans le Master Command Control.",
};

function getLocalResponse(prompt: string, context: any): string {
    const lower = prompt.toLowerCase().trim();
    
    // Contextual Data Answers
    if (context?.metrics) {
        if (lower.includes('santé') || lower.includes('health')) {
            return `La santé moyenne de votre flotte est de **${Math.round(context.metrics.averageHealth || 0)}%**. Aucun incident critique à signaler.`;
        }
        if (lower.includes('revenu') || lower.includes('mrr') || lower.includes('argent')) {
            return `Le revenu total consolidé de l'empire est de **${Math.round(context.metrics.totalRevenue || 0).toLocaleString()} €**.`;
        }
    }

    // Static Keyword Match
    for (const [key, response] of Object.entries(LOCAL_RESPONSES)) {
        if (key !== 'default' && lower.includes(key)) {
            return response;
        }
    }
    
    return LOCAL_RESPONSES.default;
}

export async function POST(request: Request) {
    try {
        const { prompt, context, history } = await request.json() as { prompt: string; context: Record<string, unknown>; history: { role: string; text: string }[] };
        const apiKey = process.env.GEMINI_API_KEY;

        // --- LOCAL MODE FALLBACK ---
        if (!apiKey || apiKey.startsWith('AIza_INVALID')) {
            console.warn("Nexus Oracle: Cloud connectivity restricted. Falling back to Local Logic.");
            return NextResponse.json({ 
                content: getLocalResponse(prompt, context),
                mode: 'local'
            });
        }

        // --- CLOUD MODE (Gemini 1.5 Flash) ---
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.1-flash-live",
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7,
            }
        });

        // Prepare context for the prompt
        const systemInstruction = `Tu es NEXUS, l'IA de gestion souveraine du Restaurant OS. 
        Tu agis en tant qu'assistant de haut niveau pour restaurateurs et gestionnaires de flotte. 
        Données actuelles de la flotte : ${JSON.stringify(context || {})}.
        Réponds de manière concise, professionnelle et inspirante.`;

        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: systemInstruction }] },
                { role: 'model', parts: [{ text: "Compris. Nexus est prêt. Comment puis-je optimiser l'empire ?" }] },
                ...history.map((m: any) => ({
                    role: m.role === 'model' ? 'model' : 'user',
                    parts: [{ text: m.text }]
                }))
            ]
        });

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ 
            content: text,
            usage: response.usageMetadata,
            mode: 'cloud'
        });

    } catch (error: any) {
        console.error("Nexus Oracle Error:", error.message);
        
        // Final fallback logic to prevent crash
        return NextResponse.json({ 
            content: "Désolé, j'ai rencontré une turbulence dans la matrice. Mode local rétabli.\n\n" + getLocalResponse("default", {}),
            mode: 'fallback'
        });
    }
}
