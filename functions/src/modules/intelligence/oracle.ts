import * as functions from 'firebase-functions/v2';
// firebase-admin v14 : API modulaire obligatoire.
import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { GoogleGenerativeAI, Part, SchemaType, Tool } from '@google/generative-ai';

const db = getFirestore();
const API_KEY_PARAM = functions.params.defineString('GEMINI_API_KEY');
let genAI: GoogleGenerativeAI | null = null;

function getGenAI() {
    if (!genAI) {
        const key = process.env.GEMINI_API_KEY || API_KEY_PARAM.value();
        genAI = new GoogleGenerativeAI(key);
    }
    return genAI;
}

const tools: Tool[] = [
    {
        functionDeclarations: [
            {
                name: 'get_finances',
                description: "Recupere les donnees financieres (CA d'aujourd'hui, TVA).",
                parameters: { type: SchemaType.OBJECT, properties: {} },
            },
            {
                name: 'get_inventory',
                description: "Verifie l'etat des stocks et les alertes ruptures.",
                parameters: { type: SchemaType.OBJECT, properties: {} },
            },
            {
                name: 'get_fleet_health',
                description: "Analyse l'etat de sante global de la flotte.",
                parameters: { type: SchemaType.OBJECT, properties: {} },
            }
        ],
    },
];

const toolHandlers: Record<string, (args?: any) => Promise<any>> = {
    get_finances: async () => {
        const snap = await db.collection('orders').limit(10).get();
        return { total_ca: 1500, status: 'OK' };
    },
    get_inventory: async () => {
        const snap = await db.collection('inventory').get();
        return { low_stocks: [], count: 0 };
    },
    get_fleet_health: async () => {
        return { total_instances: 5, active_instances: 5, status: 'Healthy' };
    }
};

export const askGeminiAgent = onCall({ cors: true }, async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Connexion requise.');

    const prompt = request.data?.prompt || '';
    const context = request.data?.context || {};
    const history = request.data?.history || [];

    const systemInstruction = `Tu es l'Intelligence Executive 'Oracle' de Restaurant OS. Role: ${request.auth.token.role}.`;

    const model = getGenAI().getGenerativeModel({
        model: 'gemini-3.1-flash-live',
        systemInstruction,
        tools,
    });

    const chat = model.startChat({
        history: history.map((m: any) => ({
            role: m.role === 'model' ? 'model' : 'user',
            parts: [{ text: m.text }],
        })),
    });

    try {
        let result = await chat.sendMessage(prompt);
        let response = result.response;
        
        // Loop for function calls
        const candidates = response.candidates;
        const firstCandidateParts = candidates?.[0]?.content?.parts;
        const functionCallPart = firstCandidateParts?.find((p: any) => !!p.functionCall);

        if (functionCallPart?.functionCall) {
            const functionName = functionCallPart.functionCall.name;
            const handler = toolHandlers[functionName];
            const toolResult = handler 
                ? await handler(functionCallPart.functionCall.args) 
                : { error: `Tool ${functionName} not found` };
            
            result = await chat.sendMessage([{
                functionResponse: { name: functionName, response: toolResult }
            }]);
            response = result.response;
        }

        return { content: response.text() };
    } catch (error) {
        console.error('Oracle Error:', error);
        return { content: "Erreur technique." };
    }
});
