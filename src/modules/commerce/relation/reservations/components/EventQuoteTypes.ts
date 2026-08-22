import type { PrivatisationFormule } from "../../../domain/schemas/commerce";

export interface EventQuoteFormData {
    // Client
    clientNom: string;
    clientPrenom: string;
    clientEmail: string;
    clientTelephone: string;

    // Événement
    evenementNom: string;
    dateEvenement: string;
    heureDebut: string;
    heureFin: string;
    nombreConvives: number;
    formule: PrivatisationFormule;
    descriptionFormule: string;

    // Tarification
    montantHT: number;
}
