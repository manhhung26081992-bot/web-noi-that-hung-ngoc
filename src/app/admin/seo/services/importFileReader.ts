export type ImportDelimiter = ',' | '\t' | ';';

export function stripVietnameseAccent(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function normalizeImportHeader(value: string) {
  return stripVietnameseAccent(String(value || '').trim().replace(/^"|"$/g, '').toLowerCase())
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function detectImportDelimiter(text: string): ImportDelimiter {
  const firstUsefulLine = String(text || '').split(/\r?\n/).find((line) => line.trim()) || '';
  const candidates: Array<{ delimiter: ImportDelimiter; count: number }> = [
    { delimiter: '\t', count: (firstUsefulLine.match(/\t/g) || []).length },
    { delimiter: ';', count: (firstUsefulLine.match(/;/g) || []).length },
    { delimiter: ',', count: (firstUsefulLine.match(/,/g) || []).length },
  ];

  return candidates.sort((a, b) => b.count - a.count)[0]?.delimiter || ',';
}

export function detectDelimiterFromLine(line: string): ImportDelimiter {
  const candidates: Array<{ delimiter: ImportDelimiter; count: number }> = [
    { delimiter: '\t', count: (line.match(/\t/g) || []).length },
    { delimiter: ';', count: (line.match(/;/g) || []).length },
    { delimiter: ',', count: (line.match(/,/g) || []).length },
  ];
  return candidates.sort((a, b) => b.count - a.count)[0]?.delimiter || ',';
}

export function splitDelimitedRow(line: string, delimiter: ImportDelimiter) {
  if (delimiter === '\t') {
    return line.split('\t').map((cell) => cleanCell(cell));
  }

  const cells: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      cells.push(cleanCell(current));
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(cleanCell(current));
  return cells;
}

export function findHeaderLineIndex(text: string, headerMatchers: string[]) {
  const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/);
  const normalizedMatchers = headerMatchers.map(normalizeImportHeader);

  return lines.findIndex((line) => {
    const delimiter = detectDelimiterFromLine(line);
    const headers = splitDelimitedRow(line, delimiter).map(normalizeImportHeader);
    return normalizedMatchers.some((matcher) => headers.includes(matcher));
  });
}

export function parseDelimitedText(text: string, options?: { headerMatchers?: string[] }) {
  const normalizedText = String(text || '').replace(/^\uFEFF/, '');
  const originalLines = normalizedText.split(/\r?\n/).filter((line) => line.trim());
  const headerIndex = options?.headerMatchers?.length ? findHeaderLineIndex(normalizedText, options.headerMatchers) : 0;
  const lines = headerIndex > 0 ? originalLines.slice(headerIndex) : originalLines;
  const delimiter = detectDelimiterFromLine(lines[0] || '') || detectImportDelimiter(normalizedText);

  if (lines.length < 2) {
    return { delimiter, headers: [] as string[], rows: [] as Array<Record<string, string>> };
  }

  const headers = splitDelimitedRow(lines[0], delimiter).map(normalizeImportHeader);
  const rows = lines.slice(1).map((line) => {
    const cells = splitDelimitedRow(line, delimiter);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] || '';
    });
    return row;
  });

  return { delimiter, headers, rows };
}

export function countImportRows(text: string) {
  return parseDelimitedText(text).rows.length;
}

export function readCsvFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không đọc được file CSV.'));
    reader.onload = () => {
      try {
        const buffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(buffer);
        let encoding: string = 'utf-8';
        let offset = 0;

        if (bytes[0] === 0xff && bytes[1] === 0xfe) {
          encoding = 'utf-16le';
          offset = 2;
        } else if (bytes[0] === 0xfe && bytes[1] === 0xff) {
          encoding = 'utf-16be';
          offset = 2;
        } else if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
          encoding = 'utf-8';
          offset = 3;
        } else {
          const sample = bytes.slice(0, Math.min(bytes.length, 200));
          const zeroOdd = sample.filter((_, index) => index % 2 === 1 && sample[index] === 0).length;
          const zeroEven = sample.filter((_, index) => index % 2 === 0 && sample[index] === 0).length;
          if (zeroOdd > sample.length / 8) encoding = 'utf-16le';
          if (zeroEven > sample.length / 8) encoding = 'utf-16be';
        }

        const text = new TextDecoder(encoding).decode(bytes.slice(offset));
        resolve(text.replace(/^\uFEFF/, ''));
      } catch {
        reject(new Error('Không đọc được file CSV.'));
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function cleanCell(value: string) {
  return String(value || '').trim().replace(/^"|"$/g, '').replace(/""/g, '"');
}
