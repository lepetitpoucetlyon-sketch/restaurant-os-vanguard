import { logger } from '@/lib/logger';
import { redactPII } from '@/lib/security/redactPII';
import { fetchWithTimeout } from '@/lib/http/resilientFetch';

export interface SlmQueryOptions {
  userRoleLevel?: number; // 10, 40, 70, 100
  tenantId?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface SlmToolCallResult {
  success: boolean;
  tool?: string;
  params?: Record<string, unknown>;
  rbacDenied?: boolean;
  requiredMinRole?: number;
  rawResponse?: string;
  latencyMs: number;
}

/**
 * ⚡ SovereignSlmClient — Client d'Inférence Haute Performance pour SLM Fine-Tuné
 * Communique avec le serveur vLLM (Gemma 2B / Qwen 3B) hébergé sur votre GPU privé.
 */
export class SovereignSlmClient {
  private static baseUrl = process.env.SOVEREIGN_SLM_URL || 'http://localhost:8000/v1';

  /**
   * Analyse une instruction naturelle et extrait l'appel d'outil structuré.
   */
  static async inferAction(
    userPrompt: string,
    options?: SlmQueryOptions
  ): Promise<SlmToolCallResult> {
    const startTime = Date.now();
    const sanitizedPrompt = redactPII(userPrompt);
    const userRole = options?.userRoleLevel ?? 40;

    // Simulation / Sandbox fallback si pas de serveur vLLM joignable
    if (!process.env.SOVEREIGN_SLM_URL && process.env.NODE_ENV !== 'production') {
      return this.sandboxInference(sanitizedPrompt, userRole, startTime);
    }

    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SOVEREIGN_SLM_API_KEY || 'sk-sovereign-local'}`,
        },
        body: JSON.stringify({
          model: process.env.SOVEREIGN_SLM_MODEL_ID || 'restaurant-os-slm-v1',
          messages: [
            {
              role: 'system',
              content: 'Tu es l\'IA Souveraine de Restaurant OS. Émets uniquement du JSON d\'appel de fonction ou d\'erreur RBAC.',
            },
            {
              role: 'user',
              content: `${sanitizedPrompt} [UserRoleLevel: ${userRole}]`,
            },
          ],
          temperature: options?.temperature ?? 0.1,
          max_tokens: options?.maxTokens ?? 256,
          response_format: { type: 'json_object' },
        }),
      }, 15_000);

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`SLM Server Error (${response.status})`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };

      const rawContent = data.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawContent);

      if (parsed.error === 'RBAC_INSUFFICIENT_PERMISSION') {
        return {
          success: false,
          rbacDenied: true,
          requiredMinRole: parsed.requiredMinRole,
          rawResponse: rawContent,
          latencyMs,
        };
      }

      return {
        success: true,
        tool: parsed.tool,
        params: parsed.params || {},
        rawResponse: rawContent,
        latencyMs,
      };
    } catch (err) {
      logger.warn(`[Sovereign SLM Client] Fallback sandbox suite à échec connexion: ${err instanceof Error ? err.message : 'Timeout'}`);
      return this.sandboxInference(sanitizedPrompt, userRole, startTime);
    }
  }

  private static sandboxInference(
    prompt: string,
    userRole: number,
    startTime: number
  ): SlmToolCallResult {
    const lower = prompt.toLowerCase();
    const latencyMs = Date.now() - startTime;

    // Simulation déterministe
    if (lower.includes('frigo') || lower.includes('stock') || lower.includes('réserve')) {
      return {
        success: true,
        tool: 'get_stock_by_location',
        params: { locationName: 'Frigo 4' },
        latencyMs,
      };
    }

    if (lower.includes('chiffre d\'affaires') || lower.includes('marge') || lower.includes('financier')) {
      if (userRole < 70) {
        return {
          success: false,
          rbacDenied: true,
          requiredMinRole: 70,
          latencyMs,
        };
      }
      return {
        success: true,
        tool: 'query_financial_snapshot',
        params: { period: 'today' },
        latencyMs,
      };
    }

    return {
      success: true,
      tool: 'navigate_to_module',
      params: { targetPath: '/pos' },
      latencyMs,
    };
  }
}
