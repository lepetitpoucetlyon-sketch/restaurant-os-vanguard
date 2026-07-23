const fs = require('fs');

const path = './public/blueprint/data.js';
let content = fs.readFileSync(path, 'utf8');

// The expansion data:
const expansion = `,
        {
            "nom": "FRANCHISES & MULTISITE",
            "genre": "domaine",
            "chemins": [
                {
                    "nom": "Master Control (HQ)",
                    "genre": "critique",
                    "description": "Hyperviseur central pour les chaînes et franchises. Diffuse les cartes et collecte la donnée.",
                    "impactsDetail": [
                        "GOUVERNANCE : Déploiement centralisé des menus et prix",
                        "FINANCE : Calcul et prélèvement automatique des redevances"
                    ],
                    "chemins": [
                        {
                            "nom": "Synchronisation des Menus",
                            "genre": "action"
                        },
                        {
                            "nom": "Benchmarking Inter-Sites",
                            "genre": "revenue"
                        },
                        {
                            "nom": "Comparatif de Rentabilité",
                            "genre": "revenue"
                        }
                    ],
                    "depth": 3
                }
            ],
            "depth": 2
        },
        {
            "nom": "MARKETING & ACQUISITION",
            "genre": "domaine",
            "chemins": [
                {
                    "nom": "Automation & Campagnes",
                    "genre": "revenue",
                    "description": "Moteur d'acquisition client. Cartes cadeaux, parrainage et campagnes SMS ciblées.",
                    "chemins": [
                        {
                            "nom": "Générateur de Cartes Cadeaux",
                            "genre": "revenue"
                        },
                        {
                            "nom": "Blast SMS Promotions",
                            "genre": "action"
                        },
                        {
                            "nom": "Réputation (Avis Google/TripAdvisor)",
                            "genre": "action"
                        }
                    ],
                    "depth": 3
                }
            ],
            "depth": 2
        },
        {
            "nom": "DELIVERY & IoT",
            "genre": "domaine",
            "chemins": [
                {
                    "nom": "Hub de Livraison Centralisé",
                    "genre": "revenue",
                    "description": "Agrégation UberEats/Deliveroo et dispatch logistique des livreurs en interne.",
                    "chemins": [
                        {
                            "nom": "Intégration Plateformes Externes",
                            "genre": "action"
                        },
                        {
                            "nom": "Suivi Livreurs (GPS Live)",
                            "genre": "critique"
                        }
                    ],
                    "depth": 3
                },
                {
                    "nom": "Efficacité Énergétique (IoT)",
                    "genre": "action",
                    "description": "Contrôle domotique du restaurant et suivi du bilan carbone temps réel.",
                    "chemins": [
                        {
                            "nom": "Relevé Automatique Frigos",
                            "genre": "critique"
                        },
                        {
                            "nom": "Extinction Automatique (Nuit)",
                            "genre": "action"
                        }
                    ],
                    "depth": 3
                }
            ],
            "depth": 2
        }
    ]
};`;

// We find the very last segment of the JSON literal in data.js
const endRegex = /\s*\]\s*\}\s*;\s*$/;
content = content.replace(endRegex, expansion);

fs.writeFileSync(path, content);
console.log("Expansions appended successfully!");
