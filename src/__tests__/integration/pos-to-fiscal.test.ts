import { describe, it, expect, beforeAll } from 'vitest';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdmin } from '@/lib/firebase-admin-init';
import { FinancialNexusBridge } from '@/modules/finance/comptabilite/FinancialNexusBridge';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FirestoreServerAdapter } from '@/infrastructure/adapters/FirestoreServerAdapter';

describe.skip('Integration: POS to Fiscal', () => {
  let db: FirebaseFirestore.Firestore;

  beforeAll(async () => {
    // 1. Initialiser Firebase Admin (qui pointera vers l'émulateur grâce à FIRESTORE_EMULATOR_HOST)
    // Assurez-vous d'avoir lancé `export FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"`
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      project_id: "demo-test",
      client_email: "test@demo-test.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCa0FQdhmTKNl9C\nucqqJrkC+M9EaBFim0FpTtjhb/U1vpMfLW7uuTfzgV5K41BI/Kw2jtXTzC7se5y2\nqqxGoqajE7bBJ3lvx4LYH6JZ5k+4mZGVsuPvhZt8n26lg1IlMF+0mrWS4haZLJvA\nsQ9ZE9NX3NucgiDJ7AfAZdh1TW5gH/fGb6fpprMTSFMdSPjgSGK2LxbZYUnLCWZ7\nPytFW1PpTKmx+P0fbf21zIuXB/xX+8NhEUGO94u+KJcnDVPHIWQyQSgrQ98J+qhV\n/wYd2ebGZfeRC6A2hO9JvOPaS9xlWfyBqQwgTNDRLo1nydYLRDklkh+URa56OVcW\nRWdbsErDAgMBAAECggEAKY5yhdplg8JEn+yvci0izKFtQbeNsyJp1JLNtPYQpHSb\nmWrgtEQTuNGpNgD+tBjfQWXmEAxnLCOiVYZK6EsQ4AWSsRafilnLzafwNKGWFL9k\nTQLQHKOIsVM6qEMv8buidSByTRNTbZqD1J2yuP6RZKxsZv6nPoyVKBgumo5Gapa/\nUygiQFrmWchPUnqx+pLOanysX8ZrauaBHxaLwuB5ohR4P2ru403/+5bHljhcAmrI\n4edWH3sVZS+qdw/ciDChm673z3sqeQGQDYzsNHjVdMJuY4FQ1MpPodOE2E7bfGGh\nDbw4whF5De4CQGfabS7zOgtfkVx5Y6/9MmqBICCaAQKBgQDHSbXRUxJBcYKw80AU\nOK5LKgtPV/2N4wBjJfgDaNMRz4CFEELAsypDbJTojJyCo1iJdzbMZQdIsoXeiJuB\n8s0jdC76l9vlkwBIb2oqD3f6PTRlJP/DQp6QXKdVOMNmnLDc7/sOasRRUsZ/CT8+\nILhRqq+5u/AT9MAcawfnNJ/5YQKBgQDG3qPfi4/OWQf5jWzUgzXXymCuhw2n3RBn\nuB7ViMRhQ2LAksOmCdJKRSknrs0AAomu2AnWvPR/lACO2Al1RwprK/W4t1XmxwOO\nXSM2JG2na2SEP8/2PiC/YA7TBzosRyGJDTy9WwuJoXYj0CIgZkb6ymrQh7ce4nhm\nwXrqwHnCowKBgFKRbpxQr8KflgdccVMvfL81p0Pzb+EmiRWLOKuo9bJuZ5A6AX43\nfS48QaHsCDh0Fw21b+XVgeQT2zUtIkj/4RBsZb57xqbidf6M8s6EZDAwxZGWd8Vd\nx7aGPOopP4Q3LWwMndcGU1piUk119lb2VYe4kWABxuFtyV681aRsgE9hAoGALU33\nIywWHLonmPBhBKDHmVtfXyMhN0ajQB2v2JGJu2awjpJgw+ik4YqT75hg10m8t/o7\nc5IkWRQMdH4+2VrPws6G8gfCKAragooxRVpTKLrMcVxgMgbBSxfFCMoytHeX6jL7\nzV96Z2ZDFbGKtLrYHLYUU2E3lG+fYjldmTE0C+UCgYBUxvW6l/xdqQ8D+ewd0dgt\nMzBOtJDmWpOKuAuF0tWYVudoaaER0owyAGGeeq3afjcD1LvQC63gKeV+NuKzfPzl\ngl7gfCTNMj+F0sByGdvmhNv8dPnETw3Y1rFZFt1wR1W3JWvK0sNC0pP8vuy2kBSv\nyfsdYLwV2M3CZCaoEdqphg==\n-----END PRIVATE KEY-----\n"
    });
    initFirebaseAdmin();
    db = getFirestore();
    
    // 2. Remplacer l'adapter mocké par le VRAI FirestoreServerAdapter
    Nexus.adapter = new FirestoreServerAdapter();
  });

  it('vente POS crée JournalEntry + FiscalSeal chaîné', async () => {
    const tenantId = 'tenant_test_1';
    
    // Nettoyer pour éviter les collisions si on relance
    const entriesCol = await db.collection(`tenants/${tenantId}/journalEntries`).get();
    for (const doc of entriesCol.docs) await doc.ref.delete();
    
    // 1. Déclencher le vrai bridge (qui écrira dans l'émulateur via FirestoreServerAdapter)
    await FinancialNexusBridge.processOrder({
      cartItems: [{ 
        cartId: 'cart_1',
        categoryId: 'cat_beverages',
        modifiers: [],
        productId: 'p1', 
        name: 'Café', 
        quantity: 2,
        unitPriceInMicrounits: 2_000_000 as any, 
        taxRate: '0.10',
        discountInMicrounits: 0 as any
      }],
      operatorId: 'op_1', 
      tableId: 'table_3', 
      tenantId,
      paymentMode: 'cash'
    });

    // 2. Vérifier que l'entrée de journal existe en base
    const entries = await db.collection(`tenants/${tenantId}/journalEntries`).get();
    expect(entries.size).toBe(1);
    
    const entry = entries.docs[0].data();
    expect(entry.totalTTCInMicrounits).toBe(4_000_000); // 2 × 2€ = 4€
    expect(entry.sealId).toBeDefined();

    // 3. Vérifier le seal et son format
    const sealDoc = await db.doc(`tenants/${tenantId}/fiscalSeals/${entry.sealId}`).get();
    expect(sealDoc.exists).toBe(true);
    
    const sealData = sealDoc.data()!;
    expect(sealData.hash).toBeTruthy();
    expect(sealData.signature).toMatch(/^EMP_NF525_/);
    expect(sealData.previousHash).toBeDefined();
    
    // 4. (Bonus) Si c'était en training mode, vérifier le hash spécifique
    if (sealData.isTrainingMode) {
      expect(sealData.hash).toBe('TRAINING_MODE_UNSIGNED_HASH');
    }
  });
});
