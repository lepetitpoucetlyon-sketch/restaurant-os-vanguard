#!/usr/bin/env python3
"""
⚡ Fast Scrapling UI Snapshotter — Interactive & Direct View
"""

import sys
import os
import time
import argparse
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = "/Users/mohammed-aliboudjaadar/.gemini/antigravity-ide/brain/56b635a2-6ebc-4dc2-bb54-026c9bb892b8"


def capture_route(url: str, name: str, wait_ms: int = 3000) -> str:
    output_path = os.path.join(ARTIFACT_DIR, f"{name}.png")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        t0 = time.perf_counter()
        print(f"🚀 [1/3] Navigation vers {url}...")
        page.goto(url, wait_until="domcontentloaded", timeout=12000)
        time.sleep(1.0)

        # 1. Click user selection card
        card = page.locator("button:has-text('ADMINISTRATEUR'), button:has-text('administrateur')").first
        if card.is_visible(timeout=3000):
            print("👤 [2/3] Clic sur la carte Administrateur...")
            card.click()
            time.sleep(0.5)

            # 2. Click keypad digits 9 9 9 9
            btn9 = page.locator("button:has-text('9')").first
            if btn9.is_visible(timeout=1500):
                print("🔑 [3/3] Saisie du code PIN 9999...")
                for _ in range(4):
                    btn9.click()
                    time.sleep(0.12)
                time.sleep(0.3)

                # Click submit
                submit_btn = page.locator(".grid-cols-3 button").last
                if submit_btn.is_visible(timeout=1000):
                    submit_btn.click()
                    print("✅ Validation PIN cliquée...")

        time.sleep(wait_ms / 1000.0)
        page.screenshot(path=output_path, full_page=False)
        t1 = time.perf_counter()
        
        browser.close()
        print(f"📸 Capture réussie en {(t1-t0):.2f}s ➔ {output_path}")
        return output_path


def main():
    parser = argparse.ArgumentParser(description="Fast Scrapling UI Snapshotter")
    parser.add_argument("--url", "-u", default="http://localhost:3001/pos", help="URL to snapshot")
    parser.add_argument("--name", "-n", default="pos_live_view", help="Name of the screenshot file")
    parser.add_argument("--wait", "-w", type=int, default=3000, help="Wait time in ms")

    args = parser.parse_args()
    capture_route(args.url, args.name, wait_ms=args.wait)


if __name__ == "__main__":
    main()
