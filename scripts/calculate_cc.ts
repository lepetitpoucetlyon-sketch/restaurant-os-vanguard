import { Project, Node, SyntaxKind } from "ts-morph";
import * as fs from "fs";

const project = new Project({
    tsConfigFilePath: "./tsconfig.json",
    skipAddingFilesFromTsConfig: true
});

project.addSourceFilesAtPaths("./src/**/*.{ts,tsx}");

function calculateCyclomaticComplexity(node: Node): number {
    let complexity = 1;
    node.forEachDescendant((descendant: Node) => {
        switch (descendant.getKind()) {
            case SyntaxKind.IfStatement:
            case SyntaxKind.WhileStatement:
            case SyntaxKind.DoStatement:
            case SyntaxKind.ForStatement:
            case SyntaxKind.ForInStatement:
            case SyntaxKind.ForOfStatement:
            case SyntaxKind.CaseClause:
            case SyntaxKind.ConditionalExpression:
            case SyntaxKind.CatchClause:
            case SyntaxKind.AmpersandAmpersandToken:
            case SyntaxKind.BarBarToken:
            case SyntaxKind.QuestionQuestionToken:
                complexity++;
                break;
        }
    });
    return complexity;
}

const results = {
    totalFiles: 0,
    modules: {} as Record<string, any>,
    godFiles: [] as any[],
    highFanOut: [] as any[],
    complexFunctions: [] as any[],
    anyTypes: [] as any[]
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
        results.modules[moduleName] = { totalLines: 0, anyCount: 0, fileCount: 0, ccSum: 0, funcCount: 0 };
    }
    
    const lines = sourceFile.getFullText().split('\n').length;
    results.modules[moduleName].totalLines += lines;
    results.modules[moduleName].fileCount++;
    
    const importDeclarations = sourceFile.getImportDeclarations();
    const fanOut = importDeclarations.length;
    
    // Aggregation Root Check: Dashboard and Providers allow fan-out <= 30
    const isAggregationRoot = filePath.includes('/app/') || filePath.includes('Dashboard') || filePath.includes('Provider');
    const fanOutThreshold = isAggregationRoot ? 30 : 12;
    
    if (lines > 400) {
        results.godFiles.push({ file: relativePath, lines, module: moduleName });
    }
    if (fanOut > fanOutThreshold) {
        results.highFanOut.push({ file: relativePath, fanOut, module: moduleName, allowed: fanOutThreshold });
    }
    
    let anyCount = 0;
    sourceFile.forEachDescendant((node: Node) => {
        if (node.getKind() === SyntaxKind.AnyKeyword) {
            anyCount++;
        }
    });
    results.modules[moduleName].anyCount += anyCount;
    if (anyCount > 0) {
        results.anyTypes.push({ file: relativePath, anyCount, module: moduleName });
    }
    
    const functions = sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration)
        .concat(sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration) as any)
        .concat(sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction) as any)
        .concat(sourceFile.getDescendantsOfKind(SyntaxKind.FunctionExpression) as any);
        
    for (const fn of functions) {
        // @ts-ignore
        const nameNode = fn.getNameNode ? fn.getNameNode() : null;
        // @ts-ignore
        const name = nameNode ? nameNode.getText() : (fn.getParent()?.getKind() === SyntaxKind.VariableDeclaration ? fn.getParent().getName() : 'anonymous');
        const cc = calculateCyclomaticComplexity(fn);
        
        results.modules[moduleName].ccSum += cc;
        results.modules[moduleName].funcCount++;
        
        if (cc > 15) { // 15 is generally considered somewhat complex, >20 is high. Using 15 to flag.
            results.complexFunctions.push({ file: relativePath, name, cc, module: moduleName });
        }
    }
}

fs.writeFileSync("/Users/mohammed-aliboudjaadar/.gemini/antigravity-ide/brain/ae0af159-ac73-4e40-a65d-28e30fd18a94/scratch/audit_results.json", JSON.stringify(results, null, 2));
console.log("Audit complete. Results written to scratch/audit_results.json");
