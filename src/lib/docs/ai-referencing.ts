import { Bot } from 'lucide-react';
import { DocCategory } from '@/types';

export const aiReferencing: DocCategory = {
    title: 'Référencement IA & SEO Local',
    description: 'Optimisez votre visibilité sur les moteurs de recherche et les assistants vocaux. L\'IA travaille pour que votre restaurant apparaisse toujours en première position.',
    icon: Bot,
    color: '#C5A059',
    details: [
        { label: 'Optimisation GMB', content: 'Mise à jour automatique de votre fiche Google Business Profile avec vos horaires, menus et actualités.' },
        { label: 'SEO Sémantique', content: 'Analyse des mots-clés recherchés par vos clients potentiels pour adapter le contenu de votre menu digital.' },
        { label: 'Local Citations', content: 'Synchronisation de vos coordonnées sur plus de 50 annuaires et guides gastronomiques en ligne.' },
        { label: 'Assistant Vocal Ready', content: 'Formatage de vos données pour être indexé parfaitement par Siri, Alexa et Google Assistant.' },
        { label: 'Tracking de Position', content: 'Rapport hebdomadaire sur votre classement dans les résultats de recherche locaux.' },
        { label: 'Intelligence Menu', content: 'L\'IA réécrit vos descriptions de plats pour maximiser leur indexation et leur pouvoir de conversion.' }
    ],
    fullTutorial: [
        {
            title: "Optimiser Google Business",
            icon: "🌐",
            content: "Dominez les résultats de recherche locaux.",
            points: [
                "Mettre à jour la fiche → [PATH:/ai-referencing] Menu 'SEO' → 'Google Business' → Modifiez horaires, photos, description → Synchroniser.",
                "Voir le classement → Onglet 'Positions' → Tableau des mots-clés → Colonne 'Rang' indique votre position.",
                "Réécrire avec IA → Sélectionnez un plat → Bouton 'Optimiser IA' → Nouvelle description générée → Appliquer."
            ]
        },
        {
            title: "Citations & Assistants Vocaux",
            icon: "🎙️",
            content: "Soyez trouvable partout.",
            points: [
                "Synchroniser les annuaires → Menu 'Citations' → Vérifiez le statut → 'Mettre à jour' pour corriger les incohérences.",
                "Tester la recherche vocale → Bouton 'Test Vocal' → Dictez 'Restaurant italien près de moi' → Vérifiez si vous apparaissez.",
                "Voir le rapport hebdo → Icône enveloppe → Rapport 'Performance SEO' → Ouvrez le PDF ou consultez en ligne."
            ]
        }
    ]
};
