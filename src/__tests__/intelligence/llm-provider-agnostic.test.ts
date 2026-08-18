import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    createLLMProvider,
    resolveModelId,
    detectProvider,
    AI_MODELS,
    AIProviderRouter,
    SovereignProvider,
    MistralProvider,
    OpenAIProvider,
    AnthropicProvider,
    GeminiProvider,
} from '@/modules/intelligence/ia/ai';

describe('🏛️ LLM Agnostic Architecture & Multi-Provider Suite', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = { ...originalEnv };
        vi.restoreAllMocks();
    });

    it('devrait résoudre correctement les alias de modèle sémantiques pour chaque provider', () => {
        expect(resolveModelId('fast', 'gemini')).toBe('gemini-1.5-flash');
        expect(resolveModelId('reasoning', 'anthropic')).toBe('claude-sonnet-4-6');
        expect(resolveModelId('fast', 'openai')).toBe('gpt-4o-mini');
        expect(resolveModelId('fast', 'mistral')).toBe('mistral-small-latest');
        expect(resolveModelId('fast', 'sovereign')).toBe('restaurant-os-slm-v1');
        expect(resolveModelId('fast', 'ollama')).toBe('qwen2.5:3b');
    });

    it('devrait détecter automatiquement le provider en fonction des clés d\'environnement', () => {
        delete process.env.AI_PROVIDER;
        delete process.env.SOVEREIGN_SLM_URL;
        delete process.env.VLLM_BASE_URL;
        delete process.env.GEMINI_API_KEY;
        delete process.env.GOOGLE_GEMINI_API_KEY;
        delete process.env.ANTHROPIC_API_KEY;
        delete process.env.OPENAI_API_KEY;
        delete process.env.MISTRAL_API_KEY;

        process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
        expect(detectProvider()).toBe('anthropic');

        process.env.OPENAI_API_KEY = 'sk-openai-test';
        delete process.env.ANTHROPIC_API_KEY;
        expect(detectProvider()).toBe('openai');

        process.env.MISTRAL_API_KEY = 'mistral-test';
        delete process.env.OPENAI_API_KEY;
        expect(detectProvider()).toBe('mistral');

        process.env.SOVEREIGN_SLM_URL = 'http://localhost:8000/v1';
        expect(detectProvider()).toBe('sovereign');
    });

    it('devrait instancier le bon provider avec createLLMProvider()', () => {
        expect(createLLMProvider('sovereign')).toBeInstanceOf(SovereignProvider);
        expect(createLLMProvider('mistral')).toBeInstanceOf(MistralProvider);
        expect(createLLMProvider('openai')).toBeInstanceOf(OpenAIProvider);
        expect(createLLMProvider('anthropic')).toBeInstanceOf(AnthropicProvider);
        expect(createLLMProvider('gemini')).toBeInstanceOf(GeminiProvider);
    });

    it('SovereignProvider devrait assainir les données PII avant envoi au vLLM', async () => {
        const provider = new SovereignProvider('http://127.0.0.1:8000/v1', 'test-token');
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [{ message: { content: '{"status":"ok"}' } }],
            }),
        });
        global.fetch = mockFetch;

        const res = await provider.generateText({
            model: 'restaurant-os-slm-v1',
            userPrompt: 'Client Jean Dupont avec carte 4970 1234 5678 9012 au 06 12 34 56 78',
        });

        expect(res.text).toBe('{"status":"ok"}');
        expect(mockFetch).toHaveBeenCalled();
        const bodySent = JSON.parse(mockFetch.mock.calls[0][1].body);
        const promptSent = bodySent.messages[0].content;
        expect(promptSent).not.toContain('4970 1234 5678 9012');
        expect(promptSent).not.toContain('06 12 34 56 78');
        expect(promptSent).toContain('****-****-****-9012');
        expect(promptSent).toContain('06 ** ** ** 78');
    });

    it('AIProviderRouter devrait basculer vers le provider suivant en cas d\'échec', async () => {
        process.env.SOVEREIGN_SLM_URL = 'http://localhost:8000/v1';
        process.env.ANTHROPIC_API_KEY = 'test-key';

        const mockFetch = vi.fn()
            .mockRejectedValueOnce(new Error('vLLM Server unreachable'))
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    content: [{ type: 'text', text: 'Réponse Claude Fallback' }],
                }),
            });
        global.fetch = mockFetch;

        const router = new AIProviderRouter();
        const response = await router.generateText('Bonjour', 'tenant-demo');

        expect(response.text).toBe('Réponse Claude Fallback');
        expect(response.provider).toBe('anthropic');
        expect(response.fallback).toBe(true);
    });
});
