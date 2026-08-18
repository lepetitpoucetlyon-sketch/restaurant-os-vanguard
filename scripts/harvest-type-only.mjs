#!/usr/bin/env node
/**
 * 🌾 Harvest Type-Only — Convertisseur Automatique d'Imports en Types Purs
 *
 * Analyse l'AST avec ts-morph pour détecter tous les imports utilisés
 * UNIQUEMENT en position de type (annotations, generics, casting, interfaces)
 * et les transforme en `import type { ... }`.
 *
 * Usage :
 *   node scripts/harvest-type-only.mjs [--dry-run] [--path=src/modules/logistics]
 */

import { Project, SyntaxKind, Node } from 'ts-morph';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const pathFilter = args.find(a => a.startsWith('--path='))?.split('=')[1] ?? 'src';

function isWithinNode(child, parent) {
    return child.getStart() >= parent.getStart() && child.getEnd() <= parent.getEnd();
}

function isTypeOnlyUsage(node) {
    let parent = node.getParent();
    if (!parent) return false;

    // Si le parent direct est un ImportSpecifier ou ImportClause, ignorer
    if (Node.isImportSpecifier(parent) || Node.isImportClause(parent)) {
        return true;
    }

    // Remonter pour vérifier si on est dans un contexte de type
    let current = node;
    while (current) {
        const kind = current.getKind();
        
        // Contextes de types purs
        if (
            kind === SyntaxKind.TypeReference ||
            kind === SyntaxKind.TypeLiteral ||
            kind === SyntaxKind.ArrayType ||
            kind === SyntaxKind.TupleType ||
            kind === SyntaxKind.UnionType ||
            kind === SyntaxKind.IntersectionType ||
            kind === SyntaxKind.TypeQuery || // typeof X
            kind === SyntaxKind.ExpressionWithTypeArguments ||
            kind === SyntaxKind.HeritageClause || // implements / extends Interface
            kind === SyntaxKind.TypeAliasDeclaration ||
            kind === SyntaxKind.InterfaceDeclaration
        ) {
            return true;
        }

        if (kind === SyntaxKind.AsExpression) {
            const typeNode = current.getTypeNode();
            if (typeNode && isWithinNode(node, typeNode)) return true;
            return false;
        }
        
        if (kind === SyntaxKind.TypeAssertionExpression) {
            const typeNode = current.getTypeNode();
            if (typeNode && isWithinNode(node, typeNode)) return true;
            return false;
        }

        // Si on est dans un JSX, une expression d'appel, une instanciation new, une opération -> C'EST UNE VALEUR !
        if (
            kind === SyntaxKind.JsxElement ||
            kind === SyntaxKind.JsxSelfClosingElement ||
            kind === SyntaxKind.CallExpression ||
            kind === SyntaxKind.NewExpression ||
            kind === SyntaxKind.BinaryExpression ||
            kind === SyntaxKind.PropertyAccessExpression ||
            kind === SyntaxKind.ElementAccessExpression
        ) {
            // Sauf si on est dans les type arguments (ex: useState<MyType>())
            if (kind === SyntaxKind.CallExpression || kind === SyntaxKind.NewExpression) {
                const typeArgs = current.getTypeArguments();
                if (typeArgs.some(arg => isWithinNode(node, arg))) {
                    return true;
                }
            }
            return false;
        }

        current = current.getParent();
    }

    return false;
}

async function harvest() {
    console.log(`🌾 Initialisation ts-morph sur le périmètre : ${pathFilter} (Dry-run: ${isDryRun})...`);

    const project = new Project({
        tsConfigFilePath: path.join(ROOT_DIR, 'tsconfig.json'),
        skipAddingFilesFromTsConfig: true,
    });

    const targetPattern = pathFilter.endsWith('.ts') || pathFilter.endsWith('.tsx')
        ? path.join(ROOT_DIR, pathFilter)
        : path.join(ROOT_DIR, pathFilter, '**/*.{ts,tsx}');

    project.addSourceFilesAtPaths(targetPattern);
    const sourceFiles = project.getSourceFiles();

    console.log(`📁 Fichiers trouvés : ${sourceFiles.length}`);

    let totalImportsAnalyzed = 0;
    let convertedToTypeOnly = 0;
    let filesModified = 0;

    for (const sourceFile of sourceFiles) {
        const filePath = sourceFile.getFilePath();
        if (filePath.includes('.test.') || filePath.includes('__tests__') || filePath.includes('.d.ts')) {
            continue;
        }

        const importDeclarations = sourceFile.getImportDeclarations();
        let fileChanged = false;

        for (const importDecl of importDeclarations) {
            if (importDecl.isTypeOnly()) continue;
            const namedImports = importDecl.getNamedImports();
            if (namedImports.length === 0) continue;

            totalImportsAnalyzed++;

            let allAreTypeOnly = true;

            for (const namedImport of namedImports) {
                const nameNode = namedImport.getNameNode();
                const references = nameNode.findReferencesAsNodes();

                // Filtrer la référence de déclaration elle-même
                const usages = references.filter(ref => ref !== nameNode && !isWithinNode(ref, namedImport));

                // Si l'import n'est même pas utilisé, on ne le touche pas
                if (usages.length === 0) {
                    allAreTypeOnly = false;
                    break;
                }

                const allUsagesTypeOnly = usages.every(usage => isTypeOnlyUsage(usage));
                if (!allUsagesTypeOnly) {
                    allAreTypeOnly = false;
                    break;
                }
            }

            if (allAreTypeOnly && namedImports.length > 0) {
                if (!isDryRun) {
                    importDecl.setIsTypeOnly(true);
                }
                convertedToTypeOnly++;
                fileChanged = true;
            }
        }

        if (fileChanged) {
            filesModified++;
            if (!isDryRun) {
                sourceFile.saveSync();
            }
        }
    }

    console.log('\n============================================================');
    console.log('📊 RÉSULTAT DU TYPE-ONLY HARVESTING');
    console.log('============================================================');
    console.log(`Imports Analysés        : ${totalImportsAnalyzed}`);
    console.log(`Imports Convertis en Type : ${convertedToTypeOnly}`);
    console.log(`Fichiers Impactés       : ${filesModified}`);
    console.log(`Mode Exécution          : ${isDryRun ? '🔍 DRY-RUN (Aucune écriture)' : '💾 ÉCRITURE EFFECTUÉE'}`);
    console.log('============================================================\n');
}

harvest().catch(err => {
    console.error('❌ Erreur lors du harvesting :', err);
    process.exit(1);
});
