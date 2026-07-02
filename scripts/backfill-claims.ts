/**
 * 🛠️ Rattrapage des custom claims Firebase Auth.
 *
 * Toute la sécurité serveur (firestore.rules, adminAuthGuard) repose sur les
 * claims { tenantId, role }. Les comptes créés avant leur introduction n'en
 * ont pas : ce script les pose.
 *
 * Usage :
 *   FIREBASE_SERVICE_ACCOUNT_JSON='...' npx tsx scripts/backfill-claims.ts --list
 *   FIREBASE_SERVICE_ACCOUNT_JSON='...' npx tsx scripts/backfill-claims.ts <email> <tenantId> [role=admin]
 *
 * Rôles valides : fleet_admin | admin | manager | staff
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const VALID_ROLES = ['fleet_admin', 'admin', 'manager', 'staff'];

function initAdmin(): void {
  if (getApps().length > 0) return;
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!sa) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON non défini.');
    process.exit(1);
  }
  initializeApp({ credential: cert(JSON.parse(sa)) });
}

async function listUsersWithoutClaims(): Promise<void> {
  const auth = getAuth();
  let pageToken: string | undefined;
  let missing = 0;
  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const u of page.users) {
      const claims = u.customClaims ?? {};
      if (!claims.tenantId || !claims.role) {
        missing++;
        console.log(`⚠️  ${u.email ?? u.uid} — claims: ${JSON.stringify(claims)}`);
      }
    }
    pageToken = page.pageToken;
  } while (pageToken);
  console.log(missing === 0 ? '✅ Tous les comptes ont tenantId + role.' : `\n${missing} compte(s) sans claims complets.`);
}

async function setClaims(email: string, tenantId: string, role: string): Promise<void> {
  if (!VALID_ROLES.includes(role)) {
    console.error(`❌ Rôle invalide "${role}". Valides : ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }
  const auth = getAuth();
  const user = await auth.getUserByEmail(email);
  // `clientId` : alias historique lu par SovereignModuleGate — on le garde synchronisé.
  await auth.setCustomUserClaims(user.uid, { tenantId, clientId: tenantId, role });
  console.log(`✅ Claims posés pour ${email} (uid=${user.uid}) : tenantId=${tenantId}, role=${role}`);
  console.log('ℹ️  L’utilisateur doit se reconnecter (ou forcer getIdToken(true)) pour voir les nouveaux claims.');
}

async function main(): Promise<void> {
  initAdmin();
  const [, , arg1, arg2, arg3] = process.argv;
  if (arg1 === '--list') {
    await listUsersWithoutClaims();
    return;
  }
  if (!arg1 || !arg2) {
    console.error('Usage : backfill-claims.ts --list | <email> <tenantId> [role=admin]');
    process.exit(1);
  }
  await setClaims(arg1, arg2, arg3 ?? 'admin');
}

main().catch((err) => {
  console.error('❌ Échec :', err instanceof Error ? err.message : err);
  process.exit(1);
});
