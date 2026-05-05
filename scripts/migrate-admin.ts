import { Project, SyntaxKind } from 'ts-morph';
import path from 'path';
import fs from 'fs';

/**
 * 🛠️ MIGRATION SCRIPT - EXTENSION REPORTS & BILLING
 * Parcourt les fichiers et remplace les styles statiques par des tokens sémantiques.
 */

const TARGET_PATH = process.argv[2];

if (!TARGET_PATH) {
    console.error("❌ Veuillez spécifier un chemin cible (ex: src/app/admin/reports)");
    process.exit(1);
}

const project = new Project();
const searchPath = path.isAbsolute(TARGET_PATH) ? TARGET_PATH : path.join(process.cwd(), TARGET_PATH);

console.log(`🔍 Scan du chemin : ${searchPath}`);

function getAllFiles(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, fileList);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

const allFiles = getAllFiles(searchPath);
allFiles.forEach(f => project.addSourceFileAtPath(f));
console.log(`📄 Fichiers trouvés : ${project.getSourceFiles().length}`);

const STATIC_TO_SEMANTIC_MAP: Record<string, string> = {
    // Backgrounds
    'bg-white': 'bg-[--color-surface-primary]',
    'bg-gray-50': 'bg-[--color-surface-secondary]',
    'bg-gray-100': 'bg-[--color-surface-tertiary]',
    'bg-gray-900': 'bg-[--color-surface-inverse]',
    // Text
    'text-gray-900': 'text-[--color-text-primary]',
    'text-gray-600': 'text-[--color-text-secondary]',
    'text-gray-400': 'text-[--color-text-disabled]',
    // Borders
    'border-gray-200': 'border-[--color-border-default]',
    'border-gray-300': 'border-[--color-border-strong]',
    // Brand accents
    'bg-blue-600': 'bg-[--color-brand-primary]',
    'text-blue-600': 'text-[--color-brand-primary]',
    'bg-red-500': 'bg-[--color-status-error]',
    'bg-yellow-400': 'bg-[--color-status-warning]',
    // RH & Finance Specifique
    'bg-green-100': 'bg-[--color-status-success-subtle]',
    'text-green-800': 'text-[--color-status-success-dark]',
    'bg-red-100': 'bg-[--color-status-error-subtle]',
    'text-red-800': 'text-[--color-status-error-dark]',
    'bg-blue-50': 'bg-[--color-surface-form]',
    'bg-indigo-50': 'bg-[--color-surface-form-accent]',
};

let totalReplacements = 0;
const migrationLog: any[] = [];

project.getSourceFiles().forEach(sourceFile => {
    let fileModified = false;

    // Remplacement dans les classes
    const stringNodes = [
        ...sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral),
        ...sourceFile.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral)
    ];

    for (const node of stringNodes) {
        if (node.wasForgotten()) continue;
        
        let text = node.getLiteralText();
        let originalText = text;

        Object.entries(STATIC_TO_SEMANTIC_MAP).forEach(([legacy, semantic]) => {
            const regex = new RegExp(`\\b${legacy}\\b`, 'g');
            if (regex.test(text)) {
                text = text.replace(regex, semantic);
                migrationLog.push({
                    file: sourceFile.getBaseName(),
                    line: node.getStartLineNumber(),
                    original: legacy,
                    replaced: semantic
                });
            }
        });

        if (text !== originalText) {
            (node as any).setLiteralValue(text);
            fileModified = true;
            totalReplacements++;
        }
    }

    if (fileModified) {
        console.log(`✅ Migré : ${sourceFile.getBaseName()}`);
        sourceFile.saveSync();
    }
});

const reportPath = path.join(process.cwd(), 'migration-reports-billing.json');
fs.writeFileSync(reportPath, JSON.stringify(migrationLog, null, 2));

console.log(`\n🎉 Migration terminée !`);
console.log(`📊 Total remplacements : ${totalReplacements}`);
console.log(`📄 Rapport : ${reportPath}`);
