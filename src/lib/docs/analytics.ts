// @ts-nocheck
// @ts-nocheck
import { BarChart3 } from 'lucide-react';
import { DocCategory } from '@/types';

export const analytics: DocCategory = {
    title: 'Business Intelligence & BI',
    description: 'Exploration profonde de vos données opérationnelles. Transformez les millions de points de données de votre restaurant en insights actionnables pour booster votre rentabilité.',
    icon: BarChart3,
    color: '#1c3c2d',
    details: [
        { label: 'Cubes de Données', content: 'Navigation multi-dimensionnelle permettant de filtrer vos ventes par serveur, par heure ou par groupe de produits.' },
        { label: 'Analyse Panier (Basket)', content: 'Détermination des articles les plus souvent achetés ensemble pour optimiser vos menus et vos promotions.' },
        { label: 'Tracking de Rétention', content: 'Mesure du taux de retour de vos clients et identification des cohortes les plus fidèles ou les plus dépensières.' },
        { label: 'Performance Multi-site', content: 'Comparaison en temps réel des performances si vous gérez plusieurs établissements au sein d\'un même groupe.' },
        { label: 'Exports Dynamiques', content: 'Génération de rapports PDF élégants ou exports CSV/Excel pour des analyses complémentaires sur mesure.' },
        { label: 'Suivi de Conversion', content: 'Mesure de l\'efficacité de vos campagnes marketing (Instagram/Ads) sur votre chiffre d\'affaires réel en salle.' }
    ],
    fullTutorial: [
        {
            title: "Explorer les Données de Vente",
            icon: "📊",
            content: "Analysez vos performances en profondeur.",
            points: [
                "Voir les ventes par catégorie → [PATH:/analytics] Menu 'Analytics' → Onglet 'Ventes' → Sélectionnez la période → Graphique par catégorie.",
                "Analyser par serveur → Filtre 'Serveur' → Sélectionnez un nom → Comparez CA et ticket moyen.",
                "Identifier les heures creuses → Onglet 'Heatmap' → Visualisez l'intensité des ventes par heure → Spots foncés = pic."
            ]
        },
        {
            title: "Exporter & Partager",
            icon: "🚀",
            content: "Générez des rapports pour votre direction.",
            points: [
                "Exporter un rapport → Bouton 'Exporter' → Choisissez PDF ou Excel → Téléchargez.",
                "Programmer un envoi auto → Menu 'Rapports' → '+ Rapport Programmé' → Fréquence + destinataires → Activez.",
                "Comparer des périodes → Icône 'Comparer' → Sélectionnez 2 périodes (ex: Sem. actuelle vs N-1) → Graphique comparatif."
            ]
        }
    ]
};
