export { ProductSchema, type Product } from '@nexus/contracts';

// ─── Privatisation contract (promoted from finance/documents/PrivatisationContract) ─
export type PrivatisationFormule = 'menu' | 'cocktail_dinatoire' | 'buffet';

export interface PrivatisationData {
    clientNom: string;
    clientPrenom: string;
    clientEmail: string;
    clientTelephone: string;
    clientAdresse?: string;
    evenementNom: string;
    dateEvenement: string;
    heureDebut: string;
    heureFin: string;
    nombreConvives: number;
    formule: PrivatisationFormule;
    descriptionFormule?: string;
    montantHT: number;
    tauxTVA?: number;
    restaurantNom: string;
    restaurantAdresse: string;
    restaurantTelephone?: string;
    restaurantEmail?: string;
    restaurantSiret?: string;
    numeroContrat?: string;
    dateSignature?: string;
}
