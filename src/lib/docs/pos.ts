import { Zap } from 'lucide-react';
import { DocCategory } from '@nexus/contracts';

export const pos: DocCategory = {
    title: 'Point de Vente (POS) Haute Performance',
    description: 'Outil de production conçu pour la vitesse d\'exécution. L\'interface réduit les frictions cognitives pour les serveurs, permettant une concentration totale sur l\'excellence du service et la relation client.',
    icon: Zap,
    color: '#C5A059',
    details: [
        { label: 'Vente Suggestive IA', content: 'L\'IA analyse le panier en temps réel et suggère des accords mets-vins ou des accompagnements à forte marge.' },
        { label: 'Encaissement Agile', content: 'Division de note ultra-rapide par article, par montant exact ou par personne avec calcul automatique des pourboires.' },
        { label: 'Précision Culinaire', content: 'Gestion granulaire des cuissons, modifications d\'ingrédients et demandes "Spéciales Client" avec transmission KDS prioritaire.' },
        { label: 'Paiements Unifiés', content: 'Intégration native des TPE, QR Code à table (Pay-at-table), titres-restaurant dématérialisés et comptes clients VIP.' },
        { label: 'Mode Hors-Ligne', content: 'Technologie de résilience permettant de continuer les ventes même en cas de coupure réseau, avec synchronisation différée.' },
        { label: 'Contrôle des Remises', content: 'Protocole de gestion des pertes, invitations d\'entreprise et gestes commerciaux avec workflow d\'approbation manager.' }
    ],
    fullTutorial: [
        {
            title: "Prise de Commande Efficace",
            icon: "⌨️",
            content: "Le POS est optimisé pour minimiser le nombre de touches nécessaires.",
            points: [
                "Sélectionner une table → [PATH:/pos] Écran d'accueil POS → Cliquez sur la table dans la grille [CLICK] → L'interface de commande s'ouvre.",
                "Ajouter un plat → Cliquez sur la catégorie (ex: 'Entrées') → Puis sur le plat souhaité → Il s'ajoute au panier.",
                "Modifier un plat → Cliquez sur le plat dans le panier → Choisissez cuisson/accompagnement dans le pop-up → Validez."
            ]
        },
        {
            title: "Envoi & Encaissement",
            icon: "💳",
            content: "Finalisez le service avec fluidité.",
            points: [
                "Envoyer en cuisine → Bouton 'Envoi' (icône toque) en bas du panier → Les plats partent au KDS.",
                "Diviser l'addition → Bouton 'Diviser' → Sélectionnez les articles par convive → Encaissez chaque part séparément.",
                "Encaisser → Bouton 'Payer' → Choisissez le mode (CB, Espèces, Titre-resto) → Validez le montant."
            ]
        }
    ]
};
