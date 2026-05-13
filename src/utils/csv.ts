/**
 * Generate a CSV file from a list of records. Quotes are doubled per RFC 4180.
 *
 *   const csv = buildCsv(rows, [
 *     { header: 'Ref', accessor: (b) => b.id },
 *     ...
 *   ]);
 *   downloadCsv('bookings.csv', csv);
 */

export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

function escape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escape(c.header)).join(',');
  const lines = rows.map((row) =>
    columns.map((c) => escape(c.accessor(row))).join(','),
  );
  // Prepend BOM for Excel compatibility on macOS
  return '﻿' + [header, ...lines].join('\r\n');
}

export function downloadCsv(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
