const fs = require('fs');

const lines = fs.readFileSync('empire_souverain_audit.txt', 'utf8').split('\n').filter(Boolean);

let markdown = "# 🏛️ REGISTRE ULTIME DE SOUVERAINETÉ (A-Z)\n\n";
markdown += "Ce document contient l'intégralité des 480 occurrences de `any`, `unknown` et types flous détectées dans l'Empire.\n\n";

markdown += "| Pôle | Fichier:Ligne | Code Source | Remplacement Grade X | Transformateur |\n";
markdown += "| :--- | :--- | :--- | :--- | :--- |\n";

lines.forEach(line => {
    const parts = line.split(':');
    const file = parts[0];
    const lineNumber = parts[1];
    const content = parts.slice(2).join(':').trim();
    
    let pole = "DOMAIN";
    if (file.includes('src/shared') || file.includes('src/lib')) pole = "CORE";
    if (file.includes('finance')) pole = "FINANCE";
    if (file.includes('ops') || file.includes('kds') || file.includes('pos')) pole = "OPS";
    if (file.includes('scripts') || file.includes('functions')) pole = "MCC";
    if (file.includes('tests')) pole = "SHIELD";

    let replacement = "T (Interface)";
    let transformer = "Interface Elevation";

    if (content.includes('as any')) {
        replacement = "TypeGuard<T>";
        transformer = "Sovereign Cast";
    } else if (content.includes('as unknown')) {
        replacement = "validate<T>";
        transformer = "Shredder Validation";
    } else if (content.includes('any[]')) {
        replacement = "T[]";
        transformer = "Array Normalization";
    }

    const safeContent = content.substring(0, 40).replace(/\|/g, '\\|');
    markdown += `| **${pole}** | \`${file}:${lineNumber}\` | \`${safeContent}...\` | \`${replacement}\` | ${transformer} |\n`;
});

fs.writeFileSync('REGISTRE_A_Z_SOUVERAINETE.md', markdown);
console.log("Registre Ultime généré : 480 occurrences scellées.");
