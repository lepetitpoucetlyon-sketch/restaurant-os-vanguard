import type { PlatformVariant } from "@/modules/system";

export interface MockTenantOptions {
  tenantId?: string;
  name?: string;
  variant?: PlatformVariant;
  adminEmail?: string;
}

export interface MockOrderOptions {
  orderId?: string;
  tenantId?: string;
  itemsCount?: number;
  totalMicros?: number;
  taxRate?: string;
}

export class TenantTestFactory {
  static createMockTenant(variant: PlatformVariant = "restaurant", options: MockTenantOptions = {}) {
    const id = options.tenantId ?? `test_${variant}_${Date.now()}`;
    return {
      id,
      tenantId: id,
      name: options.name ?? `Test ${variant.toUpperCase()} Instance`,
      variant,
      status: "ACTIVE",
      adminEmail: options.adminEmail ?? `admin@${id}.example.com`,
      currency: "EUR",
      locale: "fr-FR",
      fiscalConfig: {
        vatNumber: "FR00000000000",
        siret: "00000000000000",
        nafCode: variant === "restaurant" ? "56.10A" : "96.09Z",
        isNF525Compliant: true,
      },
      createdAt: new Date().toISOString(),
    };
  }

  static createMockOrder(options: MockOrderOptions = {}) {
    const tenantId = options.tenantId ?? "tenant_default";
    const orderId = options.orderId ?? `order_${Date.now()}`;
    const taxRate = options.taxRate ?? "0.10";
    const totalMicros = options.totalMicros ?? 25_000_000;

    return {
      orderId,
      tenantId,
      status: "COMPLETED",
      items: [
        {
          productId: "prod_001",
          name: "Item Alpha",
          quantity: 1,
          unitPriceMicros: totalMicros,
          taxRate,
        },
      ],
      totalInMicrounits: totalMicros,
      createdAt: Date.now(),
      paidAt: Date.now(),
    };
  }

  static createMockStockItem(tenantId: string, ingredientId: string, quantity: number = 10000) {
    return {
      tenantId,
      ingredientId,
      quantity,
      unit: "g",
      minQuantity: 5000,
      reorderQuantity: 10000,
      updatedAt: Date.now(),
    };
  }
}
