export const murDeChinePlugin = {
  rules: {
    "no-cross-imports": {
      meta: {
        type: "problem",
        docs: {
          description: "Mur de Chine : Bloque les imports croisés entre (client) et (admin)",
        },
        messages: {
          crossImport: "Mur de Chine : L'application {{source}} ne peut pas importer depuis {{target}}.",
        },
      },
      create(context) {
        return {
          ImportDeclaration(node) {
            const currentFile = context.filename || context.getFilename();
            const importPath = node.source.value;

            // Détecter si on est dans (client) ou (admin)
            const inClient = currentFile.includes("/app/(client)/");
            const inAdmin = currentFile.includes("/app/(admin)/");

            if (!inClient && !inAdmin) return;

            // Vérifier les imports absolus (@/...) et relatifs
            const isImportingClient = importPath.includes("/(client)") || importPath.includes("app/(client)");
            const isImportingAdmin = importPath.includes("/(admin)") || importPath.includes("app/(admin)");

            if (inClient && isImportingAdmin) {
              context.report({
                node,
                messageId: "crossImport",
                data: { source: "(client)", target: "(admin)" },
              });
            }

            if (inAdmin && isImportingClient) {
              context.report({
                node,
                messageId: "crossImport",
                data: { source: "(admin)", target: "(client)" },
              });
            }
          },
        };
      },
    },
    "no-inter-module-imports": {
      meta: {
        type: "problem",
        docs: {
          description: "Mur de Chine (Modules) : Bloque les imports directs entre différents modules métiers",
        },
        messages: {
          interModuleImport: "Mur de Chine : Le module '{{source}}' n'a pas le droit d'importer directement depuis le module '{{target}}'. Utilisez le domain/ ou le NexusEventBus.",
          libToModules: "Loi des couches (ADR-015) : src/lib/ ne dépend pas du métier — import vers '{{target}}' interdit. Sorties : `import type`, contrat neutre kernel/contracts/, ou NexusEventBus. Compteur dédié LIB_TO_MODULES (preflight.sh).",
        },
      },
      create(context) {
        // Composition roots légitimes : assembleurs qui ont le droit d'importer n'importe quel module.
        const COMPOSITION_ROOT_PATTERNS = [
          /\/src\/shared\/components\/layout\//,
          /\/src\/shared\/contexts\//,
          /\/src\/shared\/providers\//,
          /\/src\/shared\/nexus\/guards\//,
          /\/src\/shared\/components\/settings\//,
          /\/src\/lib\//,
        ];

        function checkCrossModuleImport(node, importPath) {
          const currentFile = context.filename || context.getFilename();
          const normalizedFile = currentFile.replace(/\\/g, '/');

          if (node.importKind === "type") return;
          // `import { type A, type B } from '...'` : aucune dépendance à l'exécution.
          if (
            node.specifiers &&
            node.specifiers.length > 0 &&
            node.specifiers.every((sp) => sp.importKind === "type")
          ) {
            return;
          }
          if (normalizedFile.includes(".test.") || normalizedFile.includes(".spec.")) return;

          // Vecteur 1 : inter-module profond (src/modules/A → @/modules/B/deep/path)
          // ADR-015: Un module peut importer le barrel racine @/modules/<autre>, mais JAMAIS un import profond.
          const moduleMatch = normalizedFile.match(/\/src\/modules\/([^\/]+)/);
          if (moduleMatch) {
            const currentModule = moduleMatch[1];
            const deepMatch = importPath.match(/^@\/?modules\/([^\/]+)\/.+/);
            if (deepMatch && deepMatch[1] !== currentModule) {
              context.report({
                node,
                messageId: "interModuleImport",
                data: { source: currentModule, target: deepMatch[1] },
              });
            }
            return;
          }

          // Vecteur 3 : ADR-015 — src/lib/ ne dépend pas de src/modules/.
          //
          // Avant ce vecteur, aucun fichier de src/lib/ n'était examiné : ni le vecteur 1
          // (qui exige /src/modules/) ni le vecteur 2 (qui exige /src/shared/hooks/) ne
          // matchait. La gate affichait 0 parce qu'elle ne regardait pas.
          //
          // La règle est stricte — le barrel racine `@/modules/<pilier>` est INTERDIT lui
          // aussi, y compris en import dynamique. Mesuré le 2026-08-31 : router ces imports
          // vers les barrels fait passer les cycles madge de 2 à 100 (95 pour les imports
          // statiques, 3 pour les dynamiques). Les piliers importent lib/ ; lib/ qui importe
          // un barrel de pilier ferme la boucle. Les chemins profonds actuels ne sont donc
          // pas de la négligence : ils sont porteurs, ils contournent le barrel.
          //
          // La sortie n'est pas une réécriture d'import mais un déplacement de
          // responsabilité : `import type`, contrat neutre kernel/contracts/, NexusEventBus,
          // ou relocalisation du composition root (cas de la chaîne NexusSyncService →
          // NexusSyncBootstrap → pillarSyncRegistry, entièrement logée dans lib/).
          if (/\/src\/lib\//.test(normalizedFile)) {
            const libMatch = importPath.match(/^@\/?modules\/([^\/]+)/);
            if (libMatch) {
              context.report({
                node,
                messageId: "libToModules",
                data: { target: libMatch[1] },
              });
            }
            return;
          }

          // Vecteur 2 : FIX-04 — src/shared/hooks/ → @/modules/
          // Exclut les composition roots qui ont le droit d'assembler des modules.
          const isFix04Zone = /\/src\/shared\/hooks\//.test(normalizedFile);
          if (isFix04Zone) {
            const isRoot = COMPOSITION_ROOT_PATTERNS.some(p => p.test(normalizedFile));
            if (isRoot) return;
            const modMatch = importPath.match(/^@\/?modules\/([^\/]+)/);
            if (modMatch) {
              context.report({
                node,
                messageId: "interModuleImport",
                data: { source: "shared/hooks", target: modMatch[1] },
              });
            }
          }
        }

        return {
          ImportDeclaration(node) {
            checkCrossModuleImport(node, node.source.value);
          },
          ImportExpression(node) {
            if (node.source && node.source.type === "Literal") {
              checkCrossModuleImport(node, node.source.value);
            }
          },
        };
      },
    },

  },
};
