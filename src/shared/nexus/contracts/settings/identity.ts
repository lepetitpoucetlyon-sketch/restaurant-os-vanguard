export interface BusinessIdentity {
    id: string;
    name: string;
    logo?: string;
    slogan?: string;
    activityCategory: string;
    /** Catégorie métier libre (ex: bistrot, garage, salon, clinique...) */
    category?: string;
    shortDescription?: string;
    longDescription?: string;
    foundedYear?: number;
    /** Première personne clé (ex: chef cuisinier, gérant technique, médecin référent) */
    keyContact1?: string;
    /** Deuxième personne clé ou propriétaire/responsable légal */
    keyContact2?: string;
    /** @deprecated use keyContact1 */
    headChef?: string;
    /** @deprecated use keyContact2 */
    owner?: string;
}

/** @deprecated use BusinessIdentity */
export type RestaurantIdentity = BusinessIdentity;

export interface BusinessContact {
    address: string;
    postalCode: string;
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
    phoneMain: string;
    phoneReservations?: string;
    whatsapp?: string;
    emailGeneral: string;
    emailReservations?: string;
    emailAccounting?: string;
    website?: string;
    googleMapsUrl?: string;
}

export interface SocialMedia {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    pinterest?: string;
    tripadvisor?: string;
    thefork?: string;
    google?: string;
}
