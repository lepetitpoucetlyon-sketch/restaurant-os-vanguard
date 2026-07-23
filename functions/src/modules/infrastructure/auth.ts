import { createHash } from 'node:crypto';
import * as argon2 from 'argon2';
import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();
const adminAuth = admin.auth();

export type UserRole =
    | 'server'
    | 'manager'
    | 'floor_manager'
    | 'kitchen_chef'
    | 'kitchen_line'
    | 'bartender'
    | 'host'
    | 'cashier'
    | 'admin';

export interface StaffUserDoc {
    id?: string;
    name: string;
    role: UserRole;
    avatar?: string;
    pin?: string;
    pinHash?: string;
    pinHashArgon2?: string;
    accessLevel?: number;
    performanceScore?: number;
}

const ROLE_LEVELS: Record<UserRole, number> = {
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

const ROOT_ADMIN_DEFAULT_PIN = '0404';
const ROOT_ADMIN_ID = 'user_root';

function hashPin(pin: string, salt: string): string {
    return createHash('sha256').update(`${pin}${salt}`).digest('hex');
}

async function hashPinArgon2(pin: string): Promise<string> {
    return await argon2.hash(pin, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
    });
}

async function verifyPinArgon2(hash: string, pin: string): Promise<boolean> {
    try {
        return await argon2.verify(hash, pin);
    } catch (error) {
        console.error('Argon2 Verify Error:', error);
        return false;
    }
}

function getAccessLevel(user: Pick<StaffUserDoc, 'role' | 'accessLevel'>): number {
    return user.accessLevel ?? ROLE_LEVELS[user.role] ?? 0;
}

function toSafeStaffUser(userId: string, user: StaffUserDoc) {
    return {
        id: userId,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        accessLevel: getAccessLevel(user),
        performanceScore: user.performanceScore,
    };
}

export const loginWithPin = onCall({ cors: true }, async (request) => {
    const { userId, pin } = (request.data ?? {}) as { userId: string, pin: string };

    if (!userId || !/^\d{4}$/u.test(pin)) {
        throw new HttpsError('invalid-argument', 'Identifiant utilisateur et PIN a 4 chiffres requis.');
    }

    const ref = db.collection('users').doc(userId);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
        throw new HttpsError('not-found', 'Utilisateur introuvable.');
    }

    const user = snapshot.data() as StaffUserDoc;
    let needsMigration = false;

    if (user.pinHashArgon2) {
        if (!(await verifyPinArgon2(user.pinHashArgon2, pin))) {
            throw new HttpsError('unauthenticated', 'PIN invalide.');
        }
    } else if (user.pinHash) {
        if (hashPin(pin, userId) !== user.pinHash) {
            throw new HttpsError('unauthenticated', 'PIN invalide.');
        }
        needsMigration = true;
    } else if (user.pin === pin) {
        needsMigration = true;
    } else {
        throw new HttpsError('unauthenticated', 'PIN invalide.');
    }

    if (needsMigration) {
        const pinHashArgon2 = await hashPinArgon2(pin);
        await ref.update({
            pinHashArgon2,
            pin: FieldValue.delete(),
            pinHash: FieldValue.delete(),
        });
        user.pinHashArgon2 = pinHashArgon2;
    }

    const token = await adminAuth.createCustomToken(userId, {
        role: user.role,
        admin: user.role === 'admin',
        accessLevel: getAccessLevel(user),
    });

    return { token, user: toSafeStaffUser(userId, user) };
});

export const listLoginProfiles = onCall({ cors: true }, async () => {
    const snap = await db.collection('users').get();
    const users = snap.docs
        .map((doc) => toSafeStaffUser(doc.id, doc.data() as StaffUserDoc))
        .sort((a, b) => b.accessLevel - a.accessLevel);
    return { users };
});
