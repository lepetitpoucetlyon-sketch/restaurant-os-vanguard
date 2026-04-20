// @ts-nocheck
// @ts-nocheck
import { Settings } from 'lucide-react';
import { DocCategory } from '@/types';

export const settings: DocCategory = {
    title: 'Configuration Système & Sécurité',
    description: 'Le cerveau technique de votre Restaurant OS. Personnalisez l\'intégralité des modules et gérez les droits d\'accès pour une sécurité maximale.',
    icon: Settings,
    color: '#525252',
    details: [
        { label: 'Matrice de Sécurité', content: 'Double authentification (2FA), timeouts de session automatiques et politique de rétention des logs de sécurité.' },
        { label: 'Gestion Nodale RH', content: 'Configuration des lois du travail (Heures max, OT) et des bonus temporels (Nuits 10-25%, Dimanches 25-100%).' },
        { label: 'Stripe & Webhooks', content: 'Intégration directe des flux de paiement avec synchronisation par Webhooks (Signal Events) haute fidélité.' },
        { label: 'Logistique Delivery', content: 'Configuration nodale du Click & Collect, gestion des zones géographiques et temps de préparation dynamiques.' },
        { label: 'Routage Notifications', content: 'Configuration granulaire des sons globaux, mode Ne Pas Déranger et routage par canal (Push, SMS, Email).' },
        { label: 'Thématisation Elite', content: 'Personnalisation de l\'interface aux couleurs et à l\'identité graphique de votre marque avec persistance Cloud.' }
    ],
    fullTutorial: [
        {
            title: "Sécurité & Contrôle d'Accès",
            icon: "🔐",
            content: "Protégez vos données with des protocoles de niveau bancaire.",
            points: [
                "Double Authentification (2FA) → [PATH:/settings] Activez le module 'Security' pour exiger une validation TOTP lors de la connexion. [CLICK]",
                "Gestion des Rôles → Créez un nouveau rôle pour définir des permissions granulaires. [CLICK]",
                "Rétention des Logs → Paramétrez la durée de conservation des audits (90 jours min. conseillé). [CLICK]"
            ]
        },
        {
            title: "Intégrations & Automatisation",
            icon: "⚙️",
            content: "Connectez votre restaurant au reste du monde digital.",
            points: [
                "Configuration Stripe → Insérez vos clés API directes et activez le Webhook Secret. [CLICK]",
                "Législation du Travail → Définissez les plafonds hebdos (35h/45h) et les bonus temporels. [CLICK]",
                "Click & Collect → Activez le module 'Delivery' pour gérer les zones de livraison. [CLICK]"
            ]
        },
        {
            title: "HACCP & Objectifs Stratégiques",
            icon: "🎯",
            content: "Définissez vos cibles financières et vos protocoles sanitaires.",
            points: [
                "Cible Chiffre d'Affaires → Fixez votre objectif de recettes journalier pour le calcul des performances. [CLICK]",
                "Ratio Masse Salariale → Définissez le pourcentage cible du coût personnel (ex: 30%). [CLICK]",
                "Fréquence Relevés HACCP → Configurez l'intervalle automatique des vérifications de température. [CLICK]",
                "Délai d'Alerte → Ajustez le temps avant déclenchement d'une notification d'anomalie thermique. [CLICK]"
            ]
        },
        {
            title: "Menu & Recettes",
            icon: "🍳",
            content: "Structurez votre offre culinaire et vos fiches techniques.",
            points: [
                "Visuels Produits → Activez l'affichage des photos sur les terminaux de commande. [CLICK]",
                "Mode Tarifaire → Basculez l'affichage des prix entre HT et TTC pour le contrôle de gestion. [CLICK]",
                "Nouvelle Catégorie → Créez une section 'Desserts' ou 'Vins' pour organiser votre carte. [CLICK]",
                "Rendement Standard → Définissez le nombre de portions par défaut pour vos fiches techniques. [CLICK]",
                "Cible Food Cost → Fixez votre objectif de marge brute théorique (ex: 28%). [CLICK]"
            ]
        },
        {
            title: "Stocks & Approvisionnements",
            icon: "📦",
            content: "Automatisez la gestion de vos réserves et commandes.",
            points: [
                "Alerte Stock Bas → Définissez le seuil de déclenchement des notifications de rupture (ex: 20%). [CLICK]",
                "Réassort Auto → Autorisez le système à générer des brouillons de commande fournisseurs. [CLICK]",
                "Fréquence d'Inventaire → Paramétrez le rythme de vos audits de stock (Hebdo recommandé). [CLICK]"
            ]
        },
        {
            title: "POS & Réservations",
            icon: "💳",
            content: "Optimisez l'encaissement et la prise de rendez-vous.",
            points: [
                "Devise Principale → Sélectionnez l'unité monétaire de votre établissement. [CLICK]",
                "Mode de Service → Configurez l'interface pour le service à table ou au comptoir. [CLICK]",
                "Pourboires Digitaux → Activez la suggestion de tips on the TPE virtuel. [CLICK]",
                "Délai de Réservation → Imposez un temps minimum avant l'heure du repas (ex: 2h). [CLICK]",
                "Durée du Créneau → Ajustez la rotation moyenne de vos tables (ex: 90 min). [CLICK]",
                "Acomptes → Activez le module d'empreinte bancaire pour réduire les No-Shows. [CLICK]"
            ]
        },
        {
            title: "Planning & RH",
            icon: "📅",
            content: "Gérez les emplois du temps et la législation du travail.",
            points: [
                "Début de Semaine → Alignez le planning sur votre cycle comptable (Lundi/Dimanche). [CLICK]",
                "Plafond Hebdomadaire → Définissez la durée légale du travail pour les alertes planning. [CLICK]",
                "Heures Supplémentaires → Activez le tracking des dépassements horaires. [CLICK]"
            ]
        }
    ]
};
