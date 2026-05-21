import { describe, expect, it } from 'vitest';
import { buildCsv } from './csv';

interface Row {
  id: string;
  name: string;
  count: number;
  note: string | null;
}

describe('buildCsv', () => {
  it('emits header + rows separated by CRLF and prepends UTF-8 BOM', () => {
    const csv = buildCsv<Row>(
      [
        { id: 'B-1', name: 'Window', count: 2, note: null },
        { id: 'B-2', name: 'Deep', count: 1, note: 'rush' },
      ],
      [
        { header: 'Ref', accessor: (r) => r.id },
        { header: 'Name', accessor: (r) => r.name },
        { header: 'Count', accessor: (r) => r.count },
        { header: 'Note', accessor: (r) => r.note },
      ],
    );

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const withoutBom = csv.slice(1);
    expect(withoutBom).toBe(['Ref,Name,Count,Note', 'B-1,Window,2,', 'B-2,Deep,1,rush'].join('\r\n'));
  });

  it('quotes and doubles embedded quotes per RFC 4180', () => {
    const csv = buildCsv<Row>(
      [{ id: 'B-3', name: 'She said "hi"', count: 1, note: 'comma, inside' }],
      [
        { header: 'Ref', accessor: (r) => r.id },
        { header: 'Name', accessor: (r) => r.name },
        { header: 'Count', accessor: (r) => r.count },
        { header: 'Note', accessor: (r) => r.note },
      ],
    );

    const lines = csv.slice(1).split('\r\n');
    expect(lines[1]).toBe('B-3,"She said ""hi""",1,"comma, inside"');
  });

  it('emits empty cells for null and undefined values', () => {
    const csv = buildCsv<{ a: string | null; b: number | undefined }>(
      [{ a: null, b: undefined }],
      [
        { header: 'A', accessor: (r) => r.a },
        { header: 'B', accessor: (r) => r.b },
      ],
    );
    expect(csv.slice(1).split('\r\n')[1]).toBe(',');
  });

  it('escapes newlines inside cell values', () => {
    const csv = buildCsv<{ note: string }>(
      [{ note: 'line one\nline two' }],
      [{ header: 'Note', accessor: (r) => r.note }],
    );
    expect(csv.slice(1).split('\r\n')[1]).toBe('"line one\nline two"');
  });
});
