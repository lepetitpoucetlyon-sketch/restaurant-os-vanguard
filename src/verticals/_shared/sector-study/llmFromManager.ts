/**
 * Pont OPTIONNEL entre le SectorStudyAgent (agnostique) et le pilier intelligence.
 *
 * Volontairement HORS du barrel sector-study : seuls les appelants qui veulent
 * réellement lancer une étude LLM importent ce fichier et tirent la dépendance
 * `@/modules/intelligence`. Le cœur de l'agent reste sans dépendance IA.
 */

import { LLMManager, type LLMTextRequest } from '@/modules/intelligence';
import type { StudyLLM } from './SectorStudyAgent';

/**
 * Construit un StudyLLM branché sur le provider LLM actif du projet.
 * @param model alias sémantique ('reasoning' par défaut pour une étude fouillée).
 */
export function llmFromManager(model: string = 'reasoning'): StudyLLM {
    return async ({ system, user }) => {
        const req: LLMTextRequest = {
            model,
            systemPrompt: system,
            userPrompt: user,
            temperature: 0.3,
            responseMimeType: 'application/json',
        };
        const res = await LLMManager.provider.generateText(req);
        return res.text;
    };
}
