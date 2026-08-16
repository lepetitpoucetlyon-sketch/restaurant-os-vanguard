import type { BrandInput } from '@/lib/BrandingService';

export type WizardStep = 'source' | 'preview' | 'confirm';

export interface ExtractedBrand extends BrandInput {
  primaryColor: string;
}

export function darkenHex(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const darken = (c: number) => Math.max(0, c - 25).toString(16).padStart(2, '0');
  return `#${darken((n >> 16) & 0xff)}${darken((n >> 8) & 0xff)}${darken(n & 0xff)}`;
}
