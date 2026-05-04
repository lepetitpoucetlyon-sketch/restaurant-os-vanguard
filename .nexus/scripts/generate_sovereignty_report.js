const fs = require('fs');

const lines = fs.readFileSync('all_any_unknown.txt', 'utf8').split('\n').filter(Boolean);

let markdown = "# 🏛️ REGISTRE ABSOLU DE SOUVERAINETÉ GRADE X (2026)\n\n";
markdown += "Ce document contient l'intégralité des 483 occurrences de `any` et `unknown` détectées dans l'empire.\n\n";

markdown += "| Catégorie | Dénomination (Fichier:Ligne - Code) | Remplacement Proposé | Transformateur |\n";
markdown += "| :--- | :--- | :--- | :--- |\n";

lines.forEach(line => {
    const parts = line.split(':');
    const file = parts[0];
    const lineNumber = parts[1];
    const content = parts.slice(2).join(':').trim();
    
    let category = "DOMAIN";
    if (file.includes('finance')) category = "FINANCE";
    if (file.includes('ops')) category = "OPS";
    if (file.includes('mcc') || file.includes('admin')) category = "MCC";
    if (file.includes('lib') || file.includes('engines')) category = "CORE";
    if (file.includes('store') || file.includes('atoms')) category = "ATOM";

    let replacement = "T";
    let transformer = "Interface Elevation";

    if (content.includes('as any')) {
       if (file.includes('atoms')) {
           replacement = "PrimitiveAtom<T>";
           transformer = "AtomicBridge";
       } else if (file.includes('NF525')) {
           replacement = "SovereignData";
           transformer = "SchemaCast";
       }
    } else if (content.includes('as unknown')) {
        replacement = "T";
        transformer = "TypeGuard Validator";
    }

    // Escape markdown pipe in content
    const safeContent = content.substring(0, 50).replace(/\|/g, '\\|');
    markdown += `| **${category}** | \`${file}:${lineNumber}\` - \`${safeContent}${content.length > 50 ? '...' : ''}\` | \`${replacement}\` | ${transformer} |\n`;
});

fs.writeFileSync('registre_absolu_any_unknown_2026.md', markdown);
console.log("Registre généré avec succès.");
