import { Project, SyntaxKind, StringLiteral } from 'ts-morph';
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

const ALL_COLORS = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const SHADES = '50|[1-9]00';
const PREFIXES = 'bg|text|border|ring|from|to|via';

function getGrayReplacement(prefix: string, color: string, shade: string): string | null {
    if (!['slate', 'gray', 'zinc', 'neutral', 'stone'].includes(color)) return null;
    if (['bg', 'from', 'to', 'via'].includes(prefix)) {
        if (['50', '100', '200'].includes(shade)) return `${prefix}-surface-bg`;
        if (['300', '400', '500'].includes(shade)) return `${prefix}-surface-tertiary`;
        if (['600', '700', '800', '900'].includes(shade)) return `${prefix}-surface-sidebar`;
    }
    if (prefix === 'text') {
        if (['50', '100', '200', '300', '400'].includes(shade)) return 'text-muted';
        if (['500', '600'].includes(shade)) return 'text-secondary';
        if (['700', '800', '900'].includes(shade)) return 'text-primary';
    }
    if (prefix === 'border' || prefix === 'ring') {
        if (['50', '100', '200'].includes(shade)) return `${prefix}-subtle`;
        return `${prefix}-default`;
    }
    return null;
}

function getBrandReplacement(prefix: string, color: string, _shade: string): string | null {
    if (!['blue', 'indigo', 'sky', 'cyan'].includes(color)) return null;
    if (['bg', 'from', 'to', 'via'].includes(prefix)) return `${prefix}-action-primary`;
    if (prefix === 'text') return 'text-brand';
    if (prefix === 'border' || prefix === 'ring') return `${prefix}-focus`;
    return null;
}

function getStatusReplacement(prefix: string, color: string, _shade: string): string | null {
    if (['green', 'emerald', 'teal', 'lime'].includes(color)) {
        if (['bg', 'from', 'to', 'via'].includes(prefix)) return `${prefix}-status-success`;
        if (prefix === 'text') return 'text-status-success';
    }
    if (['yellow', 'amber', 'orange'].includes(color)) {
        if (['bg', 'from', 'to', 'via'].includes(prefix)) return `${prefix}-status-warning`;
        if (prefix === 'text') return 'text-status-warning';
    }
    if (['red', 'rose', 'pink'].includes(color)) {
        if (['bg', 'from', 'to', 'via'].includes(prefix)) return `${prefix}-status-danger`;
        if (prefix === 'text') return 'text-status-danger';
    }
    return null;
}

function getSemanticReplacement(prefix: string, color: string, shade: string): string | null {
    return getGrayReplacement(prefix, color, shade) 
        || getBrandReplacement(prefix, color, shade) 
        || getStatusReplacement(prefix, color, shade);
}

const STATIC_TW_REGEX = new RegExp(`\\b(${PREFIXES})-(${ALL_COLORS})-(${SHADES})\\b`, 'g');
const ARBITRARY_HEX_REGEX = new RegExp(`\\b(${PREFIXES})-\\[#([0-9a-fA-F]{3,6})\\](?:\\/([0-9]{1,3}))?\\b`, 'g');

let totalReplacements = 0;
const migrationLog: Array<{ file: string; line: number; original: string; replaced: string }> = [];

project.getSourceFiles().forEach(sourceFile => {
    let fileModified = false;

    const stringNodes = [
        ...sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral),
        ...sourceFile.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral)
    ];

    for (const node of stringNodes) {
        if (node.wasForgotten()) continue;
        
        let text = node.getLiteralText();
        const originalText = text;

        // 1. Standard Tailwind Classes
        text = text.replace(STATIC_TW_REGEX, (match, prefix, color, shade) => {
            const replacement = getSemanticReplacement(prefix, color, shade);
            if (replacement) {
                migrationLog.push({ file: sourceFile.getBaseName(), line: node.getStartLineNumber(), original: match, replaced: replacement });
                return replacement;
            }
            return match;
        });

        // 2. Arbitrary Hex Values (Common Vanguard/Brand colors)
        text = text.replace(ARBITRARY_HEX_REGEX, (match, prefix, hex, opacity) => {
            const lowerHex = hex.toLowerCase();
            const opSuffix = opacity ? `/${opacity}` : '';
            
            // Vanguard Gold / Brand Primary
            if (['c5a059', 'c9a227', 'b48c36', 'd4af37'].includes(lowerHex)) {
                if (['bg', 'from', 'to', 'via'].includes(prefix)) return `${prefix}-action-primary${opSuffix}`;
                if (prefix === 'text') return `text-brand${opSuffix}`;
                if (prefix === 'border') return `border-focus${opSuffix}`;
            }

            // Status mappings for common hexes if possible
            if (['ef4444', 'dc2626'].includes(lowerHex)) return `${prefix}-status-danger${opSuffix}`;
            if (['10b981', '059669'].includes(lowerHex)) return `${prefix}-status-success${opSuffix}`;

            return match;
        });

        // 3. Fixed Map
        const FIXED_MAP: Record<string, string> = {
            'bg-white': 'bg-surface-card',
            'bg-black': 'bg-surface-sidebar',
            'text-black': 'text-primary',
            'border-white/10': 'border-subtle',
            'border-white/20': 'border-default',
        };

        Object.entries(FIXED_MAP).forEach(([legacy, semantic]) => {
            const regex = new RegExp(`\\b${legacy}\\b`, 'g');
            if (regex.test(text)) {
                text = text.replace(regex, semantic);
                migrationLog.push({ file: sourceFile.getBaseName(), line: node.getStartLineNumber(), original: legacy, replaced: semantic });
            }
        });

        if (text !== originalText) {
            (node as StringLiteral).setLiteralValue(text);
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
