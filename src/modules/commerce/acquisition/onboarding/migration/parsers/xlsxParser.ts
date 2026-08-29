import type { ParsedRow, ImportWarning } from '../types';
import ExcelJS from 'exceljs';

export async function xlsxToRows(file: File): Promise<{ headers: string[]; rows: ParsedRow[]; warnings: ImportWarning[] }> {
  const warnings: ImportWarning[] = [];

  try {
    const buf = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buf);

    const worksheet = workbook.worksheets[0];
    if (!worksheet || worksheet.rowCount < 2) {
      return { headers: [], rows: [], warnings: [{ row: 0, field: '', message: 'Feuille Excel vide', severity: 'error' }] };
    }

    const firstRow = worksheet.getRow(1);
    const headers: string[] = [];
    firstRow.eachCell((cell, colNumber) => {
      headers[colNumber - 1] = String(cell.value ?? '').trim();
    });

    const rows: ParsedRow[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const rowData: ParsedRow = {};
      let hasData = false;

      headers.forEach((header, colIdx) => {
        if (!header) return;
        const cell = row.getCell(colIdx + 1);
        let val = '';
        if (cell.value !== null && cell.value !== undefined) {
          if (typeof cell.value === 'object' && 'text' in cell.value) {
            val = String((cell.value as { text: unknown }).text ?? '');
          } else if (typeof cell.value === 'object' && 'result' in cell.value) {
            val = String((cell.value as { result: unknown }).result ?? '');
          } else {
            val = String(cell.value);
          }
        }
        val = val.replace(/\s+/g, ' ').trim();
        if (val) hasData = true;
        rowData[header] = val;
      });

      if (hasData) {
        rows.push(rowData);
      }
    });

    return { headers: headers.filter(Boolean), rows, warnings };
  } catch (e) {
    return {
      headers: [],
      rows: [],
      warnings: [{ row: 0, field: '', message: (e as Error).message, severity: 'error' }],
    };
  }
}
