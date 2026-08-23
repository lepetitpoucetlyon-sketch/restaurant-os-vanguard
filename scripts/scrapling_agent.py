#!/usr/bin/env python3
"""
🕸️ Scrapling Agent — High-performance scraping and extraction engine for Restaurant OS.
Powered by Scrapling (d4vinci/Scrapling) for lightning-fast parsing, stealth fetching,
and automated schema extraction.
"""

import sys
import json
import argparse
from typing import Dict, Any, List
from urllib.parse import urljoin, urlparse

try:
    from scrapling import Fetcher, StealthyFetcher, Selector
except ImportError:
    print(json.dumps({"error": "Scrapling not installed. Run: ./.venv/bin/pip install scrapling"}), file=sys.stderr)
    sys.exit(1)


def extract_page_data(url: str, stealth: bool = False, timeout: int = 10) -> Dict[str, Any]:
    """Scrapes a URL using Scrapling and returns structured business DNA metadata."""
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

    # 1. Basic Metadata
    title = page.css("title::text").get() or ""
    meta_description = (
        page.css('meta[name="description"]::attr(content)').get()
        or page.css('meta[property="og:description"]::attr(content)').get()
        or ""
    )
    og_title = page.css('meta[property="og:title"]::attr(content)').get() or title
    og_image = page.css('meta[property="og:image"]::attr(content)').get() or ""
    favicon = (
        page.css('link[rel="icon"]::attr(href)').get()
        or page.css('link[rel="shortcut icon"]::attr(href)').get()
        or ""
    )
    if favicon and not favicon.startswith("http"):
        favicon = urljoin(url, favicon)
    if og_image and not og_image.startswith("http"):
        og_image = urljoin(url, og_image)

    # 2. Extract JSON-LD Schemas
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

    # 3. Extract Links (Internal & Socials)
    domain = urlparse(url).netloc
    all_links = page.css("a::attr(href)").getall()
    social_links = {}
    internal_links = set()

    for href in all_links:
        if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
            continue
        full_url = urljoin(url, href)
        parsed_href = urlparse(full_url)
        
        # Social media detection
        lower_url = full_url.lower()
        if "instagram.com/" in lower_url and "instagram" not in social_links:
            social_links["instagram"] = full_url
        elif "facebook.com/" in lower_url and "facebook" not in social_links:
            social_links["facebook"] = full_url
        elif "tiktok.com/" in lower_url and "tiktok" not in social_links:
            social_links["tiktok"] = full_url
        elif "tripadvisor." in lower_url and "tripadvisor" not in social_links:
            social_links["tripadvisor"] = full_url
        elif "google.com/maps" in lower_url or "goo.gl/maps" in lower_url:
            social_links["google_maps"] = full_url

        # Relevant internal subpages (menu, carte, tarification, services, contact, a-propos)
        if parsed_href.netloc == domain:
            path_lower = parsed_href.path.lower()
            if any(k in path_lower for k in ["menu", "carte", "tarifs", "prix", "service", "contact", "about", "propos", "soins", "planning"]):
                internal_links.add(full_url)

    # 4. Extract Headings & Key Text Sections
    h1s = [h.strip() for h in page.css("h1::text").getall() if h.strip()]
    h2s = [h.strip() for h in page.css("h2::text").getall() if h.strip()]
    h3s = [h.strip() for h in page.css("h3::text").getall() if h.strip()]

    # 5. Extract Menu/Product Items heuristic (Cards with price indicators)
    raw_text = page.css("body").get() or ""
    
    return {
        "success": True,
        "url": url,
        "status": getattr(response, "status", 200),
        "metadata": {
            "title": title.strip(),
            "description": meta_description.strip(),
            "og_title": og_title.strip(),
            "og_image": og_image,
            "favicon": favicon
        },
        "socials": social_links,
        "internal_target_pages": list(internal_links)[:10],
        "json_ld": json_ld_data,
        "headings": {
            "h1": h1s[:5],
            "h2": h2s[:10],
            "h3": h3s[:15]
        }
    }


def main():
    parser = argparse.ArgumentParser(description="Scrapling Agent CLI for Restaurant OS")
    parser.add_argument("--url", "-u", required=True, help="URL to scrape")
    parser.add_argument("--stealth", "-s", action="store_true", help="Enable stealth mode")
    parser.add_argument("--timeout", "-t", type=int, default=10, help="Request timeout in seconds")
    parser.add_argument("--pretty", "-p", action="store_true", help="Pretty-print JSON output")

    args = parser.parse_args()
    data = extract_page_data(args.url, stealth=args.stealth, timeout=args.timeout)

    if args.pretty:
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print(json.dumps(data, ensure_ascii=False))


if __name__ == "__main__":
    main()
