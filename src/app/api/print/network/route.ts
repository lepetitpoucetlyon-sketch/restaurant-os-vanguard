import { NextResponse } from 'next/server';
import * as net from 'net';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { logger } from '@/lib/logger';

interface Body { ip: string; port: number; data: number[] }

/**
 * Proxy TCP brut pour imprimantes/tiroirs réseau (ESC/POS sur port 9100 & co).
 *
 * Durci contre le SSRF :
 *  - authentification obligatoire (utilisateur tenant),
 *  - l'IP cible DOIT être une adresse IPv4 privée RFC1918 (LAN),
 *    ce qui bloque tout accès aux services internes publics et surtout
 *    à l'endpoint de métadonnées cloud 169.254.169.254,
 *  - le port DOIT appartenir à la liste des ports d'impression connus.
 */

// Ports d'impression réseau légitimes : LPD, IPP, RAW/JetDirect (9100-9109).
const ALLOWED_PRINT_PORTS = new Set<number>([515, 631, 9100, 9101, 9102, 9103, 9104, 9105, 9106, 9107, 9108, 9109]);

/** Vrai si `ip` est une IPv4 privée RFC1918 (10/8, 172.16/12, 192.168/16). */
function isPrivateIPv4(ip: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (!m) return false;
  const oct = m.slice(1).map(Number);
  if (oct.some(o => o > 255)) return false;
  const [a, b] = oct;
  if (a === 10) return true;                       // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true;          // 192.168.0.0/16
  return false; // exclut loopback (127/8), link-local (169.254/16, dont metadata), public
}

export async function POST(request: Request): Promise<NextResponse> {
  const caller = await requireTenantUser(request);
  if (isDenied(caller)) return caller;

  let body: Body;
  try {
    body = await request.json() as Body;
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const { ip, port, data } = body;
  if (!ip || !port || !Array.isArray(data)) {
    return NextResponse.json({ error: 'ip, port et data requis' }, { status: 400 });
  }

  if (!isPrivateIPv4(ip)) {
    logger.warn('[print/network] IP cible refusée (hors LAN RFC1918)', { tenantId: caller.tenantId, ip });
    return NextResponse.json({ error: 'IP cible invalide : seul le réseau local (RFC1918) est autorisé' }, { status: 403 });
  }

  if (!ALLOWED_PRINT_PORTS.has(port)) {
    logger.warn('[print/network] Port cible refusé', { tenantId: caller.tenantId, ip, port });
    return NextResponse.json({ error: `Port ${port} non autorisé (ports d'impression uniquement)` }, { status: 403 });
  }

  const bytes = Buffer.from(data);

  try {
    await sendTCP(ip, port, bytes);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}

function sendTCP(ip: string, port: number, data: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Timeout connexion ${ip}:${port}`));
    }, 5000);

    socket.connect(port, ip, () => {
      socket.write(data, err => {
        clearTimeout(timeout);
        socket.end();
        if (err) reject(err);
        else resolve();
      });
    });

    socket.on('error', err => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}
