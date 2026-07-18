import { NextResponse } from 'next/server';
import * as net from 'net';

interface Body { ip: string; port: number; data: number[] }

export async function POST(request: Request): Promise<NextResponse> {
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
