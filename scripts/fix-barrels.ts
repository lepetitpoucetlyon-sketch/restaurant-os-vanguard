import { Project, SyntaxKind, ImportDeclaration } from 'ts-morph';

const project = new Project({ tsConfigFilePath: 'tsconfig.json' });

// We define what prefixes are restricted barrels
const isRestrictedBarrel = (specifier: string) => {
  // It's a barrel if it imports from `@/modules/...` and it resolves to an `index.ts`
  // Actually, any import from a directory (not a specific file) is a barrel if it hits an index.ts
  if (!specifier.startsWith('@/modules/')) return false;
  return true; 
};

let fixedCount = 0;

for (const sourceFile of project.getSourceFiles()) {
  const imports = sourceFile.getImportDeclarations();
  for (const imp of imports) {
    const specifier = imp.getModuleSpecifierValue();
    if (isRestrictedBarrel(specifier)) {
       // Only process named imports for simplicity
       const namedImports = imp.getNamedImports();
       if (namedImports.length === 0) continue;
       
       const newImports = new Map<string, string[]>(); // Map file path -> import names
       let allResolved = true;

       for (const namedImport of namedImports) {
          const name = namedImport.getName();
          // Find the actual declaration
          const symbol = namedImport.getNameNode().getSymbol();
          if (!symbol) { allResolved = false; break; }
          const aliasedSymbol = symbol.getAliasedSymbol();
          const targetSymbol = aliasedSymbol ? aliasedSymbol : symbol;
          
          const decls = targetSymbol.getDeclarations();
          if (decls.length === 0) { allResolved = false; break; }
          
          const declSourceFile = decls[0].getSourceFile();
          let newSpecifier = project.compilerOptions.get().baseUrl 
             ? declSourceFile.getFilePath().replace(project.compilerOptions.get().baseUrl, '') 
             : declSourceFile.getFilePath();
             
          // Convert absolute path to `@/` path
          const cwd = process.cwd();
          if (declSourceFile.getFilePath().includes('/src/')) {
             const parts = declSourceFile.getFilePath().split('/src/');
             newSpecifier = '@/' + parts[1].replace(/\.tsx?$/, '');
          }

          if (!newImports.has(newSpecifier)) {
             newImports.set(newSpecifier, []);
          }
          newImports.get(newSpecifier)!.push(name);
       }
       
       if (allResolved && newImports.size > 0) {
          let needsReplacement = false;
          // check if we actually un-barreled it (if the new specifier is longer/more specific)
          for (const [newSpec] of newImports.entries()) {
             if (newSpec !== specifier && !newSpec.endsWith('/index')) {
                needsReplacement = true;
             }
          }
          
          if (needsReplacement) {
             for (const [newSpec, names] of newImports.entries()) {
                sourceFile.addImportDeclaration({
                   moduleSpecifier: newSpec,
                   namedImports: names
                });
             }
             imp.remove();
             fixedCount++;
          }
       }
    }
  }
}

project.saveSync();
console.log(`Fixed ${fixedCount} barrel imports.`);
