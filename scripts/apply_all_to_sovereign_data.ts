import { Project } from "ts-morph";

const project = new Project({
    tsConfigFilePath: "./tsconfig.json",
    skipAddingFilesFromTsConfig: true
});

project.addSourceFilesAtPaths("./src/**/*.{ts,tsx}");

let modifiedCount = 0;
let totalReplacements = 0;

for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();
    if (filePath.includes('.test.') || filePath.includes('__tests__') || filePath.includes('.spec.') || filePath.endsWith('toSovereignData.ts')) continue;

    let text = sourceFile.getFullText();

    // Matching patterns like: `expr as unknown as import('@/shared/nexus-contract').SovereignData`
    // or `expr as unknown as SovereignData`
    const regex = /([a-zA-Z0-9_.\{\}\(\)\$\s]+?)\s+as\s+unknown\s+as\s+(?:import\(['"]@\/shared\/nexus-contract['"]\)\.)?SovereignData\b/g;

    if (regex.test(text)) {
        text = text.replace(regex, (match, expr) => {
            totalReplacements++;
            return `toSovereignData(${expr.trim()})`;
        });

        sourceFile.replaceWithText(text);

        const existingImport = sourceFile.getImportDeclaration(i => i.getModuleSpecifierValue() === '@/lib/toSovereignData');
        if (!existingImport) {
            sourceFile.addImportDeclaration({
                namedImports: [{ name: 'toSovereignData' }],
                moduleSpecifier: '@/lib/toSovereignData'
            });
        }

        sourceFile.saveSync();
        modifiedCount++;
    }
}

console.log(`SovereignData Helper Generalization: ${modifiedCount} files updated, ${totalReplacements} double casts eliminated.`);
