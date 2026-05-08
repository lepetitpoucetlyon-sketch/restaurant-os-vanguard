# generate_test_data.py
import json, random, datetime

fournisseurs = ["Metro", "Transgourmet", "Brake"]
produits = ["Tomate", "Boeuf", "Poulet", "Huile", "Farine"]

data = []
for i in range(50):
    facture = {
        "date": str(datetime.date(2024, random.randint(1,12), random.randint(1,28))),
        "fournisseur": random.choice(fournisseurs),
        "produit": random.choice(produits),
        "montant": round(random.uniform(50, 500), 2)
    }
    data.append(json.dumps(facture, ensure_ascii=False))

with open("test_invoices.jsonl", "w") as f:
    for entry in data:
        f.write(entry + "\n")

print(f"50 factures fictives générées dans test_invoices.jsonl")
