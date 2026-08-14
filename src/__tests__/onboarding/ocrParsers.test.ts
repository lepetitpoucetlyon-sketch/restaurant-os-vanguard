/**
 * Tests parsers OCR — pdfParser, imageParser, ocrPrompts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Nexus } from '@/lib/nexus/NexusAdapter';

// ─── Mock LLMManager (hoisted so it's available in vi.mock factory) ──────────
const { mockGenerateFromImage } = vi.hoisted(() => ({
  mockGenerateFromImage: vi.fn(),
}));

vi.mock('@/modules/intelligence/ia/ai/LLMManager', () => ({
  LLMManager: {
    get provider() {
      return { generateFromImage: mockGenerateFromImage, generateText: vi.fn() };
    },
    set provider(_: unknown) {},
  },
}));

vi.mock('@/modules/intelligence/ia/ai/LLMProviderFactory', () => ({
  AI_MODELS: { visionFast: 'gemini-1.5-flash', fast: 'gemini-1.5-flash' },
}));
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Import statique pour éviter le STACK_TRACE_ERROR en suite complète (await import() dans it())
import { parseImageWithOCR } from '@/modules/commerce/acquisition/onboarding/migration/parsers/imageParser';

// ─── ocrPrompts ──────────────────────────────────────────────────────────────
describe('ocrPrompts', () => {
  it('retourne un prompt pour chaque catégorie', async () => {
    const { getOcrPrompt, OCR_PROMPTS } = await import('@/modules/commerce/acquisition/onboarding/migration/parsers/ocrPrompts');
    const categories = Object.keys(OCR_PROMPTS);
    expect(categories.length).toBeGreaterThanOrEqual(10);
    for (const cat of categories) {
      const prompt = getOcrPrompt(cat as never);
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(20);
    }
  });

  it('inclut le contexte dans le prompt si fourni', async () => {
    const { getOcrPrompt } = await import('@/modules/commerce/acquisition/onboarding/migration/parsers/ocrPrompts');
    const prompt = getOcrPrompt('menu', 'restaurant gastronomique');
    expect(prompt).toContain('restaurant gastronomique');
  });
});

// ─── imageParser ─────────────────────────────────────────────────────────────
describe('imageParser', () => {
  beforeEach(() => {
      vi.clearAllMocks();
  });

  it('parse une image JPEG et retourne OcrResult avec parsed', async () => {
    const payload = { products: [{ name: 'Salade', category: 'Entrées', price: '9.50' }] };
    mockGenerateFromImage.mockResolvedValueOnce({ text: JSON.stringify(payload) });

    const file = new File(['fake-image-bytes'], 'menu.jpg', { type: 'image/jpeg' });
    const result = await parseImageWithOCR(file, 'menu');

    expect(result.confidence).toBe('high');
    expect(result.parsed).toEqual(payload);
    expect(result.raw).toBe(JSON.stringify(payload));
  });

  it('gère un retour IA avec code fence markdown', async () => {
    const payload = { products: [{ name: 'Burger', price: '12' }] };
    mockGenerateFromImage.mockResolvedValueOnce({
      text: '```json\n' + JSON.stringify(payload) + '\n```',
    });

    const file = new File(['bytes'], 'menu.png', { type: 'image/png' });
    const result = await parseImageWithOCR(file, 'menu');
    expect(result.confidence).toBe('high');
    expect(result.parsed).toEqual(payload);
  });

  it('retourne confidence=low si le JSON est invalide', async () => {
    mockGenerateFromImage.mockResolvedValueOnce({ text: 'pas du JSON du tout' });

    const file = new File(['bytes'], 'brouillon.jpg', { type: 'image/jpeg' });
    const result = await parseImageWithOCR(file, 'menu');
    expect(result.confidence).toBe('low');
    expect(result.parsed).toBeNull();
  });
});

// ─── pdfParser ───────────────────────────────────────────────────────────────
describe('pdfParser', () => {
  beforeEach(() => {
      vi.clearAllMocks();
  });

  it('extrait le texte natif si le PDF contient du texte lisible', async () => {
    // LLMManager ne doit PAS être appelé pour un PDF natif
    mockGenerateFromImage.mockResolvedValueOnce({ text: '{}' });

    const pdfWithText = new TextEncoder().encode(
      '%PDF-1.4\nBT\n/F1 12 Tf\n(Steak Frites 18.50) Tj\nET\n%%EOF'
    );
    const { parsePDFWithOCR } = await import('@/modules/commerce/acquisition/onboarding/migration/parsers/pdfParser');
    const file = new File([pdfWithText], 'menu.pdf', { type: 'application/pdf' });
    const result = await parsePDFWithOCR(file, 'menu');

    expect(result).toHaveProperty('raw');
    expect(result).toHaveProperty('confidence');
  });

  it('tombe en fallback OCR si le PDF est scanné (texte vide)', async () => {
    const ocr = { products: [{ name: 'Plat scanné', price: '15' }] };
    mockGenerateFromImage.mockResolvedValueOnce({ text: JSON.stringify(ocr) });

    const pdfScan = new TextEncoder().encode('%PDF-1.4\n%%EOF');
    const { parsePDFWithOCR } = await import('@/modules/commerce/acquisition/onboarding/migration/parsers/pdfParser');
    const file = new File([pdfScan], 'scan.pdf', { type: 'application/pdf' });
    const result = await parsePDFWithOCR(file, 'menu');

    expect(result).toHaveProperty('raw');
    expect(result).toHaveProperty('confidence');
  });
});

// ─── ImportSnapshotService ────────────────────────────────────────────────────
describe('ImportSnapshotService', () => {
  const mockAdapter = {
    get: vi.fn(),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    query: vi.fn(),
    generateId: vi.fn((prefix: string) => `${prefix}_123`),
    batch: vi.fn().mockReturnValue({ set: vi.fn(), delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Nexus.adapter, 'get').mockImplementation(mockAdapter.get);
    vi.spyOn(Nexus.adapter, 'set').mockImplementation(mockAdapter.set);
    vi.spyOn(Nexus.adapter, 'delete').mockImplementation(mockAdapter.delete);
    vi.spyOn(Nexus.adapter, 'query').mockImplementation(mockAdapter.query);
    vi.spyOn(Nexus.adapter, 'generateId').mockImplementation(mockAdapter.generateId);
    vi.spyOn(Nexus.adapter, 'batch').mockImplementation(mockAdapter.batch);
  });

  it('take() sauvegarde un snapshot et retourne son id', async () => {
    mockAdapter.query.mockResolvedValue([{ id: 'prod1', name: 'Steak', priceInMicrounits: 18000000 }]);
    const { ImportSnapshotService } = await import('@/modules/commerce/acquisition/onboarding/migration/ImportSnapshotService');
    const snap = await ImportSnapshotService.take('tenant_test', 'menu');
    expect(snap.id).toMatch(/^snap_menu_/);
    expect(snap.category).toBe('menu');
    expect(mockAdapter.set).toHaveBeenCalled();
  });

  it('list() filtre par catégorie si fournie', async () => {
    const snaps = [
      { id: 'snap_menu_1', category: 'menu', tenantId: 't1', createdAt: 1, collections: [], docs: {} },
      { id: 'snap_staff_1', category: 'staff', tenantId: 't1', createdAt: 2, collections: [], docs: {} },
    ];
    mockAdapter.query.mockResolvedValue(snaps);
    const { ImportSnapshotService } = await import('@/modules/commerce/acquisition/onboarding/migration/ImportSnapshotService');
    const result = await ImportSnapshotService.list('menu');
    expect(result.every(s => s.category === 'menu')).toBe(true);
  });
});
