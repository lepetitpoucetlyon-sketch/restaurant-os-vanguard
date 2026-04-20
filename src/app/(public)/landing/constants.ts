import {
    ChefHat,
    Utensils,
    Package,
    BarChart3,
    Users,
    Shield
} from "lucide-react";

export const ACCENT = "#C9A227";

export const FEATURES = [
    {
        id: "pos",
        title: "POS & Gestion Salle",
        description: "Interface de caisse intuitive et plan de salle interactif pour un service fluide.",
        icon: Utensils,
        color: "#C5A059",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop",
        size: "large"
    },
    {
        id: "kitchen",
        title: "Cuisine & KDS",
        description: "Écran de production, fiches recettes et mise en place automatisée.",
        icon: ChefHat,
        color: "#FF9500",
        image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800&auto=format&fit=crop",
        size: "medium"
    },
    {
        id: "stock",
        title: "Stocks Intelligents",
        description: "Prédictions de rupture, commandes fournisseurs et traçabilité HACCP.",
        icon: Package,
        color: "#007AFF",
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop",
        size: "medium"
    },
    {
        id: "finance",
        title: "Finance & Comptabilité",
        description: "Tableau de bord P&L, cash-flow prédictif et génération de devis.",
        icon: BarChart3,
        color: "#9333EA",
        image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=800&auto=format&fit=crop",
        size: "small"
    },
    {
        id: "hr",
        title: "RH & Planning",
        description: "Planification des équipes, gestion des congés et conformité légale.",
        icon: Users,
        color: "#EC4899",
        image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=800&auto=format&fit=crop",
        size: "small"
    },
    {
        id: "haccp",
        title: "Qualité HACCP",
        description: "Relevés de température, plans de nettoyage et audit trail complet.",
        icon: Shield,
        color: "#C5A059",
        image: "https://images.unsplash.com/photo-1581299894007-aaa50297cf16?q=80&w=800&auto=format&fit=crop",
        size: "small"
    }
];

export const PRICING = [
    {
        id: "essential",
        name: "Essential",
        price: "99",
        period: "/mois",
        description: "Pour les restaurants indépendants",
        features: [
            "POS & Gestion Salle",
            "Livre de Recettes (50 max)",
            "Gestion Stocks de base",
            "1 Terminal",
            "Support Email"
        ],
        highlighted: false,
        cta: "Commencer"
    },
    {
        id: "professional",
        name: "Professional",
        price: "199",
        period: "/mois",
        description: "Pour les établissements ambitieux",
        features: [
            "Tout Essential +",
            "Recettes illimitées",
            "Prédictions IA Stock",
            "Module RH & Planning",
            "KDS Multi-postes",
            "3 Terminaux",
            "Support Prioritaire 24/7"
        ],
        highlighted: true,
        cta: "Essai Gratuit 14j"
    },
    {
        id: "enterprise",
        name: "Enterprise",
        price: "Sur mesure",
        period: "",
        description: "Pour les groupes multi-sites",
        features: [
            "Tout Professional +",
            "Multi-établissements",
            "API & Intégrations",
            "Comptabilité Certifiée",
            "Onboarding Dédié",
            "SLA Garanti 99.9%"
        ],
        highlighted: false,
        cta: "Nous Contacter"
    }
];

export const TESTIMONIALS = [
    {
        id: 1,
        quote: "Restaurant OS a révolutionné notre service. Le temps de formation des équipes a été divisé par deux.",
        author: "Marie Dupont",
        role: "Directrice, Le Petit Bistrot",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
        rating: 5
    },
    {
        id: 2,
        quote: "L'intelligence prédictive des stocks nous a fait économiser 18% sur notre food cost en 3 mois.",
        author: "Jean-Pierre Martin",
        role: "Chef Exécutif, Brasserie Moderne",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
        rating: 5
    },
    {
        id: 3,
        quote: "Enfin un outil pensé par des restaurateurs, pour des restaurateurs. L'interface est sublime.",
        author: "Sophie Bernard",
        role: "Propriétaire, Café des Arts",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop",
        rating: 5
    }
];

export const STATS = [
    { value: "2,500+", label: "Restaurants Actifs" },
    { value: "18%", label: "Réduction Food Cost" },
    { value: "99.9%", label: "Uptime Garanti" },
    { value: "4.9/5", label: "Note Clients" }
];
