import { Project } from "ts-morph";

const project = new Project({
    tsConfigFilePath: "./tsconfig.json",
    skipAddingFilesFromTsConfig: true
});

project.addSourceFilesAtPaths("./src/**/*.{ts,tsx}");

let modifiedFilesCount = 0;

for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();
    if (filePath.includes('.test.') || filePath.includes('__tests__') || filePath.includes('.spec.')) continue;

    let fullText = sourceFile.getFullText();
    const pattern = /\b([a-zA-Z0-9_]+)\s+instanceof\s+Error\s*\?\s*\1\.message\s*:\s*String\(\1\)/g;

    const newText = fullText.replace(pattern, 'toError($1).message');

    if (newText !== fullText) {
        sourceFile.replaceWithText(newText);

        const existingImport = sourceFile.getImportDeclaration(i => i.getModuleSpecifierValue() === '@/lib/toError');
        if (!existingImport) {
            sourceFile.addImportDeclaration({
                namedImports: [{ name: 'toError' }],
                moduleSpecifier: '@/lib/toError'
            });
        }

        sourceFile.saveSync();
        modifiedFilesCount++;
    }
}

console.log(`L1 Refactoring Complete: ${modifiedFilesCount} files updated.`);
