import fs from 'fs';
import path from 'path';

function processLocale(lang: 'fr' | 'en') {
    const localePath = `./src/i18n/locales/${lang}.ts`;
    const content = fs.readFileSync(localePath, 'utf8');

    // Extract raw object literal
    const match = content.match(new RegExp(`const ${lang}: SovereignData = ({[\\s\\S]+?});`));
    if (!match) return;

    // Evaluate JSON by quoting keys if needed or parsing via ts-node execution
    const outDir = `./src/i18n/namespaces/${lang}`;
    fs.mkdirSync(outDir, { recursive: true });

    // Read the dictionary object by dynamically requiring or regex splitting top-level keys
    const lines = match[1].split('\n');
    const sections: Record<string, string[]> = {};
    let currentKey: string | null = null;
    let braceDepth = 0;

    for (const line of lines) {
        const keyMatch = line.match(/^\s*"([a-zA-Z0-9_]+)":\s*\{/);
        if (keyMatch && braceDepth === 1) {
            currentKey = keyMatch[1];
            sections[currentKey] = [line];
            braceDepth++;
            continue;
        }

        if (line.includes('{')) braceDepth += (line.match(/\{/g) || []).length;
        if (line.includes('}')) braceDepth -= (line.match(/\}/g) || []).length;

        if (currentKey) {
            sections[currentKey].push(line);
            if (braceDepth === 1) {
                currentKey = null;
            }
        }
    }

    const navKeys = ['nav', 'header', 'sidebar'];
    const opsKeys = ['pos', 'cart', 'categories', 'options', 'payment', 'split', 'modes', 'grid', 'render', 'hardware', 'inventory', 'tabs', 'search', 'table', 'prep', 'orders', 'status', 'reservations', 'zones', 'list', 'customer'];
    const commonKeys = Object.keys(sections).filter(k => !navKeys.includes(k) && !opsKeys.includes(k));

    const buildFileContent = (keys: string[]) => {
        const parts = keys.filter(k => sections[k]).map(k => sections[k].join('\n'));
        return `export const dictionary = {\n${parts.join(',\n')}\n};\n`;
    };

    fs.writeFileSync(path.join(outDir, 'nav.ts'), buildFileContent(navKeys));
    fs.writeFileSync(path.join(outDir, 'ops.ts'), buildFileContent(opsKeys));
    fs.writeFileSync(path.join(outDir, 'common.ts'), buildFileContent(commonKeys));

    const newLocaleContent = `import { SovereignData } from '@/shared/nexus-contract';
import { dictionary as nav } from '../namespaces/${lang}/nav';
import { dictionary as ops } from '../namespaces/${lang}/ops';
import { dictionary as common } from '../namespaces/${lang}/common';

const ${lang}: SovereignData = {
    ...nav,
    ...ops,
    ...common,
};

export default ${lang};
`;

    fs.writeFileSync(localePath, newLocaleContent);
    console.log(`[${lang}] Split successfully into nav.ts, ops.ts, common.ts`);
}

processLocale('fr');
processLocale('en');
