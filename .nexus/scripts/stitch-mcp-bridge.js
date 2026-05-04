const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

/**
 * 🛰️ STITCH-MCP-BRIDGE v1.0
 * Goal: Export 38+ Restaurant OS pages as "Intelligence Templates" for Google Stitch.
 * Workflow: Page Scraping -> Structural Metadata Extraction -> Stitch Registry Update.
 */

const BASE_URL = 'http://localhost:3000';
const AUTH_CODE = '0404';
const REGISTRY_PATH = path.join(__dirname, '../stitch_registry.json');
const OUTPUT_DIR = path.join(__dirname, '../exports-stitch/templates');

const ROUTES = [
  '/', '/accounting', '/crm', '/haccp', '/inventory', '/kitchen', '/pos', 
  '/reservations', '/staff', '/settings', '/finance', '/planning', 
  '/floor-plan', '/omnichannel-reservations', '/kds', '/registre',
  '/recruitment', '/quality', '/audit-portal', '/system-map', '/storage-map'
];

async function exportAll() {
    console.log('🔗 Initializing Stitch MCP Bridge...');

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Auth Challenge (Handled via User Selection + Master PIN)
    console.log('🔐 Entering Authentication Shield...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    try {
        await page.waitForSelector('button', { timeout: 15000 });
        
        // Find and click the first user profile (likely Admin)
        const userButtons = await page.$$('button:has-text("Admin"), button:has-text("User"), button:has-text("Root")');
        if (userButtons.length > 0) {
            await userButtons[0].click();
            console.log('   👤 User profile selected.');
            await page.waitForTimeout(1000);
        } else {
            // If no match found by text, click the first available button in the grid
            const gridButtons = await page.$$('.grid button');
            if (gridButtons.length > 0) {
                await gridButtons[0].click();
                console.log('   👤 First available profile selected.');
            }
        }

        // Type Master Rescue PIN
        const MASTER_PIN = '9999';
        for (const digit of MASTER_PIN) {
            await page.keyboard.press(digit);
            await page.waitForTimeout(100);
        }
        
        // Wait for Nav to confirm entry
        await page.waitForSelector('nav', { timeout: 15000 });
        console.log('✅ Master Authentication successful.');
    } catch (e) {
        console.log(`⚠️ Authentication issue: ${e.message}`);
    }


    const registry = {
        project_id: "6579253670455119326",
        last_sync: new Date().toISOString(),
        screens: []
    };

    for (const route of ROUTES) {
        try {
            console.log(`📦 Exporting Template: [${route}]`);
            const url = `${BASE_URL}${route}`;
            await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            await page.waitForTimeout(2000);

            // Extract Structural Metadata for Stitch
            const metadata = await page.evaluate(() => {
                const getCleanText = (el) => el.innerText?.trim().substring(0, 100) || '';
                
                const components = Array.from(document.querySelectorAll('button, input, h1, h2, h3, .card-premium, table'))
                    .map((el, i) => ({
                        id: `stitch_${i}`,
                        tag: el.tagName.toLowerCase(),
                        role: el.getAttribute('role') || '',
                        text: getCleanText(el),
                        classes: el.className,
                        bounds: el.getBoundingClientRect()
                    }));

                return {
                    title: document.title,
                    pathname: window.location.pathname,
                    components: components.slice(0, 100) // Caps for transfer efficiency
                };
            });

            const safeName = route === '/' ? 'dashboard' : route.replace(/\//g, '_').substring(1);
            const templatePath = path.join(OUTPUT_DIR, `${safeName}.stitch.json`);
            
            fs.writeFileSync(templatePath, JSON.stringify(metadata, null, 2));
            
            // Capture Screenshot as Visual Reference
            const screenshotPath = path.join(OUTPUT_DIR, `${safeName}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });

            registry.screens.push({
                route,
                file: `src/app${route === '/' ? '/page.tsx' : route + '/page.tsx'}`,
                template: `exports-stitch/templates/${safeName}.stitch.json`,
                timestamp: new Date().toISOString()
            });

            console.log(`   ✅ Template generated: ${safeName}`);

        } catch (err) {
            console.error(`   ❌ Failed to export [${route}]: ${err.message}`);
        }
    }

    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
    console.log('\n🚀 GLOBAL STITCH SYNC COMPLETE.');
    console.log(`📂 Registry updated at: ${REGISTRY_PATH}`);
    
    await browser.close();
}

exportAll().catch(err => {
    console.error('🔥 Bridge Failure:', err);
    process.exit(1);
});
