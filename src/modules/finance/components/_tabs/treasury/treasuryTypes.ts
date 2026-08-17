export interface CashflowForecast {
  id?: string;
  date: string;
  predictedRevenueInMicrounits: number;
  basedOnRevenue?: number;
  updatedAt?: number;
}

export interface SupplierInvoice {
  id: string;
  supplierName: string;
  amountInMicrounits: number;
  dueDate: string;
  status: "pending" | "approved" | "paid" | "overdue";
  iban?: string;
  bic?: string;
}

export function microToEur(µ: number): string {
  return (µ / 1_000_000).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
}
