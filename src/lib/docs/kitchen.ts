import { ChefHat } from 'lucide-react';
import { DocCategory } from '@nexus/contracts';

export const kitchen: DocCategory = {
    title: 'Fiche Technique & Standardisation',
    description: 'Standardisation de l\'excellence culinaire et contrôle strict du Food Cost. Centralisez votre patrimoine créatif pour une qualité constante sur chaque assiette.',
    icon: ChefHat,
    color: '#8B7355',
    recipe: {
        name: 'Burrata Crémeuse',
        description: 'Burrata des Pouilles sélectionnée, lit de tomates cerises anciennes confites, pesto basilic maison et crumble de pistaches de Sicile.',
        image: 'https://images.unsplash.com/photo-1594910350538-40624bbdec27?q=80&w=1200&auto=format&fit=crop',
        prepTime: '25 min',
        difficulty: 'moyen',
        ingredients: [
            { name: 'Burrata di Bufala DOP (125g)', quantity: '1 pièce' },
            { name: 'Tomates cerises anciennes', quantity: '150 g' },
            { name: 'Pesto basilic frais maison', quantity: '30 g' },
            { name: 'Huile d\'olive extra vierge Sicile', quantity: '20 ml' },
            { name: 'Vinaigre balsamique de Modène', quantity: '10 ml' },
            { name: 'Pistaches de Sicile concassées', quantity: '15 g' },
            { name: 'Feuilles de basilic frais', quantity: '6 feuilles' },
            { name: 'Fleur de sel de Guérande', quantity: '1 pincée' },
            { name: 'Poivre noir du moulin', quantity: 'QS' },
            { name: 'Pain de campagne (croutons)', quantity: '40 g' }
        ],
        steps: [
            { order: '01', instruction: 'Sortir la burrata du réfrigérateur 20 minutes avant le service pour qu\'elle soit à température ambiante. Vérifier la DLC et l\'intégrité de l\'emballage.', time: '2 MIN' },
            { order: '02', instruction: 'Laver et sécher les tomates cerises. Les couper en deux et les disposer sur une plaque. Assaisonner d\'huile d\'olive, sel et poivre. Passer au four à 180°C pendant 8 minutes pour les confire légèrement.', time: '10 MIN' },
            { order: '03', instruction: 'Réaliser le crumble de pistaches : mixer grossièrement les pistaches et les mélanger avec un filet d\'huile d\'olive. Réserver à température ambiante.', time: '3 MIN' },
            { order: '04', instruction: 'Chauffer l\'assiette de service à 45°C. Étaler le pesto en un cercle irrégulier au centre de l\'assiette chaude à l\'aide d\'une cuillère, en créant un mouvement fluide.', time: '2 MIN' },
            { order: '05', instruction: 'Disposer les tomates cerises confites autour du pesto. Déposer délicatement la burrata au centre. Ouvrir légèrement le dessus de la burrata pour révéler la stracciatella crémeuse.', time: '5 MIN' },
            { order: '06', instruction: 'Finition : Parsemer de pistaches concassées, ajouter les feuilles de basilic, un filet d\'huile d\'olive, une touche de balsamique en cercles et la fleur de sel. Servir immédiatement avec les croutons à côté.', time: '3 MIN' }
        ],
        allergens: ['Lait', 'Gluten', 'Fruits à coque']
    },

    details: [
        { label: 'Codification Recettes', content: 'Fiches techniques avec étapes de préparation, photos de dressage et calcul automatique du Food Cost théorique.' },
        { label: 'Mise en Place Live', content: 'Liste des tâches de préparation par service avec attribution individuelle et suivi de progression numérique.' },
        { label: 'Registre des Pertes', content: 'Saisie simplifiée du gaspillage (Casse, Erreur, Périmé) pour un ajustement précis de la valeur de stock.' },
        { label: 'Calcul des Rendements', content: 'Prise en compte du coefficient de perte lors de la transformation des produits bruts (ex: parage viande).' },
        { label: 'Exemple Pratique', content: 'Consultez la fiche "Burrata Crémeuse" pour voir un exemple de standardisation haute fidélité.' },
        { label: 'Alerte Ratio Marge', content: 'Notification automatique si le prix d\'achat dynamique d\'un ingrédient risque de dégrader la marge cible du plat.' }
    ],
    fullTutorial: [
        {
            title: "Créer & Consulter une Fiche Technique",
            icon: "📖",
            content: "La fiche technique standardise vos recettes pour une qualité constante.",
            points: [
                "Créer une recette → [PATH:/kitchen] Bouton '+ Nouvelle Recette' → Remplissez Nom, Description, Temps de préparation → Suivant.",
                "Ajouter des ingrédients → Onglet 'Ingrédients' → Recherchez l'ingrédient → Entrez la quantité → Ajoutez.",
                "Consulter le Food Cost → Icône '€' à côté de la recette → Le coût théorique s'affiche avec la marge."
            ]
        },
        {
            title: "Mise en Place & Pertes",
            icon: "🔪",
            content: "Gérez la préparation quotidienne et enregistrez les pertes.",
            points: [
                "Créer une tâche Mise en Place → Bouton '+ Tâche' → Sélectionnez la recette → Assignez un cuisinier → Validez.",
                "Valider une tâche → Cliquez sur la tâche terminée → Bouton 'Fait' → Elle passe en vert.",
                "Enregistrer une perte → Menu 'Pertes' → '+ Perte' → Sélectionnez produit, quantité, motif → Enregistrer."
            ]
        }
    ]
};
