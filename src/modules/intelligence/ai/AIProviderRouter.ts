/**
 * AI Provider Router — ai-fallback-1
 *
 * Route les appels IA vers Gemini en priorité, avec fallback automatique sur Claude.
 * Si Gemini retourne une erreur (429, 500, timeout), bascule sur Claude Haiku.
 *
 * Usage:
 *   const router = new AIProviderRouter();
 *   const result = await router.generateText(prompt, tenantId);
 *
 * Variables d'env :
 *   GOOGLE_GEMINI_API_KEY — Gemini 1.5 Flash (provider primaire)
 *   ANTHROPIC_API_KEY     — Claude Haiku 4.5 (fallback)
 */
import { logger } from '@/lib/logger';

export interface AIResponse {
  text:     string;
  provider: 'gemini' | 'claude';
  model:    string;
  fallback: boolean;
}

export interface AIProviderOptions {
  maxTokens?: number;
  temperature?: number;
}

export class AIProviderRouter {
  private readonly geminiKey    = process.env.GOOGLE_GEMINI_API_KEY;
  private readonly anthropicKey = process.env.ANTHROPIC_API_KEY;

  async generateText(
    prompt: string,
    tenantId: string,
    opts: AIProviderOptions = {},
  ): Promise<AIResponse> {
    if (this.geminiKey) {
      try {
        return await this.callGemini(prompt, opts);
      } catch (err) {
        logger.warn(`[AIRouter] Gemini indisponible (${String(err).slice(0, 80)}) — fallback Claude`);
      }
    }

    if (this.anthropicKey) {
      return await this.callClaude(prompt, opts);
    }

    logger.error(`[AIRouter] Aucun provider IA disponible pour tenant ${tenantId}`);
    throw new Error('Aucun provider IA configuré (GOOGLE_GEMINI_API_KEY ou ANTHROPIC_API_KEY requis)');
  }

  private async callGemini(prompt: string, opts: AIProviderOptions): Promise<AIResponse> {
    const model = 'gemini-1.5-flash';
    const res   = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiKey}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents:         [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: opts.maxTokens ?? 512,
            temperature:     opts.temperature ?? 0.7,
          },
        }),
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);

    const data  = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text  = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return { text, provider: 'gemini', model, fallback: false };
  }

  private async callClaude(prompt: string, opts: AIProviderOptions): Promise<AIResponse> {
    const model = 'claude-haiku-4-5-20251001';
    const res   = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         this.anthropicKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: opts.maxTokens ?? 512,
        messages:   [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) throw new Error(`Claude HTTP ${res.status}`);

    const data = await res.json() as { content?: Array<{ text?: string }> };
    const text = data.content?.[0]?.text ?? '';
    return { text, provider: 'claude', model, fallback: true };
  }
}

export const aiRouter = new AIProviderRouter();
