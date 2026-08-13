export interface MerchantIdentity {
    id: string;
    name: string;
    logo?: string;
    slogan?: string;
    /** Generic business type — replaces cuisineType. Ex: "French cuisine", "Auto repair", "Hair salon" */
    businessType: string;
    /** Open string — verticals set their own categories via resolveMetricLabels */
    category?: string;
    shortDescription?: string;
    longDescription?: string;
    foundedYear?: number;
    headChef?: string;
    owner?: string;
}

/** @deprecated Use MerchantIdentity */
export type RestaurantIdentity = MerchantIdentity;

export interface RestaurantContact {
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
