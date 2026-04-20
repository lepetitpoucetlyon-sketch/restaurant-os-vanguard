// @ts-nocheck
// @ts-nocheck
import { Map } from 'lucide-react';
import { DocCategory } from '@/types';

export const floorPlan: DocCategory = {
    title: 'Plan de Salle Interactif',
    description: 'Interface visuelle 1:1 de votre établissement permettant une gestion géographique des services. Le plan de salle communique en temps réel avec le POS et le système de réservations pour une synchronisation totale.',
    icon: Map,
    color: '#C5A059',
    details: [
        { label: 'Visualisation Dynamique', content: 'Code couleur par état de table : Libre, Occupée (Temps de repas), Demandée (Action requise), Réservée (Arrivée imminente).' },
        { label: 'Multi-Zones Premium', content: 'Gestion isolée ou globale de vos espaces : Salon Alpha, Terrasse, Private Lounge ou Bar, avec configuration spécifique par zone.' },
        { label: 'Contrôle Terminal', content: 'Lancez les "suites", demandez l\'addition ou validez un paiement directement depuis la vue plan sur tablette mobile.' },
        { label: 'Modularité de Salle', content: 'Fusionnez ou séparez vos tables virtuellement en un clic pour accueillir de grands groupes tout en conservant la traçabilité.' },
        { label: 'Alertes d\'Inactivité', content: 'Indication visuelle clignotante si une table n\'a reçu aucune interaction (boisson, suite) depuis un délai pré-défini.' },
        { label: 'Statistiques de Zone', content: 'Superposition de données analytiques montrant la rentabilité et le ticket moyen réel par zone géographique de la salle.' }
    ],
    fullTutorial: [
        {
            title: "Navigation & Contrôle Visuel",
            icon: "🗺️",
            content: "Le plan de salle est votre interface de commande principale pour le service.",
            points: [
                "Voir une table → [PATH:/floor-plan] Cliquez sur n'importe quelle table → Un panneau latéral affiche le statut, la commande en cours et le temps écoulé.",
                "Changer de zone → Cliquez sur les onglets 'Terrasse', 'Salon', 'Bar' en haut → Seules les tables de cette zone sont affichées.",
                "Ajouter une table → Bouton '+ Table' (coin supérieur droit) → Choisissez forme et capacité → Placez sur le plan."
            ]
        },
        {
            title: "Actions Rapides en Salle",
            icon: "⚡",
            content: "Exécutez les opérations courantes sans quitter la vue plan.",
            points: [
                "Fusionner des tables → Maintenez 'Shift' + Cliquez sur 2 tables → Bouton 'Fusionner' → Validez.",
                "Demander l'addition → Cliquez sur la table → Bouton 'Addition' (icône €) → La table passe en statut 'Paiement'.",
                "Libérer une table → Après encaissement, cliquez sur la table → 'Libérer' → Elle repasse en vert (Libre)."
            ]
        }
    ]
};
