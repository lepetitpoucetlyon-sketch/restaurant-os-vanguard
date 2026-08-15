import { describe, it, expect } from 'vitest';
import {
  deriveBaselineStudy,
  runSectorStudy,
  extractJson,
  buildStudyPrompt,
  type StudyLLM,
} from '@/verticals/_shared/sector-study';

describe('SectorStudyAgent — baseline déterministe', () => {
  const baseline = deriveBaselineStudy({ slug: 'salon', profileId: 'B' });

  it('produit une substance non vide dérivée du profil', () => {
    expect(baseline.vertical).toBe('salon');
    expect(baseline.businessRules.length).toBeGreaterThan(0); // profile.specifics
    expect(baseline.regulations.some(r => r.legalAddendum === 'SALON')).toBe(true);
    expect(baseline.hardware.some(h => h.kind === 'receipt_printer')).toBe(true); // mod_pos
    expect(baseline.confidence).toBe(0.5);
  });

  it('porte les infos de sous-variante', () => {
    const sv = deriveBaselineStudy({
      slug: 'restaurant',
      profileId: 'A',
      subVariant: { slug: 'gastronomique', label: 'Gastronomique', description: 'Service à table étoilé, cave.' },
    });
    expect(sv.subVariant).toBe('gastronomique');
    expect(sv.variantDifferentiators).toContain('Service à table étoilé, cave.');
  });
});

describe('SectorStudyAgent — enrichissement LLM (agnostique)', () => {
  it('sans LLM → retourne la baseline', async () => {
    const study = await runSectorStudy({ slug: 'salon', profileId: 'B' });
    expect(study.confidence).toBe(0.5);
  });

  it('avec LLM valide → fusionne (summary + confidence du LLM)', async () => {
    const fakeLLM: StudyLLM = async () => JSON.stringify({
      summary: 'Étude enrichie du secteur salon.',
      integrations: ['Planity', 'Treatwell'],
      confidence: 0.9,
    });
    const study = await runSectorStudy({ slug: 'salon', profileId: 'B' }, fakeLLM);
    expect(study.summary).toBe('Étude enrichie du secteur salon.');
    expect(study.integrations).toContain('Planity');
    expect(study.confidence).toBe(0.9);
    // les champs non fournis retombent sur la baseline
    expect(study.regulations.some(r => r.legalAddendum === 'SALON')).toBe(true);
  });

  it('avec LLM cassé (JSON invalide) → fallback baseline, confiance plafonnée', async () => {
    const brokenLLM: StudyLLM = async () => 'désolé, je ne peux pas répondre en JSON';
    const study = await runSectorStudy({ slug: 'salon', profileId: 'B' }, brokenLLM);
    expect(study.confidence).toBeLessThanOrEqual(0.5);
    expect(study.businessRules.length).toBeGreaterThan(0);
  });

  it('extractJson tolère les fences markdown', () => {
    const parsed = extractJson('```json\n{"a":1}\n```') as { a: number };
    expect(parsed.a).toBe(1);
  });

  it('le prompt cible explicitement la sous-variante', () => {
    const { user } = buildStudyPrompt({
      slug: 'restaurant', profileId: 'A',
      subVariant: { slug: 'brunch', label: 'Brunch' },
    });
    expect(user).toContain('SOUS-VARIANTE');
    expect(user).toContain('Brunch');
  });
});
