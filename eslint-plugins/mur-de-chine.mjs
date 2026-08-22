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
