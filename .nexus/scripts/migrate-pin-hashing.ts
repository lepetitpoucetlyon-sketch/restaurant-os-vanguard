// @ts-nocheck
/**
 * PIN MIGRATION SCRIPT — Restaurant OS
 * One-shot: Migre les PINs en clair vers des hashes SHA-256 salés.
 * 
 * Usage: npx tsx scripts/migrate-pin-hashing.ts
 * 
 * IMPORTANT: Exécuter UNE SEULE FOIS avant de passer en production.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, deleteField } from 'firebase/firestore';

// Firebase config — à adapter selon l'environnement
const firebaseConfig = {
    // Utilise les mêmes credentials que l'app
    projectId: process.env.FIREBASE_PROJECT_ID || 'kitchen-os-gastro',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function hashPin(pin: string, salt: string): Promise<string> {
    const data = new TextEncoder().encode(pin + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');
}

async function migrate() {
    console.log('🔄 Début de la migration des PINs...\n');
    
    const usersSnap = await getDocs(collection(db, 'users'));
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;

        // Skip if already migrated
        if (userData.pinHash && !userData.pin) {
            console.log(`  ⏭️  ${userData.name} (${userId}) — déjà migré`);
            skipped++;
            continue;
        }

        if (!userData.pin) {
            console.log(`  ⚠️  ${userData.name} (${userId}) — pas de PIN trouvé`);
            errors++;
            continue;
        }

        try {
            const pinHash = await hashPin(userData.pin, userId);
            await updateDoc(doc(db, 'users', userId), {
                pinHash,
                pin: deleteField()  // Supprime le PIN en clair
            });
            console.log(`  ✅ ${userData.name} (${userId}) — migré avec succès`);
            migrated++;
        } catch (err) {
            console.error(`  ❌ ${userData.name} (${userId}) — ERREUR:`, err);
            errors++;
        }
    }

    console.log(`\n📊 Résultat de la migration:`);
    console.log(`   ✅ Migrés: ${migrated}`);
    console.log(`   ⏭️  Déjà faits: ${skipped}`);
    console.log(`   ❌ Erreurs: ${errors}`);
    console.log(`   📝 Total traités: ${usersSnap.docs.length}`);
    
    if (errors === 0) {
        console.log('\n🎉 Migration terminée avec succès !');
    } else {
        console.log('\n⚠️  Migration terminée avec des erreurs. Vérifier les logs.');
    }
}

migrate().catch(console.error);
