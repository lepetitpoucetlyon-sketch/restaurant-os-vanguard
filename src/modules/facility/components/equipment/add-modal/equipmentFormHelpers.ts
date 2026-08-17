import type { EquipmentCategory } from '../../../assets/domain/schemas/equipment';

export interface EquipmentFormFields {
  name: string;
  category: EquipmentCategory;
  brand: string;
  model: string;
  serialNumber: string;
  location: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceUrl: string;
  purchasePriceEuros: string;
  purchaseDate: string;
  warrantyMonths: number;
  depreciationYears: number;
  supportPhone: string;
  supportCompany: string;
}

export function buildEquipmentPayload(f: EquipmentFormFields) {
  const pDate = new Date(f.purchaseDate);
  const warrantyExpDate = new Date(pDate);
  warrantyExpDate.setMonth(warrantyExpDate.getMonth() + f.warrantyMonths);
  const nextMaint = new Date();
  nextMaint.setDate(nextMaint.getDate() + 90);
  return {
    name: f.name.trim(),
    category: f.category,
    brand: f.brand.trim(),
    model: f.model.trim(),
    serialNumber: f.serialNumber.trim(),
    location: f.location.trim(),
    status: 'OPERATIONAL',
    purchase: {
      supplierName: f.supplierName.trim() || f.brand.trim(),
      invoiceNumber: f.invoiceNumber.trim() || undefined,
      invoiceUrl: f.invoiceUrl.trim() || undefined,
      purchaseDate: pDate.toISOString(),
      purchasePriceInMicrounits: Math.round(parseFloat(f.purchasePriceEuros || '0') * 1_000_000),
      taxRatePercent: 20,
      warrantyDurationMonths: f.warrantyMonths,
      warrantyExpiresAt: warrantyExpDate.toISOString(),
      depreciationPeriodYears: f.depreciationYears,
      pcgAccount: '2183',
    },
    maintenanceFrequencyDays: 90,
    nextMaintenanceDueAt: nextMaint.toISOString(),
    supportContact: {
      companyName: f.supportCompany.trim() || f.supplierName.trim() || f.brand.trim(),
      phone: f.supportPhone.trim() || undefined,
    },
  };
}
