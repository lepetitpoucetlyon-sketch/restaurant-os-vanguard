const fs = require('fs');

const path = './public/blueprint/data.js';
let content = fs.readFileSync(path, 'utf8');

const translations = [
    { eng: "Recherche Full-Text Events", fr: "Recherche Intégrale Évènements" },
    { eng: "Timeout 120s \\+ Retry ×3", fr: "Délai 120s + Nouvel Essai ×3" },
    { eng: "Appel Firebase : Timeout 120s \\+ ...", fr: "Requête Firebase : Délai 120s + ..." },
    { eng: "Extraction Food Cost", fr: "Calcul Coût Matière" },
    { eng: "getCost\\(\\) = sum\\(ingredient \\* unit_price\\)", fr: "Prix Total = Somme des Ingrédients" },
    { eng: "Ratio: total_cost / selling_price %", fr: "Ratio : Coût Brut / Prix Vente %" },
    { eng: "analyzeHistoricalData\\(date\\)", fr: "Analyse des Données Historiques" },
    { eng: "Timer Intégré par Étape", fr: "Chronomètre Synthétique d'Étape" },
    { eng: "Feedback & Photo Archive", fr: "Avis & Archives Visuelles" },
    { eng: "Structured Data \\(Schema.org\\)", fr: "Données Structurées (Schema.org)" },
    { eng: "Event Schema", fr: "Schéma Évènementiel" },
    { eng: "Social Marketing", fr: "Marketing Social" },
    { eng: "Planification Posts", fr: "Planification des Publications" }
];

translations.forEach(t => {
    content = content.replace(new RegExp(t.eng, 'g'), t.fr);
});

fs.writeFileSync(path, content);
console.log("Translations successfully applied to data.js");
