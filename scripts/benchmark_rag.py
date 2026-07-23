#!/usr/bin/env python3
import requests
import time
import json
import argparse
from datetime import datetime

URL = "http://localhost:9621/query"

QUESTIONS = [
    {"id": "Q01", "q": "Quels sont les 3 principaux fournisseurs identifiés ?"},
    {"id": "Q02", "q": "Y a-t-il des anomalies dans les dates de factures (ex: format, cohérence) ?"},
    {"id": "Q03", "q": "Quel est le montant total exact des achats chez Metro ?"},
    {"id": "Q04", "q": "Quels produits sont le plus souvent achetés chez Brake ?"},
    {"id": "Q05", "q": "Cite une facture spécifique avec une date mal formatée."},
    {"id": "Q06", "q": "Le système identifie-t-il 'Mtro' et 'Metro' comme la même entité ?"},
    {"id": "Q07", "q": "Quelle est la quantité totale de Poulet achetée ?"},
    {"id": "Q08", "q": "Y a-t-il des doublons de factures suspectés ?"},
    {"id": "Q09", "q": "Quel est le prix moyen de la Farine ?"},
    {"id": "Q10", "q": "Donne le montant de la facture la plus élevée."},
    {"id": "Q11", "q": "Quels articles ont été achetés chez Pomona ?"},
    {"id": "Q12", "q": "Identifie une abréviation étrange dans les articles (ex: TMT)."},
    {"id": "Q13", "q": "Y a-t-il des factures datées de 2025 ?"},
    {"id": "Q14", "q": "Quelle est la répartition des dépenses par fournisseur ?"},
    {"id": "Q15", "q": "Cite un article dont le nom est tronqué ou illisible."},
    {"id": "Q16", "q": "Le fournisseur 'B.F.' est-il identifié comme 'Brake' ?"},
    {"id": "Q17", "q": "Quels sont les montants de TVA identifiés ?"},
    {"id": "Q18", "q": "Y a-t-il des mentions de 'RAG' ou 'Stress Test' dans les documents ?"},
    {"id": "Q19", "q": "Donne la liste des dates de livraison pour Transgourmet."},
    {"id": "Q20", "q": "Résume la santé globale de l'extraction sur ces données sales."}
]

def run_query(workspace, question, mode="mix"):
    headers = {"X-Workspace": workspace, "Content-Type": "application/json"}
    payload = {"query": question, "mode": mode}
    start = time.time()
    try:
        resp = requests.post(URL, json=payload, headers=headers, timeout=120)
        elapsed = time.time() - start
        if resp.status_code == 200:
            return elapsed, resp.json().get("response", "")
        else:
            return elapsed, f"ERROR {resp.status_code}: {resp.text}"
    except Exception as e:
        return time.time() - start, f"EXCEPTION: {e}"

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Benchmark RAG")
    parser.add_argument("--workspace", default="test-fleet-dirty", help="Target workspace")
    parser.add_argument("--output", default="docker/lightrag/benchmark_results.json", help="Output JSON path")
    args = parser.parse_args()

    print(f"\n🥊 Lancement du Stress Test LIVE sur '{args.workspace}'...")
    results = []
    
    for i, q_item in enumerate(QUESTIONS):
        q = q_item["q"]
        print(f"\n--- Question [{i+1}/{len(QUESTIONS)}] ---")
        print(f"❓ {q}")
        
        elapsed, res = run_query(args.workspace, q)
        
        print(f"🤖 RÉPONSE (en {elapsed:.2f}s) :")
        print(f"{res}")
        print("-" * 50)
        
        results.append({
            "id": q_item["id"],
            "question": q,
            "response": res,
            "time_s": round(elapsed, 2)
        })

    report = {
        "date": datetime.now().isoformat(),
        "test": "Stress Test Phase 2 — Données Sales (Live)",
        "workspace": args.workspace,
        "results": results
    }

    with open(args.output, "w") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Benchmark terminé. Rapport complet dans {args.output}")
