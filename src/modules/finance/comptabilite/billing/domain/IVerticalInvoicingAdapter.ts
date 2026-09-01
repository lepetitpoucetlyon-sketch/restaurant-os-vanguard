import type { PlatformVariant } from '@nexus/contracts';

export type BillingUnit = 'per_cover' | 'per_night' | 'parts_labor' | 'per_act' | 'per_item' | 'per_session' | 'per_service';

export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unitPriceHTInMicrounits: number;
  taxRate: number;
  billingUnit: BillingUnit;
  analyticalAxis?: string;
}

export interface VerticalTaxRule {
  defaultRate: number;
  exemptCategories?: string[];
  specialRates?: Array<{ category: string; rate: number; label: string }>;
  surcharges?: Array<{ label: string; amountInMicrounits: number; isTaxable: boolean }>;
}

export interface IVerticalInvoicingAdapter {
  variant: PlatformVariant;
  billingUnit: BillingUnit;
  getTaxRules(): VerticalTaxRule;
  buildInvoiceLines(operationData: Record<string, unknown>): InvoiceLineInput[];
  getDefaultAnalyticalAxis(): string;
  formatInvoiceDescription(operationData: Record<string, unknown>): string;
  /**
   * Infère la catégorie fiscale d'un produit à partir de son id/nom.
   * Retourne la catégorie et le taux TVA applicable.
   * Permet de sortir la liste de produits restaurant en dur de vatResolver.
   */
  inferProductCategory(categoryId: string, productName?: string): { category: string; taxRate: number };
}

export class RestaurantInvoicingAdapter implements IVerticalInvoicingAdapter {
  variant = 'restaurant' as PlatformVariant;
  billingUnit = 'per_cover' as BillingUnit;

  getTaxRules(): VerticalTaxRule {
    return {
      defaultRate: 10,
      specialRates: [
        { category: 'alcohol', rate: 20, label: 'Boissons alcoolisées' },
        { category: 'beverage_soft', rate: 5.5, label: 'Boissons non alcoolisées (emporter)' },
        { category: 'takeaway_food', rate: 5.5, label: 'Vente à emporter' },
      ],
    };
  }

  buildInvoiceLines(data: Record<string, unknown>): InvoiceLineInput[] {
    const items = (data.items ?? []) as Array<{
      name: string;
      quantity: number;
      unitPriceInMicrounits: number;
      taxRate?: number;
      category?: string;
    }>;
    return items.map(item => ({
      description: item.name,
      quantity: item.quantity,
      unitPriceHTInMicrounits: item.unitPriceInMicrounits,
      taxRate: item.taxRate ?? 10,
      billingUnit: this.billingUnit,
      analyticalAxis: (item.category === 'alcohol' || item.category === 'beverage_soft') ? 'Beverage' : 'Food',
    }));
  }

  getDefaultAnalyticalAxis(): string { return 'Food'; }

  formatInvoiceDescription(data: Record<string, unknown>): string {
    const tableId = data.tableId as string | undefined;
    return `Repas — Table ${tableId ?? 'Emporté'}`;
  }

  inferProductCategory(categoryId: string, productName?: string): { category: string; taxRate: number } {
    const lower = (categoryId + ' ' + (productName ?? '')).toLowerCase();
    if (/alcool|vin|bière|cocktail|spiritueux|whisky|rhum|vodka|gin|champagne|prosecco|apéritif/.test(lower)) return { category: 'alcohol', taxRate: 20 };
    if (/boisson|jus|soda|eau|café|thé|limonade|smoothie/.test(lower)) return { category: 'beverage_soft', taxRate: 10 };
    if (/service|couverts|supplément/.test(lower)) return { category: 'service', taxRate: 20 };
    return { category: 'food', taxRate: 10 };
  }
}

export class HotelInvoicingAdapter implements IVerticalInvoicingAdapter {
  variant = 'hotel' as PlatformVariant;
  billingUnit = 'per_night' as BillingUnit;

  getTaxRules(): VerticalTaxRule {
    return {
      defaultRate: 10,
      surcharges: [
        { label: 'Taxe de séjour', amountInMicrounits: 0, isTaxable: false },
      ],
    };
  }

  buildInvoiceLines(data: Record<string, unknown>): InvoiceLineInput[] {
    const nights = (data.nights as number) ?? 1;
    const ratePerNight = (data.ratePerNightInMicrounits as number) ?? 0;
    const roomType = (data.roomType as string) ?? 'Standard';
    return [{
      description: `Hébergement ${roomType} — ${nights} nuit${nights > 1 ? 's' : ''}`,
      quantity: nights,
      unitPriceHTInMicrounits: ratePerNight,
      taxRate: 10,
      billingUnit: this.billingUnit,
      analyticalAxis: 'Hébergement',
    }];
  }

  getDefaultAnalyticalAxis(): string { return 'Hébergement'; }

  formatInvoiceDescription(data: Record<string, unknown>): string {
    const guestName = data.guestName as string | undefined;
    return `Séjour${guestName ? ` — ${guestName}` : ''}`;
  }

  inferProductCategory(categoryId: string): { category: string; taxRate: number } {
    const lower = categoryId.toLowerCase();
    if (/taxe.*s[eé]jour|city.*tax/.test(lower)) return { category: 'city_tax', taxRate: 0 };
    if (/resto|restaur|food|repas/.test(lower)) return { category: 'restaurant', taxRate: 10 };
    return { category: 'accommodation', taxRate: 10 };
  }
}

export class GarageInvoicingAdapter implements IVerticalInvoicingAdapter {
  variant = 'garage' as PlatformVariant;
  billingUnit = 'parts_labor' as BillingUnit;

  getTaxRules(): VerticalTaxRule {
    return { defaultRate: 20 };
  }

  buildInvoiceLines(data: Record<string, unknown>): InvoiceLineInput[] {
    const parts = (data.parts ?? []) as Array<{ name: string; quantity: number; unitPriceInMicrounits: number }>;
    const laborHours = (data.laborHours as number) ?? 0;
    const laborRateInMicrounits = (data.laborRateInMicrounits as number) ?? 0;

    const lines: InvoiceLineInput[] = parts.map(p => ({
      description: `Pièce : ${p.name}`,
      quantity: p.quantity,
      unitPriceHTInMicrounits: p.unitPriceInMicrounits,
      taxRate: 20,
      billingUnit: 'per_item' as BillingUnit,
      analyticalAxis: 'Pièces',
    }));

    if (laborHours > 0) {
      lines.push({
        description: 'Main d\'oeuvre',
        quantity: laborHours,
        unitPriceHTInMicrounits: laborRateInMicrounits,
        taxRate: 20,
        billingUnit: 'parts_labor',
        analyticalAxis: 'Main d\'oeuvre',
      });
    }

    const warrantyLine = data.warrantyLineInMicrounits as number | undefined;
    if (warrantyLine != null) {
      lines.push({
        description: 'Garantie pièces et main d\'oeuvre',
        quantity: 1,
        unitPriceHTInMicrounits: 0,
        taxRate: 20,
        billingUnit: 'per_service',
        analyticalAxis: 'Garantie',
      });
    }

    return lines;
  }

  getDefaultAnalyticalAxis(): string { return 'Réparation'; }

  formatInvoiceDescription(data: Record<string, unknown>): string {
    const vehicleReg = data.vehicleRegistration as string | undefined;
    return `Intervention${vehicleReg ? ` — ${vehicleReg}` : ''}`;
  }

  inferProductCategory(categoryId: string): { category: string; taxRate: number } {
    const lower = categoryId.toLowerCase();
    if (/garantie|warranty/.test(lower)) return { category: 'warranty', taxRate: 20 };
    if (/main.*oeuvre|labor|mano/.test(lower)) return { category: 'labor', taxRate: 20 };
    return { category: 'parts', taxRate: 20 };
  }
}

export class ClinicInvoicingAdapter implements IVerticalInvoicingAdapter {
  variant = 'clinic' as PlatformVariant;
  billingUnit = 'per_act' as BillingUnit;

  getTaxRules(): VerticalTaxRule {
    return {
      defaultRate: 0,
      exemptCategories: ['medical_act', 'consultation', 'surgery'],
      specialRates: [
        { category: 'aesthetic', rate: 20, label: 'Actes esthétiques (non thérapeutiques)' },
      ],
    };
  }

  buildInvoiceLines(data: Record<string, unknown>): InvoiceLineInput[] {
    const acts = (data.acts ?? []) as Array<{
      name: string;
      quantity: number;
      priceInMicrounits: number;
      category?: string;
    }>;
    return acts.map(act => ({
      description: act.name,
      quantity: act.quantity,
      unitPriceHTInMicrounits: act.priceInMicrounits,
      taxRate: act.category === 'aesthetic' ? 20 : 0,
      billingUnit: this.billingUnit,
      analyticalAxis: 'Actes médicaux',
    }));
  }

  getDefaultAnalyticalAxis(): string { return 'Actes médicaux'; }

  formatInvoiceDescription(data: Record<string, unknown>): string {
    return `Soins${(data.patientRef as string) ? ` — Réf. ${data.patientRef}` : ''}`;
  }

  inferProductCategory(categoryId: string): { category: string; taxRate: number } {
    const lower = categoryId.toLowerCase();
    if (/esth[eé]t|aesthetic|cosm[eé]t/.test(lower)) return { category: 'aesthetic', taxRate: 20 };
    return { category: 'medical_act', taxRate: 0 };
  }
}

export class BakeryInvoicingAdapter implements IVerticalInvoicingAdapter {
  variant = 'bakery' as PlatformVariant;
  billingUnit = 'per_item' as BillingUnit;

  getTaxRules(): VerticalTaxRule {
    return {
      defaultRate: 5.5,
      specialRates: [
        { category: 'dine_in', rate: 10, label: 'Consommation sur place' },
      ],
    };
  }

  buildInvoiceLines(data: Record<string, unknown>): InvoiceLineInput[] {
    const items = (data.items ?? []) as Array<{
      name: string;
      quantity: number;
      unitPriceInMicrounits: number;
      consumptionMode?: string;
    }>;
    return items.map(item => ({
      description: item.name,
      quantity: item.quantity,
      unitPriceHTInMicrounits: item.unitPriceInMicrounits,
      taxRate: item.consumptionMode === 'dine_in' ? 10 : 5.5,
      billingUnit: this.billingUnit,
      analyticalAxis: 'Viennoiserie',
    }));
  }

  getDefaultAnalyticalAxis(): string { return 'Viennoiserie'; }

  formatInvoiceDescription(): string { return 'Vente boulangerie'; }

  inferProductCategory(categoryId: string, productName?: string): { category: string; taxRate: number } {
    const lower = (categoryId + ' ' + (productName ?? '')).toLowerCase();
    if (/boire|boisson|café|jus/.test(lower)) return { category: 'beverage', taxRate: 5.5 };
    return { category: 'food', taxRate: 5.5 };
  }
}

export class SalonInvoicingAdapter implements IVerticalInvoicingAdapter {
  variant = 'salon' as PlatformVariant;
  billingUnit = 'per_session' as BillingUnit;

  getTaxRules(): VerticalTaxRule {
    return { defaultRate: 20 };
  }

  buildInvoiceLines(data: Record<string, unknown>): InvoiceLineInput[] {
    const services = (data.services ?? []) as Array<{
      name: string;
      priceInMicrounits: number;
    }>;
    return services.map(s => ({
      description: s.name,
      quantity: 1,
      unitPriceHTInMicrounits: s.priceInMicrounits,
      taxRate: 20,
      billingUnit: this.billingUnit,
      analyticalAxis: 'Prestations',
    }));
  }

  getDefaultAnalyticalAxis(): string { return 'Prestations'; }

  formatInvoiceDescription(): string { return 'Prestations salon'; }

  inferProductCategory(): { category: string; taxRate: number } {
    return { category: 'hair_service', taxRate: 20 };
  }
}

export class RetailInvoicingAdapter implements IVerticalInvoicingAdapter {
  variant = 'retail' as PlatformVariant;
  billingUnit = 'per_item' as BillingUnit;

  getTaxRules(): VerticalTaxRule {
    return { defaultRate: 20 };
  }

  buildInvoiceLines(data: Record<string, unknown>): InvoiceLineInput[] {
    const items = (data.items ?? []) as Array<{
      name: string;
      quantity: number;
      unitPriceInMicrounits: number;
      taxRate?: number;
    }>;
    return items.map(item => ({
      description: item.name,
      quantity: item.quantity,
      unitPriceHTInMicrounits: item.unitPriceInMicrounits,
      taxRate: item.taxRate ?? 20,
      billingUnit: this.billingUnit,
      analyticalAxis: 'Vente',
    }));
  }

  getDefaultAnalyticalAxis(): string { return 'Vente'; }

  formatInvoiceDescription(): string { return 'Vente en magasin'; }

  inferProductCategory(categoryId: string): { category: string; taxRate: number } {
    const lower = categoryId.toLowerCase();
    if (/aliment|food|[eé]picerie/.test(lower)) return { category: 'food', taxRate: 5.5 };
    if (/livre|book/.test(lower)) return { category: 'book', taxRate: 5.5 };
    if (/pharma|m[eé]dic|sant[eé]/.test(lower)) return { category: 'health', taxRate: 10 };
    return { category: 'general', taxRate: 20 };
  }
}

const ADAPTERS: Record<string, IVerticalInvoicingAdapter> = {
  restaurant: new RestaurantInvoicingAdapter(),
  hotel: new HotelInvoicingAdapter(),
  garage: new GarageInvoicingAdapter(),
  clinic: new ClinicInvoicingAdapter(),
  bakery: new BakeryInvoicingAdapter(),
  salon: new SalonInvoicingAdapter(),
  retail: new RetailInvoicingAdapter(),
};

export function resolveInvoicingAdapter(variant: string): IVerticalInvoicingAdapter {
  return ADAPTERS[variant] ?? ADAPTERS['restaurant'];
}
