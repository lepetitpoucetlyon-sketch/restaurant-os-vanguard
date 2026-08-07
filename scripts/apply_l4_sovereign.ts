import { Project } from "ts-morph";

const project = new Project({
    tsConfigFilePath: "./tsconfig.json",
    skipAddingFilesFromTsConfig: true
});

project.addSourceFilesAtPaths("./src/**/*.{ts,tsx}");

let modifiedFilesCount = 0;
let totalReplacements = 0;

for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();
    if (filePath.includes('.test.') || filePath.includes('__tests__') || filePath.includes('.spec.') || filePath.includes('toSovereignData')) continue;

    let fullText = sourceFile.getFullText();

    // Pattern: `expr as unknown as SovereignData`  →  `toSovereignData(expr)`
    // Also handles `} as unknown as SovereignData` and  `{...obj} as unknown as SovereignData`
    // Be careful with multi-line patterns — we capture the preceding expression 
    
    // Simple inline: `variable as unknown as SovereignData`
    const simplePattern = /(\b\w+)\s+as\s+unknown\s+as\s+SovereignData\b/g;
    let newText = fullText.replace(simplePattern, 'toSovereignData($1)');

    // Object literal ending: `} as unknown as SovereignData)` or `} as unknown as SovereignData;`  
    // These are harder — the expression starts with { which can span multiple lines.
    // For safety, only replace the `as unknown as SovereignData` part with a function wrapper
    // applied to the containing expression. This is tricky with regex, so for now we leave these
    // for manual review and only handle the simple cases.

    if (newText !== fullText) {
        sourceFile.replaceWithText(newText);

        // Add import if not present
        const existingImport = sourceFile.getImportDeclaration(i => i.getModuleSpecifierValue() === '@/lib/toSovereignData');
        if (!existingImport) {
            sourceFile.addImportDeclaration({
                namedImports: [{ name: 'toSovereignData' }],
                moduleSpecifier: '@/lib/toSovereignData'
            });
        }

        // Remove unused SovereignData import if it was only used for the cast
        // (Don't do this automatically — too risky)

        sourceFile.saveSync();
        modifiedFilesCount++;
        const matches = fullText.match(simplePattern);
        totalReplacements += matches ? matches.length : 0;
    }
}

console.log(`L4 SovereignData Refactoring: ${totalReplacements} simple casts replaced across ${modifiedFilesCount} files.`);
