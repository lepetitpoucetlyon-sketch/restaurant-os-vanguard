/**
 * no-raw-controls — préserve l'adoption DS.
 *
 * Interdit `<button>`, `<input>`, `<textarea>` bruts dans le code applicatif.
 * Doit importer la primitive DS équivalente (Button, Input, Textarea) depuis
 * `@/shared/components/ui/*`.
 *
 * Exempté :
 * - Fichiers `src/shared/components/ui/**` (primitives DS elles-mêmes)
 * - Fichiers `src/app/(marketing)/**` (design distinct — cf. AUDIT-DS)
 * - Formulaires HTML natifs (type="submit" / "reset" / "hidden" / "file" / "checkbox" / "radio")
 * - Éléments avec `data-allow-raw` (échappement documenté par cas)
 */
export const noRawControlsPlugin = {
  rules: {
    "no-raw-button": {
      meta: {
        type: "suggestion",
        docs: { description: "Interdit <button> brut : utiliser <Button> depuis @/shared/components/ui" },
        messages: {
          rawButton: "Utiliser <Button variant=\"…\"> depuis @/shared/components/ui/Button — évite les régressions DS.",
        },
        schema: [],
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            if (node.name.type !== "JSXIdentifier" || node.name.name !== "button") return;
            const attrs = node.attributes;
            const attrObj = Object.fromEntries(
              attrs.filter(a => a.type === "JSXAttribute" && a.name?.type === "JSXIdentifier").map(a => [
                a.name.name,
                a.value?.type === "Literal" ? a.value.value : true,
              ])
            );
            if (attrObj["data-allow-raw"]) return;
            const type = attrObj.type;
            if (type === "submit" || type === "reset") return;
            context.report({ node, messageId: "rawButton" });
          },
        };
      },
    },
    "no-raw-input": {
      meta: {
        type: "suggestion",
        docs: { description: "Interdit <input> brut : utiliser <Input> depuis @/shared/components/ui" },
        messages: {
          rawInput: "Utiliser <Input> depuis @/shared/components/ui/Input — évite les régressions DS.",
        },
        schema: [],
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            if (node.name.type !== "JSXIdentifier" || node.name.name !== "input") return;
            const attrs = node.attributes;
            const attrObj = Object.fromEntries(
              attrs.filter(a => a.type === "JSXAttribute" && a.name?.type === "JSXIdentifier").map(a => [
                a.name.name,
                a.value?.type === "Literal" ? a.value.value : true,
              ])
            );
            if (attrObj["data-allow-raw"]) return;
            const type = attrObj.type;
            if (type === "hidden" || type === "file" || type === "checkbox" || type === "radio") return;
            context.report({ node, messageId: "rawInput" });
          },
        };
      },
    },
    "no-raw-textarea": {
      meta: {
        type: "suggestion",
        docs: { description: "Interdit <textarea> brut : utiliser <Textarea> depuis @/shared/components/ui" },
        messages: {
          rawTextarea: "Utiliser <Textarea> depuis @/shared/components/ui/Textarea — évite les régressions DS.",
        },
        schema: [],
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            if (node.name.type !== "JSXIdentifier" || node.name.name !== "textarea") return;
            const attrs = node.attributes;
            const attrObj = Object.fromEntries(
              attrs.filter(a => a.type === "JSXAttribute" && a.name?.type === "JSXIdentifier").map(a => [a.name.name, true])
            );
            if (attrObj["data-allow-raw"]) return;
            context.report({ node, messageId: "rawTextarea" });
          },
        };
      },
    },
  },
};
