import type { FileFormat, SourceSystem, ParsedFile } from '../types';
import { parseCSV, parseFECText, readFileAsText } from './csvParser';
import { xlsxToRows } from './xlsxParser';

const SOURCE_FINGERPRINTS: Record<SourceSystem, string[][]> = {
  zenchef: [
    ['Date de réservation', 'Couverts', 'Statut réservation'],
    ['Nom', 'Prénom', 'Date', 'Heure', 'Couverts'],
    ['date_reservation', 'nb_couverts', 'statut'],
  ],
  thefork: [
    ['booking_date', 'party_size', 'status'],
    ['customer_email', 'booking_time'],
  ],
  laddition: [
    ['Libellé', 'Montant TTC', 'TVA', 'Montant HT'],
    ['Article', 'Prix TTC', 'Taux TVA'],
  ],
  zelty: [
    ['product_name', 'price_cents', 'category'],
    ['name', 'price_cents', 'category_id'],
  ],
  lightspeed: [
    ['SKU', 'Name', 'Price', 'Stock'],
    ['ProductName', 'Barcode', 'CostPrice'],
  ],
  generic: [],
};

export function detectSourceSystem(headers: string[]): SourceSystem {
  const normalized = headers.map(h => h.trim().toLowerCase());
  for (const entry of Object.entries(SOURCE_FINGERPRINTS) as Array<[SourceSystem, string[][]]>) {
    const [source, patterns] = entry;
    if (source === 'generic') continue;
    for (const pattern of patterns) {
      const patternLower = pattern.map((p: string) => p.toLowerCase());
      const matched = patternLower.filter((p: string) => normalized.some(h => h.includes(p) || p.includes(h)));
      if (matched.length >= Math.ceil(pattern.length * 0.6)) return source;
    }
  }
  return 'generic';
}

async function detectFormatFromMagicBytes(file: File): Promise<FileFormat> {
  const buf = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buf);

  // XLSX / ZIP: PK\x03\x04
  if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) return 'xlsx';
  // PDF: %PDF
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'pdf';
  // JPEG: FFD8FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'image';
  // PNG: 89PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'image';
  // WebP: RIFF....WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return 'image';

  // FEC: try extension
  if (file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.fec')) return 'fec';

  // JSON: first visible char is { or [
  const text = new TextDecoder().decode(buf);
  const firstChar = text.trim()[0];
  if (firstChar === '{' || firstChar === '[') return 'json';

  return 'csv';
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const format = await detectFormatFromMagicBytes(file);

  if (format === 'xlsx') {
    const { headers, rows, warnings } = await xlsxToRows(file);
    const source = detectSourceSystem(headers);
    return { format, source, headers, rows, warnings, encoding: 'utf-8', separator: 'n/a' };
  }

  if (format === 'csv' || format === 'fec') {
    if (format === 'fec') {
      const text = await readFileAsText(file);
      const { headers, rows, warnings } = parseFECText(text);
      return { format: 'fec', source: 'generic', headers, rows, warnings, encoding: 'utf-8', separator: '|' };
    }
    const result = await parseCSV(file);
    const source = detectSourceSystem(result.headers);
    return { format: 'csv', source, headers: result.headers, rows: result.rows, warnings: result.warnings, encoding: result.encoding, separator: result.separator };
  }

  if (format === 'json') {
    const text = await readFileAsText(file);
    try {
      const data = JSON.parse(text);
      const arr: Record<string, string>[] = Array.isArray(data) ? data : [data];
      const headers = arr.length > 0 ? Object.keys(arr[0]) : [];
      const rows = arr.map(item => Object.fromEntries(Object.entries(item).map(([k, v]) => [k, String(v ?? '')])));
      const source = detectSourceSystem(headers);
      return { format: 'json', source, headers, rows, warnings: [], encoding: 'utf-8' };
    } catch {
      return { format: 'json', source: 'generic', headers: [], rows: [], warnings: [{ row: 0, field: '', message: 'JSON invalide', severity: 'error' }] };
    }
  }

  // pdf / image → needs Gemini Vision, return empty + marker
  return { format, source: 'generic', headers: [], rows: [], warnings: [{ row: 0, field: '', message: `Format ${format} — envoi vers IA pour extraction`, severity: 'info' }] };
}
