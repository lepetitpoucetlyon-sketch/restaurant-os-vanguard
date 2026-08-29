import type { PlatformVariant } from '@/modules/system';

export interface StylePreset {
  id: string;
  label: string;
  primaryColor: string;
  accentColor?: string;
  appearance: 'light' | 'dark';
  fontBrand?: string;
  fontBrandUrl?: string;
}

/**
 * Palettes prédéfinies par vertical — affichées dans PlusBrandSection.
 * Chaque preset est cohérent avec l'identité du secteur d'activité.
 */
export const VERTICAL_STYLE_PRESETS: Record<PlatformVariant, StylePreset[]> = {
  restaurant: [
    { id: 'luxe',      label: 'Luxe',      primaryColor: '#C5A059', accentColor: '#B08D48', appearance: 'dark',  fontBrand: 'Playfair Display', fontBrandUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap' },
    { id: 'bistro',    label: 'Bistro',    primaryColor: '#8B4513', accentColor: '#A0522D', appearance: 'light', fontBrand: 'Lora',             fontBrandUrl: 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&display=swap' },
    { id: 'moderne',   label: 'Moderne',   primaryColor: '#1a1a2e', accentColor: '#16213e', appearance: 'dark' },
    { id: 'brasserie', label: 'Brasserie', primaryColor: '#B8860B', accentColor: '#DAA520', appearance: 'dark',  fontBrand: 'Libre Baskerville', fontBrandUrl: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital@0;1&display=swap' },
    { id: 'cocktail_bar',  label: 'Bar & Cocktails',  primaryColor: '#7C3AED', accentColor: '#06B6D4', appearance: 'dark',  fontBrand: 'Outfit',              fontBrandUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap' },
    { id: 'gastronomique', label: 'Gastronomique',     primaryColor: '#92845A', accentColor: '#6B5D3E', appearance: 'dark',  fontBrand: 'Cormorant Garamond',  fontBrandUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap' },
    { id: 'street_food',   label: 'Street & Fast',     primaryColor: '#F97316', accentColor: '#EA580C', appearance: 'light', fontBrand: 'Syne',                fontBrandUrl: 'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&display=swap' },
    { id: 'dark_kitchen',  label: 'Dark Kitchen',      primaryColor: '#52525B', accentColor: '#3F3F46', appearance: 'dark' },
  ],
  hotel: [
    { id: 'palace',    label: 'Palace',    primaryColor: '#1E3A5F', accentColor: '#2D5F8A', appearance: 'dark',  fontBrand: 'Cormorant Garamond', fontBrandUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap' },
    { id: 'boutique',  label: 'Boutique',  primaryColor: '#4A5568', accentColor: '#718096', appearance: 'dark' },
    { id: 'resort',    label: 'Resort',    primaryColor: '#2C7A7B', accentColor: '#319795', appearance: 'light' },
    { id: 'business',  label: 'Business',  primaryColor: '#2B6CB0', accentColor: '#3182CE', appearance: 'light' },
  ],
  bakery: [
    { id: 'artisan',   label: 'Artisan',   primaryColor: '#C68642', accentColor: '#8B4513', appearance: 'light', fontBrand: 'Lora', fontBrandUrl: 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&display=swap' },
    { id: 'patisserie',label: 'Pâtisserie',primaryColor: '#D4A5C7', accentColor: '#9B59B6', appearance: 'light', fontBrand: 'Playfair Display', fontBrandUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap' },
    { id: 'moderne',   label: 'Moderne',   primaryColor: '#744210', accentColor: '#975A16', appearance: 'dark' },
    { id: 'bio',       label: 'Bio',       primaryColor: '#276749', accentColor: '#2F855A', appearance: 'light' },
  ],
  salon: [
    { id: 'zen',       label: 'Zen',       primaryColor: '#D4A5C7', accentColor: '#9B59B6', appearance: 'light', fontBrand: 'Cormorant Garamond', fontBrandUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap' },
    { id: 'bold',      label: 'Bold',      primaryColor: '#9B59B6', accentColor: '#8E44AD', appearance: 'dark' },
    { id: 'pastel',    label: 'Pastel',    primaryColor: '#F8BBD0', accentColor: '#F48FB1', appearance: 'light' },
    { id: 'noir',      label: 'Noir',      primaryColor: '#2C2C2C', accentColor: '#4A4A4A', appearance: 'dark' },
  ],
  clinic: [
    { id: 'medical',   label: 'Médical',   primaryColor: '#3498DB', accentColor: '#1ABC9C', appearance: 'light' },
    { id: 'nature',    label: 'Nature',    primaryColor: '#27AE60', accentColor: '#2ECC71', appearance: 'light' },
    { id: 'premium',   label: 'Premium',   primaryColor: '#1E3A5F', accentColor: '#2D5F8A', appearance: 'dark' },
  ],
  garage: [
    { id: 'industrie', label: 'Industrie', primaryColor: '#2C3E50', accentColor: '#E74C3C', appearance: 'dark',  fontBrand: 'Rajdhani', fontBrandUrl: 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap' },
    { id: 'racing',    label: 'Racing',    primaryColor: '#E74C3C', accentColor: '#C0392B', appearance: 'dark',  fontBrand: 'Bebas Neue', fontBrandUrl: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap' },
    { id: 'moderne',   label: 'Moderne',   primaryColor: '#34495E', accentColor: '#2C3E50', appearance: 'dark' },
  ],
  retail: [
    { id: 'fresh',     label: 'Fresh',     primaryColor: '#27AE60', accentColor: '#2ECC71', appearance: 'light', fontBrand: 'Poppins', fontBrandUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap' },
    { id: 'premium',   label: 'Premium',   primaryColor: '#8B5CF6', accentColor: '#7C3AED', appearance: 'dark' },
    { id: 'energie',   label: 'Énergie',   primaryColor: '#F59E0B', accentColor: '#D97706', appearance: 'light' },
    { id: 'minimaliste',label:'Minimaliste',primaryColor: '#374151', accentColor: '#4B5563', appearance: 'light' },
  ],
  custom: [
    { id: 'indigo',    label: 'Indigo',    primaryColor: '#6366f1', accentColor: '#8B5CF6', appearance: 'dark' },
    { id: 'emerald',   label: 'Émeraude',  primaryColor: '#10B981', accentColor: '#059669', appearance: 'light' },
    { id: 'rose',      label: 'Rose',      primaryColor: '#F43F5E', accentColor: '#E11D48', appearance: 'dark' },
    { id: 'slate',     label: 'Ardoise',   primaryColor: '#64748B', accentColor: '#475569', appearance: 'light' },
  ],
  gym: [
    { id: 'power',     label: 'Power',     primaryColor: '#EF4444', accentColor: '#F97316', appearance: 'dark' },
    { id: 'neon',      label: 'Néon',      primaryColor: '#8B5CF6', accentColor: '#06B6D4', appearance: 'dark' },
  ],
  coworking: [
    { id: 'hive',      label: 'Hive',      primaryColor: '#6366F1', accentColor: '#A855F7', appearance: 'dark' },
    { id: 'zen',       label: 'Clarté',    primaryColor: '#0D9488', accentColor: '#14B8A6', appearance: 'light' },
  ],
  veterinary: [
    { id: 'care',      label: 'Soin',      primaryColor: '#0284C7', accentColor: '#38BDF8', appearance: 'light' },
    { id: 'nature',    label: 'Clinique',  primaryColor: '#059669', accentColor: '#34D399', appearance: 'light' },
  ],
  florist: [
    { id: 'botanic',   label: 'Botanique', primaryColor: '#10B981', accentColor: '#F43F5E', appearance: 'light', fontBrand: 'Playfair Display' },
    { id: 'pastel',    label: 'Fleuriste', primaryColor: '#F43F5E', accentColor: '#FB7185', appearance: 'light' },
  ],
};
