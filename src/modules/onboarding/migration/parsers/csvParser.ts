import type { ParsedRow, ImportWarning } from '../types';

export function detectSeparator(header: string): string {
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 };
  for (const ch of header) {
    if (ch in counts) counts[ch]++;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export function parseCSVLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function sniffEncoding(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf.slice(0, 512));
  for (let i = 0; i < bytes.length - 1; i++) {
    // Latin-1 tells: byte >= 0x80 and next byte is NOT a valid UTF-8 continuation
    if (bytes[i] >= 0x80 && bytes[i] <= 0xBF && (bytes[i + 1] < 0x80 || bytes[i + 1] > 0xBF)) {
      return 'iso-8859-1';
    }
    // Clear UTF-8 2-byte sequence marker
    if ((bytes[i] & 0xE0) === 0xC0 && (bytes[i + 1] & 0xC0) === 0x80) {
      return 'utf-8';
    }
  }
  return 'utf-8';
}

export async function readFileAsText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const encoding = sniffEncoding(buf);
  return new TextDecoder(encoding).decode(buf);
}

export interface CSVParseResult {
  headers: string[];
  rows: ParsedRow[];
  separator: string;
  encoding: string;
  warnings: ImportWarning[];
}

export async function parseCSV(file: File): Promise<CSVParseResult> {
  const buf = await file.arrayBuffer();
  const encoding = sniffEncoding(buf);
  const text = new TextDecoder(encoding).decode(buf);

  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    return { headers: [], rows: [], separator: ',', encoding, warnings: [{ row: 0, field: '', message: 'Fichier vide ou sans données', severity: 'error' }] };
  }

  const sep = detectSeparator(lines[0]);
  const headers = parseCSVLine(lines[0], sep).map(h =>
    h.replace(/^["']|["']$/g, '').trim()
  );

  const warnings: ImportWarning[] = [];
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i], sep);
    if (cells.length !== headers.length) {
      warnings.push({ row: i, field: '', message: `Ligne ${i + 1} : ${cells.length} colonnes au lieu de ${headers.length} — ignorée`, severity: 'warning' });
      continue;
    }
    const row: ParsedRow = {};
    headers.forEach((h, idx) => { row[h] = (cells[idx] ?? '').replace(/ /g, ' ').trim(); });
    rows.push(row);
  }

  return { headers, rows, separator: sep, encoding, warnings };
}

export function parseFECText(text: string): { headers: string[]; rows: ParsedRow[]; warnings: ImportWarning[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const warnings: ImportWarning[] = [];

  // FEC uses | as separator, first line is headers
  const headers = lines[0].split('|').map(h => h.trim());
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split('|');
    if (cells.length < headers.length - 2) {
      warnings.push({ row: i, field: '', message: `Ligne FEC ${i + 1} malformée`, severity: 'warning' });
      continue;
    }
    const row: ParsedRow = {};
    headers.forEach((h, idx) => { row[h] = (cells[idx] ?? '').trim(); });
    rows.push(row);
  }

  return { headers, rows, warnings };
}
