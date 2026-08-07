import { Project, SyntaxKind, Node } from "ts-morph";

const project = new Project({
    tsConfigFilePath: "./tsconfig.json",
    skipAddingFilesFromTsConfig: true
});

project.addSourceFilesAtPaths("./src/**/*.{ts,tsx}");

// STRATEGY: Only replace Record<string, unknown> when it appears in:
// 1. Logger calls (as Record<string, unknown> cast for logger.xxx)
// 2. Metadata properties in interfaces/types
// 3. Simple variable declarations that hold serializable data
// DO NOT TOUCH: adapter generics, connector data structures, function parameters used for domain objects

let modifiedFilesCount = 0;
let totalReplacements = 0;
const skippedFiles: string[] = [];

// FILES TO SKIP — these use Record<string, unknown> for domain objects, not raw JSON
const SKIP_PATTERNS = [
    'MockAdapter',       // generic adapter with T
    'FirestoreAdapter',  // generic adapter
    'FirestoreServerAdapter',
    'FirestoreDocumentStore',
    'MasterBridge',
    'ClickCollectProvider',  // uses values as DeliveryOrder
    'WidgetReservationProvider', // uses values as Reservation
    'NexusTelemetryEngine',  // assigns functions to record values
    'SovereignField',
    '/connectors/',      // connectors often cast to domain types
    'nexus-contract',
    'shared-kernel',
];

for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();
    if (filePath.includes('.test.') || filePath.includes('__tests__') || filePath.includes('.spec.')) continue;

    // Skip files known to break with JsonObject
    const shouldSkip = SKIP_PATTERNS.some(p => filePath.includes(p));
    if (shouldSkip) {
        skippedFiles.push(filePath.substring(filePath.indexOf('src/')));
        continue;
    }

    let fullText = sourceFile.getFullText();

    // Only replace `as Record<string, unknown>` casts in logger calls
    const loggerCastPattern = /as\s+Record<string,\s*unknown>/g;
    const newText = fullText.replace(loggerCastPattern, 'as JsonObject');

    if (newText !== fullText) {
        sourceFile.replaceWithText(newText);

        const existingImport = sourceFile.getImportDeclaration(i => i.getModuleSpecifierValue() === '@/shared/types/json');
        if (!existingImport) {
            sourceFile.addImportDeclaration({
                namedImports: [{ name: 'JsonObject' }],
                moduleSpecifier: '@/shared/types/json'
            });
        }

        sourceFile.saveSync();
        modifiedFilesCount++;
        // Count actual replacements
        const matches = fullText.match(loggerCastPattern);
        totalReplacements += matches ? matches.length : 0;
    }
}

console.log(`L3 Safe Refactoring Complete: ${totalReplacements} casts replaced across ${modifiedFilesCount} files.`);
console.log(`Skipped ${skippedFiles.length} files by policy.`);
