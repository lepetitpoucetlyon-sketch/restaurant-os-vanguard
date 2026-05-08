#!/usr/bin/env python3
"""
Générateur de données "Sales" (Dirty Data) pour Stress Test.
Introduit du bruit, des fautes d'orthographe et des doublons incohérents.
"""
import json
import random
from datetime import datetime, timedelta

FOURNISSEURS_PROPRES = ["Metro", "Brake", "Transgourmet", "Pomona"]
FOURNISSEURS_DIRTY = ["Metrro", "Brak", "Trans-Gourmet", "Pomonna", "METRO Corp"]

PRODUITS = ["Saumon", "Poulet", "Farine", "Huile", "Beurre", "Crème", "Tomates", "Oignons"]

def generate_dirty_invoice(i):
    # Aléatoirement propre ou dirty
    clean = random.choice([True, False])
    
    if clean:
        fournisseur = random.choice(FOURNISSEURS_PROPRES)
    else:
        fournisseur = random.choice(FOURNISSEURS_DIRTY)
        
    date = (datetime(2024, 1, 1) + timedelta(days=random.randint(0, 365))).strftime("%Y-%m-%d")
    
    # Incohérence de date (10% des cas)
    if random.random() < 0.1:
        date = "2025-13-45" # Date impossible
        
    return {
        "id": f"DIRTY-INV-{i:03d}",
        "date": date,
        "fournisseur": fournisseur,
        "produit": random.choice(PRODUITS),
        "montant": round(random.uniform(50, 2000), 2),
        "note": "Donnée générée pour stress test de robustesse sémantique."
    }

def main():
    data = [generate_dirty_invoice(i) for i in range(50)]
    
    # Ajout de doublons avec montants différents (Le cauchemar du RAG)
    for _ in range(5):
        dup = data[random.randint(0, 44)].copy()
        dup["montant"] = dup["montant"] * 1.5
        data.append(dup)
        
    output_path = "test_invoices_dirty.jsonl"
    with open(output_path, "w") as f:
        for entry in data:
            f.write(json.dumps(entry) + "\n")
            
    print(f"✅ {len(data)} factures 'sales' générées dans {output_path}")

if __name__ == "__main__":
    main()
