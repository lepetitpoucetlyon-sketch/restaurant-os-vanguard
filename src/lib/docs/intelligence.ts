// @ts-nocheck
// @ts-nocheck
import { BrainCircuit } from 'lucide-react';
import { DocCategory } from '@/types';

export const intelligence: DocCategory = {
    title: 'Executive Intelligence & Simulations',
    description: 'Le cerveau stratégique du Restaurant OS. Utilisez la puissance de l\'intelligence artificielle pour modéliser le futur de votre établissement et anticiper les fluctuations du marché.',
    icon: BrainCircuit,
    color: '#C5A059',
    details: [
        { label: 'What-If Simulator', content: 'Testez l\'impact d\'une hausse du prix des vins ou d\'une modification de la carte sur votre bénéfice net annuel.' },
        { label: 'Forecast Affluence', content: 'Algorithme prédisant le nombre de couverts à 7 jours selon l\'historique, la météo et les événements locaux.' },
        { label: 'Menu Engineering', content: 'Identification des plats "Stars" et "Chiens" via l\'analyse croisée de la popularité et de la rentabilité (Matrice BCG).' },
        { label: 'Auto-Sentiment Analysis', content: 'L\'IA lit et synthétise tous vos avis digitaux pour vous fournir un rapport mensuel sur les points d\'amélioration.' },
        { label: 'Optimisation Staffing', content: 'Analyse des flux de service pour suggérer le nombre idéal de personnel par station et ainsi réduire la masse salariale.' },
        { label: 'Détection d\'Anomalies', content: 'Surveillance intelligente des opérations de caisse (Offerts, Annulations) pour prévenir la fraude ou les erreurs répétées.' }
    ],
    fullTutorial: [
        {
            title: "Simulateur What-If",
            icon: "🧪",
            content: "Testez vos décisions stratégiques avant de les appliquer.",
            points: [
                "Lancer une simulation → [PATH:/intelligence] Menu 'Simulations' → '+ Nouveau Scénario' [CLICK] → Choisissez le type (Prix, Carte, Staff).",
                "Modifier un paramètre → Ajustez le curseur (ex: +10% sur le prix du vin) → Le graphique se met à jour en temps réel.",
                "Sauvegarder → Bouton 'Enregistrer Scénario' → Donnez un nom → Retrouvez-le dans 'Mes Scénarios'."
            ]
        },
        {
            title: "Prévisions & Menu Engineering",
            icon: "🔮",
            content: "Anticipez l'affluence et optimisez votre carte.",
            points: [
                "Voir les prévisions → Onglet 'Forecast' → Sélectionnez la semaine → Consultez les couverts prévus par jour.",
                "Analyser le Menu → Menu 'Engineering' → Graphique Stars/Dogs s'affiche → Cliquez sur un plat pour détails.",
                "Appliquer une recommandation → Pop-up 'Action Suggérée' → 'Appliquer' → Le changement est programmé."
            ]
        }
    ]
};
