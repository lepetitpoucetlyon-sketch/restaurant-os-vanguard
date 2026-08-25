import { describe, it, expect } from 'vitest';
import {
  DEFAULT_RESTAURANT_LEXICON,
  GARAGE_LEXICON,
  SALON_LEXICON,
  CLINIC_LEXICON,
  HOTEL_LEXICON,
  BAKERY_LEXICON,
  RETAIL_LEXICON,
  GYM_LEXICON,
  COWORKING_LEXICON,
  VETERINARY_LEXICON,
  FLORIST_LEXICON,
  CUSTOM_LEXICON,
  IVerticalLexicon
} from '@/shared/plugins/IVerticalLexicon';

describe('IVerticalLexicon — 12 Variants Lexical Sovereignty', () => {
  const allLexicons: [string, IVerticalLexicon][] = [
    ['restaurant', DEFAULT_RESTAURANT_LEXICON],
    ['garage', GARAGE_LEXICON],
    ['salon', SALON_LEXICON],
    ['clinic', CLINIC_LEXICON],
    ['hotel', HOTEL_LEXICON],
    ['bakery', BAKERY_LEXICON],
    ['retail', RETAIL_LEXICON],
    ['gym', GYM_LEXICON],
    ['coworking', COWORKING_LEXICON],
    ['veterinary', VETERINARY_LEXICON],
    ['florist', FLORIST_LEXICON],
    ['custom', CUSTOM_LEXICON],
  ];

  it('devrait avoir exactement 12 lexiques complets et distincts', () => {
    expect(allLexicons).toHaveLength(12);
  });

  it.each(allLexicons)('le lexique %s doit définir tous les 6 champs obligatoires', (_name, lexicon) => {
    expect(lexicon.tableLabel).toBeTruthy();
    expect(lexicon.recipeLabel).toBeTruthy();
    expect(lexicon.staffLabel).toBeTruthy();
    expect(lexicon.ticketLabel).toBeTruthy();
    expect(lexicon.itemLabel).toBeTruthy();
    expect(lexicon.customerLabel).toBeTruthy();
  });

  it('chaque variante non-restaurant doit adapter au moins tableLabel ou customerLabel', () => {
    expect(GARAGE_LEXICON.tableLabel).toBe('Pont Élévateur');
    expect(CLINIC_LEXICON.customerLabel).toBe('Patient');
    expect(GYM_LEXICON.customerLabel).toBe('Adhérent / Membre');
    expect(COWORKING_LEXICON.tableLabel).toBe('Bureau / Salle');
    expect(VETERINARY_LEXICON.tableLabel).toBe('Salle de Soin');
    expect(HOTEL_LEXICON.tableLabel).toBe('Chambre / Suite');
  });
});
