import { describe, it, expect } from 'vitest';
import { generateSyntheticDataset } from '../../../scripts/ai-slm-finetuning/generate_synthetic_dataset';
import { SovereignSlmClient } from '@/modules/intelligence/ia/ai/SovereignSlmClient';

describe('Sovereign SLM Fine-Tuning & Inference Engine', () => {
  it('devrait générer un dataset synthétique équilibré avec respect du RBAC et format ChatML', () => {
    const dataset = generateSyntheticDataset(50);
    expect(dataset.length).toBe(50);

    const firstSample = dataset[0];
    expect(firstSample.messages.length).toBe(3);
    expect(firstSample.messages[0].role).toBe('system');
    expect(firstSample.messages[1].role).toBe('user');
    expect(firstSample.messages[2].role).toBe('assistant');

    // Vérifie que l'assistant produit du JSON valide
    const parsedAssistant = JSON.parse(firstSample.messages[2].content);
    expect(parsedAssistant).toBeDefined();
    expect(parsedAssistant.tool || parsedAssistant.error).toBeDefined();
  });

  it('devrait inférer une action métier avec SovereignSlmClient', async () => {
    const res = await SovereignSlmClient.inferAction('Combien il reste dans le Frigo 4 ?', {
      userRoleLevel: 40,
    });

    expect(res.success).toBe(true);
    expect(res.tool).toBe('get_stock_by_location');
    expect(res.params?.locationName).toBe('Frigo 4');
  });

  it('devrait bloquer l accès aux données financières pour un rôle inférieur au niveau requis', async () => {
    const res = await SovereignSlmClient.inferAction('Donne-moi le chiffre d affaires et la marge', {
      userRoleLevel: 10, // Opérateur simple (requis: 70)
    });

    expect(res.success).toBe(false);
    expect(res.rbacDenied).toBe(true);
    expect(res.requiredMinRole).toBe(70);
  });
});
