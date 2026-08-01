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
        return {
          ImportDeclaration(node) {
            const currentFile = context.filename || context.getFilename();
            const importPath = node.source.value;

            const normalizedFile = currentFile.replace(/\\/g, '/');
            const match = normalizedFile.match(/\/src\/modules\/([^\/]+)/);
            if (!match) return;
            const currentModule = match[1];

            let targetModule = null;
            const absoluteMatch = importPath.match(/^@\/modules\/([^\/]+)/);
            if (absoluteMatch) {
              targetModule = absoluteMatch[1];
            }

            if (targetModule && targetModule !== currentModule) {
              context.report({
                node,
                messageId: "interModuleImport",
                data: { source: currentModule, target: targetModule },
              });
            }
          },
        };
      },
    },
  },
};
