import { Project } from "ts-morph";

const project = new Project({
    tsConfigFilePath: "./tsconfig.json",
    skipAddingFilesFromTsConfig: true
});

project.addSourceFilesAtPaths("./src/**/*.{ts,tsx}");

let modifiedCount = 0;

for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();
    if (filePath.includes('.test.') || filePath.includes('__tests__') || filePath.includes('.spec.')) continue;

    let text = sourceFile.getFullText();

    // Replace Record<string, unknown> in metadata / options / payloads with Record<string, JsonValue> or JsonObject
    if (text.includes("Record<string, unknown>") && (filePath.includes("Telemetry") || filePath.includes("audit") || filePath.includes("logger") || filePath.includes("connector") || filePath.includes("adapter"))) {
        text = text.replace(/Record<string,\s*unknown>/g, "JsonObject");

        sourceFile.replaceWithText(text);

        const existingImport = sourceFile.getImportDeclaration(i => i.getModuleSpecifierValue() === '@/shared/types/json');
        if (!existingImport) {
            sourceFile.addImportDeclaration({
                namedImports: [{ name: 'JsonObject' }, { name: 'JsonValue' }],
                moduleSpecifier: '@/shared/types/json'
            });
        }

        sourceFile.saveSync();
        modifiedCount++;
    }
}

console.log(`L3 JSON Refactoring Complete: ${modifiedCount} files updated with JsonObject.`);
