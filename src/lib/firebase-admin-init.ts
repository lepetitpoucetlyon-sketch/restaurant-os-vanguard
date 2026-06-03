import 'server-only';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

/**
 * Initializes Firebase Admin SDK once. Safe to call multiple times.
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON env var (JSON string of service account).
 */
export function initFirebaseAdmin(): void {
  if (getApps().length > 0) return;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccount) {
    throw new Error('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_JSON env var is not set');
  }

  initializeApp({
    credential: cert(JSON.parse(serviceAccount)),
  });
}
