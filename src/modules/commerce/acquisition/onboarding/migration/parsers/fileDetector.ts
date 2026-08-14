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

const MAGIC_SIGNATURES: Array<{ bytes: number[]; format: FileFormat }> = [
  { bytes: [0x50, 0x4B, 0x03, 0x04], format: 'xlsx' },  // ZIP/XLSX
  { bytes: [0x25, 0x50, 0x44, 0x46], format: 'pdf' },   // %PDF
  { bytes: [0xFF, 0xD8, 0xFF],       format: 'image' },  // JPEG
  { bytes: [0x89, 0x50, 0x4E, 0x47], format: 'image' },  // PNG
  { bytes: [0x52, 0x49, 0x46, 0x46], format: 'image' },  // RIFF/WebP
];

const FEC_EXTENSIONS = ['.txt', '.fec'];

async function detectFormatFromMagicBytes(file: File): Promise<FileFormat> {
  const buf = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buf);

  const magicMatch = MAGIC_SIGNATURES.find(sig => sig.bytes.every((b, i) => bytes[i] === b));
  if (magicMatch) return magicMatch.format;

  const ext = file.name.toLowerCase();
  if (FEC_EXTENSIONS.some(e => ext.endsWith(e))) return 'fec';

  const firstChar = new TextDecoder().decode(buf).trim()[0];
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
    } catch (_parseErr) {
      // eslint-disable-next-line no-console
      console.debug('[fileDetector] JSON.parse échoué — fichier malformé');
      return { format: 'json', source: 'generic', headers: [], rows: [], warnings: [{ row: 0, field: '', message: 'JSON invalide', severity: 'error' }] };
    }
  }

  // pdf / image → needs Gemini Vision, return empty + marker
  return { format, source: 'generic', headers: [], rows: [], warnings: [{ row: 0, field: '', message: `Format ${format} — envoi vers IA pour extraction`, severity: 'info' }] };
}
