import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { getRateLimiter } from '@/lib/rate-limiter';

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

export async function GET(req: NextRequest): Promise<NextResponse> {
    // Audit S8 : rate-limit IP — l'endpoint est public (pré-auth) et énumère les
    // profils staff ; on plafonne pour éviter le scraping massif.
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
    const rl = await getRateLimiter().check(`auth:login-profiles:${ip}`, 30, 60 * 1000);
    if (!rl.allowed) {
        return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 });
    }
    // NB : liste bornée par tenant (effectif staff ≤ quelques dizaines) — l'écran de sélection
    // pré-auth consomme la liste complète en un seul appel. On plafonne à 500 pour bloquer
    // un tenant pathologique tout en gardant la sémantique historique (retour non paginé).
    const users = await Nexus.adapter.query<RootUserDoc>('users', { limit: 500 });
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
