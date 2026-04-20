// @ts-nocheck
// @ts-nocheck
import { Users } from 'lucide-react';
import { DocCategory } from '@/types';

export const staff: DocCategory = {
    title: 'Ressources Humaines & Talents',
    description: 'Gérez votre capital humain avec la même précision que vos stocks. Centralisez les carrières, les contrats et le développement des compétences de vos équipes.',
    icon: Users,
    color: '#1c3c2d',
    details: [
        { label: 'Coffre-fort Salarié', content: 'Archivage sécurisé des contrats, pièces d\'identité, diplômes et visites médicales de chaque employé.' },
        { label: 'Suivi des Compétences', content: 'Cartographie des talents (Matrice de polyvalence) pour organiser au mieux vos brigades de service.' },
        { label: 'Entretiens Annuels', content: 'Planification et archivage des entretiens de progrès et de l\'évolution de la rémunération.' },
        { label: 'Alertes Légales RH', content: 'Notifications automatiques pour les renouvellements de contrats ou les fins de périodes d\'essai.' },
        { label: 'Variable de Paie', content: 'Historique des primes, heures sup et avantages en nature pour une transparence totale.' },
        { label: 'Registre du Personnel', content: 'Tenue automatique du registre unique du personnel répondant aux obligations légales.' }
    ],
    fullTutorial: [
        {
            title: "Gérer les Dossiers Employés",
            icon: "📁",
            content: "Centralisez la documentation RH.",
            points: [
                "Ajouter un document → [PATH:/staff] Fiche employé → Onglet 'Coffre-fort' → '+ Document' → Uploadez le fichier → Catégorisez.",
                "Voir le registre du personnel → Menu 'RH' → 'Registre' → Liste automatique des employés → Export PDF possible.",
                "Configurer une alerte → Fiche employé → Champ 'Fin de Contrat' → L'alerte se déclenche 30 jours avant."
            ]
        },
        {
            title: "Compétences & Entretiens",
            icon: "🌟",
            content: "Développez vos talents.",
            points: [
                "Créer la matrice polyvalence → Menu 'Compétences' → Tableau employés × postes → Cochez les maîtrises → Enregistrer.",
                "Planifier un entretien → Fiche employé → '+ Entretien' → Date + Objectifs → Le RDV apparaît dans l'agenda.",
                "Exporter les variables paie → Menu 'Paie' → Sélectionnez la période → 'Exporter' → Fichier prêt pour le cabinet."
            ]
        }
    ]
};
