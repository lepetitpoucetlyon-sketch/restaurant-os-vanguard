// @ts-nocheck
// @ts-nocheck
import { Wine } from 'lucide-react';
import { DocCategory } from '@/types';

export const bar: DocCategory = {
    title: 'Bar, Vins & Sommellerie',
    description: 'Gestion spécialisée des liquides et de la cave. De la mixologie de précision à la gestion des grands crus, assurez une traçabilité et une rentabilité millimétrée.',
    icon: Wine,
    color: '#8B7355',
    details: [
        { label: 'Cave Digitale Live', content: 'Inventaire dynamique des bouteilles avec mise à jour automatique des stocks lors de la commande au bar.' },
        { label: 'Accords Mets-Vins', content: 'Base de données intelligente suggérant le meilleur vin au serveur selon le plat sélectionné par le client.' },
        { label: 'Gestion des Débits', content: 'Suivi des consommations au verre, pesée des fûts ou intégration avec débitmètres pour éviter la démarque inconnue.' },
        { label: 'Mixologie & Coût', content: 'Calcul du "Food Cost" au centilitre pour chaque cocktail création incluant les garnitures et alcools premium.' },
        { label: 'Menu Sommelier', content: 'Option de carte des vins interactive sur tablette pour les clients avec fiches descriptives et terroirs.' },
        { label: 'Sorties de Cave', content: 'Procédure sécurisée de déstockage des bouteilles de prestige avec validation par le sommelier responsable.' }
    ],
    fullTutorial: [
        {
            title: "Gestion de la Cave",
            icon: "🍷",
            content: "Organisez et suivez votre inventaire de vins.",
            points: [
                "Ajouter une bouteille → [PATH:/bar] Menu 'Cave' → '+ Entrée' → Scannez l'étiquette ou saisissez manuellement → Enregistrer.",
                "Sortir une bouteille → Fiche du vin → Bouton 'Sortie' → Indiquez la raison (Vente, Casse, Dégustation) → Valider.",
                "Voir le stock par région → Onglet 'Cave' → Filtres en haut → Sélectionnez 'Bourgogne', 'Bordeaux', etc."
            ]
        },
        {
            title: "Cocktails & Rentabilité Bar",
            icon: "🍸",
            content: "Optimisez vos marges sur la carte boissons.",
            points: [
                "Créer une fiche cocktail → Menu 'Cocktails' → '+ Nouveau' → Ingrédients + quantités en cl → Le coût se calcule.",
                "Analyser les ventes → Onglet 'Analytics Bar' → Top 10 des cocktails → Comparez marge vs volume.",
                "Configurer une promo → Menu 'Happy Hour' → Définissez horaires + remise → Activez → Visible au POS."
            ]
        }
    ]
};
