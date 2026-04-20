// @ts-nocheck
// @ts-nocheck
import { Instagram } from 'lucide-react';
import { DocCategory } from '@/types';

export const socialMarketing: DocCategory = {
    title: 'Marketing & Rayonnement Social',
    description: 'Gérez votre e-réputation et votre présence digitale. Ce module centralise vos réseaux sociaux et vos avis pour une image de marque cohérente et prestigieuse.',
    icon: Instagram,
    color: '#833ab4',
    details: [
        { label: 'Gestionnaire d\'Avis', content: 'Interface unifiée pour répondre aux avis Google, TripAdvisor et Yelp avec des suggestions de réponses par IA.' },
        { label: 'Planificateur Social', content: 'Programmation de vos publications Instagram et Facebook mettant en avant vos plats signatures et vos événements.' },
        { label: 'Analyse Reputation', content: 'Suivi de votre note moyenne et analyse sémantique des commentaires pour identifier les points forts/faibles.' },
        { label: 'Base de données Image', content: 'Photothèque centralisée pour vos équipes marketing incluant les visuels professionnels de vos plats.' },
        { label: 'Campagnes Couponing', content: 'Création de codes promotionnels traçables pour mesurer le ROI exact de vos campagnes publicitaires.' },
        { label: 'Surveille de Concurrence', content: 'Veille automatique sur les prix et les avis de vos concurrents directs dans votre zone géographique.' }
    ],
    fullTutorial: [
        {
            title: "Répondre aux Avis",
            icon: "📸",
            content: "Gérez votre e-réputation efficacement.",
            points: [
                "Voir les nouveaux avis → [PATH:/social-marketing] Menu 'Avis' → Liste triée par date → Points rouges = non répondus.",
                "Répondre avec IA → Cliquez sur un avis → Bouton 'Suggestion IA' → Adaptez le texte → Publier.",
                "Voir l'évolution de la note → Onglet 'Tendance' → Graphique de votre note moyenne → Survolez pour détails."
            ]
        },
        {
            title: "Planifier des Publications",
            icon: "🕵️",
            content: "Programmez votre présence sur les réseaux.",
            points: [
                "Créer une publication → Menu 'Social' → '+ Post' → Ajoutez image + texte → Sélectionnez date/heure → Programmer.",
                "Utiliser la photothèque → Lors de la création → Icône 'Bibliothèque' → Sélectionnez un visuel validé.",
                "Créer un code promo → Menu 'Campagnes' → '+ Code' → Définissez remise + validité → Générez le code traçable."
            ]
        }
    ]
};
