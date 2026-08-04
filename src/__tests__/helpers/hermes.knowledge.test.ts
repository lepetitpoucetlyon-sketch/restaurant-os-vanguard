import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockSovereignHealth, mockSovereignQuery, mockSovereignIngest } = vi.hoisted(() => ({
  mockSovereignHealth: vi.fn(),
  mockSovereignQuery:  vi.fn(),
  mockSovereignIngest: vi.fn(),
}));

vi.mock('@/modules/intelligence/knowledge/rag/SovereignRAGClient', () => ({
  sovereignHealth: mockSovereignHealth,
  sovereignQuery:  mockSovereignQuery,
  sovereignIngest: mockSovereignIngest,
}));

vi.mock('@/modules/intelligence/knowledge/rag/PulseSanitizer', () => ({
  PulseSanitizer: class {
    sanitize(p: unknown) { return p; }
    send() {}
  },
}));

vi.mock('@/shared/nexus/telemetry/NexusTelemetryService', () => ({
  NexusTelemetryService: { emit: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ─── Import après mocks ───────────────────────────────────────────────────────

import { HermesKnowledgeManager } from '@/modules/intelligence/knowledge/rag/HermesKnowledgeManager';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HermesKnowledgeManager', () => {
  let hermes: HermesKnowledgeManager;

  beforeEach(() => {
    vi.clearAllMocks();
    hermes = new HermesKnowledgeManager('tenant-test', { restaurantName: 'Le Voltaire', country: 'FR' } as never);
  });

  // ── isReady / getHealth ──────────────────────────────────────────────────────

  describe('isReady()', () => {
    it('retourne true si Sovereign RAG est online', async () => {
      mockSovereignHealth.mockResolvedValueOnce({ status: 'online' });
      expect(await hermes.isReady()).toBe(true);
    });

    it('retourne false si Sovereign RAG est offline', async () => {
      mockSovereignHealth.mockResolvedValueOnce({ status: 'offline' });
      expect(await hermes.isReady()).toBe(false);
    });

    it('propage l\'erreur si sovereignHealth rejette', async () => {
      mockSovereignHealth.mockRejectedValueOnce(new Error('connection refused'));
      await expect(hermes.isReady()).rejects.toThrow('connection refused');
    });
  });

  describe('getHealth()', () => {
    it('délègue à sovereignHealth et retourne le résultat brut', async () => {
      const health = { status: 'online', documentCount: 42, version: '1.2.3' };
      mockSovereignHealth.mockResolvedValueOnce(health);
      expect(await hermes.getHealth()).toEqual(health);
    });
  });

  // ── query ────────────────────────────────────────────────────────────────────

  describe('query()', () => {
    it('délègue à sovereignQuery et retourne la réponse structurée', async () => {
      mockSovereignQuery.mockResolvedValueOnce({
        answer: 'Utiliser 200g de farine par portion.',
        sources: [{ title: 'Recette Pain', snippet: '…' }],
        latencyMs: 340,
      });

      const result = await hermes.query(
        { question: 'Quelle quantité de farine pour la brioche ?' },
        'chef_cuisinier'
      );

      expect(result.answer).toContain('farine');
      expect(result.sources).toContain('Recette Pain');
      expect(mockSovereignQuery).toHaveBeenCalledWith(
        'Quelle quantité de farine pour la brioche ?',
        expect.objectContaining({ workspaceId: 'tenant-test', role: 'chef_cuisinier' })
      );
    });

    it('retourne un message de fallback si sovereignQuery lève une erreur', async () => {
      mockSovereignQuery.mockRejectedValueOnce(new Error('timeout'));

      const result = await hermes.query({ question: 'Question quelconque' }, 'serveur');

      expect(result.answer).toContain('temporairement indisponible');
      expect(result.confidence).toBe(0);
    });
  });

  // ── indexCollection ──────────────────────────────────────────────────────────

  describe('indexCollection()', () => {
    it('indexe chaque document et retourne le compteur', async () => {
      mockSovereignIngest.mockResolvedValue({ jobId: 'job-1', status: 'queued' });

      const docs = [
        { id: 'prod-1', name: 'Brioche', description: 'Brioche au beurre' },
        { id: 'prod-2', name: 'Croissant', description: 'Croissant feuilleté' },
      ];

      const result = await hermes.indexCollection('product', docs);

      expect(result.indexed).toBe(2);
      expect(result.failed).toBe(0);
      expect(mockSovereignIngest).toHaveBeenCalledTimes(2);
    });

    it('retourne failed=0 et n\'appelle pas sovereignIngest si tableau vide', async () => {
      const result = await hermes.indexCollection('recipe', []);
      expect(result.indexed).toBe(0);
      expect(result.failed).toBe(0);
      expect(mockSovereignIngest).not.toHaveBeenCalled();
    });

    it('incrémente failed si sovereignIngest rejette sur un document', async () => {
      mockSovereignIngest
        .mockResolvedValueOnce({ jobId: 'job-ok', status: 'queued' })
        .mockRejectedValueOnce(new Error('Blob upload failed'));

      const docs = [
        { id: 'prod-1', name: 'Tartine', description: 'Tartine grillée' },
        { id: 'prod-2', name: 'Café', description: 'Café expresso' },
      ];

      const result = await hermes.indexCollection('product', docs);

      expect(result.indexed).toBe(1);
      expect(result.failed).toBe(1);
    });
  });
});
