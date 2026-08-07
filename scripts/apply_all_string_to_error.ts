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
    if (filePath.includes('.test.') || filePath.includes('__tests__') || filePath.includes('.spec.')) continue;

    let text = sourceFile.getFullText();

    // Match String(err), String(error), String(e), String(_err), String(_error), String(_e)
    const pattern = /\bString\(\s*(_?err|_?error|_?e)\s*\)/g;

    if (pattern.test(text)) {
        text = text.replace(pattern, 'toError($1).message');
        sourceFile.replaceWithText(text);

        const existingImport = sourceFile.getImportDeclaration(i => i.getModuleSpecifierValue() === '@/lib/toError');
        if (!existingImport) {
            sourceFile.addImportDeclaration({
                namedImports: [{ name: 'toError' }],
                moduleSpecifier: '@/lib/toError'
            });
        }

        sourceFile.saveSync();
        modifiedCount++;
        const matches = text.match(pattern);
        totalReplacements += matches ? matches.length : 1;
    }
}

console.log(`String(err) Refactoring Complete: ${totalReplacements} replacements across ${modifiedCount} files.`);
