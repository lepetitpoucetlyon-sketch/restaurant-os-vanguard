const { config } = require('./antigravity-config');
const fs = require('fs');
const path = require('path');

/**
 * 🔒 ANTIGRAVITY ENVIRONMENT SEAL
 * Goal: Validate all system dependencies and finalize environment configuration.
 */

async function sealEnvironment() {
    console.log('🔒 Antigravity Environment Seal: Démarrage du diagnostic...');
    console.log('='.repeat(60));

    let allOk = true;

    // 1. Validate Binaries
    for (const [name, binPath] of Object.entries(config.binaries)) {
        if (fs.existsSync(binPath)) {
            console.log(`✅ [${name.toUpperCase().padEnd(8)}] Trouvé : ${binPath}`);
        } else {
            console.error(`❌ [${name.toUpperCase().padEnd(8)}] INTROUVABLE : Nous cherchions ${binPath}`);
            allOk = false;
        }
    }

    // 2. Validate Project Structure
    const requiredDirs = ['.antigravity', 'scripts', 'src'];
    for (const dir of requiredDirs) {
        const fullPath = path.join(config.repoRoot, dir);
        if (fs.existsSync(fullPath)) {
            console.log(`✅ [PROJET  ] Répertoire validé : ${dir}`);
        } else {
            console.error(`❌ [PROJET  ] Répertoire MANQUANT : ${dir}`);
            allOk = false;
        }
    }

    // 3. Finalize Config
    if (allOk) {
        console.log('='.repeat(60));
        console.log('✨ Environnement SCELLÉ avec succès.');
        console.log('📁 Configuration sauvegardée dans .antigravity/env.json');
        process.exit(0);
    } else {
        console.error('='.repeat(60));
        console.error('⚠️  ÉCHEC DU SCELLAGE : Des dépendances critiques sont manquantes.');
        process.exit(1);
    }
}

sealEnvironment().catch(console.error);
