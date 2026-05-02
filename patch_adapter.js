const fs = require('fs');
const path = './src/infrastructure/adapters/FirestoreAdapter.ts';
let code = fs.readFileSync(path, 'utf8');

const importStr = `import { FirestoreHydrator } from '@/lib/sovereign/firestoreHydrator';\n`;
if (!code.includes('FirestoreHydrator')) {
  code = code.replace(`import { app } from '@/lib/firebase';`, `${importStr}import { app } from '@/lib/firebase';`);
}

const hydratorFunc = `
function hydrateBasedOnPath(pathOrCollection: string, data: any) {
    if (!data) return data;
    if (pathOrCollection.includes('users')) return FirestoreHydrator.hydrateUser(data);
    if (pathOrCollection.includes('orders')) return FirestoreHydrator.hydrateOrder(data);
    if (pathOrCollection.includes('modules')) return FirestoreHydrator.hydrateModule(data);
    return data;
}
`;

if (!code.includes('hydrateBasedOnPath')) {
  code = code.replace(`export class FirestoreAdapter`, `${hydratorFunc}\nexport class FirestoreAdapter`);
}

// Modify get
code = code.replace(
  `return { id: snap.id, ...snap.data() } as T;`,
  `const rawData = { id: snap.id, ...snap.data() };\n            return hydrateBasedOnPath(path, rawData) as T;`
);

// Modify query
code = code.replace(
  `return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));`,
  `return snap.docs.map(d => hydrateBasedOnPath(collectionPath, { id: d.id, ...d.data() }) as T);`
);

// Modify onSnapshot collection
code = code.replace(
  `const data = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));\n                callback(data as any);`,
  `const data = snap.docs.map((d: any) => hydrateBasedOnPath(path, { id: d.id, ...d.data() }));\n                callback(data as any);`
);

// Modify onSnapshot doc
code = code.replace(
  `const data = snap.exists() ? { id: snap.id, ...snap.data() } : null;\n                callback(data as T);`,
  `const rawData = snap.exists() ? { id: snap.id, ...snap.data() } : null;\n                const data = rawData ? hydrateBasedOnPath(path, rawData) : null;\n                callback(data as T);`
);

fs.writeFileSync(path, code);
