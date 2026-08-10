import * as fs from 'fs';

const files = [
"src/shared/actions/settings.action.ts",
"src/modules/commerce/relation/reservations/actions/eventQuote.action.ts",
"src/modules/commerce/actions/marketing.action.ts",
"src/modules/compliance/qualite/haccp/actions/nonConformity.action.ts",
"src/modules/compliance/qualite/haccp/actions/haccp.action.ts",
"src/modules/ops/service/pos/actions/commerce.action.ts",
"src/modules/ops/service/pos/actions/kitchen.action.ts",
"src/modules/ops/service/pos/actions/cashdrawer.action.ts",
"src/modules/ops/service/pos/actions/floor.action.ts",
"src/modules/human/effectifs/hr/actions/timeclock.action.ts",
"src/modules/logistics/stock/inventory/actions/inventory.action.ts"
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/z\.custom\<any\>/g, "z.custom<unknown>");
  fs.writeFileSync(file, content);
}
console.log("Done.");
