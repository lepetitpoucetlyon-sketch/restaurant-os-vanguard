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
    // Replace `catch (varName: unknown)` with `catch (varName)`
    const catchRegex = /catch\s*\(\s*([a-zA-Z0-9_]+)\s*:\s*unknown\s*\)/g;

    if (catchRegex.test(text)) {
        text = text.replace(catchRegex, 'catch ($1)');
        sourceFile.replaceWithText(text);
        sourceFile.saveSync();
        modifiedCount++;
    }
}

console.log(`CAT-A Clean Catch Signature Complete: ${modifiedCount} files updated.`);
