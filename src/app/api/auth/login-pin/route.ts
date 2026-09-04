import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import * as argon2 from 'argon2';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { PinHashService } from '@/lib/server/PinHashService';
import { hashPin } from '@/lib/shared-kernel';
import { getServerAuthProvider } from '@/lib/auth/ServerAuthProvider';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';
import { getRateLimiter } from '@/lib/rate-limiter';

/**
 * POST /api/auth/login-pin
 *
 * Remplace la Cloud Function `loginWithPin` (firestore.md §12 Lot B2.b) —
 * même collection racine `users/{userId}` (plateforme, PAS `tenants/{t}/users`),
 * mêmes règles anti-brute-force, même migration progressive vers Argon2id.
 * Volontairement SANS garde d'auth : c'est le point d'entrée qui ÉTABLIT la
 * session — comme l'était la Cloud Function `onCall({cors:true})` d'origine.
 *
 * ⚠️ Trois schémas de hash coexistent sur les documents existants (cf. plan) :
 *   1. pinHashArgon2 (Argon2id)       — posé par l'ancienne Cloud Function
 *   2. pinHash + pinSalt (PBKDF2)     — PinHashService, schéma "staff" tenant
 *   3. pinHash seul (SHA-256+userId)  — legacy shared-kernel.hashPin, ou `pin` en clair
 * Un succès sur 2 ou 3 déclenche un re-hash silencieux vers Argon2id.
 */

const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// Reprise telle quelle de functions/src/modules/infrastructure/auth.ts —
// mêmes niveaux, même rôle par défaut si accessLevel est absent du document.
type StaffRole =
    | 'server' | 'manager' | 'floor_manager' | 'kitchen_chef' | 'kitchen_line'
    | 'bartender' | 'host' | 'cashier' | 'admin';

const ROLE_LEVELS: Record<StaffRole, number> = {
    admin: 100,
    manager: 90,
    floor_manager: 70,
    kitchen_chef: 70,
    bartender: 40,
    server: 30,
    host: 30,
    kitchen_line: 20,
    cashier: 20,
};

interface RootUserDoc {
    id: string;
    name: string;
    role: StaffRole;
    avatar?: string;
    // Nullable (pas seulement optionnel) : le succès d'une migration de schéma
    // les met explicitement à `null` pour purger l'ancien hash/PIN en clair —
    // `Nexus.adapter.update()` n'a pas d'équivalent à `FieldValue.delete()`.
    pin?: string | null;
    pinHash?: string | null;
    pinSalt?: string | null;
    pinHashArgon2?: string | null;
    accessLevel?: number;
    performanceScore?: number;
    failedPinAttempts?: number | null;
    pinLockedUntil?: number | null;
}

function getAccessLevel(user: Pick<RootUserDoc, 'role' | 'accessLevel'>): number {
    return user.accessLevel ?? ROLE_LEVELS[user.role] ?? 0;
}

function toSafeUser(user: RootUserDoc) {
    return {
        id: user.id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        accessLevel: getAccessLevel(user),
        performanceScore: user.performanceScore,
    };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    // Audit S8 : rate-limit IP en défense supplémentaire du lockout par compte
    // (le lockout ne protège pas contre l'énumération userId cross-comptes depuis
    // une même IP — un attaquant peut cibler 100 comptes à 4 essais chacun).
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
    const rl = await getRateLimiter().check(`auth:login-pin:${ip}`, 20, 15 * 60 * 1000);
    if (!rl.allowed) {
        return NextResponse.json({ error: 'Trop de tentatives — réessayez plus tard.' }, { status: 429 });
    }

    let body: { userId?: string; pin?: string };
    try {
        body = (await req.json()) as typeof body;
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { userId, pin } = body;
    if (!userId || typeof userId !== 'string' || !pin || !/^\d{4}$/.test(pin)) {
        return NextResponse.json(
            { error: 'Identifiant utilisateur et PIN à 4 chiffres requis.' },
            { status: 400 },
        );
    }

    const path = `users/${userId}`;
    const user = await Nexus.adapter.get<RootUserDoc>(path);
    if (!user) {
        return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    const now = Date.now();
    if ((user.pinLockedUntil ?? 0) > now) {
        return NextResponse.json(
            { error: 'Trop de tentatives. Compte temporairement verrouillé, réessayez plus tard.' },
            { status: 429 },
        );
    }

    // Cascade de vérification — un seul schéma est réellement présent par document,
    // l'ordre reflète la priorité de migration (le plus fort en premier).
    let valid = false;
    let needsMigration = false;
    if (user.pinHashArgon2) {
        try {
            valid = await argon2.verify(user.pinHashArgon2, pin);
        } catch (err) {
            logger.error('[login-pin] Argon2 verify error', toError(err).message);
            valid = false;
        }
    } else if (user.pinHash && user.pinSalt) {
        valid = PinHashService.verify(pin, user.pinHash, user.pinSalt);
        needsMigration = valid;
    } else if (user.pinHash) {
        valid = (await hashPin(pin, userId)) === user.pinHash;
        needsMigration = valid;
    } else if (user.pin != null) {
        valid = user.pin === pin;
        needsMigration = valid;
    }

    if (!valid) {
        const attempts = (user.failedPinAttempts ?? 0) + 1;
        const update: Partial<RootUserDoc> =
            attempts >= MAX_PIN_ATTEMPTS
                ? { failedPinAttempts: 0, pinLockedUntil: now + PIN_LOCKOUT_MS }
                : { failedPinAttempts: attempts };
        await Nexus.adapter.update(path, update).catch((err) => {
            logger.warn('[login-pin] Échec écriture compteur tentatives', toError(err).message);
        });
        return NextResponse.json({ error: 'PIN invalide.' }, { status: 401 });
    }

    if (needsMigration) {
        try {
            const pinHashArgon2 = await argon2.hash(pin, {
                type: argon2.argon2id,
                memoryCost: 2 ** 16,
                timeCost: 3,
                parallelism: 1,
            });
            await Nexus.adapter.update(path, {
                pinHashArgon2,
                pin: null,
                pinHash: null,
                pinSalt: null,
                failedPinAttempts: null,
                pinLockedUntil: null,
            } as Partial<RootUserDoc>);
        } catch (err) {
            // La migration est un best-effort : le login réussit même si le re-hash échoue.
            logger.warn('[login-pin] Migration Argon2id échouée (non bloquant)', toError(err).message);
        }
    } else if ((user.failedPinAttempts ?? 0) > 0 || (user.pinLockedUntil ?? 0) > 0) {
        await Nexus.adapter.update(path, {
            failedPinAttempts: null,
            pinLockedUntil: null,
        } as Partial<RootUserDoc>).catch(() => {});
    }

    const accessLevel = getAccessLevel(user);
    const token = await getServerAuthProvider().createSessionToken(userId, {
        role: user.role,
        admin: user.role === 'admin',
        accessLevel,
    });

    return NextResponse.json({ token, user: toSafeUser({ ...user, id: userId } as RootUserDoc) });
}
