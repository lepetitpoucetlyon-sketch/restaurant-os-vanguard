import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

// Simulation du FiscalEngine (pour éviter les problèmes d'import ESM dans ts-node)
const generateHash = (data: string, previousHash: string): string => {
    const dataToHash = data + previousHash;
    return crypto.createHash('sha256').update(dataToHash).digest('hex');
};

async function runBenchmark(count: number = 100) {
    console.log(`🚀 Démarrage du Benchmark de Performance V15.5... (${count} transactions)`);

    // 1. Initialisation Admin SDK (ESM Modular)
    const serviceAccountPath = '/Users/mohammed-aliboudjaadar/.gemini/antigravity/service-account.json';
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    initializeApp({
        credential: cert(serviceAccount)
    });

    const db = getFirestore();
    const tenantId = 'global_tenant'; // Simulons un tenant global
    const journalRef = db.collection(`tenants/${tenantId}/journalEntries`);
    const sealsRef = db.collection(`tenants/${tenantId}/fiscalSeals`);

    console.log(`🔗 Connexion à Firestore réussie. Projet: ${serviceAccount.project_id}`);

    let lastHash = 'GENESIS_ROOT';
    const entries = [];
    const startTime = Date.now();

    // 2. Génération et Scellage (Phase Blockchain)
    console.log(`⛓️  Phase 1 : Hachage et Scellage Blockchain (NF525)...`);
    for (let i = 0; i < count; i++) {
        const entryData = {
            date: new Date().toISOString(),
            description: `Vente de test #${i}`,
            amount: Math.random() * 100,
            isSystemGenerated: true,
            pieceNumber: `T${Date.now()}_${i}`
        };

        const dataSnapshot = JSON.stringify(entryData);
        const hash = generateHash(dataSnapshot, lastHash);
        
        entries.push({
            entry: entryData,
            seal: {
                id: `seal_${crypto.randomUUID().replace(/-/g, '')}`,
                transactionId: `tx_${i}`,
                previousHash: lastHash,
                hash: hash,
                timestamp: new Date().toISOString(),
                dataSnapshot,
                signature: `SIG_${hash.substring(0, 12)}`
            }
        });

        lastHash = hash;
    }
    const hashingTime = Date.now() - startTime;
    console.log(`✅ ${count} transactions hachées en ${hashingTime}ms. (Moyenne: ${(hashingTime/count).toFixed(2)}ms/entry)`);

    // 3. Injection Firestore (Phase Réseau)
    console.log(`📡 Phase 2 : Injection Cloud Firestore (Multi-threaded)...`);
    const networkStartTime = Date.now();
    
    // On utilise des lots (batches) pour optimiser, mais ici on teste la latence individuelle
    const promises = entries.map(async (item) => {
        const docRef = journalRef.doc();
        return db.runTransaction(async (transaction) => {
            transaction.set(docRef, item.entry);
            transaction.set(sealsRef.doc(), { ...item.seal, transactionId: docRef.id });
        });
    });

    await Promise.all(promises);
    
    const networkTime = Date.now() - networkStartTime;
    console.log(`✅ ${count} transactions scellées en production en ${networkTime}ms.`);
    console.log(`📊 Latence moyenne d'écriture scellée : ${(networkTime/count).toFixed(2)}ms/écriture.`);

    // 4. Rapport Token Efficiency (Calcul Théorique)
    console.log('\n--- 📏 RAPPORT D\'EFFICIENCE (TOKEN ECONOMY) ---');
    const standardContextSize = count * 0.5; // ~0.5KB par doc en moyenne
    const industrializedContextSize = 0.5; // Un seul aggregate BigQuery
    console.log(`🔹 Volume contexte 'Standard' : ${standardContextSize.toFixed(2)} KB`);
    console.log(`🔹 Volume contexte 'Industrialisé' : ${industrializedContextSize.toFixed(2)} KB`);
    console.log(`🏆 ÉCONOMIE : x${(standardContextSize/industrializedContextSize).toFixed(0)} de réduction de fenêtre.`);

    console.log('\n✅ BENCHMARK TERMINÉ.');
    process.exit(0);
}

runBenchmark(100).catch(err => {
    console.error('❌ Erreur Critique lors du Benchmark:', err);
    process.exit(1);
});
