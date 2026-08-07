/**
 * 🔌 LIB/ADAPTERS — Adapters infrastructure et clients tiers
 *
 * Barrel logique pour la couche adapters de lib/.
 * Les fichiers sources restent à la racine de lib/ pour compatibilité ascendante
 * et seront physiquement déplacés ici lors d'un sprint dédié post-versionbase.
 *
 * Import conseillé : `import { X } from '@/lib/<adapter>'`
 * Import futur     : `import { X } from '@/lib/adapters'`
 *
 * Périmètre :
 *   audit, axiom, email-service,
 *   firebase, firebase-admin-init,
 *   sentry, MosyleClient (MDM)
 *
 * ⚠️ firebase-admin-init : server-side only (import conditionnel recommandé)
 */

export * from '../audit';
export * from '../axiom';
export * from '../email-service';
export * from '../firebase';
export * from '../sentry';
export * from '../MosyleClient';
// firebase-admin-init : server-side uniquement, pas ré-exporté pour éviter
// un import accidentel côté client.
// Usage : `import { adminDb } from '@/lib/firebase-admin-init'`
