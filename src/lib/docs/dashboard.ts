import { LayoutGrid } from 'lucide-react';
import { DocCategory } from '@nexus/contracts';

export const dashboard: DocCategory = {
    title: 'Tableau de Bord Stratégique',
    description: 'Le centre de commandement "Executive Intelligence" offre une vision 360° en temps réel sur la performance globale de votre établissement. Il agrège les données financières, opérationnelles et relationnelles pour une prise de décision éclairée basée sur des données consolidées en temps réel.',
    icon: LayoutGrid,
    color: '#1c3c2d',
    details: [
        { label: 'Indicateurs Clés (KPI)', content: 'Suivi du CA brut, CA net, ticket moyen par couvert et taux d\'occupation dynamique. Comparez vos performances avec N-1.' },
        { label: 'Centre de Notifications', content: 'Alertes critiques sur les stocks bas (Seuils de rupture), les DLC courtes et les arrivées imminentes de vos clients VIP.' },
        { label: 'Analyse Prédictive IA', content: 'Comparaison automatique entre le réalisé du jour et les prévisions générées par l\'IA selon l\'historique et la météo.' },
        { label: 'Flux d\'Activité Live', content: 'Visualisation en direct des commandes en cours, des tables prêtes pour le départ et de l\'état des services de cuisine.' },
        { label: 'Objectifs Stratégiques', content: 'Suivi de progression vers les objectifs de chiffre d\'affaires et de ratio de coût matière définis pour la période.' },
        { label: 'Radar de Performance', content: 'Vue consolidée de l\'efficacité de votre brigade, du temps d\'envoi moyen et de la satisfaction client digitale.' }
    ],
    fullTutorial: [
        {
            title: "Pilotage des Indicateurs Stratégiques",
            icon: "💰",
            content: "Le tableau de bord est votre tour de contrôle. Chaque chiffre est cliquable pour une analyse en profondeur.",
            points: [
                "Voir le détail du CA → [PATH:/] Cliquez sur la carte 'Chiffre d'Affaires' → Un panneau latéral affiche la ventilation par catégorie.",
                "Analyser le Ticket Moyen → Cliquez sur la valeur '€/couvert' → Consultez l'évolution sur 7 jours.",
                "Identifier les goulots → Cliquez sur 'Radar de Performance' → Inspectez les temps moyens par station (Cuisine, Bar)."
            ]
        },
        {
            title: "Intelligence Prédictive & Alertes",
            icon: "🧠",
            content: "L'IA scanne vos données pour anticiper les besoins du service. Voici comment l'exploiter.",
            points: [
                "Consulter les prévisions → [PATH:/] Cliquez sur l'icône 'Cerveau' en haut à droite → Sélectionnez 'Prévisions du jour'.",
                "Traiter une alerte stock → Cliquez sur la notification rouge 'Stock Critique' → Puis 'Commander' pour créer un bon fournisseur.",
                "Préparer l'accueil VIP → Cliquez sur 'Arrivées Attendues' → Icône étoile à côté du nom → Voir préférences client."
            ]
        }
    ]
};
