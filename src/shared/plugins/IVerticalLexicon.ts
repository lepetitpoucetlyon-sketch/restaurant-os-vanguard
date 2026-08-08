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
