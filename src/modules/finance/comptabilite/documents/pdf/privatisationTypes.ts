export type PrivatisationFormule = 'menu' | 'cocktail_dinatoire' | 'buffet';

export interface PrivatisationData {
  /** Informations client */
  clientNom: string;
  clientPrenom: string;
  clientEmail: string;
  clientTelephone: string;
  clientAdresse?: string;

  /** Informations événement */
  evenementNom: string;
  dateEvenement: string;          // Format ISO : "2026-09-20"
  heureDebut: string;             // Format "HH:MM"
  heureFin: string;               // Format "HH:MM"
  nombreConvives: number;
  formule: PrivatisationFormule;
  descriptionFormule?: string;    // Précisions sur le menu / formule

  /** Tarification (en euros) */
  montantHT: number;              // Montant total hors taxes en euros
  tauxTVA?: number;               // TVA en % — défaut 20

  /** Informations restaurant (depuis tenantConfig / whiteLabelInstanceConfig) */
  restaurantNom: string;
  restaurantAdresse: string;
  restaurantSiret?: string;
  restaurantTVA?: string;
  restaurantTelephone?: string;
  restaurantEmail?: string;

  /** Modalités financières */
  pourcentageAcompte?: number;    // % d'acompte demandé à la signature (défaut 30)
  dateSoldeMax?: string;          // Date limite paiement solde (défaut : jour J)
  dateLimiteAnnulation?: string;  // Date limite annulation avec remboursement (défaut : J-15)

  /** Conditions particulières */
  clausesParticulieres?: string[]; // Clauses spécifiques négociées avec le client
  cautionEuros?: number;          // Montant de la caution demandée en euros

  /** Métadonnées */
  numeroContrat?: string;         // Référence du contrat
  dateSignature?: string;         // Format ISO — défaut : aujourd'hui
}
