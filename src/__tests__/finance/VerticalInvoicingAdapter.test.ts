import { describe, it, expect } from 'vitest';
import {
  resolveInvoicingAdapter,
  RestaurantInvoicingAdapter,
  HotelInvoicingAdapter,
  GarageInvoicingAdapter,
  ClinicInvoicingAdapter,
  BakeryInvoicingAdapter,
  SalonInvoicingAdapter,
  RetailInvoicingAdapter,
} from '@/modules/finance/comptabilite/billing/domain/IVerticalInvoicingAdapter';

describe('IVerticalInvoicingAdapter — Adaptateurs de facturation multi-verticales (§7.8)', () => {
  describe('resolveInvoicingAdapter', () => {
    it('résout chaque adaptateur spécifique par son nom de variante', () => {
      expect(resolveInvoicingAdapter('restaurant')).toBeInstanceOf(RestaurantInvoicingAdapter);
      expect(resolveInvoicingAdapter('hotel')).toBeInstanceOf(HotelInvoicingAdapter);
      expect(resolveInvoicingAdapter('garage')).toBeInstanceOf(GarageInvoicingAdapter);
      expect(resolveInvoicingAdapter('clinic')).toBeInstanceOf(ClinicInvoicingAdapter);
      expect(resolveInvoicingAdapter('bakery')).toBeInstanceOf(BakeryInvoicingAdapter);
      expect(resolveInvoicingAdapter('salon')).toBeInstanceOf(SalonInvoicingAdapter);
      expect(resolveInvoicingAdapter('retail')).toBeInstanceOf(RetailInvoicingAdapter);
    });

    it('fallback sur RestaurantInvoicingAdapter si variante inconnue', () => {
      const unknownAdapter = resolveInvoicingAdapter('unknown_vertical_xyz');
      expect(unknownAdapter).toBeInstanceOf(RestaurantInvoicingAdapter);
      expect(unknownAdapter.variant).toBe('restaurant');
    });
  });

  describe('RestaurantInvoicingAdapter', () => {
    const adapter = new RestaurantInvoicingAdapter();

    it('définit l\'unité per_cover et l\'axe analytique Food par défaut', () => {
      expect(adapter.variant).toBe('restaurant');
      expect(adapter.billingUnit).toBe('per_cover');
      expect(adapter.getDefaultAnalyticalAxis()).toBe('Food');
    });

    it('construit les lignes de facturation avec ventilation Food/Beverage', () => {
      const lines = adapter.buildInvoiceLines({
        items: [
          { name: 'Burger Maison', quantity: 2, unitPriceInMicrounits: 15_000_000, category: 'food' },
          { name: 'Bière IPA 33cl', quantity: 2, unitPriceInMicrounits: 6_000_000, taxRate: 20, category: 'alcohol' },
        ],
      });

      expect(lines).toHaveLength(2);
      expect(lines[0].description).toBe('Burger Maison');
      expect(lines[0].taxRate).toBe(10);
      expect(lines[0].analyticalAxis).toBe('Food');

      expect(lines[1].description).toBe('Bière IPA 33cl');
      expect(lines[1].taxRate).toBe(20);
      expect(lines[1].analyticalAxis).toBe('Beverage');
    });

    it('infère les catégories fiscales et taux de TVA selon les mots-clés', () => {
      expect(adapter.inferProductCategory('bar', 'Bouteille de vin rouge')).toEqual({ category: 'alcohol', taxRate: 20 });
      expect(adapter.inferProductCategory('soft', 'Jus d\'orange pressé')).toEqual({ category: 'beverage_soft', taxRate: 10 });
      expect(adapter.inferProductCategory('menu', 'Plat du jour')).toEqual({ category: 'food', taxRate: 10 });
      expect(adapter.inferProductCategory('extra', 'Supplément sauce')).toEqual({ category: 'service', taxRate: 20 });
    });

    it('formate la description de facture selon la table ou vente à emporter', () => {
      expect(adapter.formatInvoiceDescription({ tableId: '12' })).toBe('Repas — Table 12');
      expect(adapter.formatInvoiceDescription({})).toBe('Repas — Table Emporté');
    });
  });

  describe('HotelInvoicingAdapter', () => {
    const adapter = new HotelInvoicingAdapter();

    it('construit les lignes de séjour par nuitée', () => {
      expect(adapter.variant).toBe('hotel');
      expect(adapter.billingUnit).toBe('per_night');

      const lines = adapter.buildInvoiceLines({
        nights: 3,
        ratePerNightInMicrounits: 120_000_000, // 120 € / nuit
        roomType: 'Suite Deluxe',
      });

      expect(lines).toHaveLength(1);
      expect(lines[0].description).toBe('Hébergement Suite Deluxe — 3 nuits');
      expect(lines[0].quantity).toBe(3);
      expect(lines[0].unitPriceHTInMicrounits).toBe(120_000_000);
      expect(lines[0].analyticalAxis).toBe('Hébergement');
    });

    it('infère la taxe de séjour (0%) et les repas (10%)', () => {
      expect(adapter.inferProductCategory('taxe_de_sejour')).toEqual({ category: 'city_tax', taxRate: 0 });
      expect(adapter.inferProductCategory('restaurant_petit_dej')).toEqual({ category: 'restaurant', taxRate: 10 });
      expect(adapter.inferProductCategory('chambre_standard')).toEqual({ category: 'accommodation', taxRate: 10 });
    });
  });

  describe('GarageInvoicingAdapter', () => {
    const adapter = new GarageInvoicingAdapter();

    it('construit les lignes ventilées pièces, main d\'oeuvre et garantie', () => {
      expect(adapter.variant).toBe('garage');
      expect(adapter.billingUnit).toBe('parts_labor');

      const lines = adapter.buildInvoiceLines({
        parts: [
          { name: 'Plaquettes de frein AV', quantity: 1, unitPriceInMicrounits: 85_000_000 },
        ],
        laborHours: 2.5,
        laborRateInMicrounits: 75_000_000, // 75 € / h
        warrantyLineInMicrounits: 0,
      });

      expect(lines).toHaveLength(3);
      expect(lines[0].description).toBe('Pièce : Plaquettes de frein AV');
      expect(lines[0].analyticalAxis).toBe('Pièces');

      expect(lines[1].description).toBe('Main d\'oeuvre');
      expect(lines[1].quantity).toBe(2.5);
      expect(lines[1].unitPriceHTInMicrounits).toBe(75_000_000);
      expect(lines[1].analyticalAxis).toBe('Main d\'oeuvre');

      expect(lines[2].description).toBe('Garantie pièces et main d\'oeuvre');
      expect(lines[2].analyticalAxis).toBe('Garantie');
    });
  });

  describe('ClinicInvoicingAdapter', () => {
    const adapter = new ClinicInvoicingAdapter();

    it('distingue les actes médicaux exonérés (0%) des actes esthétiques (20%)', () => {
      expect(adapter.variant).toBe('clinic');
      expect(adapter.billingUnit).toBe('per_act');

      const lines = adapter.buildInvoiceLines({
        acts: [
          { name: 'Consultation générale', quantity: 1, priceInMicrounits: 30_000_000, category: 'medical_act' },
          { name: 'Soin esthétique laser', quantity: 1, priceInMicrounits: 150_000_000, category: 'aesthetic' },
        ],
      });

      expect(lines).toHaveLength(2);
      expect(lines[0].taxRate).toBe(0);
      expect(lines[1].taxRate).toBe(20);
    });

    it('infère les catégories cliniques', () => {
      expect(adapter.inferProductCategory('acte_chirurgie')).toEqual({ category: 'medical_act', taxRate: 0 });
      expect(adapter.inferProductCategory('soin_esthetique')).toEqual({ category: 'aesthetic', taxRate: 20 });
    });
  });

  describe('BakeryInvoicingAdapter', () => {
    const adapter = new BakeryInvoicingAdapter();

    it('applique 5.5% à emporter et 10% sur place', () => {
      expect(adapter.variant).toBe('bakery');
      expect(adapter.billingUnit).toBe('per_item');

      const lines = adapter.buildInvoiceLines({
        items: [
          { name: 'Baguette Tradition', quantity: 2, unitPriceInMicrounits: 1_300_000, consumptionMode: 'takeaway' },
          { name: 'Formule Sandwich Café', quantity: 1, unitPriceInMicrounits: 8_500_000, consumptionMode: 'dine_in' },
        ],
      });

      expect(lines).toHaveLength(2);
      expect(lines[0].taxRate).toBe(5.5);
      expect(lines[1].taxRate).toBe(10);
    });
  });

  describe('SalonInvoicingAdapter & RetailInvoicingAdapter', () => {
    it('SalonInvoicingAdapter facture les prestations à 20%', () => {
      const salon = new SalonInvoicingAdapter();
      expect(salon.variant).toBe('salon');
      expect(salon.billingUnit).toBe('per_session');

      const lines = salon.buildInvoiceLines({
        services: [{ name: 'Coupe Brushing', priceInMicrounits: 45_000_000 }],
      });

      expect(lines).toHaveLength(1);
      expect(lines[0].taxRate).toBe(20);
      expect(lines[0].analyticalAxis).toBe('Prestations');
    });

    it('RetailInvoicingAdapter infère alimentation (5.5%), livres (5.5%), santé (10%) et général (20%)', () => {
      const retail = new RetailInvoicingAdapter();
      expect(retail.variant).toBe('retail');
      expect(retail.billingUnit).toBe('per_item');

      expect(retail.inferProductCategory('epicerie_fine')).toEqual({ category: 'food', taxRate: 5.5 });
      expect(retail.inferProductCategory('livre_roman')).toEqual({ category: 'book', taxRate: 5.5 });
      expect(retail.inferProductCategory('sante_pansement')).toEqual({ category: 'health', taxRate: 10 });
      expect(retail.inferProductCategory('textile_vetement')).toEqual({ category: 'general', taxRate: 20 });
    });
  });
});
