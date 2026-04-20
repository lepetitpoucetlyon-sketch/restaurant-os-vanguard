import { Calendar } from 'lucide-react';
import { DocCategory } from '@/types';

export const reservations: DocCategory = {
    title: 'Manifeste & Réservations',
    description: 'Un système de hostrie digitale conçu pour maximiser le taux d\'occupation et fluidifier l\'accueil. Il gère l\'intégralité du cycle de vie du convive, de la demande initiale à son départ, en optimisant chaque mètre carré de votre salle.',
    icon: Calendar,
    color: '#1B4332',
    details: [
        { label: 'Timeline de Service', content: 'Visualisation linéaire des flux arrivants. Glissez-deposez pour modifier les horaires ou changer l\'affectation de table.' },
        { label: 'Attribution Intelligente', content: 'L\'IA suggère automatiquement la meilleure table selon le nombre de couverts, le rang du serveur et les préférences clients.' },
        { label: 'Cyclage des Convives', content: 'Suivi précis des statuts : Attendu, Arrivé, Installé, Mise à feu, Dessert, Addition demandée, Départ.' },
        { label: 'Liste d\'Attente Mobile', content: 'Gestion prioritaire des clients sans réservation avec estimation précise du temps d\'attente envoyée par SMS.' },
        { label: 'No-Show Protection', content: 'Système d\'empreinte bancaire sécurisée et relances automatiques multicanaux pour garantir votre taux de remplissage.' },
        { label: 'Profil de Réservation', content: 'Chaque réservation est liée à un profil Customer riche incluant allergies, habitudes alimentaires et historique de dépenses.' }
    ],
    fullTutorial: [
        {
            title: "Créer & Gérer une Réservation",
            icon: "🗓️",
            content: "Optimisez votre remplissage en maîtrisant le flux de réservations.",
            points: [
                "Nouvelle réservation → [PATH:/reservations] Cliquez sur '+ Nouvelle Résa' (coin supérieur droit) [CLICK] → Remplissez Nom, Tél, Date, Heure, Couverts → Validez.",
                "Modifier une résa → Cliquez sur la ligne de réservation dans la liste → Modifiez les champs → 'Enregistrer'.",
                "Annuler une résa → Cliquez sur la réservation → Bouton 'Annuler' (rouge) en bas du panneau → Confirmez."
            ]
        },
        {
            title: "Accueil & Cyclage Client",
            icon: "🚪",
            content: "Suivez le parcours client depuis l'arrivée jusqu'au départ.",
            points: [
                "Pointer l'arrivée → Cliquez sur la résa 'Attendue' → Bouton 'Client Arrivé' → Le statut passe à 'Arrivé'.",
                "Installer à table → Cliquez sur 'Installer' → Sélectionnez la table sur le plan → Confirmez l'installation.",
                "Marquer le départ → Après paiement, cliquez sur la table → Bouton 'Libérer Table' → La table repasse en 'Libre'."
            ]
        }
    ]
};
