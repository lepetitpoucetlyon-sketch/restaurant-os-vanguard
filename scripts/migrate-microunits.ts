/**
 * Script de migration §5 : données Firestore InCents → InMicrounits
 *
 * Usage :
 *   DRY_RUN=true  npx ts-node scripts/migrate-microunits.ts   (liste sans toucher)
 *   DRY_RUN=false npx ts-node scripts/migrate-microunits.ts   (migration réelle)
 *
 * Toujours exécuter sur l'émulateur d'abord :
 *   FIRESTORE_EMULATOR_HOST="127.0.0.1:8080" DRY_RUN=true ...
 *
 * La migration AJOUTE uniquement les champs *InMicrounits — elle ne supprime jamais
 * les anciens *InCents (rétrocompatibilité pendant la transition).
 */

import { initFirebaseAdmin } from '../src/lib/firebase-admin-init';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const DRY_RUN = process.env.DRY_RUN !== 'false';

interface MigrationRule {
  collection: string;
  fields: { cents: string; microunits: string }[];
  nestedArrayField?: { arrayField: string; itemFields: { cents: string; microunits: string }[] };
}

const RULES: MigrationRule[] = [
  {
    collection: 'orders',
    fields: [{ cents: 'totalInCents', microunits: 'totalInMicrounits' }],
    nestedArrayField: {
      arrayField: 'items',
      itemFields: [{ cents: 'priceInCents', microunits: 'priceInMicrounits' }],
    },
  },
  {
    collection: 'journalEntries',
    fields: [{ cents: 'amountInCents', microunits: 'amountInMicrounits' }],
  },
  {
    collection: 'expenseClaims',
    fields: [{ cents: 'amountInCents', microunits: 'amountInMicrounits' }],
  },
  {
    collection: 'cashDrawerSessions',
    fields: [
      { cents: 'openingInCents', microunits: 'openingInMicrounits' },
      { cents: 'closingInCents', microunits: 'closingInMicrounits' },
    ],
  },
  {
    collection: 'inventory',
    fields: [{ cents: 'unitCostInCents', microunits: 'unitCostInMicrounits' }],
  },
  {
    collection: 'purchaseOrders',
    fields: [{ cents: 'totalInCents', microunits: 'totalInMicrounits' }],
    nestedArrayField: {
      arrayField: 'lines',
      itemFields: [{ cents: 'unitPriceInCents', microunits: 'unitPriceInMicrounits' }],
    },
  },
];

async function migrateTenant(
  db: FirebaseFirestore.Firestore,
  tenantId: string,
  rule: MigrationRule,
): Promise<number> {
  let migrated = 0;
  const col = db.collection(`tenants/${tenantId}/${rule.collection}`);
  const snap = await col.get();

  for (const doc of snap.docs) {
    const data = doc.data();
    const updates: Record<string, unknown> = {};
    let needsUpdate = false;

    for (const field of rule.fields) {
      const centsVal = data[field.cents];
      if (typeof centsVal === 'number' && data[field.microunits] === undefined) {
        updates[field.microunits] = centsVal * 10_000;
        needsUpdate = true;
      }
    }

    if (rule.nestedArrayField) {
      const arr = data[rule.nestedArrayField.arrayField];
      if (Array.isArray(arr)) {
        const updatedArr = arr.map((item: Record<string, number>) => {
          const updatedItem = { ...item };
          for (const f of rule.nestedArrayField!.itemFields) {
            if (typeof item[f.cents] === 'number' && item[f.microunits] === undefined) {
              updatedItem[f.microunits] = item[f.cents] * 10_000;
              needsUpdate = true;
            }
          }
          return updatedItem;
        });
        if (needsUpdate) {
          updates[rule.nestedArrayField.arrayField] = updatedArr;
        }
      }
    }

    if (needsUpdate) {
      console.log(`[${DRY_RUN ? 'DRY' : 'MIGRATE'}] tenants/${tenantId}/${rule.collection}/${doc.id}`, Object.keys(updates));
      if (!DRY_RUN) {
        await doc.ref.update({ ...updates, _migratedAt: FieldValue.serverTimestamp() });
      }
      migrated++;
    }
  }

  return migrated;
}

async function main() {
  initFirebaseAdmin();
  const db = getFirestore();

  console.log(`\n=== Migration microunits (DRY_RUN=${DRY_RUN}) ===\n`);

  const tenantsSnap = await db.collection('tenants').listDocuments();
  const tenantIds = tenantsSnap.map((ref) => ref.id);
  console.log(`Tenants trouvés : ${tenantIds.length}\n`);

  let totalMigrated = 0;
  const report: Record<string, number> = {};

  for (const tenantId of tenantIds) {
    for (const rule of RULES) {
      const count = await migrateTenant(db, tenantId, rule);
      if (count > 0) {
        const key = `${tenantId}/${rule.collection}`;
        report[key] = count;
        totalMigrated += count;
      }
    }
  }

  console.log('\n=== Rapport ===');
  for (const [key, count] of Object.entries(report)) {
    console.log(`  ${key}: ${count} doc(s) migrés`);
  }
  console.log(`\nTotal : ${totalMigrated} document(s) ${DRY_RUN ? 'à migrer (dry-run)' : 'migrés'}`);
}

main().catch(console.error);
