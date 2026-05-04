const fs = require('fs');

const dataFile = './blueprint-landing/data.js';
let content = fs.readFileSync(dataFile, 'utf8');
let BLUEPRINT_DATA;
eval(content.replace('const BLUEPRINT_DATA = ', 'BLUEPRINT_DATA = '));

// Dictionnaire de traduction stricte
const translations = {
    "Analytics (Dashboard)": "Analytique (Tableau de bord)",
    "Dashboard Exécutif": "Synthèse Exécutive",
    "Food Cost Gauge": "Jauge Coût Matière",
    "Labor Cost Gauge": "Jauge Coût Main d'Œuvre",
    "Dashboard Opérationnel": "Contrôle Opérationnel",
    "Tables Status Live": "Statut des Tables en Direct",
    "Kitchen Load (Tickets en attente)": "Charge Cuisine (Bons en Attente)",
    "Covers par Heure (Réel vs Prévu)": "Couverts par Heure (Réel vs Théorique)",
    "Menu Engineering": "Ingénierie du Menu",
    "Tracking Progrès User": "Suivi de Progression Utilisateur",
    "Routing par Sévérité": "Routage par Criticité",
    "Quiet Hours (23h-7h)": "Heures Silencieuses (23h-7h)",
    "Digest Mode": "Mode Résumé Quotidien",
    "Per Channel Toggle": "Contrôle par Canal",
    "Settings (Context)": "Paramètres (Context)",
    "Dark Mode (Glassmorphism)": "Mode Sombre (Verre Givré)",
    "Light Mode": "Mode Clair",
    "Language Context Switch": "Sélecteur de Langue Dynamique"
};

// Arborescence enrichie pour "Paramètres (Context)" demandée par le User
const parametresDetail = [
    {
        nom: "Clés API & Intégrations",
        genre: "action",
        chemins: [
            { nom: "Passerelle de Paiement (Stripe)", genre: "critique" },
            { nom: "Comptabilité (Pennylane / QuickBooks)", genre: "critique" },
            { nom: "Agrégateurs (Deliveroo / UberEats)", genre: "revenue" },
            { nom: "Communication (SendGrid / Twilio)", genre: "action" }
        ]
    },
    {
        nom: "Configuration Établissement",
        genre: "action",
        chemins: [
            { nom: "Organisation → Marques → Établissements", genre: "action" },
            { nom: "SIRET / TVA Intra par Site", genre: "action" },
            { nom: "Gestion des Devises & Taxes (TVA 10/20%)", genre: "critique" },
            { nom: "Jours Féries & Majoration des Salaires", genre: "revenue" }
        ]
    },
    {
        nom: "Règles d'Intelligence Artificielle",
        genre: "action",
        chemins: [
            { nom: "Agressivité Tarification Dynamique", genre: "critique" },
            { nom: "Modèle LLM Config (Gemini Pro)", genre: "action" },
            { nom: "Seuils d'Alerte Financière", genre: "revenue" }
        ]
    },
    {
        nom: "Apparence & Thématique",
        genre: "action",
        chemins: [
            { nom: "Mode Sombre (Verre Givré)", genre: "action" },
            { nom: "Mode Clair", genre: "action" },
            { nom: "Préférences Typographie", genre: "action" }
        ]
    },
    {
        nom: "Internationalisation (i18n)",
        genre: "action",
        chemins: [
            { nom: "Sélecteur de Langue Dynamique", genre: "action" },
            { nom: "Traductions Dynamiques", genre: "action" }
        ]
    }
];

function traverseAndTranslate(node) {
    if (translations[node.nom]) {
        node.nom = translations[node.nom];
    }
    
    // Remplacement spécifique pour le noeud Paramètres
    if (node.nom === "Paramètres (Context)") {
        node.chemins = parametresDetail;
    }

    if (node.chemins) {
        node.chemins.forEach(traverseAndTranslate);
    }
}

traverseAndTranslate(BLUEPRINT_DATA);

const newContent = `const BLUEPRINT_DATA = ${JSON.stringify(BLUEPRINT_DATA, null, 4)};`;
fs.writeFileSync(dataFile, newContent, 'utf8');
console.log("Traduction et expansion des Paramètres terminées.");
