import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const OUTPUT_DIR = path.resolve(process.cwd(), "design/all-pages");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Full catalogue of platform routes
const routes = [
  // 1. Ops & Service
  { name: "01-POS-Caisse", path: "/pos" },
  { name: "02-POS-Mobile", path: "/pos-mobile" },
  { name: "03-Plan-De-Salle", path: "/floor-plan" },
  { name: "04-Reservations", path: "/reservations" },
  { name: "05-Bar-Cocktails", path: "/bar" },
  { name: "06-Kiosk-Borne", path: "/kiosk" },

  // 2. Production & Kitchen
  { name: "07-KDS-Cuisine", path: "/kds" },
  { name: "08-Fiches-Recettes", path: "/kitchen" },
  { name: "09-Editeur-Menu", path: "/menu-builder" },
  { name: "10-Menu-Engineering", path: "/menu-engineering" },

  // 3. Stock & Logistics
  { name: "11-Inventaire-Stocks", path: "/inventory" },
  { name: "12-Fournisseurs-Hub", path: "/suppliers" },
  { name: "13-Reception-Marchandises", path: "/admin/inventory/reception" },

  // 4. Compliance & HACCP & NF525
  { name: "14-HACCP-Sanitaire", path: "/haccp" },
  { name: "15-Audits-Hygiene", path: "/hygiene" },
  { name: "16-NF525-Grand-Livre", path: "/nf525" },
  { name: "17-Registre-Securite", path: "/registre" },

  // 5. Finance & Accounting
  { name: "18-Finance-Tresorerie", path: "/finance" },
  { name: "19-Portail-Comptable", path: "/accounting-portal" },
  { name: "20-Audit-DGFiP", path: "/audit-portal" },

  // 6. HR & Staff
  { name: "21-Effectifs-Staff", path: "/staff" },
  { name: "22-Planning-Shifts", path: "/planning" },
  { name: "23-Pointeuse-Timeclock", path: "/timeclock" },
  { name: "24-Conges-Absences", path: "/leaves" },
  { name: "25-Recrutement-CV", path: "/recruitment" },
  { name: "26-Espace-Personnel", path: "/mon-espace" },
  { name: "27-Onboarding-Staff", path: "/welcome-staff" },

  // 7. CRM & Marketing
  { name: "28-CRM-Clients-VIP", path: "/crm" },
  { name: "29-Marketing-Campagnes", path: "/marketing" },
  { name: "30-SEO-Google-Local", path: "/marketing/seo" },

  // 8. Admin & MCC Fleet
  { name: "31-Admin-MCC-Cockpit", path: "/admin/mcc" },
  { name: "32-Admin-Dashboard", path: "/admin/dashboard" },
  { name: "33-Admin-Agents-IA", path: "/admin/agent" },
  { name: "34-Admin-Simulation", path: "/admin/simulation" },
  { name: "35-Admin-Prospecting", path: "/admin/prospecting" },
  { name: "36-Admin-DLQ", path: "/admin/mcc/dlq" },
  { name: "37-System-Map", path: "/system-map" },
  { name: "38-Blueprint-Verticales", path: "/blueprint" },
  { name: "39-Design-System", path: "/design-system" },

  // 9. Client & Public
  { name: "40-Portail-Commande-Client", path: "/order/_demo_restaurant" },
  { name: "41-Menu-Digital-Table", path: "/menu/_demo_restaurant/table_1" },
  { name: "42-Landing-Page", path: "/landing" },
  { name: "43-Pricing-Simulateur", path: "/pricing" },
  { name: "44-Showcase", path: "/showcase" },
  { name: "45-Documentation", path: "/docs/pos" },
];

async function run() {
  console.log(`🚀 Capture automatisée des écrans sur ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // Retina 2x for ultra high-fidelity Figma import
  });

  const page = await context.newPage();

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const targetUrl = `${BASE_URL}${route.path}`;
    const outputPath = path.join(OUTPUT_DIR, `${route.name}.png`);

    try {
      console.log(`[${i + 1}/${routes.length}] Capture: ${route.name} (${route.path})...`);
      await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 10000 });
      await page.waitForTimeout(600); // allow animations to settle
      await page.screenshot({ path: outputPath, fullPage: false });
    } catch (err) {
      console.warn(`⚠️ Erreur sur ${route.path}:`, err.message);
      // Fallback: take screenshot anyway
      try {
        await page.screenshot({ path: outputPath, fullPage: false });
      } catch (_) {}
    }
  }

  await browser.close();
  console.log(`\n✅ Capture terminée ! Toutes les maquettes sont dans : ${OUTPUT_DIR}`);
}

run();
