/**
 * 🏭 Fleet Demo Seed — Restaurant OS
 * Écrit un document SiteTelemetry réaliste dans fleet-telemetry/{tenantId}
 * pour rendre le tenant demo visible dans le MCC immédiatement.
 *
 * Usage:
 *   node scripts/seed-fleet-demo.js [tenantId]
 *   node scripts/seed-fleet-demo.js lepetitpoucet
 */
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

require('dotenv').config({ path: '.env.local' });

const TENANT_ID = process.argv[2] || process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'lepetitpoucet';

const firebaseConfig = {
    apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

async function seedDemoFleet() {
    const now = new Date().toISOString();

    const siteTelemetry = {
        id:            TENANT_ID,
        key:           TENANT_ID,
        name:          process.env.NEXT_PUBLIC_RESTAURANT_NAME || 'Le Restaurant OS — Démo',
        tenantId:      TENANT_ID,
        status:        'ONLINE',
        tier:          'PREMIUM',
        version:       '4.0.0-NEXUS',
        engineVersion: 'Grade-X-Vanguard',
        createdAt:     now,
        updatedAt:     now,
        lastHeartbeat: now,
        lastSeen:      now,

        // Métriques réalistes
        activeUsers:     4,
        dailyRevenue:    1840,
        activeOrders:    7,
        healthScore:     94,
        complianceScore: 98,
        lowStockAlerts:  2,

        branding: {
            primaryColor:   process.env.NEXT_PUBLIC_PRIMARY_COLOR   || '#C5A059',
            secondaryColor: process.env.NEXT_PUBLIC_SECONDARY_COLOR || '#1C1C1C',
            logoUrl:        '',
            tagline:        process.env.NEXT_PUBLIC_RESTAURANT_SLOGAN || 'Excellence Opérationnelle',
        },

        security: {
            twoFactorEnabled:          true,
            nf525Certified:            true,
            maintenanceAccessGranted:  false,
            supportAccessGranted:      false,
        },

        ragStatus: {
            status:        'online',
            version:       '1.0.0',
            documentCount: 142,
            lastIndexed:   now,
            latencyMs:     82,
        },

        featureFlags: {
            mod_pos:       true,
            mod_kds:       true,
            mod_haccp:     true,
            mod_analytics: true,
            mod_hr:        true,
            mod_treasury:  true,
        },

        firebaseConfig: {
            projectId:  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        },
    };

    await setDoc(doc(db, 'fleet-telemetry', TENANT_ID), siteTelemetry, { merge: true });

    console.log(`✅  Instance demo "${TENANT_ID}" enregistrée dans fleet-telemetry/`);
    console.log(`    → Ouvre le MCC et clique sur "Sync Globale" pour la voir apparaître.`);
    process.exit(0);
}

seedDemoFleet().catch(err => {
    console.error('❌  Erreur seed:', err.message);
    process.exit(1);
});
