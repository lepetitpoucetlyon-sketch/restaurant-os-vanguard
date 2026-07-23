export interface RestaurantIdentity {
    id: string;
    name: string;
    logo?: string;
    slogan?: string;
    cuisineType: string;
    category: 'bistrot' | 'gastronomique' | 'brasserie' | 'fast_casual' | 'cafe' | 'bar' | 'other';
    shortDescription?: string;
    longDescription?: string;
    foundedYear?: number;
    headChef?: string;
    owner?: string;
}

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
