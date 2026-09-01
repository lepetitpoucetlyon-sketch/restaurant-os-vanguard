/**
 * no-hardcoded-hex — protège la personnalisation tenant MCC (DESIGNUP §1 & §4.2).
 *
 * Bloque les couleurs hex (#xxx, #xxxxxx, #xxxxxxxx) et rgba(...) littérales
 * dans les classes CSS, styles inline et props graphiques JSX (hors whitelist).
 *
 * Whitelist de fichiers :
 * - globals.css
 * - tokens/* (définition des palettes canoniques)
 * - blueprints/* (presets visuels initiaux)
 * - verticals/*\/ui.ts (chartes par défaut des verticales)
 * - app/(marketing)/* & app/(client)/(public)/* (landing pages publiques)
 * - Fichiers de test
 */
/**
 * Motif partagé — SOURCE UNIQUE de ce qu'est « une couleur en dur ».
 * La mesure m16 (scripts/measure/measures.mjs) l'importe pour ne pas diverger :
 * elle comptait `#hex` seulement alors que son titre annonçait « #hex et rgba() »,
 * si bien que la purge des `rgba(197,160,89,…)` du Lot 0 n'a pas fait bouger le
 * compteur d'un point (797 sur trois relevés consécutifs).
 * `rgb()` sans alpha est inclus : il fuit exactement autant.
 */
export const HEX_OR_RGB_REGEX = /#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/;
const HEX_OR_RGBA_REGEX = HEX_OR_RGB_REGEX;

const WHITELIST_PATHS = [
  /globals\.css$/,
  /\/tokens\//,
  /\/blueprints\//,
  /\/verticals\/[^/]+\/ui\.ts$/,
  /\/app\/\(marketing\)\//,
  /\/app\/\(client\)\/\(public\)\//,
  /\.test\.[tj]sx?$/,
  /\/__tests__\//,
  /\/tests\//,
  /\/e2e\//,
];

export const noHardcodedHexPlugin = {
  rules: {
    "no-hardcoded-hex": {
      meta: {
        type: "suggestion",
        docs: {
          description: "Interdit les couleurs #hex et rgba() en dur pour préserver la personnalisation tenant MCC.",
        },
        messages: {
          hardcodedHex: "Couleur en dur interdite ('{{value}}') — utiliser un token sémantique (var(--brand-*), var(--shadow-*), etc.).",
        },
        schema: [],
      },
      create(context) {
        const filename = context.filename || context.getFilename();
        if (WHITELIST_PATHS.some(re => re.test(filename))) {
          return {};
        }

        function checkString(node, str) {
          if (typeof str !== "string") return;
          const match = str.match(HEX_OR_RGBA_REGEX);
          if (match) {
            context.report({
              node,
              messageId: "hardcodedHex",
              data: { value: match[0] },
            });
          }
        }

        return {
          JSXAttribute(node) {
            const attrName = node.name?.name;
            if (attrName === "className" || attrName === "style" || attrName === "fill" || attrName === "stroke" || attrName === "color") {
              if (node.value?.type === "Literal") {
                checkString(node.value, node.value.value);
              }
            }
          },
          Property(node) {
            if (node.value?.type === "Literal") {
              checkString(node.value, node.value.value);
            }
          },
        };
      },
    },
  },
};
