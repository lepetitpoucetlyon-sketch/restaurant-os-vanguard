// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

const TARGET_FILE = 'public/blueprint/data.js';
const VAR_NAME = 'SINGULARITY_EMPIRE';

if (!fs.existsSync(TARGET_FILE)) {
    console.error(`Error: ${TARGET_FILE} not found. Ensure you are in the project root.`);
    process.exit(1);
}

let content = fs.readFileSync(TARGET_FILE, 'utf8');

let dataObj;
try {
    const wrappedCode = content.replace(`const ${VAR_NAME} =`, 'tempVar =')
                               .split('if (typeof window')[0];
    let tempVar;
    eval(wrappedCode);
    dataObj = tempVar;
} catch (e) {
    console.error("Failed to parse blueprint data:", e);
    process.exit(1);
}

// 1. Remove hallucinations (already refined)
function removeHallucinations(node) {
    if (!node.chemins) return;
    node.chemins = node.chemins.filter(c => {
        const name = c.nom.toLowerCase();
        if (name.includes('postgresql') || name.includes('timescaledb') || name.includes('s3 glacier')) return false;
        if (name.includes('biométrie') || name.includes('badge nfc') || name.includes('argon2')) return false;
        if (name.includes('maintenance') || name.includes('dératisation')) return false;
        return true;
    });
    node.chemins.forEach(removeHallucinations);
}
removeHallucinations(dataObj);

// 2. Aggressive Level 7 Expansion
const DOMAIN_MAP = {
    "🛡️ SÉCURITÉ": {
        level4: "SovereignShield Protocol",
        level5: "Token Verification Engine",
        level6: "IdentityManager.validate()",
        level7: "Firestore.getDoc(tenantAuth)"
    },
    "⚡ PERFORMANCE": {
        level4: "Resource Optimizer",
        level5: "Atom Garbage Collector",
        level6: "FinalizationRegistry.cleanup()",
        level7: "WeakRef.deref()"
    },
    "⚖️ FISCALITÉ": {
        level4: "Immutable Ledger",
        level5: "SHA-256 Chaining Service",
        level6: "FiscalEngine.notarize()",
        level7: "Ledger.append(hash)"
    },
    "🛒 OPÉRATIONS": {
        level4: "Real-time Sync Loop",
        level5: "Nexus Transaction Logic",
        level6: "NexusSyncService.update()",
        level7: "Firestore.setDoc(atomic)"
    },
    "🧬 DARWINIENNE": {
        level4: "Chaos Resilience Layer",
        level5: "Self-Healing Worker",
        level6: "CRC Checksum Validation",
        level7: "MemoryInjection.apply()"
    }
};

function expandNode(node, currentDepth, rootDomain) {
    node.depth = currentDepth;

    if (currentDepth < 7) {
        if (!node.chemins || node.chemins.length === 0) {
            // Generate a child based on root domain patterns if generic
            const patterns = DOMAIN_MAP[rootDomain] || DOMAIN_MAP["🛒 OPÉRATIONS"];
            let nextNom = "";
            let nextGenre = node.genre;

            if (currentDepth === 3) nextNom = `${node.nom} Layer`;
            else if (currentDepth === 4) nextNom = patterns[`level5`];
            else if (currentDepth === 5) nextNom = patterns[`level6`];
            else if (currentDepth === 6) nextNom = patterns[`level7`];
            else nextNom = `${node.nom} Sub-Action`;

            node.chemins = [{
                nom: nextNom,
                genre: currentDepth >= 5 ? "action" : node.genre,
                description: `Expansion automatique niveau ${currentDepth + 1}`
            }];
        }
        node.chemins.forEach(c => expandNode(c, currentDepth + 1, rootDomain));
    }
}

dataObj.chemins.forEach(domaine => {
    const domainName = domaine.nom;
    expandNode(domaine, 2, domainName);
});
dataObj.depth = 1;

// Overwrite file
const newContent = `const ${VAR_NAME} = ${JSON.stringify(dataObj, null, 2)};

if (typeof window !== 'undefined') {
    window.${VAR_NAME} = ${VAR_NAME};
}
`;

fs.writeFileSync(TARGET_FILE, newContent, 'utf8');
console.log(`Blueprint expanded to Level 7 in ${TARGET_FILE}`);
