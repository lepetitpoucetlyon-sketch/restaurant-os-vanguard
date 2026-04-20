import { Heart } from 'lucide-react';
import { DocCategory } from '@/types';

export const customer: DocCategory = {
    title: 'Customer Hôtelier & Intelligence Client',
    description: 'Le cœur de votre stratégie de fidélisation. Le Customer stocke et analyse chaque interaction pour recréer une expérience ultra-personnalisée, transformant chaque convive en ambassadeur régulier de votre établissement.',
    icon: Heart,
    color: '#1c3c2d',
    details: [
        { label: 'Fiches Hôtes Riches', content: 'Base de données centralisée incluant identité, anniversaires, préférences de table, allergies et historique de consommations.' },
        { label: 'Segmentation IA', content: 'Tagage automatique des profils : VIP, Critique, Habitué, Client à Risque (Désengagement), ou Presse/Influent.' },
        { label: 'Engagement RFM', content: 'Analyse automatique de la Récence, Fréquence et Montant pour identifier vos clients les plus profitables (Top Spenders).' },
        { label: 'Marketing Prédictif', content: 'Déclenchement d\'e-mails ou SMS de courtoisie pour les événements spéciaux ou après une période d\'inactivité prolongée.' },
        { label: 'Historique des Notes', content: 'Accès aux commentaires confidentiels laissés par les différents maîtres d\'hôtel pour un accueil "Nommé" immédiat.' },
        { label: 'Tracking de Satisfaction', content: 'Agrégation des avis Google/TripAdvisor directement liés à la fiche client pour un suivi qualité individualisé.' }
    ],
    fullTutorial: [
        {
            title: "Gérer les Fiches Clients",
            icon: "🤝",
            content: "Chaque client a un profil riche pour un accueil personnalisé.",
            points: [
                "Créer un client → [PATH:/customer] Bouton '+ Client' → Remplissez Nom, Prénom, Tél, Email → Onglet 'Préférences' pour allergies/table → Enregistrer.",
                "Ajouter une note → Ouvrez la fiche client → Onglet 'Notes' → '+ Note' → Tapez votre commentaire → Enregistrer.",
                "Consulter l'historique → Fiche client → Onglet 'Visites' → Liste des réservations passées avec montants dépensés."
            ]
        },
        {
            title: "Analyse & Marketing",
            icon: "📈",
            content: "Exploitez les données pour fidéliser et réactiver.",
            points: [
                "Voir le score RFM → Liste clients → Colonne 'Score' → Cliquez sur un client → Détail Récence/Fréquence/Montant.",
                "Filtrer les VIP → Barre de filtres → Tag 'VIP' → Seuls les clients premium s'affichent.",
                "Lancer une campagne → Menu 'Marketing' → '+ Campagne' → Sélectionnez segment → Rédigez message → Envoyer."
            ]
        }
    ]
};
