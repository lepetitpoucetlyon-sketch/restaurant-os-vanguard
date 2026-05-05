import { Project, SyntaxKind } from 'ts-morph';
import path from 'path';
import fs from 'fs';

/**
 * 🛠️ MIGRATION SCRIPT - OPÉRATION DÉCAPAGE ADMIN
 */

const TARGET_MODULE = process.argv[2];

if (!TARGET_MODULE) {
    console.error("❌ Veuillez spécifier un module cible (ex: dashboard)");
    process.exit(1);
}

const project = new Project();
const searchPath = path.join(process.cwd(), 'src/app/(admin)', TARGET_MODULE);

console.log(`🔍 Scan du module : ${TARGET_MODULE} dans ${searchPath}`);

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

const MAPPINGS: Record<string, string> = {
    'bg-slate-': 'bg-surface-bg',
    'bg-gray-': 'bg-surface-bg',
    'bg-neutral-': 'bg-surface-bg',
    'bg-zinc-': 'bg-surface-bg',
    'bg-white': 'bg-surface-card',
    'bg-black': 'bg-surface-bg',
    'bg-blue-': 'bg-action-primary',
    'bg-indigo-': 'bg-action-primary',
    'bg-emerald-': 'bg-status-success',
    'bg-green-': 'bg-status-success',
    'bg-amber-': 'bg-status-warning',
    'bg-yellow-': 'bg-status-warning',
    'bg-red-': 'bg-status-danger',
    'bg-rose-': 'bg-status-danger',
    'bg-accent': 'bg-action-primary',
    'text-slate-': 'text-text-primary',
    'text-gray-': 'text-text-secondary',
    'text-neutral-': 'text-text-primary',
    'text-zinc-': 'text-text-primary',
    'text-blue-': 'text-action-primary',
    'text-indigo-': 'text-action-primary',
    'text-emerald-': 'text-status-success',
    'text-green-': 'text-status-success',
    'text-amber-': 'text-status-warning',
    'text-yellow-': 'text-status-warning',
    'text-red-': 'text-status-danger',
    'text-rose-': 'text-status-danger',
    'text-accent': 'text-action-primary',
    'border-slate-': 'border-border-default',
    'border-gray-': 'border-border-default',
    'border-neutral-': 'border-border-default',
    'border-white/5': 'border-border-subtle',
    'border-white/10': 'border-border-default',
    'border-accent': 'border-action-primary',
    'font-serif': 'font-brand',
    'font-sans': 'font-ui',
};

const HEX_MAP: Record<string, string> = {
    '#C5A059': 'var(--action-primary)',
    '#0B0B0C': 'var(--surface-card)',
    '#F8F7F2': 'var(--surface-bg)',
    '#050505': 'var(--surface-bg)',
    '#080808': 'var(--surface-bg)',
    '#0A0A0A': 'var(--surface-card)',
};

let totalReplacements = 0;

project.getSourceFiles().forEach(sourceFile => {
    let fileModified = false;

    // 1. Remplacement dans les classes
    const stringNodes = [
        ...sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral),
        ...sourceFile.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral)
    ];

    for (const node of stringNodes) {
        if (node.wasForgotten()) continue;
        
        let text = node.getLiteralText();
        let originalText = text;

        Object.entries(MAPPINGS).forEach(([legacy, semantic]) => {
            const regex = new RegExp(`\\b${legacy}[^\\s"']*`, 'g');
            if (regex.test(text)) {
                text = text.replace(regex, semantic);
            }
        });

        if (text !== originalText) {
            node.setLiteralValue(text);
            fileModified = true;
            totalReplacements++;
        }
    }

    // 2. Remplacement des codes Hex
    const jsxExprs = sourceFile.getDescendantsOfKind(SyntaxKind.JsxExpression);
    for (const expr of jsxExprs) {
        if (expr.wasForgotten()) continue;

        const text = expr.getText();
        let newText = text;

        Object.entries(HEX_MAP).forEach(([hex, variable]) => {
            if (newText.includes(hex)) {
                newText = newText.replace(new RegExp(hex, 'g'), variable);
            }
        });

        if (newText !== text) {
            expr.replaceWithText(newText);
            fileModified = true;
            totalReplacements++;
        }
    }

    if (fileModified) {
        console.log(`✅ Migré : ${sourceFile.getBaseName()}`);
        sourceFile.saveSync();
    }
});

console.log(`\n🎉 Migration terminée pour le module ${TARGET_MODULE} !`);
console.log(`📊 Total remplacements : ${totalReplacements}`);
