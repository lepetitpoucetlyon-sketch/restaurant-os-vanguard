export interface IVerticalLexicon {
  tableLabel: string;        // Resto: "Table", Garage: "Pont Élévateur", Salon: "Fauteuil", Clinic: "Box"
  recipeLabel: string;       // Resto: "Recette", Garage: "Forfait Réparation", Salon: "Prestation", Clinic: "Acte Médical"
  staffLabel: string;        // Resto: "Serveur", Garage: "Technicien / Mécanicien", Salon: "Coiffeur", Clinic: "Soignant"
  ticketLabel: string;       // Resto: "Ticket KDS", Garage: "Ordre de Réparation", Salon: "Fiche Prestation"
  itemLabel: string;         // Resto: "Ingrédient", Garage: "Pièce Auto", Salon: "Soin Cosmétique"
  customerLabel: string;     // Resto: "Client / Convive", Garage: "Propriétaire Véhicule", Clinic: "Patient"
}

export const DEFAULT_RESTAURANT_LEXICON: IVerticalLexicon = {
  tableLabel: 'Table',
  recipeLabel: 'Recette / Plat',
  staffLabel: 'Serveur / Cuisinier',
  ticketLabel: 'Ticket Cuisine',
  itemLabel: 'Ingrédient',
  customerLabel: 'Client / Convive',
};

export const GARAGE_LEXICON: IVerticalLexicon = {
  tableLabel: 'Pont Élévateur',
  recipeLabel: 'Forfait Réparation',
  staffLabel: 'Mécanicien / Technicien',
  ticketLabel: 'Ordre de Réparation (OR)',
  itemLabel: 'Pièce Détachée',
  customerLabel: 'Propriétaire / Automobiliste',
};

export const SALON_LEXICON: IVerticalLexicon = {
  tableLabel: 'Poste / Fauteuil',
  recipeLabel: 'Prestation / Coiffure',
  staffLabel: 'Coiffeur / Esthéticienne',
  ticketLabel: 'Fiche Prestation',
  itemLabel: 'Produit Cosmétique',
  customerLabel: 'Client',
};

export const CLINIC_LEXICON: IVerticalLexicon = {
  tableLabel: 'Box de Consultation',
  recipeLabel: 'Acte Médical / Soin',
  staffLabel: 'Praticien / Soignant',
  ticketLabel: 'Feuille de Soin',
  itemLabel: 'Consommable Médical',
  customerLabel: 'Patient',
};

export const HOTEL_LEXICON: IVerticalLexicon = {
  tableLabel: 'Chambre / Suite',
  recipeLabel: 'Forfait Séjour',
  staffLabel: 'Réceptionniste / Gouvernante',
  ticketLabel: 'Fiche Réservation',
  itemLabel: 'Fourniture Chambre',
  customerLabel: 'Client / Résident',
};

export const BAKERY_LEXICON: IVerticalLexicon = {
  tableLabel: 'Comptoir / Vitrine',
  recipeLabel: 'Recette / Fiche Fournil',
  staffLabel: 'Boulanger / Vendeur',
  ticketLabel: 'Bon de Préparation',
  itemLabel: 'Farine / Ingrédient',
  customerLabel: 'Client',
};

export const RETAIL_LEXICON: IVerticalLexicon = {
  tableLabel: 'Caisse / Rayon',
  recipeLabel: 'Fiche Article',
  staffLabel: 'Vendeur / Conseiller',
  ticketLabel: 'Ticket de Caisse',
  itemLabel: 'Article / Référence',
  customerLabel: 'Client',
};

export const GYM_LEXICON: IVerticalLexicon = {
  tableLabel: 'Plateau / Espace',
  recipeLabel: 'Abonnement / Forfait',
  staffLabel: 'Coach / Instructeur',
  ticketLabel: 'Pass Séance',
  itemLabel: 'Équipement / Complément',
  customerLabel: 'Adhérent / Membre',
};

export const COWORKING_LEXICON: IVerticalLexicon = {
  tableLabel: 'Bureau / Salle',
  recipeLabel: 'Pass Coworking',
  staffLabel: 'Office Manager / Hôte',
  ticketLabel: 'Réservation Bureau',
  itemLabel: 'Fourniture / Boisson',
  customerLabel: 'Résident / Nomade',
};

export const VETERINARY_LEXICON: IVerticalLexicon = {
  tableLabel: 'Salle de Soin',
  recipeLabel: 'Acte / Consultation',
  staffLabel: 'Vétérinaire / ASV',
  ticketLabel: 'Fiche de Soin',
  itemLabel: 'Médicament / Dispositif',
  customerLabel: 'Propriétaire / Animal',
};

export const FLORIST_LEXICON: IVerticalLexicon = {
  tableLabel: 'Atelier / Serre',
  recipeLabel: 'Composition / Bouquet',
  staffLabel: 'Fleuriste / Artisan',
  ticketLabel: 'Bon de Composition',
  itemLabel: 'Tige / Végétal',
  customerLabel: 'Client',
};

export const CUSTOM_LEXICON: IVerticalLexicon = {
  tableLabel: 'Espace / Poste',
  recipeLabel: 'Prestation / Service',
  staffLabel: 'Opérateur / Collaborateur',
  ticketLabel: 'Fiche d’Activité',
  itemLabel: 'Fourniture / Article',
  customerLabel: 'Client / Bénéficiaire',
};

