// @ts-nocheck
// @ts-nocheck
import { CalendarRange } from 'lucide-react';
import { DocCategory } from '@/types';

export const planning: DocCategory = {
    title: 'Planning & Capital Humain',
    description: 'Optimisation de la masse salariale et épanouissement des équipes. Gérez vos ressources humaines avec agilité, prévision et conformité au droit du travail.',
    icon: CalendarRange,
    color: '#C5A059',
    details: [
        { label: 'Planning Drag & Drop', content: 'Conception ergonomique des shifts par station de travail avec contrôle automatique des repos légaux.' },
        { label: 'Productivité Salaire', content: 'Visualisation immédiate du ratio de masse salariale par rapport au chiffre d\'affaires prévisionnel de la journée.' },
        { label: 'Pointeuse Intelligente', content: 'Enregistrement sécurisé des heures réelles de prise et de fin de poste pour une paie sans aucune contestation.' },
        { label: 'Espace Collaborateur', content: 'Portail mobile pour les employés : consultation de planning, demandes de congés et accès aux documents RH.' },
        { label: 'Variables de Paie', content: 'Compilation automatisée des heures supplémentaires, primes, et absences pour transfert direct au cabinet de paie.' },
        { label: 'Tutoriels d\'Intégration', content: 'Accès direct aux vidéos de formation interne pour accélérer l\'onboarding des nouveaux arrivants.' }
    ],
    fullTutorial: [
        {
            title: "Créer & Modifier le Planning",
            icon: "📅",
            content: "Gérez les shifts de votre équipe.",
            points: [
                "Ajouter un shift → [PATH:/planning] Cliquez sur une case vide (jour + employé) → Pop-up s'ouvre → Entrez horaires → Enregistrer.",
                "Modifier un shift → Cliquez sur le shift existant → Modifiez les horaires → Ou glissez-déposez vers un autre jour.",
                "Dupliquer la semaine → Bouton 'Dupliquer' en haut → Sélectionnez la semaine cible → Validez."
            ]
        },
        {
            title: "Pointage & Congés",
            icon: "👥",
            content: "Suivez les présences et gérez les absences.",
            points: [
                "Valider un pointage → Menu 'Pointeuse' → Liste des entrées/sorties → Cliquez pour valider ou corriger.",
                "Traiter une demande de congé → Icône cloche → Section 'Congés' → 'Approuver' ou 'Refuser' → Le planning se met à jour.",
                "Voir le ratio masse salariale → Bandeau en haut du planning → Pourcentage affiché → Cliquez pour détails par poste."
            ]
        }
    ]
};
