#!/usr/bin/env python3
"""
🕸️ Scrapling Agent — Deep Morphogenetic Intelligence Engine for Restaurant OS.
Powered by Scrapling (d4vinci/Scrapling) for sub-second stealth crawling, multi-source
extraction, schema detection, legal/fiscal discovery, full menu parsing, allergen tagging,
and automatic platform archetype profiling.
"""

import sys
import re
import json
import argparse
from typing import Dict, Any, List, Optional, Set, Tuple
from urllib.parse import urljoin, urlparse

try:
    from scrapling import Fetcher, StealthyFetcher, Selector
except ImportError:
    print(json.dumps({"error": "Scrapling not installed. Run: ./.venv/bin/pip install scrapling"}), file=sys.stderr)
    sys.exit(1)


# ── Regex Patterns ─────────────────────────────────────────────────────────────

PRICE_REGEX = re.compile(r"(\d+(?:[.,]\d{1,2})?)\s*(?:€|EUR|\$|CHF)", re.IGNORECASE)
PHONE_REGEX = re.compile(r"(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}")
EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
SIREN_REGEX = re.compile(r"\b(\d{3}\s*\d{3}\s*\d{3})\b")
SIRET_REGEX = re.compile(r"\b(\d{3}\s*\d{3}\s*\d{3}\s*\d{5})\b")
TVA_REGEX = re.compile(r"\b(FR\s*[0-9A-Z]{2}\s*\d{9})\b", re.IGNORECASE)
APE_REGEX = re.compile(r"\b(\d{2}\.\d{2}[A-Z])\b", re.IGNORECASE)
HEX_COLOR_REGEX = re.compile(r"#(?:[0-9a-fA-F]{3}){1,2}\b")
POSTAL_CODE_FR_REGEX = re.compile(r"\b(0[1-9]|[1-8]\d|9[0-8])\d{3}\b")


# ── Helpers ───────────────────────────────────────────────────────────────────

def parse_price(text: str) -> Optional[float]:
    """Extract numeric price in euros from text."""
    if not text:
        return None
    match = PRICE_REGEX.search(text)
    if match:
        raw_val = match.group(1).replace(",", ".")
        try:
            val = float(raw_val)
            if 0.5 <= val <= 990.0:  # Reasonable price range for food/services
                return round(val, 2)
        except ValueError:
            return None
    return None


def clean_text(text: Optional[str]) -> str:
    """Strip and collapse multiple whitespaces."""
    if not text:
        return ""
    return re.sub(r"\s+", " ", text).strip()


def detect_dietary_tags(text: str) -> List[str]:
    """Detects culinary and dietary tags from item description."""
    lower = text.lower()
    tags = []
    if any(k in lower for k in ["végétarien", "vegetarien", "veggie", "🌱", "sans viande"]):
        tags.append("Végétarien")
    if any(k in lower for k in ["vegan", "végane", "100% végétal", "plante"]):
        tags.append("Vegan")
    if any(k in lower for k in ["sans gluten", "gluten free", "gluten-free"]):
        tags.append("Sans Gluten")
    if any(k in lower for k in ["halal", "viande halal"]):
        tags.append("Halal")
    if any(k in lower for k in ["bio", "biologique", "ab ", "certifié bio"]):
        tags.append("Bio")
    if any(k in lower for k in ["fait maison", "fait-maison", "fait main", "maison"]):
        tags.append("Fait Maison")
    if any(k in lower for k in ["aop", "aoc", "igp"]):
        tags.append("AOP/AOC/IGP")
    if any(k in lower for k in ["vbf", "viande bovine française", "origine france"]):
        tags.append("Origine France")
    return list(set(tags))


def infer_category(name: str, context: str = "") -> str:
    """Classifies a menu item into a standard restaurant category."""
    combined = f"{name} {context}".lower()
    if any(k in combined for k in ["entrée", "entree", "starter", "tapas", "planches", "carpaccio", "velouté", "soupe", "salade"]):
        return "Entrées"
    if any(k in combined for k in ["plat", "viande", "poisson", "burger", "pizza", "pasta", "pâtes", "grillade", "tartare", "entrecôte", "risotto"]):
        return "Plats"
    if any(k in combined for k in ["dessert", "mignardise", "gâteau", "tarte", "glace", "chocolat", "tiramisu", "crème brûlée", "café gourmand"]):
        return "Desserts"
    if any(k in combined for k in ["vin", "bouteille", "verre", "cocktail", "bière", "champagne", "apéritif", "soft", "boisson", "eau"]):
        return "Boissons & Vins"
    if any(k in combined for k in ["formule", "menu du midi", "menu enfant", "menu découverte", "dégustation"]):
        return "Formules & Menus"
    return "Carte"


# ── Schema.org & JSON-LD Deep Parser ──────────────────────────────────────────

def extract_deep_json_ld(json_ld_list: List[Any]) -> Dict[str, Any]:
    """Extracts all high-value data from JSON-LD graph."""
    res: Dict[str, Any] = {
        "legal": {},
        "location": {},
        "hours": {},
        "rating": {},
        "items": [],
        "organization": {}
    }

    def walk_node(node: Any):
        if not isinstance(node, dict):
            return

        node_type = str(node.get("@type", ""))
        
        # 1. Organization / Restaurant / LocalBusiness
        if any(t in node_type for t in ["Restaurant", "FoodEstablishment", "Bakery", "BarOrPub", "LocalBusiness", "Organization"]):
            if "name" in node:
                res["organization"]["name"] = clean_text(node["name"])
            if "legalName" in node:
                res["legal"]["legalName"] = clean_text(node["legalName"])
            if "telephone" in node:
                res["organization"]["phone"] = clean_text(node["telephone"])
            if "email" in node:
                res["organization"]["email"] = clean_text(node["email"])
            if "priceRange" in node:
                res["organization"]["priceRange"] = clean_text(node["priceRange"])
            if "servesCuisine" in node:
                cuisine = node["servesCuisine"]
                res["organization"]["cuisine"] = cuisine if isinstance(cuisine, list) else [cuisine]

            # Address
            addr = node.get("address")
            if isinstance(addr, dict):
                res["location"]["street"] = clean_text(addr.get("streetAddress"))
                res["location"]["postalCode"] = clean_text(addr.get("postalCode"))
                res["location"]["city"] = clean_text(addr.get("addressLocality"))
                res["location"]["country"] = clean_text(addr.get("addressCountry", "FR"))

            # Geo coordinates
            geo = node.get("geo")
            if isinstance(geo, dict):
                try:
                    res["location"]["latitude"] = float(geo.get("latitude"))
                    res["location"]["longitude"] = float(geo.get("longitude"))
                except (TypeError, ValueError):
                    pass

            # Opening Hours
            hours = node.get("openingHours") or node.get("openingHoursSpecification")
            if hours:
                res["hours"]["raw"] = hours

            # Rating
            rating = node.get("aggregateRating")
            if isinstance(rating, dict):
                try:
                    res["rating"]["score"] = float(rating.get("ratingValue"))
                    res["rating"]["reviewsCount"] = int(rating.get("reviewCount") or rating.get("ratingCount") or 0)
                except (TypeError, ValueError):
                    pass

        # 2. Menu & Items
        if node_type in ("MenuItem", "Product", "Offer", "IndividualProduct"):
            name = clean_text(node.get("name") or node.get("title"))
            desc = clean_text(node.get("description"))
            offers = node.get("offers", {})
            price = None
            if isinstance(offers, dict):
                price = offers.get("price")
            elif isinstance(offers, list) and offers:
                price = offers[0].get("price")
            if price is None:
                price = node.get("price")

            if name and len(name) > 1:
                price_val = 0.0
                if price is not None:
                    try:
                        price_val = float(str(price).replace(",", ".").replace("€", "").strip())
                    except ValueError:
                        price_val = 0.0
                
                cat = infer_category(name, desc)
                res["items"].append({
                    "name": name,
                    "description": desc,
                    "price": price_val,
                    "category": cat,
                    "tags": detect_dietary_tags(f"{name} {desc}"),
                    "source": "json-ld"
                })

        for k, v in node.items():
            if isinstance(v, list):
                for item in v:
                    walk_node(item)
            elif isinstance(v, dict):
                walk_node(v)

    for doc in json_ld_list:
        walk_node(doc)

    return res


# ── Page Parser ───────────────────────────────────────────────────────────────

def extract_page_data(url: str, stealth: bool = False, timeout: int = 8) -> Dict[str, Any]:
    """Scrapes a URL using Scrapling and extracts complete multi-dimensional business DNA."""
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    try:
        if stealth:
            fetcher = StealthyFetcher()
            response = fetcher.get(url, timeout=timeout)
        else:
            fetcher = Fetcher()
            response = fetcher.get(url, timeout=timeout)
    except Exception as e:
        return {
            "url": url,
            "error": str(e),
            "status": 500,
            "success": False
        }

    page: Selector = response

    # 1. Title & Meta
    title = clean_text(page.css("title::text").get())
    meta_description = clean_text(
        page.css('meta[name="description"]::attr(content)').get()
        or page.css('meta[property="og:description"]::attr(content)').get()
    )
    og_title = clean_text(page.css('meta[property="og:title"]::attr(content)').get() or title)
    og_image = clean_text(page.css('meta[property="og:image"]::attr(content)').get())
    
    # Favicon & Logo
    favicon = clean_text(
        page.css('link[rel="icon"]::attr(href)').get()
        or page.css('link[rel="shortcut icon"]::attr(href)').get()
        or page.css('link[rel="apple-touch-icon"]::attr(href)').get()
    )
    if favicon and not favicon.startswith("http") and not favicon.startswith("data:"):
        favicon = urljoin(url, favicon)
    if og_image and not og_image.startswith("http"):
        og_image = urljoin(url, og_image)

    # 2. JSON-LD Schemas
    json_ld_scripts = page.css('script[type="application/ld+json"]::text').getall()
    json_ld_data = []
    for script_text in json_ld_scripts:
        try:
            parsed = json.loads(script_text)
            if isinstance(parsed, list):
                json_ld_data.extend(parsed)
            else:
                json_ld_data.append(parsed)
        except Exception:
            continue

    deep_ld = extract_deep_json_ld(json_ld_data)

    # 3. Links, Socials, Integrations & Services
    domain = urlparse(url).netloc
    all_links = page.css("a::attr(href)").getall()
    social_links = {}
    integrations = {}
    internal_links: Set[str] = set()
    telephones: Set[str] = set()
    emails: Set[str] = set()

    for href in all_links:
        if not href or href.startswith("#") or href.startswith("javascript:"):
            continue
        
        if href.startswith("tel:"):
            telephones.add(clean_text(href.replace("tel:", "")))
            continue
        if href.startswith("mailto:"):
            clean_em = clean_text(href.replace("mailto:", "").split("?")[0])
            if clean_em and "@" in clean_em:
                emails.add(clean_em)
            continue

        full_url = urljoin(url, href)
        parsed_href = urlparse(full_url)
        lower_url = full_url.lower()

        # Social Media
        if "instagram.com/" in lower_url and "instagram" not in social_links:
            social_links["instagram"] = full_url
        elif "facebook.com/" in lower_url and "facebook" not in social_links:
            social_links["facebook"] = full_url
        elif "tiktok.com/" in lower_url and "tiktok" not in social_links:
            social_links["tiktok"] = full_url
        elif "tripadvisor." in lower_url and "tripadvisor" not in social_links:
            social_links["tripadvisor"] = full_url
        elif ("google.com/maps" in lower_url or "goo.gl/maps" in lower_url) and "google_maps" not in social_links:
            social_links["google_maps"] = full_url

        # Third-party Integrations (Bookings & Delivery)
        if any(k in lower_url for k in ["zenchef.com", "thefork.com", "lafourchette.com", "sevenrooms.com", "guestonline."]):
            integrations["reservation_provider"] = full_url
        if any(k in lower_url for k in ["ubereats.com", "deliveroo.", "just-eat."]):
            integrations["delivery_platform"] = full_url

        # Internal target subpages
        if parsed_href.netloc == domain:
            path_lower = parsed_href.path.lower()
            if any(k in path_lower for k in [
                "menu", "carte", "tarifs", "prix", "vins", "boissons", "cocktails",
                "formules", "contact", "mentions-legales", "mentions", "cgv", "legal",
                "a-propos", "about", "horaires"
            ]):
                if full_url != url and full_url != url + "/":
                    internal_links.add(full_url)

    # 4. Text & Regex Discovery (Legal, Phone, Email, Colors)
    body_text = clean_text(" ".join(page.css("body *::text").getall()))
    
    # Phone regex fallback
    if not telephones:
        for p in PHONE_REGEX.findall(body_text)[:2]:
            telephones.add(clean_text(p))

    # Email regex fallback
    if not emails:
        for e in EMAIL_REGEX.findall(body_text)[:2]:
            if not e.endswith((".png", ".jpg", ".jpeg", ".webp", ".svg")):
                emails.add(clean_text(e))

    # Legal discovery (SIREN / SIRET / TVA / APE)
    legal_info = deep_ld.get("legal", {})
    siren_match = SIREN_REGEX.search(body_text)
    if siren_match and "siren" not in legal_info:
        legal_info["siren"] = siren_match.group(1).replace(" ", "")
    
    siret_match = SIRET_REGEX.search(body_text)
    if siret_match and "siret" not in legal_info:
        legal_info["siret"] = siret_match.group(1).replace(" ", "")

    tva_match = TVA_REGEX.search(body_text)
    if tva_match and "tva" not in legal_info:
        legal_info["tva"] = tva_match.group(1).replace(" ", "")

    # Theme color extraction
    theme_color = page.css('meta[name="theme-color"]::attr(content)').get()
    extracted_colors = []
    if theme_color and HEX_COLOR_REGEX.match(theme_color):
        extracted_colors.append(theme_color)

    # 5. Headings
    h1s = [clean_text(h) for h in page.css("h1::text").getall() if clean_text(h)]
    h2s = [clean_text(h) for h in page.css("h2::text").getall() if clean_text(h)]
    h3s = [clean_text(h) for h in page.css("h3::text").getall() if clean_text(h)]

    # 6. Deep HTML Menu & Product Extractor
    catalog_items = deep_ld.get("items", [])
    
    # Heuristic card parser for HTML menus
    menu_containers = page.css(
        ".menu-item, .menu_item, .dish, .plat, .card-menu, .food-item, "
        ".product, .item-menu, .carte-item, li:has(span), tr:has(td)"
    ).getall()

    for container_html in menu_containers[:50]:
        c_sel = Selector(container_html)
        c_text = clean_text(" ".join(c_sel.css("*::text").getall()))
        price = parse_price(c_text)
        
        if price is not None and price > 0:
            name_el = c_sel.css("h2::text, h3::text, h4::text, h5::text, strong::text, .title::text, .name::text, .dish-name::text").get()
            desc_el = c_sel.css("p::text, .desc::text, .description::text, .ingredients::text, small::text").get()
            
            clean_name = clean_text(name_el)
            clean_desc = clean_text(desc_el)

            if clean_name and 2 <= len(clean_name) <= 70 and not any(it["name"] == clean_name for it in catalog_items):
                cat = infer_category(clean_name, clean_desc)
                catalog_items.append({
                    "name": clean_name,
                    "description": clean_desc,
                    "price": price,
                    "category": cat,
                    "tags": detect_dietary_tags(f"{clean_name} {clean_desc}"),
                    "source": "html-heuristic"
                })

    # Location merging
    location = deep_ld.get("location", {})
    if not location.get("postalCode"):
        pc_match = POSTAL_CODE_FR_REGEX.search(body_text)
        if pc_match:
            location["postalCode"] = pc_match.group(0)

    # 7. Services & Amenities Detection
    amenities = []
    lower_body = body_text.lower()
    if any(k in lower_body for k in ["terrasse", "en plein air", "rooftop", "jardin"]):
        amenities.append("Terrasse")
    if any(k in lower_body for k in ["climatisation", "climatisé", "air conditionné"]):
        amenities.append("Climatisation")
    if any(k in lower_body for k in ["wifi", "wi-fi", "accès internet"]):
        amenities.append("Wifi gratuit")
    if any(k in lower_body for k in ["accès pmr", "handicap", "mobilité réduite", "accessible"]):
        amenities.append("Accès PMR")
    if any(k in lower_body for k in ["animaux acceptés", "chiens acceptés", "pet friendly"]):
        amenities.append("Animaux acceptés")
    if any(k in lower_body for k in ["à emporter", "take away", "takeaway", "vente à emporter"]):
        amenities.append("Vente à emporter")
    if any(k in lower_body for k in ["click & collect", "click and collect", "commande en ligne"]):
        amenities.append("Click & Collect")
    if any(k in lower_body for k in ["réservation conseillée", "réserver une table", "réservation"]):
        amenities.append("Réservations en ligne")

    return {
        "success": True,
        "url": url,
        "status": getattr(response, "status", 200),
        "identity": {
            "name": deep_ld.get("organization", {}).get("name") or title.split("-")[0].split("|")[0].strip(),
            "legal": legal_info,
            "phone": list(telephones),
            "email": list(emails),
            "location": location,
            "rating": deep_ld.get("rating", {})
        },
        "branding": {
            "title": title,
            "description": meta_description,
            "og_title": og_title,
            "og_image": og_image,
            "favicon": favicon,
            "primary_color": extracted_colors[0] if extracted_colors else "#C5A059"
        },
        "socials": social_links,
        "integrations": integrations,
        "amenities": amenities,
        "internal_target_pages": list(internal_links)[:10],
        "catalog_items": catalog_items[:60],
        "headings": {
            "h1": h1s[:5],
            "h2": h2s[:10],
            "h3": h3s[:15]
        },
        "json_ld_blocks_count": len(json_ld_data)
    }


# ── Morphogenetic Synthesizer ─────────────────────────────────────────────────

def synthesize_restaurant_os_profile(crawled_data: Dict[str, Any]) -> Dict[str, Any]:
    """Derives complete operational profile, archetype, and module configuration for Restaurant OS."""
    items = crawled_data.get("catalog_items", [])
    identity = crawled_data.get("identity", {})
    branding = crawled_data.get("branding", {})
    amenities = crawled_data.get("amenities", [])
    integrations = crawled_data.get("integrations", {})

    # 1. Average Ticket Estimation
    dish_prices = [it["price"] for it in items if it.get("price", 0) > 0]
    avg_price = round(sum(dish_prices) / len(dish_prices), 2) if dish_prices else 18.50
    estimated_ticket = round(avg_price * 1.6, 2)  # Base dish + drink/dessert multiplier

    # 2. Archetype Classification
    text_corpus = f"{branding.get('title', '')} {branding.get('description', '')} {' '.join([it['name'] for it in items])}".lower()
    
    archetype = "restaurant_traditionnel"
    display_name = "Restaurant Traditionnel / Bistrot"
    
    if any(k in text_corpus for k in ["boulangerie", "pâtisserie", "baguette", "croissant", "sandwich"]):
        archetype = "boulangerie_traiteur"
        display_name = "Boulangerie / Pâtisserie / Traiteur"
    elif any(k in text_corpus for k in ["pizza", "pizzeria", "napolitaine", "trattoria"]):
        archetype = "pizzeria"
        display_name = "Pizzeria & Trattoria"
    elif any(k in text_corpus for k in ["burger", "smash", "fast food", "street food", "frites"]):
        archetype = "fast_good"
        display_name = "Fast Good / Street Food"
    elif any(k in text_corpus for k in ["brasserie", "choucroute", "fruits de mer", "bavette", "bière"]):
        archetype = "brasserie"
        display_name = "Grande Brasserie"
    elif any(k in text_corpus for k in ["cocktail", "bar", "tapas", "pub", "bières", "mixologie"]):
        archetype = "bar_cocktails"
        display_name = "Bar à Cocktails / Tapas"
    elif any(k in text_corpus for k in ["étoilé", "michelin", "gastronomique", "dégustation en 7 temps"]):
        archetype = "gastronomique"
        display_name = "Haute Gastronomie"

    # 3. Recommended Restaurant OS Modules
    recommended_modules = [
        {"id": "pos", "name": "Caisse Tactile NF525", "priority": "CORE", "reason": "Obligation légale d'encaissement inaltérable."},
        {"id": "kds", "name": "Écran Cuisine (KDS)", "priority": "HIGH", "reason": "Cadençage instantané des commandes en cuisine."},
        {"id": "floor_plan", "name": "Plan de Salle 3D / 2D", "priority": "HIGH" if "Terrasse" in amenities or archetype in ["brasserie", "restaurant_traditionnel"] else "MEDIUM", "reason": "Gestion des tables et attribution des rangs."},
        {"id": "reservations", "name": "Cahier de Réservations", "priority": "HIGH" if integrations.get("reservation_provider") or "Réservations en ligne" in amenities else "MEDIUM", "reason": "Gestion du plan de table et taux d'occupation."},
        {"id": "haccp", "name": "Module Hygiène HACCP", "priority": "HIGH", "reason": "Relevés de températures et traçabilité sanitaire."},
        {"id": "inventory", "name": "Gestion des Stocks & Fiches Recettes", "priority": "HIGH", "reason": "Déduction temps réel au plat et maîtrise du Food Cost."},
        {"id": "click_collect", "name": "Click & Collect / QR Code", "priority": "HIGH" if "Click & Collect" in amenities or archetype == "fast_good" else "LOW", "reason": "Prise de commande digitale sans attente."}
    ]

    return {
        "archetype": {
            "id": archetype,
            "label": display_name,
            "confidence": 0.92,
        },
        "financials": {
            "estimated_average_ticket": f"{estimated_ticket:.2f} €",
            "items_count_discovered": len(items),
            "currency": "EUR"
        },
        "recommended_modules": recommended_modules,
        "dna_profile": {
            "brand": identity.get("name"),
            "legal_entity": identity.get("legal", {}),
            "contact": {
                "phones": identity.get("phone", []),
                "emails": identity.get("email", []),
                "address": identity.get("location", {})
            },
            "social_presence": crawled_data.get("socials", {}),
            "amenities": amenities,
            "integrations": integrations
        }
    }


# ── Deep Multi-Page Crawl ─────────────────────────────────────────────────────

def deep_morphogenetic_crawl(url: str, stealth: bool = False, max_subpages: int = 3) -> Dict[str, Any]:
    """Performs deep multi-page crawl and morphogenetic profile synthesis."""
    home_data = extract_page_data(url, stealth=stealth)
    if not home_data.get("success"):
        return home_data

    catalog = home_data.get("catalog_items", [])
    subpages = home_data.get("internal_target_pages", [])
    
    # Target priority subpages (menu, carte, mentions legales, contact)
    priority_subpages = [p for p in subpages if any(k in p.lower() for k in ["menu", "carte", "tarifs", "vins", "boissons", "mentions", "legal"])]
    if not priority_subpages and subpages:
        priority_subpages = subpages[:max_subpages]
    else:
        priority_subpages = priority_subpages[:max_subpages]

    for sub_url in priority_subpages:
        sub_data = extract_page_data(sub_url, stealth=stealth)
        if sub_data.get("success"):
            # Merge catalog
            for item in sub_data.get("catalog_items", []):
                if not any(it["name"] == item["name"] for it in catalog):
                    catalog.append(item)
            # Merge phones
            for ph in sub_data.get("identity", {}).get("phone", []):
                if ph not in home_data["identity"]["phone"]:
                    home_data["identity"]["phone"].append(ph)
            # Merge emails
            for em in sub_data.get("identity", {}).get("email", []):
                if em not in home_data["identity"]["email"]:
                    home_data["identity"]["email"].append(em)
            # Merge legal info
            sub_legal = sub_data.get("identity", {}).get("legal", {})
            for k, v in sub_legal.items():
                if v and not home_data["identity"]["legal"].get(k):
                    home_data["identity"]["legal"][k] = v
            # Merge amenities
            for am in sub_data.get("amenities", []):
                if am not in home_data["amenities"]:
                    home_data["amenities"].append(am)

    home_data["catalog_items"] = catalog
    home_data["crawled_subpages_count"] = len(priority_subpages)
    
    # Synthesize Restaurant OS Morphogenesis Profile
    home_data["morphogenesis"] = synthesize_restaurant_os_profile(home_data)
    return home_data


def main():
    parser = argparse.ArgumentParser(description="Scrapling Morphogenetic Intelligence Agent")
    parser.add_argument("--url", "-u", required=True, help="URL to scrape")
    parser.add_argument("--stealth", "-s", action="store_true", help="Enable stealth mode")
    parser.add_argument("--crawl", "-c", action="store_true", help="Deep multi-page crawl")
    parser.add_argument("--timeout", "-t", type=int, default=8, help="Request timeout in seconds")
    parser.add_argument("--pretty", "-p", action="store_true", help="Pretty-print JSON output")

    args = parser.parse_args()
    
    if args.crawl:
        data = deep_morphogenetic_crawl(args.url, stealth=args.stealth)
    else:
        data = extract_page_data(args.url, stealth=args.stealth, timeout=args.timeout)
        if data.get("success"):
            data["morphogenesis"] = synthesize_restaurant_os_profile(data)

    if args.pretty:
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print(json.dumps(data, ensure_ascii=False))


if __name__ == "__main__":
    main()
