const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * RESTAURANT OS - STITCH CRAWLER PROTOCOL v5 (Ultra-Robust)
 * Fidelity: 1:1 Extreme (Infinite wait for Next.js dev + Modal Deep-Link)
 */

const BASE_URL = 'http://localhost:3000';
const AUTH_CODE = '0404';
const OUTPUT_DIR = path.join(__dirname, '../exports-stitch');

const VIEWPORTS = {
  DESKTOP: { width: 1920, height: 1080 },
  TABLET: { width: 1024, height: 1366 },
  MOBILE: { width: 393, height: 852 },
};

// 38 Verified Routes from Recursive Scan
const ROUTES = [
  '/', '/account-settings', '/accounting', '/ai-referencing', '/analytics', 
  '/analytics-integration', '/audit-portal', '/bar', '/crm', '/finance', 
  '/floor-plan', '/groups', '/haccp', '/haccp/pms', '/intelligence', '/inventory', 
  '/kds', '/kitchen', '/landing', '/leaves', '/omnichannel-reservations', 
  '/onboarding', '/planning', '/pms', '/pos', '/quality', '/quotes', 
  '/recruitment', '/registre', '/reservations', '/seo', '/settings', 
  '/simulator', '/social-marketing', '/staff', '/storage-map', '/system-map'
];

async function capture() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🚀 Launching Restaurant OS Auto-Explorer v5 (ROBUST)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // --- STEP 1: AUTHENTICATION ---
  console.log(`🔐 Authenticating with code: ${AUTH_CODE}`);
  await page.goto(BASE_URL, { timeout: 120000 });
  try {
    await page.waitForSelector('input, [role="button"]', { timeout: 10000 });
    for (const digit of AUTH_CODE) {
      await page.keyboard.press(digit);
      await page.waitForTimeout(100);
    }
    await page.waitForSelector('nav, aside', { timeout: 120000 });
    console.log('✅ Authentication successful.');
  } catch (err) {
    console.warn('⚠️ Auth check bypassed.');
  }

  // --- STEP 2: CRAWLING ---
  for (const route of ROUTES) {
    const url = `${BASE_URL}${route}`;
    const safeName = route === '/' ? 'dashboard' : route.replace(/\//g, '_').substring(1);
    
    console.log(`\n📂 Processing: [${route}]`);

    try {
      // Increased timeout to 60s for slow Next.js dev compiles
      await page.goto(url, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(3000); // 3s buffer for hydration

      for (const [device, viewport] of Object.entries(VIEWPORTS)) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(1000);
        const filePath = path.join(OUTPUT_DIR, `${safeName}_${device.toLowerCase()}_main.png`);
        await page.screenshot({ path: filePath, fullPage: true });
        console.log(`  ✅ ${device} captured.`);
      }

      // 🔍 Better Modal Discovery (Looking for Actions/Icons)
      const triggers = await page.$$('button:visible, [role="button"]:visible, a.card-premium:visible');
      const filteredTriggers = [];
      
      for (const trigger of triggers) {
        const text = (await trigger.innerText()).trim();
        const ariaLabel = await trigger.getAttribute('aria-label') || '';
        const title = await trigger.getAttribute('title') || '';
        const lowerLabel = (text + ariaLabel + title).toLowerCase();
        
        const modalKeywords = [
          'nouveau', 'ajouter', 'modifier', 'edit', 'pay', 'details', 'plus', 'add', 
          'param', 'filtre', 'commander', 'client', 'search', 'réserver', 'ouvrir', 'voir'
        ];
        
        if (modalKeywords.some(kw => lowerLabel.includes(kw)) || ariaLabel.includes('Plus') || text.includes('+')) {
           filteredTriggers.push({ handle: trigger, label: text || ariaLabel || 'action' });
        }
      }

      console.log(`  🔍 Found ${filteredTriggers.length} potential triggers.`);

      for (const triggerItem of filteredTriggers.slice(0, 5)) {
        try {
          await triggerItem.handle.click();
          await page.waitForTimeout(2000); // Animation
          
          const label = triggerItem.label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const modalPath = path.join(OUTPUT_DIR, `${safeName}_desktop_window_${label}.png`);
          
          await page.screenshot({ path: modalPath });
          console.log(`    🎁 Window captured: ${label}`);
          
          await page.keyboard.press('Escape');
          await page.waitForTimeout(1000);
        } catch (innerErr) {
          // If click fails, try clicking a backdrop or just continue
          await page.keyboard.press('Escape');
        }
      }

    } catch (err) {
      console.error(`  ❌ Error on ${route}: ${err.message}`);
    }
  }

  console.log('\n✨ Export COMPLETE. Local images ready in /exports-stitch');
  await browser.close();
}

capture().catch(console.error);
