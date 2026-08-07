import { Project, Node, SyntaxKind, TypeReferenceNode, TypeLiteralNode, Identifier } from "ts-morph";
import * as fs from "fs";

const project = new Project({
    tsConfigFilePath: "./tsconfig.json",
    skipAddingFilesFromTsConfig: true
});

project.addSourceFilesAtPaths("./src/**/*.{ts,tsx}");

const results = {
    totalFiles: 0,
    metrics: {
        anyCount: 0,
        unknownCount: 0,
        functionTypeCount: 0,
        objectTypeCount: 0,
        emptyObjectCount: 0,
        tsIgnoreCount: 0,
        tsExpectErrorCount: 0
    },
    modules: {} as Record<string, any>,
    violations: [] as any[]
};

const sourceFiles = project.getSourceFiles();
results.totalFiles = sourceFiles.length;

for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    if (filePath.includes('.test.') || filePath.includes('__tests__') || filePath.includes('.spec.')) continue;
    
    const relativePath = filePath.substring(filePath.indexOf('src/'));
    const match = relativePath.match(/modules\/([^\/]+)/) || relativePath.match(/src\/([^\/]+)/);
    const moduleName = match ? match[1] : 'unknown';
    
    if (!results.modules[moduleName]) {
        results.modules[moduleName] = { 
            anyCount: 0, unknownCount: 0, functionTypeCount: 0, objectTypeCount: 0, emptyObjectCount: 0, tsIgnoreCount: 0, tsExpectErrorCount: 0
        };
    }

    // Process comments for ts-ignore / ts-expect-error
    const fileText = sourceFile.getFullText();
    const tsIgnoreMatches = fileText.match(/@ts-ignore/g);
    const tsExpectErrorMatches = fileText.match(/@ts-expect-error/g);

    if (tsIgnoreMatches) {
        results.metrics.tsIgnoreCount += tsIgnoreMatches.length;
        results.modules[moduleName].tsIgnoreCount += tsIgnoreMatches.length;
        results.violations.push({ file: relativePath, type: 'ts-ignore', count: tsIgnoreMatches.length, module: moduleName });
    }
    
    if (tsExpectErrorMatches) {
        results.metrics.tsExpectErrorCount += tsExpectErrorMatches.length;
        results.modules[moduleName].tsExpectErrorCount += tsExpectErrorMatches.length;
        results.violations.push({ file: relativePath, type: 'ts-expect-error', count: tsExpectErrorMatches.length, module: moduleName });
    }

    // Traverse AST for types
    sourceFile.forEachDescendant((node: Node) => {
        const kind = node.getKind();
        
        let violationType: string | null = null;
        
        if (kind === SyntaxKind.AnyKeyword) {
            results.metrics.anyCount++;
            results.modules[moduleName].anyCount++;
            violationType = 'any';
        } else if (kind === SyntaxKind.UnknownKeyword) {
            results.metrics.unknownCount++;
            results.modules[moduleName].unknownCount++;
            violationType = 'unknown';
        } else if (kind === SyntaxKind.TypeReference) {
            const typeRef = node as TypeReferenceNode;
            const name = typeRef.getTypeName().getText();
            if (name === 'Function') {
                results.metrics.functionTypeCount++;
                results.modules[moduleName].functionTypeCount++;
                violationType = 'Function';
            } else if (name === 'Object') {
                results.metrics.objectTypeCount++;
                results.modules[moduleName].objectTypeCount++;
                violationType = 'Object';
            }
        } else if (kind === SyntaxKind.TypeLiteral) {
            const typeLit = node as TypeLiteralNode;
            if (typeLit.getMembers().length === 0) {
                // Not all empty {} are bad, but as a type it's basically 'any' non-null object
                // Let's filter out object destructuring which is not a TypeLiteral but ObjectBindingPattern
                // TypeLiteral is specifically `{}` in type position
                results.metrics.emptyObjectCount++;
                results.modules[moduleName].emptyObjectCount++;
                violationType = '{}';
            }
        }

        if (violationType) {
            results.violations.push({
                file: relativePath,
                type: violationType,
                module: moduleName,
                line: sourceFile.getLineAndColumnAtPos(node.getStart()).line
            });
        }
    });
}

fs.writeFileSync("/Users/mohammed-aliboudjaadar/.gemini/antigravity-ide/brain/ae0af159-ac73-4e40-a65d-28e30fd18a94/scratch/audit_types_results.json", JSON.stringify(results, null, 2));
console.log("Audit complete. Results written to scratch/audit_types_results.json");
