import { Package } from 'lucide-react';
import { DocCategory } from '@/types';

export const inventory: DocCategory = {
    title: 'Stocks & Logistique Supply Chain',
    description: 'Un contrôle militaire sur vos approvisionnements et votre valeur de stock. L\'inventaire est interconnecté avec les ventes pour un suivi théorique vs réel d\'une précision chirurgicale.',
    icon: Package,
    color: '#1B4332',
    details: [
        { label: 'Inventaire Temps Réel', content: 'Décrémentation automatique des ingrédients lors de chaque vente enregistrée au POS via les fiches techniques.' },
        { label: 'Centrale d\'Achat', content: 'Gestion des catalogues fournisseurs, des mercuriales et des conditions tarifaires négociées par groupe.' },
        { label: 'Bons de Commande IA', content: 'Génération assistée des commandes basées sur les seuils critiques et les prévisions de service à venir.' },
        { label: 'Contrôle Réception', content: 'Procédure de validation des BL, scan des températures de livraison et vérification des DLC pour une sécurité totale.' },
        { label: 'Valorisation Comptable', content: 'Calcul automatique de la valeur du stock au PMP (Prix Moyen Pondéré) pour une intégration bilan simplifiée.' },
        { label: 'Lutte contre le Gaspi', content: 'Suivi FEFO (First Expired, First Out) et alertes de péremption pour minimiser drastiquement votre démarque inconnue.' }
    ],
    fullTutorial: [
        {
            title: "Gérer les Stocks & Réceptions",
            icon: "📦",
            content: "Suivez vos entrées et sorties de marchandises.",
            points: [
                "Voir le stock → [PATH:/inventory] Menu 'Inventaire' → Liste des produits avec quantités → Barre rouge = Stock critique.",
                "Réceptionner → Bouton 'Réception' → Scannez ou saisissez le BL → Validez les quantités → Enregistrer.",
                "Créer une commande → '+ Commande Fournisseur' → Sélectionnez articles → Quantités → Envoyez."
            ]
        },
        {
            title: "Alertes & Valorisation",
            icon: "💰",
            content: "Maîtrisez vos alertes et votre valeur de stock.",
            points: [
                "Configurer une alerte → Fiche produit → Champ 'Seuil Critique' → Entrez la quantité min → Enregistrer.",
                "Voir les DLC → Onglet 'Expirations' → Liste triée par date → Produits en rouge = à utiliser en priorité.",
                "Exporter la valeur → Menu 'Rapports' → 'Valorisation Stock' → Choisissez PMP ou FIFO → Télécharger PDF."
            ]
        }
    ]
};
