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

const MODAL_KEYWORDS = [
  'nouveau', 'ajouter', 'modifier', 'edit', 'pay', 'details', 'plus', 'add',
  'param', 'filtre', 'commander', 'client', 'search', 'réserver', 'ouvrir', 'voir'
];

async function _authenticate(page, authCode) {
  try {
    await page.waitForSelector('input, [role="button"]', { timeout: 10000 });
    for (const digit of authCode) {
      await page.keyboard.press(digit);
      await page.waitForTimeout(100);
    }
    await page.waitForSelector('nav, aside', { timeout: 120000 });
    console.log('✅ Authentication successful.');
  } catch (err) {
    console.warn('⚠️ Auth check bypassed.');
  }
}

async function _captureViewports(page, safeName, outputDir) {
  for (const [device, viewport] of Object.entries(VIEWPORTS)) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(1000);
    const filePath = path.join(outputDir, `${safeName}_${device.toLowerCase()}_main.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`  ✅ ${device} captured.`);
  }
}

async function _findModalTriggers(page) {
  const triggers = await page.$$('button:visible, [role="button"]:visible, a.card-premium:visible');
  const filteredTriggers = [];
  for (const trigger of triggers) {
    const text = (await trigger.innerText()).trim();
    const ariaLabel = await trigger.getAttribute('aria-label') || '';
    const title = await trigger.getAttribute('title') || '';
    const lowerLabel = (text + ariaLabel + title).toLowerCase();
    if (MODAL_KEYWORDS.some(kw => lowerLabel.includes(kw)) || ariaLabel.includes('Plus') || text.includes('+')) {
      filteredTriggers.push({ handle: trigger, label: text || ariaLabel || 'action' });
    }
  }
  return filteredTriggers;
}

async function _clickTriggers(page, filteredTriggers, safeName, outputDir) {
  for (const triggerItem of filteredTriggers.slice(0, 5)) {
    try {
      await triggerItem.handle.click();
      await page.waitForTimeout(2000);
      const label = triggerItem.label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const modalPath = path.join(outputDir, `${safeName}_desktop_window_${label}.png`);
      await page.screenshot({ path: modalPath });
      console.log(`    🎁 Window captured: ${label}`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    } catch (innerErr) {
      await page.keyboard.press('Escape');
    }
  }
}

async function capture() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🚀 Launching Restaurant OS Auto-Explorer v5 (ROBUST)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log(`🔐 Authenticating with code: ${AUTH_CODE}`);
  await page.goto(BASE_URL, { timeout: 120000 });
  await _authenticate(page, AUTH_CODE);

  for (const route of ROUTES) {
    const url = `${BASE_URL}${route}`;
    const safeName = route === '/' ? 'dashboard' : route.replace(/\//g, '_').substring(1);
    console.log(`\n📂 Processing: [${route}]`);
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(3000);
      await _captureViewports(page, safeName, OUTPUT_DIR);
      const filteredTriggers = await _findModalTriggers(page);
      console.log(`  🔍 Found ${filteredTriggers.length} potential triggers.`);
      await _clickTriggers(page, filteredTriggers, safeName, OUTPUT_DIR);
    } catch (err) {
      console.error(`  ❌ Error on ${route}: ${err.message}`);
    }
  }

  console.log('\n✨ Export COMPLETE. Local images ready in /exports-stitch');
  await browser.close();
}

capture().catch(console.error);
