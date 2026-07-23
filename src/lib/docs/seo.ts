import { Globe } from 'lucide-react';
import { DocCategory } from '@nexus/contracts';

export const seo: DocCategory = {
    title: 'SEO & Référencement',
    description: 'Optimisez la visibilité de votre site web sur les moteurs de recherche. Suivez vos scores, analysez votre trafic et améliorez vos méta-données pour attirer plus de convives.',
    icon: Globe,
    color: '#3B82F6',
    details: [
        { label: 'Score Global', content: 'Évaluation en temps réel de votre santé SEO basée sur plus de 50 critères techniques et sémantiques.' },
        { label: 'Indicateurs de Performance', content: 'Suivi du trafic organique, du taux de clics (CTR) et du nombre de pages indexées.' },
        { label: 'Audit par Page', content: 'Détail précis des optimisations nécessaires pour chaque page de votre établissement (Menu, Réservation, Accueil).' },
        { label: 'Google Business', content: 'Lien direct avec votre fiche établissement pour assurer la cohérence des informations locales.' }
    ],
    fullTutorial: [
        {
            title: "Analyser vos Performances",
            icon: "📈",
            content: "Comprenez comment les clients vous trouvent en ligne.",
            points: [
                "Vérifier le score global → [PATH:/seo] Regardez la jauge principale → Un score > 80 est excellent. [SELECTOR:#seo-score-gauge]",
                "Suivre le trafic organique → Examinez la carte 'Trafic Organique' → Identifiez les tendances de recherche. [SELECTOR:#seo-traffic-stat]",
                "Voir les pages indexées → Carte 'Pages Indexées' → Assurez-vous que tout votre menu est visible. [SELECTOR:#seo-indexed-stat]"
            ]
        },
        {
            title: "Optimiser les Pages",
            icon: "🛠️",
            content: "Améliorez chaque page individuellement.",
            points: [
                "Identifier les problèmes → Liste des pages → Regardez les badges rouges 'Issue' → Cliquez pour voir le détail. [SELECTOR:#seo-pages-list]",
                "Modifier les Métas → Cliquez sur l'icône édition d'une page → Ajustez le titre et la description → Valider. [SELECTOR:#seo-edit-page-0]"
            ]
        }
    ]
};
