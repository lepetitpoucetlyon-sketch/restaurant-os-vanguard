export { ProductSchema, type Product } from '@nexus/contracts';

// ─── Event contract types — re-exported from finance/documents/EventContract ─
export type { EventFormule, EventContractData } from '@/modules/finance/comptabilite/documents/EventContract';

/** @deprecated use EventFormule */
export type PrivatisationFormule = 'menu' | 'cocktail_dinatoire' | 'buffet';

/** @deprecated use EventContractData */
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
    merchantNom: string;
    merchantAdresse: string;
    merchantTelephone?: string;
    merchantEmail?: string;
    merchantSiret?: string;
    numeroContrat?: string;
    dateSignature?: string;
}
