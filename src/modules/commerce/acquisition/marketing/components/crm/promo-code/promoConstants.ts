import { toMicrounits } from "@/shared/schemas/primitives";
import type { PromoCodeRecord } from '../types';

export const SEED_CODES: Omit<PromoCodeRecord, "id" | "createdAt" | "updatedAt">[] = [
  {
    code: "BIENVENUE10",
    discountType: "percent",
    value: 10,
    label: "Bienvenue",
    minOrderInMicrounits: toMicrounits(0),
    maxUses: 1000,
    currentUses: 0,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
  },
  {
    code: "NEXUS20",
    discountType: "percent",
    value: 20,
    label: "Offre Nexus",
    minOrderInMicrounits: toMicrounits(20),
    maxUses: 500,
    currentUses: 0,
    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
  },
  {
    code: "FREE3",
    discountType: "fixed",
    value: 3,
    label: "Remise 3€",
    minOrderInMicrounits: toMicrounits(15),
    maxUses: 200,
    currentUses: 0,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
  },
];

export const DEFAULT_FORM = {
  code: "",
  discountType: "percent" as "percent" | "fixed",
  value: 10,
  label: "",
  minOrder: 0,
  maxUses: 100,
  expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
};
