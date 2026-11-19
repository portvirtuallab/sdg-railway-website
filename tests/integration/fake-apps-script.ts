/**
 * Minimal in-memory stand-in for the Apps Script services used by apps-script/src, so the back end
 * can be tested in Node: SpreadsheetApp, CacheService, LockService, HtmlService, DriveApp,
 * ContentService, Utilities, Session, Logger, MimeType.
 */
import fs from 'node:fs';
import vm from 'node:vm';

type Cell = string | number | boolean | Date;

/** Sheets stores "'text" as text without the apostrophe, and numbers typed as text as numbers. */
function store(v: unknown, textFormat: boolean): Cell {
  if (typeof v === 'string' && v.startsWith("'")) return v.slice(1);
  if (typeof v === 'string' && !textFormat && /^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v as Cell;
}

class FakeRange {
  constructor(
    private sheet: FakeSheet,
    private r: number,
    private c: number,
    private nr = 1,
    private nc = 1,
  ) {}
  getValues(): Cell[][] {
    return Array.from({ length: this.nr }, (_, i) =>
      Array.from({ length: this.nc }, (_, j) => this.sheet.cell(this.r + i, this.c + j)),
    );
  }
  getValue(): Cell {
    return this.sheet.cell(this.r, this.c);
  }
  setValue(v: unknown) {
    this.sheet.set(this.r, this.c, v);
    return this;
  }
  setValues(rows: unknown[][]) {
    rows.forEach((row, i) => row.forEach((v, j) => this.sheet.set(this.r + i, this.c + j, v)));
    return this;
  }
  setFontWeight() {
    return this;
  }
  setNumberFormat(f: string) {
    if (f === '@') for (let j = 0; j < this.nc; j++) this.sheet.textCols.add(this.c + j);
    return this;
  }
}

export class FakeSheet {
  rows: Cell[][] = [];
  textCols = new Set<number>();
  constructor(public name: string) {}
  cell(r: number, c: number): Cell {
    return this.rows[r - 1]?.[c - 1] ?? '';
  }
  set(r: number, c: number, v: unknown) {
    while (this.rows.length < r) this.rows.push([]);
    const row = this.rows[r - 1]!;
    while (row.length < c) row.push('');
    row[c - 1] = store(v, this.textCols.has(c));
  }
  getLastRow() {
    return this.rows.length;
  }
  getLastColumn() {
    return Math.max(0, ...this.rows.map((r) => r.length));
  }
  getDataRange() {
    return new FakeRange(this, 1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn()));
  }
  getRange(a: number | string, c?: number, nr?: number, nc?: number) {
    if (typeof a === 'string') return new FakeRange(this, 1, 1, 0, 0); // "A:A" formats only
    return new FakeRange(this, a, c!, nr, nc);
  }
  appendRow(row: unknown[]) {
    const r = this.rows.length + 1;
    row.forEach((v, j) => this.set(r, j + 1, v));
  }
  setFrozenRows() {}
  setTabColor() {}
  /** Rows as objects, for assertions. */
  objects(): Record<string, Cell>[] {
    const [h, ...rest] = this.rows;
    return rest.map((r) => Object.fromEntries(h!.map((k, i) => [String(k), r[i] ?? ''])));
  }
} // prettier-ignore

export function createSpreadsheet(tables: Record<string, Record<string, unknown>[]>) {
  const sheets = new Map<string, FakeSheet>();
  for (const [name, rows] of Object.entries(tables)) {
    const s = new FakeSheet(name);
    const headers = Object.keys(rows[0] ?? {});
    s.appendRow(headers);
    for (const r of rows) s.appendRow(headers.map((h) => r[h] ?? ''));
    sheets.set(name, s);
  }
  return {
    sheets,
    getSheetByName: (n: string) => sheets.get(n) ?? null,
    insertSheet: (n: string) => {
      const s = new FakeSheet(n);
      sheets.set(n, s);
      return s;
    },
  };
}

export function loadAppsScript(distDir: string, ss: ReturnType<typeof createSpreadsheet>) {
  const files: { name: string; content: string }[] = [];
  const cache = new Map<string, string>();
  const ctx: Record<string, unknown> = {
    console,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ss,
      getUi: () => {
        throw new Error('no UI');
      },
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k: string) => cache.get(k) ?? null,
        put: (k: string, v: string) => void cache.set(k, v),
        removeAll: (ks: string[]) => ks.forEach((k) => cache.delete(k)),
      }),
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Session: { getScriptTimeZone: () => 'UTC' },
    Utilities: {
      formatDate: (d: Date, _tz: string, f: string) =>
        f === 'HH:mm' ? d.toISOString().slice(11, 16) : d.toISOString().slice(0, 10),
    },
    Logger: { log() {} },
    MimeType: { PDF: 'application/pdf' },
    HtmlService: {
      createTemplateFromFile: (name: string) => {
        const tpl: Record<string, unknown> = {
          evaluate: () => ({
            getAs: () => ({
              setName: (n: string) => {
                files.push({ name: n, content: renderTemplate(distDir, name, tpl) });
                return { name: n };
              },
            }),
          }),
        };
        return tpl;
      },
    },
    DriveApp: {
      getFolderById: () => ({ createFile: (b: { name: string }) => fakeFile(b.name) }),
      getRootFolder: () => ({ createFile: (b: { name: string }) => fakeFile(b.name) }),
    },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (s: string) => ({ setMimeType: () => ({ content: s }) }),
    },
  };
  vm.createContext(ctx);
  for (const f of ['Engine.gs', 'Seed.gs', 'Code.gs', 'Setup.gs'])
    vm.runInContext(fs.readFileSync(`${distDir}/${f}`, 'utf8'), ctx, { filename: f });

  const call = (fn: string, ...args: unknown[]) =>
    (ctx[fn] as (...a: unknown[]) => unknown)(...args);
  return {
    ctx,
    files,
    get: (action: string) =>
      JSON.parse((call('doGet', { parameter: { action } }) as { content: string }).content),
    post: (body: unknown) =>
      JSON.parse(
        (call('doPost', { postData: { contents: JSON.stringify(body) } }) as { content: string })
          .content,
      ),
    run: call,
  };
}

function fakeFile(name: string) {
  const id = `file-${name}`;
  return { getId: () => id, getUrl: () => `https://drive.example/${id}` };
}

/** Renders the HtmlService template (<? ?>, <?= ?>) with HTML escaping, to catch template errors. */
function renderTemplate(dir: string, name: string, vars: Record<string, unknown>): string {
  const src = fs.readFileSync(`${dir}/${name}.html`, 'utf8');
  let js = 'let __o = "";\n';
  const re = /<\?(=)?([\s\S]*?)\?>/g;
  let last = 0;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    js += `__o += ${JSON.stringify(src.slice(last, m.index))};\n`;
    js += m[1] ? `__o += __esc(${m[2]});\n` : `${m[2]}\n`;
    last = re.lastIndex;
  }
  js += `__o += ${JSON.stringify(src.slice(last))};\n__o;`;
  const esc = (v: unknown) => String(v).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const data = Object.fromEntries(Object.entries(vars).filter(([, v]) => typeof v !== 'function'));
  return vm.runInNewContext(js, { ...data, __esc: esc, Math }) as string;
}
