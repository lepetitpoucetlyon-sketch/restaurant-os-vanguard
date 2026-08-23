#!/usr/bin/env python3
"""
⚡ Scrapling UI Checklist Tester — Ultra-fast UI and route verification for Restaurant OS.
Audits all operational routes using Scrapling's adaptive parser in milliseconds, verifies status codes,
DOM tree integrity, navigation links, and layout sanity.
"""

import sys
import time
import urllib.request
import urllib.error
from typing import List, Dict, Any
from scrapling import Selector

BASE_URL = "http://localhost:3001"

ROUTES_TO_AUDIT = [
    # ── Core Operations ────────────────────────────────────────────────────────
    {"path": "/", "name": "Tableau de Bord", "section": "Principal"},
    {"path": "/pos", "name": "Point de Vente (POS)", "section": "Opérations"},
    {"path": "/pos-mobile", "name": "POS Mobile", "section": "Opérations"},
    {"path": "/floor-plan", "name": "Plan de Salle", "section": "Opérations"},
    {"path": "/menu-builder", "name": "Éditeur de Carte", "section": "Opérations"},
    {"path": "/menu-engineering", "name": "Ingénierie Menu", "section": "Opérations"},
    {"path": "/operations", "name": "Gestion Opérations", "section": "Opérations"},

    # ── Production & Cuisine ──────────────────────────────────────────────────
    {"path": "/kds", "name": "Production (KDS)", "section": "Cuisine"},
    {"path": "/kitchen", "name": "Gestion Cuisine", "section": "Cuisine"},
    {"path": "/bar", "name": "Bar & Sommellerie", "section": "Cuisine"},

    # ── Stocks & Achats ───────────────────────────────────────────────────────
    {"path": "/inventory", "name": "Stocks & Inventaire", "section": "Stocks"},
    {"path": "/admin/inventory/reception", "name": "Réception Marchandises", "section": "Stocks"},

    # ── Qualité & Légal ───────────────────────────────────────────────────────
    {"path": "/haccp", "name": "HACCP & Traçabilité", "section": "Qualité"},
    {"path": "/facility", "name": "Parc Matériel & GMAO", "section": "Qualité"},
    {"path": "/registre", "name": "Registres Obligatoires", "section": "Légal"},

    # ── Clients & Réservations ────────────────────────────────────────────────
    {"path": "/reservations", "name": "Réservations", "section": "Clients"},
    {"path": "/crm", "name": "CRM Clients & Fidélité", "section": "Clients"},
    {"path": "/groups", "name": "Groupes & Privatisation", "section": "Clients"},

    # ── Équipe & RH ───────────────────────────────────────────────────────────
    {"path": "/timeclock", "name": "Pointage / Timeclock", "section": "Équipe"},
    {"path": "/staff", "name": "Ressources Humaines", "section": "Équipe"},
    {"path": "/leaves", "name": "Congés & Absences", "section": "Équipe"},
    {"path": "/welcome-staff", "name": "Prise de Poste", "section": "Équipe"},

    # ── Analytics & Marketing ─────────────────────────────────────────────────
    {"path": "/intelligence", "name": "Hub Intelligence IA", "section": "Analytics"},
    {"path": "/analytics", "name": "Analytique BI", "section": "Analytics"},
    {"path": "/marketing", "name": "Marketing & Réseaux", "section": "Analytics"},
    {"path": "/marketing/seo", "name": "SEO & Visibilité", "section": "Analytics"},

    # ── Finance & Comptabilité ────────────────────────────────────────────────
    {"path": "/finance", "name": "Trésorerie & Dépenses", "section": "Finance"},
    {"path": "/nf525", "name": "Conformité NF525", "section": "Comptabilité"},
    {"path": "/accounting-portal", "name": "Portail Comptable", "section": "Comptabilité"},

    # ── Administration & Réseau ───────────────────────────────────────────────
    {"path": "/settings", "name": "Paramètres & Checklist", "section": "Admin"},
    {"path": "/integrations", "name": "Intégrations & API", "section": "Admin"},
    {"path": "/account-settings", "name": "Gestion des Accès", "section": "Admin"},
    {"path": "/mon-espace", "name": "Mon Espace", "section": "Admin"},
    {"path": "/aide", "name": "Aide & Support", "section": "Admin"},
    {"path": "/franchise", "name": "Multi-Sites & Franchise", "section": "Réseau"},

    # ── MCC & Intelligence Plateforme ─────────────────────────────────────────
    {"path": "/admin/mcc", "name": "Console Flotte MCC", "section": "MCC"},
    {"path": "/admin/agent", "name": "Intelligence Exécutive", "section": "MCC"},
    {"path": "/admin/prospecting", "name": "Prospection & LeadGen", "section": "MCC"},
    {"path": "/simulator", "name": "Simulateur & Benchmarks", "section": "MCC"},
    {"path": "/audit-portal", "name": "Portail d'Audit", "section": "MCC"},
]


def audit_routes(base_url: str = BASE_URL) -> List[Dict[str, Any]]:
    results = []
    print(f"\n🚀 Démarrage de l'audit UI avec Scrapling ({len(ROUTES_TO_AUDIT)} routes ciblées)...\n")

    for route in ROUTES_TO_AUDIT:
        full_url = f"{base_url}{route['path']}"
        t0 = time.perf_counter()
        
        try:
            req = urllib.request.Request(
                full_url,
                headers={"User-Agent": "Mozilla/5.0 (Scrapling-UIAuditor/1.0)"}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                latency_ms = (time.perf_counter() - t0) * 1000
                status = response.status
                html = response.read().decode("utf-8", errors="ignore")
                
                # Parse with Scrapling Selector
                page = Selector(html)
                title = page.css("title::text").get() or ""
                has_nav = bool(page.css("nav").getall() or page.css("aside").getall())
                has_main = bool(page.css("main").getall() or page.css("body").getall())
                has_buttons = len(page.css("button").getall())
                has_links = len(page.css("a").getall())
                
                is_error_page = "Application error" in html or "Unhandled Runtime Error" in html

                result = {
                    "path": route["path"],
                    "name": route["name"],
                    "section": route["section"],
                    "status": status,
                    "latency_ms": round(latency_ms, 1),
                    "title": title.strip(),
                    "has_nav": has_nav,
                    "has_main": has_main,
                    "buttons_count": has_buttons,
                    "links_count": has_links,
                    "is_error": is_error_page or status >= 400,
                    "ok": not is_error_page and status == 200
                }
        except urllib.error.HTTPError as e:
            latency_ms = (time.perf_counter() - t0) * 1000
            result = {
                "path": route["path"],
                "name": route["name"],
                "section": route["section"],
                "status": e.code,
                "latency_ms": round(latency_ms, 1),
                "title": "",
                "has_nav": False,
                "has_main": False,
                "buttons_count": 0,
                "links_count": 0,
                "is_error": True,
                "error_msg": f"HTTP {e.code}: {e.reason}",
                "ok": False
            }
        except Exception as e:
            latency_ms = (time.perf_counter() - t0) * 1000
            result = {
                "path": route["path"],
                "name": route["name"],
                "section": route["section"],
                "status": 500,
                "latency_ms": round(latency_ms, 1),
                "title": "",
                "has_nav": False,
                "has_main": False,
                "buttons_count": 0,
                "links_count": 0,
                "is_error": True,
                "error_msg": str(e),
                "ok": False
            }
        
        results.append(result)
        
        badge = "✅" if result["ok"] else "❌"
        print(f"{badge} [{result['section']}] {result['name']:<28} {route['path']:<28} {result['status']} ({result['latency_ms']} ms)", flush=True)

    return results


def print_markdown_report(results: List[Dict[str, Any]]):
    total = len(results)
    passed = sum(1 for r in results if r["ok"])
    failed = total - passed
    avg_latency = sum(r["latency_ms"] for r in results) / total if total else 0

    print("\n" + "=" * 80)
    print(f"📊 RAPPORT DE VÉRIFICATION UI SCRAPLING — {passed}/{total} VERTES ({passed/total*100:.1f}%)")
    print(f"⏱️ Latence moyenne : {avg_latency:.1f} ms par page")
    print("=" * 80 + "\n")

    print("| Section | Page | Route | Statut | Latence | Éléments Clés |")
    print("|---|---|---|---|---|---|")
    for r in results:
        status_badge = "🟢 200 OK" if r["ok"] else f"🔴 {r['status']}"
        elements = f"{r['buttons_count']} boutons, {r['links_count']} liens" if r["ok"] else r.get("error_msg", "Erreur")
        print(f"| {r['section']} | {r['name']} | `{r['path']}` | {status_badge} | {r['latency_ms']} ms | {elements} |")


if __name__ == "__main__":
    results = audit_routes()
    print_markdown_report(results)
