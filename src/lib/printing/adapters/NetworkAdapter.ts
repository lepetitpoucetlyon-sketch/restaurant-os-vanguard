import type { NetworkConnection, PrintResult } from '../types';

export async function printNetworkRaw(
  conn: NetworkConnection,
  data: Uint8Array
): Promise<PrintResult> {
  // epos-http: Epson ePOS-Print HTTP API (printer exposes HTTP on port 8008)
  if (conn.protocol === 'epos-http') {
    return printEposHttp(conn, data);
  }
  // raw TCP: proxy via Next.js API route (browsers can't open raw TCP sockets)
  return printRawViaProxy(conn, data);
}

async function printEposHttp(conn: NetworkConnection, data: Uint8Array): Promise<PrintResult> {
  const url = `http://${conn.ip}:${conn.port}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`;
  const xml = buildEposXml(data);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: '""' },
      body: xml,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { success: true, method: 'epos-http' };
  } catch (err) {
    return { success: false, method: 'epos-http', error: String(err) };
  }
}

async function printRawViaProxy(conn: NetworkConnection, data: Uint8Array): Promise<PrintResult> {
  // Next.js API route converts HTTP request to raw TCP on the server side
  try {
    const res = await fetch('/api/print/network', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip: conn.ip,
        port: conn.port,
        data: Array.from(data),
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    return { success: true, method: 'network' };
  } catch (err) {
    return { success: false, method: 'network', error: String(err) };
  }
}

function buildEposXml(data: Uint8Array): string {
  const b64 = btoa(String.fromCharCode(...data));
  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
      <command>${b64}</command>
    </epos-print>
  </s:Body>
</s:Envelope>`;
}
