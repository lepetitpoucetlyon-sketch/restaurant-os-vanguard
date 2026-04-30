import { Briefcase } from 'lucide-react';
import { DocCategory } from '@nexus/contracts';

export const onboarding: DocCategory = {
    title: 'Onboarding & Culture Équipe',
    description: 'Créez une culture d\'excellence dès le premier jour. Le module Onboarding assure une intégration professionnelle et standardisée de chaque nouveau collaborateur.',
    icon: Briefcase,
    color: '#1c3c2d',
    details: [
        { label: 'Parcours de Formation', content: 'Module interactif de bienvenue avec présentation de la vision et des valeurs de l\'établissement.' },
        { label: 'Checklist Prise de Poste', content: 'Guide pas à pas pour les premières heures de travail (Tenue, Casier, Outils, Codes de caisse).' },
        { label: 'Académie Vidéo', content: 'Bibliothèque de micro-learning pour apprendre les procédures signatures (Service au guéridon, Mixologie).' },
        { label: 'Validation Acquis', content: 'Quiz rapides pour valider la connaissance de la carte et des allergènes avant le premier service.' },
        { label: 'Documents Numériques', content: 'Signature dématérialisée du règlement intérieur, des fiches de sécurité et du livret d\'accueil.' },
        { label: 'Lien de Parrainage', content: 'Affectation d\'un "Buddy" (mentor) pour accompagner le nouveau recru durant sa première semaine.' }
    ],
    fullTutorial: [
        {
            title: "Intégrer un Nouveau Collaborateur",
            icon: "🎓",
            content: "Lancez le parcours d'intégration.",
            points: [
                "Créer un profil → [PATH:/onboarding] Menu 'Staff' → '+ Employé' → Remplissez les infos → Cochez 'Activer Onboarding' → Enregistrer.",
                "Suivre la progression → Fiche employé → Onglet 'Onboarding' → Barre de progression + tâches restantes.",
                "Affecter un mentor → Champ 'Buddy' → Sélectionnez un collègue expérimenté → Enregistrer."
            ]
        },
        {
            title: "Quiz & Documents",
            icon: "✅",
            content: "Validez les compétences avant le premier service.",
            points: [
                "Lancer un quiz → Fiche employé → Onglet 'Formation' → Bouton 'Quiz Allergènes' → L'employé reçoit un lien.",
                "Faire signer un document → Onglet 'Documents' → Sélectionnez le livret → 'Envoyer pour signature' → Statut 'Signé' apparaît.",
                "Voir les vidéos → Menu 'Académie' → Liste des tutoriels → Cliquez pour visionner → Marquez 'Vu' quand terminé."
            ]
        }
    ]
};
