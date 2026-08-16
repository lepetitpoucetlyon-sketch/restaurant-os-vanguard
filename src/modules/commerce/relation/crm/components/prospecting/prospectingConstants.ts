import type { BrandConfig } from '@/shared/nexus/tokens/brand';
import type { BrandInput } from '@/lib/BrandingService';

export type ExtractedTokens = Partial<BrandConfig>;
export type Phase = 'idle' | 'scanning' | 'preview_ready' | 'applying' | 'done';

export const PRESETS: { label: string; color: string; input: BrandInput }[] = [
  { label: 'Gold Luxury',   color: '#C5A059', input: { name: 'Luxury',  primaryColor: '#C5A059', atmosphere: 'luxury' } },
  { label: 'Bistrot Rouge', color: '#E11D48', input: { name: 'Bistrot', primaryColor: '#E11D48', atmosphere: 'bistro' } },
  { label: 'Vert Nature',   color: '#059669', input: { name: 'Nature',  primaryColor: '#059669', atmosphere: 'zen' } },
  { label: 'Bleu Marine',   color: '#1D4ED8', input: { name: 'Marine',  primaryColor: '#1D4ED8', atmosphere: 'modern' } },
];

export function deriveSwatches(tokens: ExtractedTokens) {
  const fields: { label: string; key: keyof ExtractedTokens }[] = [
    { label: 'Principale',  key: 'primaryColor'  },
    { label: 'Accent',      key: 'accentColor'   },
    { label: 'Fond',        key: 'surfaceBg'     },
    { label: 'Carte',       key: 'surfaceCard'   },
    { label: 'Modal',       key: 'surfaceModal'  },
    { label: 'Succès',      key: 'statusSuccess' },
    { label: 'Alerte',      key: 'statusWarning' },
    { label: 'Danger',      key: 'statusDanger'  },
  ];
  return fields
    .filter(f => !!tokens[f.key])
    .map(f => ({ label: f.label, value: tokens[f.key] as string }));
}

export function textOn(hex: string): string {
  if (!hex || hex.length < 7) return '#FFFFFF';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? '#000000' : '#FFFFFF';
}
