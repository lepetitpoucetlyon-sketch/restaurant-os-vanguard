import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { PinHashService } from '@/lib/server/PinHashService';
import { logger } from '@/lib/logger';
import type { User } from '@/modules/human';
import { toError } from "@/lib/toError";

/**
 * POST /api/timeclock/verify-pin
 *
 * Vérifie le PIN staff côté serveur (PBKDF2-SHA256) avec rate limiting persistant.
 * Appelé par la pointeuse kiosque en remplacement de la query Nexus client-side.
 *
 * - tenantId : du JWT uniquement (jamais du body)
 * - Rate limit : 5 essais / 30s, persisté dans Nexus (survive aux rechargements)
 * - Migration progressive : si pinHash absent, compare en clair et hash à la volée
 *
 * Retourne uniquement les champs non-sensibles : id, name, role, avatar.
 */

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

interface RateEntry { attempts: number; lockedUntil?: number }
type StaffDoc = User & { pinHash?: string; pinSalt?: string; pin?: string };

function validatePinRequest(pin?: string, terminalId?: string): NextResponse | null {
  if (!pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN invalide' }, { status: 400 });
  }
  if (!terminalId || typeof terminalId !== 'string' || terminalId.length > 64) {
    return NextResponse.json({ error: 'terminalId requis' }, { status: 400 });
  }
  return null;
}

function verifyStaffPin(staffList: StaffDoc[], pin: string, tenantId: string): StaffDoc | undefined {
  for (const staff of staffList) {
    if (staff.pinHash && staff.pinSalt) {
      if (PinHashService.verify(pin, staff.pinHash, staff.pinSalt)) {
        return staff;
      }
    } else if (staff.pin === pin) {
      const hashed = PinHashService.hash(pin);
      Nexus.adapter.update(`tenants/${tenantId}/staff/${staff.id}`, {
        pinHash: hashed.pinHash,
        pinSalt: hashed.pinSalt,
      }).catch((err) => {
        logger.warn('[timeclock/verify-pin] Migration PIN hash échouée', toError(err).message);
      });
      return staff;
    }
  }
  return undefined;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let callerTenantId: string | undefined;
  const caller = await requireTenantUser(req);
  if (!isDenied(caller) && (caller as { tenantId?: string })?.tenantId) {
    callerTenantId = (caller as { tenantId: string }).tenantId;
  }

  let body: { pin: string; terminalId: string; tenantId?: string };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { pin, terminalId, tenantId: bodyTenantId } = body;
  const tenantId = callerTenantId || req.headers.get('x-tenant-id') || bodyTenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId requis pour le pointage' }, { status: 400 });
  }

  const validationError = validatePinRequest(pin, terminalId);
  if (validationError) return validationError;

  // Rate limit côté serveur — survit aux rechargements de page
  const safeTerminal = encodeURIComponent(terminalId);
  const ratePath = `tenants/${tenantId}/pinRateLimits/${safeTerminal}`;
  const rate = (await Nexus.adapter.get<RateEntry>(ratePath)) ?? { attempts: 0 };

  if (rate.lockedUntil && Date.now() < rate.lockedUntil) {
    const waitSec = Math.ceil((rate.lockedUntil - Date.now()) / 1000);
    return NextResponse.json(
      { error: `Kiosque verrouillé — réessayez dans ${waitSec}s` },
      { status: 429 },
    );
  }

  // Récupère tout le staff du tenant (< 100 records en restauration)
  const staffList = (await Nexus.adapter.query<StaffDoc>(
    `tenants/${tenantId}/staff`,
    {},
  )) as StaffDoc[];

  const match = verifyStaffPin(staffList, pin, tenantId);

  if (!match) {
    const nextAttempts = (rate.attempts ?? 0) + 1;
    const update: RateEntry = { attempts: nextAttempts };
    if (nextAttempts >= MAX_ATTEMPTS) {
      update.lockedUntil = Date.now() + LOCKOUT_MS;
      
      const { NexusEventBus } = await import('@/shared/eventBus/NexusEventBus');
      await NexusEventBus.emitDurable('security.pin_locked', {
        v: 1,
        tenantId,
        terminalId,
        lockedUntil: update.lockedUntil,
      });
    }
    
    await Nexus.adapter.set(ratePath, update);
    logger.warn(
      `[timeclock/verify-pin] PIN incorrect (${nextAttempts}/${MAX_ATTEMPTS}) tenant=${tenantId} terminal=${terminalId}`,
    );
    return NextResponse.json({ error: 'PIN incorrect' }, { status: 401 });
  }

  // Succès — reset rate limit
  await Nexus.adapter.set(ratePath, { attempts: 0 });

  return NextResponse.json({
    id: match.id,
    name: match.name,
    role: match.role,
    avatar: match.avatar ?? null,
  });
}

