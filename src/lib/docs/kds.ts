// @ts-nocheck
// @ts-nocheck
import { ChefHat } from 'lucide-react';
import { DocCategory } from '@/types';

export const kds: DocCategory = {
    title: 'Cuisine (KDS) & Coordination',
    description: 'La passerelle digitale entre la salle et la cuisine. Le Kitchen Display System organise les bons de commande par priorité chronologique, temps de cuisson et profil client.',
    icon: ChefHat,
    color: '#8B7355',
    details: [
        { label: 'Routage par Station', content: 'Dispatching automatique des articles vers les postes concernés : Saucier, Garde-manger, Pâtisserie ou Passe.' },
        { label: 'Synchronisation des Temps', content: 'Coordination intelligente des plats à temps de cuisson différents pour une sortie de commande simultanée et chaude.' },
        { label: 'Séquençage Chrono', content: 'Affichage clair des étapes du repas : Amuse-bouche, Entrée, Plat, Suite demandée, Fromage, Dessert, Café.' },
        { label: 'Bouclier Allergènes', content: 'Signalétique visuelle agressive et bloquante pour toute modification de recette liée à une allergie critique déclarée.' },
        { label: 'Gestion des "Pieds"', content: 'Suivi des réclamations "Suite en cuisine" (Mise à feu) avec notification sonore pour la brigade.' },
        { label: 'Analytics de Passe', content: 'Rapport détaillé sur les temps moyens de préparation par plat pour identifier les goulots d\'étranglement en cuisine.' }
    ],
    fullTutorial: [
        {
            title: "Gestion des Tickets de Production",
            icon: "👨‍🍳",
            content: "Gérez le flux de production avec précision.",
            points: [
                "Voir les tickets → [PATH:/kds] Les bons s'affichent automatiquement par ordre d'arrivée → Les plus anciens à gauche.",
                "Valider un plat → Cliquez sur l'article terminé → Il passe en vert → La salle est notifiée.",
                "Marquer 'Prêt' → Quand tous les articles sont verts → Bouton 'PRÊT' → Le bon disparaît et passe en livraison."
            ]
        },
        {
            title: "Alertes & Priorités",
            icon: "📢",
            content: "Gérez les urgences et les modifications.",
            points: [
                "Voir une note client → Icône orange sur l'article → Cliquez dessus → La note s'affiche (ex: 'Sans sel').",
                "Signaler une rupture → Appuyez longuement sur un plat → 'Rupture' → Il est retiré de la carte en salle.",
                "Gérer un rappel → Si un plat clignote en rouge → C'est une alerte de temps → Priorisez ce bon."
            ]
        }
    ]
};
