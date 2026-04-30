import { Layout } from 'lucide-react';
import { DocCategory } from '@nexus/contracts';

export const general: DocCategory = {
    title: 'Vue d\'Ensemble du Système',
    description: 'Une plateforme unifiée pensée pour l\'excellence opérationnelle. Découvrez comment les différents modules de Restaurant OS collaborent pour automatiser votre gestion et maximiser votre rentabilité.',
    icon: Layout,
    color: '#1c3c2d',
    details: [
        { label: 'Indicateurs Clés de Performance (KPI)', content: 'Suivi en temps réel du Chiffre d\'Affaires, couvert moyen, marge brute et ratio de masse salariale.' },
        { label: 'Gouvernance Multi-Établissement', content: 'Centralisation des données pour les groupes de restauration avec rapports consolidate et gestion des droits par site.' },
        { label: 'Expérience Client 360°', content: 'Fidélisation intelligente reliant les réservations, les préférences de table et l\'historique de consommation.' },
        { label: 'Contrôle des Coûts Chirurgical', content: 'Optimisation du Food Cost via des fiches techniques précises et un inventaire dynamique proactif.' }
    ],
    fullTutorial: [
        {
            title: "Navigation & Interface MCC",
            icon: "🖥️",
            content: "Le Master Command Control (MCC) est votre centre de pilotage stratégique.",
            points: [
                "Accéder au Dashboard → [PATH:/dashboard] Cliquez sur l'icône Maison dans la barre latérale pour voir vos KPIs globaux.",
                "Changer d'Établissement → Utilisez le sélecteur en haut à gauche pour basculer entre vos différents restaurants.",
                "Recherche Globale → Appuyez sur 'Cmd+K' (Mac) ou 'Ctrl+K' (Windows) pour naviguer instantanément vers n'importe quel module."
            ]
        },
        {
            title: "Protocoles de Lancement",
            icon: "🚀",
            content: "Assurez-vous que votre établissement est prêt pour le service.",
            points: [
                "Ouverture de Service → [PATH:/pos] Cliquez sur 'Ouvrir Caisse' → Déclarez votre fond de caisse initial.",
                "Briefing Équipe → Consultez le module Planning pour voir les effectifs du jour et les notes de service.",
                "Vérification HACCP → Validez les relevés de température critiques avant l'arrivée du premier client."
            ]
        }
    ]
};
