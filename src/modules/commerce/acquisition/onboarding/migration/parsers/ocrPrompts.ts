/**
 * Prompts structurants OCR par catégorie d'import.
 * Chaque prompt demande UNIQUEMENT du JSON brut — pas de markdown, pas d'explication.
 * Le LLM utilisé est agnostique (Gemini, Claude, OpenAI via TenantAIRegistry).
 */

import type { ImportCategory } from '../types';

export const OCR_PROMPTS: Record<ImportCategory, string> = {
    menu: `Tu es un assistant de migration Restaurant OS.
Analyse ce document (photo de carte, PDF menu, ou texte brut) et extrais TOUS les plats visibles.
Retourne UNIQUEMENT ce JSON (pas de markdown, pas de texte avant/après) :
{
  "categories": [{ "name": "Entrées", "type": "food", "sortOrder": 1 }],
  "products": [{ "name": "Oeuf Mayo", "description": "...", "price": 8.50, "categoryName": "Entrées", "taxRate": 10.0 }]
}
Règles : prix en euros décimaux (ex: 8.50), taxRate 10% par défaut sauf si TVA 20% indiquée (boissons alcoolisées).`,

    staff: `Tu es un assistant de migration Restaurant OS.
Analyse ce document et extrais tous les membres du personnel.
Retourne UNIQUEMENT ce JSON :
{
  "staff": [{ "name": "Marie Dupont", "role": "serveur", "email": "marie@resto.fr", "phone": "0612345678", "hourlyRate": 12.50 }]
}
Rôles valides : directeur, manager, comptable, chef_rang, chef_cuisinier, serveur, cuisinier, barman, hotesse, plongeur.`,

    crm: `Tu es un assistant de migration Restaurant OS.
Analyse ce document et extrais la liste clients/CRM.
Retourne UNIQUEMENT ce JSON :
{
  "customers": [{ "firstName": "Jean", "lastName": "Martin", "email": "jean@email.fr", "phone": "0611111111", "totalVisits": 5, "lastVisit": "2024-06-15", "notes": "Allergique noix" }]
}`,

    suppliers: `Tu es un assistant de migration Restaurant OS.
Analyse ce document et extrais tous les fournisseurs.
Retourne UNIQUEMENT ce JSON :
{
  "suppliers": [{ "name": "Metro", "email": "contact@metro.fr", "phone": "0800123456", "category": "Épicerie", "deliveryDays": 2, "paymentTerms": "30 jours" }]
}`,

    inventory: `Tu es un assistant de migration Restaurant OS.
Analyse ce document (inventaire, comptage papier, bon de livraison) et extrais tous les produits en stock.
Retourne UNIQUEMENT ce JSON :
{
  "items": [{ "name": "Tomates", "quantity": 10.5, "unit": "kg", "dlc": "2026-12-31", "zone": "Chambre froide", "unitCost": 1.20, "supplier": "Metro" }]
}
Unités valides : kg, g, l, cl, ml, unit, piece, boite, sachet, carton, litre, portion.`,

    recipes: `Tu es un assistant de migration Restaurant OS.
Analyse ce document (fiche recette, PDF, photo) et extrais les recettes avec leurs ingrédients.
Retourne UNIQUEMENT ce JSON :
{
  "recipes": [{
    "name": "Margherita",
    "portions": 1,
    "steps": ["Étaler la pâte", "Ajouter la sauce tomate"],
    "ingredients": [{ "name": "Farine", "quantity": 200, "unit": "g" }, { "name": "Mozzarella", "quantity": 150, "unit": "g" }]
  }]
}`,

    reservations: `Tu es un assistant de migration Restaurant OS.
Analyse ce document et extrais l'historique des réservations.
Retourne UNIQUEMENT ce JSON :
{
  "reservations": [{ "date": "2024-01-15", "time": "19:30", "covers": 4, "firstName": "Jean", "lastName": "Martin", "email": "jean@email.fr", "phone": "0611111111", "source": "TheFork", "status": "confirmed" }]
}`,

    statements: `Tu es un assistant de migration Restaurant OS.
Analyse ce relevé bancaire et extrais toutes les opérations.
Retourne UNIQUEMENT ce JSON :
{
  "transactions": [{ "date": "2024-01-15", "label": "METRO PARIS", "amount": -450.00, "category": "Achats matières premières" }]
}
Amount : négatif = débit, positif = crédit. Tous les montants en euros.`,

    fec: `Tu es un assistant de migration Restaurant OS.
Analyse ce fichier FEC (Fichier des Écritures Comptables, format DGFiP).
Retourne UNIQUEMENT ce JSON :
{
  "entries": [{ "JournalCode": "VTE", "EcritureDate": "20240115", "CompteNum": "701000", "CompteLib": "Ventes produits", "Debit": 0, "Credit": 1200.00, "EcritureLib": "Vente du jour" }]
}`,

    floorplan: `Tu es un assistant de migration Restaurant OS.
Analyse ce document (plan de salle, CSV tables, liste tables) et extrais la configuration du restaurant.
Retourne UNIQUEMENT ce JSON :
{
  "zones": [{ "name": "Salle principale", "color": "#4A90D9" }, { "name": "Terrasse", "color": "#7ED321" }],
  "tables": [{ "number": "1", "capacity": 4, "zone": "Salle principale", "shape": "rect" }]
}`,

    haccp_history: `Tu es un assistant de migration Restaurant OS.
Analyse ce registre HACCP (températures, contrôles sanitaires) et extrais tous les relevés visibles.
Retourne UNIQUEMENT ce JSON (pas de markdown, pas de texte avant/après) :
{
  "readings": [{ "date": "2024-01-15", "time": "08:00", "zone": "Chambre froide 1", "temperature": 3.5, "operator": "Jean", "notes": "" }]
}
Règles : date au format ISO YYYY-MM-DD, température en °C (décimal), zone = nom équipement ou zone.`,
};

export function getOcrPrompt(category: ImportCategory, additionalContext?: string): string {
    const base = OCR_PROMPTS[category];
    if (!additionalContext) return base;
    return `${base}\n\nContexte supplémentaire : ${additionalContext}`;
}
