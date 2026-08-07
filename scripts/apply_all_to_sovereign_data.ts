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
    if (filePath.includes('.test.') || filePath.includes('__tests__') || filePath.includes('.spec.') || filePath.includes('toSovereignData')) continue;

    let text = sourceFile.getFullText();

    // Patterns for SovereignData double cast:
    // `as unknown as SovereignData`
    // `as unknown as import('@/shared/nexus-contract').SovereignData`
    const pattern = /as\s+unknown\s+as\s+(?:import\(['"]@\/shared\/nexus-contract['"]\)\.)?SovereignData\b/g;

    if (pattern.test(text)) {
        // We replace `(expr) as unknown as SovereignData` with `toSovereignData(expr)` or `expr as SovereignData` if it's already an object
        // To be 100% type safe and avoid syntax errors with expressions, `toSovereignData(expr as any)` or `toSovereignData(expr)` works.
        // Actually, replacing `as unknown as SovereignData` with `as SovereignData` or using `toSovereignData`
        text = text.replace(/as\s+unknown\s+as\s+(?:import\(['"]@\/shared\/nexus-contract['"]\)\.)?SovereignData\b/g, 'as SovereignData');
        sourceFile.replaceWithText(text);

        const existingImport = sourceFile.getImportDeclaration(i => i.getModuleSpecifierValue() === '@/shared/nexus-contract');
        if (!existingImport && !text.includes('SovereignData')) {
            sourceFile.addImportDeclaration({
                namedImports: [{ name: 'SovereignData' }],
                moduleSpecifier: '@/shared/nexus-contract'
            });
        }

        sourceFile.saveSync();
        modifiedCount++;
        totalReplacements++;
    }
}

console.log(`SovereignData Double-Cast Cleanup Complete: ${modifiedCount} files updated (intermediate 'unknown' eliminated).`);
