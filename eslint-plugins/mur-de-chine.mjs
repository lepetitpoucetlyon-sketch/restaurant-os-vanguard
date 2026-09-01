// Composition roots légitimes : assembleurs qui ont le droit d'importer n'importe quel module.
const COMPOSITION_ROOT_PATTERNS = [
  /\/src\/shared\/components\/layout\//,
  /\/src\/shared\/contexts\//,
  /\/src\/shared\/providers\//,
  /\/src\/shared\/nexus\/guards\//,
  /\/src\/shared\/components\/settings\//,
  /\/src\/lib\//,
];

/** Vecteur 1 — src/modules/A → @/modules/B/profondeur (ADR-015). */
function checkModuleToModule(context, node, normalizedFile, importPath) {
  const moduleMatch = normalizedFile.match(/\/src\/modules\/([^\/]+)/);
  if (!moduleMatch) return false;
  const deepMatch = importPath.match(/^@\/?modules\/([^\/]+)\/.+/);
  if (deepMatch && deepMatch[1] !== moduleMatch[1]) {
    context.report({
      node,
      messageId: "interModuleImport",
      data: { source: moduleMatch[1], target: deepMatch[1] },
    });
  }
  return true;
}

/**
 * Vecteur 3 — src/lib/ ne dépend pas de src/modules/ (ADR-015).
 *
 * Avant ce vecteur, aucun fichier de src/lib/ n'était examiné : ni le vecteur 1
 * (qui exige /src/modules/) ni le vecteur 2 (qui exige /src/shared/hooks/) ne
 * matchait. La gate affichait 0 parce qu'elle ne regardait pas.
 *
 * La règle est stricte — le barrel racine `@/modules/<pilier>` est INTERDIT lui
 * aussi, y compris en import dynamique. Mesuré le 2026-08-31 : router ces imports
 * vers les barrels fait passer les cycles madge de 2 à 100 (95 pour les imports
 * statiques, 3 pour les dynamiques). Les piliers importent lib/ ; lib/ qui importe
 * un barrel de pilier ferme la boucle. Les chemins profonds actuels ne sont donc
 * pas de la négligence : ils sont porteurs, ils contournent le barrel.
 *
 * La sortie n'est pas une réécriture d'import mais un déplacement de
 * responsabilité : `import type`, contrat neutre kernel/contracts/, NexusEventBus,
 * ou relocalisation du composition root.
 */
function checkLibToModules(context, node, normalizedFile, importPath) {
  if (!/\/src\/lib\//.test(normalizedFile)) return false;
  const libMatch = importPath.match(/^@\/?modules\/([^\/]+)/);
  if (libMatch) {
    context.report({
      node,
      messageId: "libToModules",
      data: { target: libMatch[1] },
    });
  }
  return true;
}

/** Vecteur 2 — FIX-04 : src/shared/hooks/ → @/modules/, hors composition roots. */
function checkSharedHooksToModules(context, node, normalizedFile, importPath) {
  if (!/\/src\/shared\/hooks\//.test(normalizedFile)) return false;
  if (COMPOSITION_ROOT_PATTERNS.some(p => p.test(normalizedFile))) return true;
  const modMatch = importPath.match(/^@\/?modules\/([^\/]+)/);
  if (modMatch) {
    context.report({
      node,
      messageId: "interModuleImport",
      data: { source: "shared/hooks", target: modMatch[1] },
    });
  }
  return true;
}

/** Un import `type`-only n'a aucune arête à l'exécution. */
function isTypeOnly(node) {
  if (node.importKind === "type") return true;
  return Boolean(
    node.specifiers &&
      node.specifiers.length > 0 &&
      node.specifiers.every((sp) => sp.importKind === "type")
  );
}

function checkCrossModuleImport(context, node, importPath) {
  const normalizedFile = (context.filename || context.getFilename()).replace(/\\/g, '/');
  if (isTypeOnly(node)) return;
  if (normalizedFile.includes(".test.") || normalizedFile.includes(".spec.")) return;

  checkModuleToModule(context, node, normalizedFile, importPath) ||
    checkLibToModules(context, node, normalizedFile, importPath) ||
    checkSharedHooksToModules(context, node, normalizedFile, importPath);
}


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
        return {
          ImportDeclaration(node) {
            checkCrossModuleImport(context, node, node.source.value);
          },
          ImportExpression(node) {
            if (node.source && node.source.type === "Literal") {
              checkCrossModuleImport(context, node, node.source.value);
            }
          },
        };
      },
    },
  },
};
