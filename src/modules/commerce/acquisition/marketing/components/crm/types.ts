export interface PromoCodeRecord {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  value: number;
  label?: string;
  minOrderInMicrounits: number;
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
