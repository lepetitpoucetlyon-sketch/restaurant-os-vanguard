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
    if (filePath.includes('.test.') || filePath.includes('__tests__') || filePath.includes('.spec.') || filePath.includes('toError')) continue;

    let text = sourceFile.getFullText();
    const pattern = /\bString\(\s*(_?err|_?error|_?e)\s*\)/g;

    const newText = text.replace(pattern, 'toError($1).message');

    if (newText !== text) {
        sourceFile.replaceWithText(newText);

        const existingImport = sourceFile.getImportDeclaration(i => i.getModuleSpecifierValue() === '@/lib/toError');
        if (!existingImport) {
            sourceFile.addImportDeclaration({
                namedImports: [{ name: 'toError' }],
                moduleSpecifier: '@/lib/toError'
            });
        }

        sourceFile.saveSync();
        modifiedCount++;
        totalReplacements++;
    }
}

console.log(`String(err) Refactoring Complete: ${totalReplacements} files updated with toError.`);
