# ADR-006 : Choix de la Stack Type-Safety End-to-End

## Contexte
Le frontend (Web App Next.js, Mobile POS, QR Code Ordering, KDS) et le backend (API Routes Next.js) échangent des données critiques (commandes, règlements, TVA, inventaire).
Pour garantir l'absence totale de dérive de typage à l'exécution (runtime mismatch) sans alourdir le cycle de développement ni casser la compatibilité avec les clients mobiles (Flutter / React Native / tablettes), nous devons choisir une stratégie d'API type-safe.

## Options Étudiées
1. **Option A : Zod ➔ OpenAPI 3.0 ➔ Client TypeScript Généré (Retenue)**
   - Utilise les schémas Zod existants comme source unique de vérité.
   - Génère automatiquement la spécification OpenAPI 3.0.3 (`/api/v1/openapi.json`).
   - Fournit un client TypeScript léger et standard (`src/lib/api/client.ts` et `mobilePosClient.ts`).
   - Compatible 100% avec les clients natifs (iOS, Android, Flutter) et tiers.
2. **Option B : tRPC**
   - Fort couplage TypeScript client-serveur, mais intégration mobile et partenaires externes complexe.
3. **Option C : Hono RPC**
   - Nécessite une réécriture des handlers Next.js App Router.

## Décision
Nous retenons l'**Option A (Zod ➔ OpenAPI ➔ Client Typé)**.
- Schémas Zod partagés dans `src/domain/schemas/` et `src/modules/*/domain/`.
- Spécification OpenAPI exposée via `OpenApiSpecService.ts`.
- Client universel `src/lib/api/client.ts` avec autocomplétion et validation stricte.
