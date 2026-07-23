#!/usr/bin/env python3
import argparse
import time
import requests
from pypdf import PdfReader

API_URL = "http://localhost:9621/documents/text"

def extract_text(pdf_path):
    print(f"📄 Extraction du texte de {pdf_path}...")
    reader = PdfReader(pdf_path)
    text = ""
    for i, page in enumerate(reader.pages):
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
        if i % 100 == 0 and i > 0:
            print(f"  ... {i} pages extraites")
    return text

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--workspace", required=True, help="Workspace cible")
    parser.add_argument("--file", required=True, help="Fichier PDF source")
    args = parser.parse_args()

    full_text = extract_text(args.file)
    
    # Split text into manageable chunks if too large (LightRAG handles chunking, 
    # but we send it as one or few large blocks)
    # For very large documents, we might want to split by chapters or groups of pages.
    # Here we'll send it as one big block to the /documents/text endpoint.
    
    headers = {"X-Workspace": args.workspace, "Content-Type": "application/json"}
    payload = {"text": full_text}

    print(f"📦 Envoi du contenu ({len(full_text)} caractères) vers '{args.workspace}'...")
    start_time = time.time()
    try:
        resp = requests.post(API_URL, json=payload, headers=headers, timeout=600)
        elapsed = time.time() - start_time
        if resp.status_code == 200:
            print(f"✅ Succès en {elapsed:.2f}s : {resp.json().get('message')}")
        else:
            print(f"❌ Erreur {resp.status_code} : {resp.text}")
    except Exception as e:
        print(f"⚠️ Échec : {e}")
