#!/usr/bin/env python3
"""Injecte les factures de test dans un workspace LightRAG."""
import json
import time
import argparse
import requests

API_URL = "http://localhost:9621/documents/text"

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--workspace", default="test-fleet", help="Workspace cible")
    parser.add_argument("--file", default="test_invoices.jsonl", help="Fichier JSONL source")
    parser.add_argument("--delay", type=float, default=2.0, help="Délai entre injections (secondes)")
    args = parser.parse_args()

    headers = {"X-Workspace": args.workspace, "Content-Type": "application/json"}

    with open(args.file, "r") as f:
        lines = [l.strip() for l in f if l.strip()]

    print(f"📦 Injection de {len(lines)} documents dans workspace '{args.workspace}'...")

    success = 0
    for i, line in enumerate(lines, 1):
        payload = {"text": line}
        try:
            resp = requests.post(API_URL, json=payload, headers=headers, timeout=120)
            if resp.status_code == 200:
                print(f"  ✅ [{i}/{len(lines)}] Injecté: {line[:60]}...")
                success += 1
            else:
                print(f"  ❌ [{i}/{len(lines)}] Erreur {resp.status_code}: {resp.text[:100]}")
        except Exception as e:
            print(f"  ⚠️ [{i}/{len(lines)}] Échec: {e}")
        # Petit délai pour laisser le serveur traiter
        time.sleep(args.delay)

    print(f"\n📊 Résultat: {success}/{len(lines)} documents injectés avec succès.")
