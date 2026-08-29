export interface ContextualSuggestion {
    id: string;
    title: string;
    prompt: string;
    icon?: string;
}

export type SuggestionKey = 'pos' | 'inventory' | 'finance' | 'luxury' | 'default';

export const PATH_SUGGESTIONS: Record<SuggestionKey, ContextualSuggestion[]> = {
    pos: [
        { id: '1', title: 'Verrouiller une table', prompt: 'Peux-tu verrouiller la table 4 pour une arrivée VIP ?' },
        { id: '2', title: 'Procédure avoir/remise', prompt: 'Comment enregistrer un geste commercial ou un avoir sur une addition ?' },
        { id: '3', title: 'Articles en rupture', prompt: 'Quels sont les articles actuellement en rupture de stock ?' },
    ],
    inventory: [
        { id: '1', title: 'DLC & Alertes Péremption', prompt: 'Quels ingrédients arrivent à péremption dans les prochaines 48 heures ?' },
        { id: '2', title: 'Stock par Emplacement', prompt: 'Qu\'est-ce qu\'il reste dans le Frigo N°4 ?' },
        { id: '3', title: 'Commande Fournisseur', prompt: 'Prépare une commande fournisseur pour les articles en seuil critique.' },
    ],
    finance: [
        { id: '1', title: 'CA d\'hier & du jour', prompt: 'Quel est le montant du chiffre d\'affaires d\'hier et la répartition de TVA ?' },
        { id: '2', title: 'Dernières Factures', prompt: 'Donne-moi la liste des 5 dernières factures fournisseurs reçues.' },
        { id: '3', title: 'Vérification NF525', prompt: 'Le registre de scellement fiscal est-il 100% synchronisé et intègre ?' },
    ],
    luxury: [
        { id: '1', title: 'Cote Marché Sacs', prompt: 'Quelle est l\'évolution de la cote du Hermès Birkin 30 Crocodile ?' },
        { id: '2', title: 'Rendement Locatif', prompt: 'Quel est le rendement locatif moyen versé aux investisseurs ce mois-ci ?' },
        { id: '3', title: 'Statut Chambre Forte', prompt: 'Tous les scellés physiques et puces NFC sont-ils validés en coffre ?' },
    ],
    default: [
        { id: '1', title: 'CA d\'hier & Métriques', prompt: 'Quel est le montant du chiffre d\'affaires d\'hier ?' },
        { id: '2', title: 'Stocks Frigos & Réserves', prompt: 'Qu\'est-ce qu\'il reste dans le frigo numéro 4 ?' },
        { id: '3', title: 'Dernières Factures', prompt: 'Donne-moi la liste des dernières factures fournisseurs.' },
    ],
};

export function resolvePathKey(path: string): SuggestionKey {
    if (path.includes('/pos') || path.includes('/caisse')) return 'pos';
    if (path.includes('/inventory') || path.includes('/stock') || path.includes('/logistics')) return 'inventory';
    if (path.includes('/finance') || path.includes('/fec') || path.includes('/comptabilite') || path.includes('/accounting')) return 'finance';
    if (path.includes('/luxury') || path.includes('/vault')) return 'luxury';
    return 'default';
}
