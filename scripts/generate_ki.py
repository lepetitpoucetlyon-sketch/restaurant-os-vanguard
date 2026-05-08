#!/usr/bin/env python3
import os
import requests
import json
import datetime
import argparse
import time
from pathlib import Path

KI_BASE_DIR = os.path.expanduser("~/.gemini/antigravity/knowledge")

def fetch_slow_brain_insight(workspace, query):
    url = "http://localhost:9621/query"
    payload = {"query": query, "mode": "mix"}
    headers = {"X-Workspace": workspace}
    
    print(f"⌛ Interrogation du Slow Brain pour le workspace '{workspace}'...")
    response = requests.post(url, json=payload, headers=headers)
    if response.status_code == 200:
        return response.json().get("response", "")
    else:
        raise Exception(f"Erreur Slow Brain: {response.text}")

def inject_back_to_rag(workspace, content):
    print(f"📥 Ré-injection du KI dans le RAG pour le workspace '{workspace}'...")
    url = "http://localhost:9621/documents/text"
    payload = {"text": content}
    headers = {"X-Workspace": workspace}
    response = requests.post(url, json=payload, headers=headers)
    return response.status_code == 200

def create_ki(title, summary, content, category="finance", tags=None):
    slug = "".join([c if c.isalnum() or c in "_-" else "_" for c in title.lower().replace(" ", "_")])
    ki_dir = Path(KI_BASE_DIR) / slug
    artifacts_dir = ki_dir / "artifacts"
    os.makedirs(artifacts_dir, exist_ok=True)
    
    timestamp = datetime.datetime.now().isoformat()
    metadata = {
        "title": title,
        "summary": summary,
        "category": category,
        "created_at": timestamp,
        "tags": tags or ["auto-generated", "slow-brain-sync"]
    }
    
    with open(ki_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    with open(artifacts_dir / "insight.md", "w") as f:
        f.write(f"# {title}\n\n{content}")
    return ki_dir

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--workspace", required=True)
    parser.add_argument("--source-query", required=False)
    parser.add_argument("--title", required=False)
    parser.add_argument("--batch", required=False, help="Path to JSON file with prompts")
    args = parser.parse_args()

    if args.batch:
        try:
            with open(args.batch, 'r', encoding='utf-8') as f:
                batch_items = json.load(f)
            
            print(f"📦 Démarrage du Batch KI ({len(batch_items)} items) pour '{args.workspace}'...")
            for i, item in enumerate(batch_items, 1):
                title = item["title"]
                query = item["query"]
                print(f"\n--- [{i}/{len(batch_items)}] Génération de : {title} ---")
                try:
                    content = fetch_slow_brain_insight(args.workspace, query)
                    path = create_ki(title, f"Synthèse générée pour {args.workspace}", content)
                    print(f"✅ KI créé localement : {path}")
                    
                    if inject_back_to_rag(args.workspace, content):
                        print(f"🚀 KI ré-injecté avec succès dans le RAG.")
                    else:
                        print(f"⚠️ Échec de la ré-injection dans le RAG.")
                        
                except Exception as e:
                    print(f"❌ Échec pour '{title}' : {e}")
                
                if i < len(batch_items):
                    print("⏳ Pause de 5 secondes avant le prochain KI...")
                    time.sleep(5)
            print("\n🎉 Batch KI terminé avec succès.")
        except Exception as e:
            print(f"❌ Échec du batch : {e}")
            
    else:
        if not args.source_query or not args.title:
            print("❌ Erreur : --source-query et --title sont requis si --batch n'est pas utilisé.")
            exit(1)
            
        try:
            content = fetch_slow_brain_insight(args.workspace, args.source_query)
            path = create_ki(args.title, f"Synthèse générée pour {args.workspace}", content)
            print(f"✅ KI créé localement : {path}")
            
            if inject_back_to_rag(args.workspace, content):
                print(f"🚀 KI ré-injecté avec succès dans le RAG.")
            else:
                print(f"⚠️ Échec de la ré-injection dans le RAG.")
                
        except Exception as e:
            print(f"❌ Échec : {e}")
