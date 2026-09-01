/**
 * kernel/contracts/tenant — Variantes et métadonnées universelles de la plateforme.
 * Neutre, sans dépendance métier.
 */

export const PLATFORM_VARIANTS = [
    'restaurant',
    'hotel',
    'bakery',
    'garage',
    'salon',
    'clinic',
    'retail',
    'custom',
    'gym',
    'coworking',
    'veterinary',
    'florist',
] as const;

export type PlatformVariant = (typeof PLATFORM_VARIANTS)[number];

export const VERTICAL_META: Record<PlatformVariant, { emoji: string; label: string }> = {
    restaurant: { emoji: '🍽️', label: 'Restaurant' },
    hotel: { emoji: '🏨', label: 'Hôtel' },
    bakery: { emoji: '🥐', label: 'Boulangerie' },
    garage: { emoji: '🔧', label: 'Garage' },
    salon: { emoji: '✂️', label: 'Salon' },
    clinic: { emoji: '🏥', label: 'Clinique' },
    retail: { emoji: '🛍️', label: 'Retail' },
    custom: { emoji: '✨', label: 'Personnalisé' },
    gym: { emoji: '🏋️', label: 'Salle de Sport' },
    coworking: { emoji: '🏢', label: 'Coworking' },
    veterinary: { emoji: '🐾', label: 'Vétérinaire' },
    florist: { emoji: '🌸', label: 'Fleuriste' },
};
