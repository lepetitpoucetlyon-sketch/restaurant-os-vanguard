export interface DemoSupplier {
  id: string;
  name: string;
  category: 'viande' | 'legumes' | 'boissons';
  contactEmail: string;
}

export const DEMO_SUPPLIERS: DemoSupplier[] = [
  { id: 'sup_boucher_1', name: 'Boucheries de France', category: 'viande', contactEmail: 'commande@boucherie.fr' },
  { id: 'sup_primeur_1', name: 'Primeur du Marché', category: 'legumes', contactEmail: 'contact@primeur.fr' },
  { id: 'sup_boissons_1', name: 'DistriBoissons HCR', category: 'boissons', contactEmail: 'logistique@distriboissons.fr' },
];
