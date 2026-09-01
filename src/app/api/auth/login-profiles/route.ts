import 'server-only';
import { NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';

/**
 * GET /api/auth/login-profiles
 *
 * Remplace la Cloud Function `listLoginProfiles` (firestore.md §12 Lot B2.b) —
 * même collection racine `users` (plateforme), même tri par accessLevel
 * décroissant, mêmes champs exposés (aucun secret : ni pin, ni pinHash*).
 * Volontairement SANS garde d'auth : sert l'écran de sélection de profil
 * AVANT toute authentification — comme l'était la Cloud Function d'origine.
 */

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
    accessLevel?: number;
    performanceScore?: number;
}

function getAccessLevel(user: Pick<RootUserDoc, 'role' | 'accessLevel'>): number {
    return user.accessLevel ?? ROLE_LEVELS[user.role] ?? 0;
}

export async function GET(): Promise<NextResponse> {
    const users = await Nexus.adapter.query<RootUserDoc>('users');
    const safeUsers = users
        .map((u) => ({
            id: u.id,
            name: u.name,
            role: u.role,
            avatar: u.avatar,
            accessLevel: getAccessLevel(u),
            performanceScore: u.performanceScore,
        }))
        .sort((a, b) => b.accessLevel - a.accessLevel);

    return NextResponse.json({ users: safeUsers });
}
