/** Browser-only importer: fetch + DOMParser, no Playwright or filesystem. */
export type PrestigeValue = string | number | null;

export interface PrestigeColumn {
  index: number;
  headerPath: string[];
  label: string | null;
  key: string
}

export interface PrestigeChange {
  from: unknown;
  to: unknown
}

export interface PrestigeUpdate {
  at: string;
  type: 'added' | 'changed' | 'metadata';
  changes?: Record<string, PrestigeChange>
}

export interface PrestigeLevel {
  rewards: PrestigeValue[];
  updates?: PrestigeUpdate[]

  [field: string]: unknown;
}

export interface PrestigeBuilding {
  name: string;
  subtitle: string;
  url: string;
  columns: PrestigeColumn[];
  levels: Record<string, PrestigeLevel>;
  updates?: PrestigeUpdate[]
}

export interface PrestigeData {
  source: string;
  updatedAt: string;
  buildings: Record<string, PrestigeBuilding>;
  updateSummary: { changedBuildings: number; changedLevels: number; addedLevels: number; removedLevels: number; changedFields: number };
}

export interface PrestigeImportOptions {
  baseUrl?: string;
  /** Supply a fetch-compatible function, e.g. a proxy-backed fetch. */
  fetcher?: typeof fetch;
  /** Optional callback for progress reporting. */
  onProgress?: (done: number, total: number, slug: string) => void;
  /** AbortSignal forwarded to all requests. */
  signal?: AbortSignal;
}

const clean = (s: unknown): string => String(s ?? '').replace(/\s+/g, ' ').trim();
const rewardKey = (key: string): boolean => /^P[1-7]$/.test(key);
const parseValue = (value: unknown): PrestigeValue => {
  const s = clean(value);
  if (!s || /^[–—-]$/.test(s) || s === '?') {
    return null;
  }
  if (/^[\d\s,.]+$/.test(s)) {
    return Number(s.replace(/[\s,]/g, ''));
  }
  return s;
};
const withoutRewardColumns = (columns: PrestigeColumn[] = []): PrestigeColumn[] => columns.filter(c => !rewardKey(c.key));
const normalizeLevel = (level: PrestigeLevel): Record<string, unknown> => {
  const {updates: _updates, ...fields} = level;
  const rewards = Array.isArray(fields.rewards)
    ? fields.rewards
    : Array.from({length: 7}, (_, i) => fields[`P${i + 1}`] ?? null);
  for (let i = 1; i <= 7; i++) {
    delete fields[`P${i}`];
  }
  return {...fields, rewards};
};
const metadata = (b: PrestigeBuilding) => ({name: b.name, subtitle: b.subtitle, url: b.url, columns: withoutRewardColumns(b.columns)});
const differences = (before: Record<string, unknown>, after: Record<string, unknown>, excluded: string[] = []): Record<string, PrestigeChange> => {
  const result: Record<string, PrestigeChange> = {};
  const ignored = new Set(excluded);
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (ignored.has(key)) {
      continue;
    }
    const from = before[key] ?? null;
    const to = after[key] ?? null;
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      result[key] = {from, to};
    }
  }
  return result;
};
const levelDifferences = (old: PrestigeLevel, current: PrestigeLevel): Record<string, PrestigeChange> => {
  const before = normalizeLevel(old);
  const after = normalizeLevel(current);
  const changes = differences(before, after, ['rewards']);
  const a = before['rewards'] as PrestigeValue[];
  const b = after['rewards'] as PrestigeValue[];
  for (let i = 0; i < 7; i++) {
    const from = a[i] ?? null, to = b[i] ?? null;
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      changes[`P${i + 1}`] = {from, to};
    }
  }
  return changes;
};
const describe = (cell: Element): string => {
  const pieces: unknown[] = [clean((cell as HTMLElement).innerText || cell.textContent), cell.getAttribute('aria-label'), cell.getAttribute('title')];
  for (const el of Array.from(cell.querySelectorAll('img,svg,[aria-label],[title],[data-tooltip]'))) {
    pieces.push(el.getAttribute('alt'), el.getAttribute('aria-label'), el.getAttribute('title'), el.getAttribute('data-tooltip'), el.querySelector('title')?.textContent);
  }
  return [...new Set(pieces.map(clean).filter(Boolean))].join(' / ');
};

interface TableContent {
  columns: PrestigeColumn[];
  rows: string[][]
}

const extractTable = (table: HTMLTableElement): TableContent => {
  const grid: string[][] = [];
  Array.from(table.querySelectorAll('thead tr')).forEach((tr, r) => {
    grid[r] ??= [];
    let col = 0;
    for (const cell of Array.from(tr.children)) {
      if (!cell.matches('th,td')) {
        continue;
      }
      while (grid[r][col] !== undefined) {
        col++;
      }
      const label = describe(cell);
      const colspan = Math.max(1, Number(cell.getAttribute('colspan')) || 1);
      const rowspan = Math.max(1, Number(cell.getAttribute('rowspan')) || 1);
      for (let y = r; y < r + rowspan; y++) {
        grid[y] ??= [];
        for (let x = col; x < col + colspan; x++) {
          grid[y][x] = label;
        }
      }
      col += colspan;
    }
  });
  const width = Math.max(0, ...grid.map(row => row.length));
  const used = new Set<string>();
  const columns: PrestigeColumn[] = Array.from({length: width}, (_, i) => {
    const headerPath = [...new Set(grid.map(row => row[i]).filter(Boolean))];
    const label = headerPath.join(' / ') || null;
    let key = label || `column_${i}`;
    if (used.has(key)) {
      key = `${key}__${i}`;
    }
    used.add(key);
    return {index: i, headerPath, label, key};
  });
  const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr =>
    Array.from(tr.querySelectorAll('th,td')).flatMap(cell =>
      Array.from({length: Math.max(1, Number(cell.getAttribute('colspan')) || 1)}, () => clean(cell.textContent))));
  return {columns, rows};
};

export class PrestigeImporter {
  static readonly DEFAULT_URL = 'https://forgeofempires.wiki/gb-prestige-update';

  /** No files are read/written. Previous data is supplied by the caller. */
  async import(previous: PrestigeData | null = null, options: PrestigeImportOptions = {}): Promise<PrestigeData> {
    const baseUrl = (options.baseUrl ?? PrestigeImporter.DEFAULT_URL).replace(/\/$/, '');
    const fetcher = options.fetcher ?? fetch.bind(globalThis);
    const getDocument = async (url: string): Promise<Document> => {
      console.log('url', url);
      const response = await fetcher('https://corg.zreptil.de?url=' + url, {signal: options.signal});
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${url}`);
      }
      return new DOMParser().parseFromString(await response.text(), 'text/html');
    };
    if (previous && (!previous.buildings || typeof previous.buildings !== 'object')) {
      throw new Error('Ungültige bisherige Prestige-Daten.');
    }
    const index = await getDocument(baseUrl);
    const buildings = new Map<string, string>();
    for (const anchor of Array.from(index.querySelectorAll<HTMLAnchorElement>('a[href*="/gb-prestige-update/"]'))) {
      const url = new URL(anchor.getAttribute('href')!, baseUrl);
      const slug = url.pathname.match(/^\/gb-prestige-update\/([^/]+)\/?$/)?.[1];
      if (slug) {
        buildings.set(slug, url.href);
      }
    }
    if (!buildings.size) {
      throw new Error('Keine LG-Links gefunden. Die Webseite hat möglicherweise ihre Struktur geändert.');
    }
    const result: PrestigeData = {
      source: baseUrl, updatedAt: new Date().toISOString(), buildings: {},
      updateSummary: {changedBuildings: 0, changedLevels: 0, addedLevels: 0, removedLevels: 0, changedFields: 0}
    };
    let done = 0;
    for (const [slug, url] of buildings) {
      const doc = await getDocument(url);
      const name = clean(doc.querySelector('h1')?.textContent);
      const h1 = doc.querySelector('h1');
      const subtitle = clean(h1?.nextElementSibling?.textContent);
      const levels = new Map<number, PrestigeLevel>();
      const columns: PrestigeColumn[] = [];
      // Fetch/DOMParser sees server-rendered HTML only. Hidden range tables
      // are included; JavaScript-created tabs are not automatically executed.
      for (const table of Array.from(doc.querySelectorAll<HTMLTableElement>('table'))) {
        const extracted = extractTable(table);
        if (!extracted.columns.some(c => c.headerPath.some(h => /^level$/i.test(h)))) {
          continue;
        }
        for (const cells of extracted.rows) {
          const level = Number(cells[0]);
          if (!Number.isInteger(level) || level < 1 || level > 300) {
            continue;
          }
          const values: Record<string, unknown> = Object.fromEntries(extracted.columns.map(c => [c.key, parseValue(cells[c.index])]));
          const findField = (label: string) => extracted.columns.find(c => c.headerPath.includes(label))?.key;
          for (const label of ['Level', 'FP', 'Total FP', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7']) {
            const key = findField(label);
            if (key && !(label in values)) {
              values[label] = values[key];
            }
          }
          const rewards = Array.from({length: 7}, (_, i) => (values[`P${i + 1}`] ?? null) as PrestigeValue);
          for (let i = 1; i <= 7; i++) {
            delete values[`P${i}`];
          }
          levels.set(level, {...values, rewards});
        }
        for (const c of extracted.columns) {
          if (!rewardKey(c.key) && !columns.some(x => x.key === c.key)) {
            columns.push(c);
          }
        }
      }
      if (!levels.size) {
        throw new Error(`${slug}: Keine Stufendaten im HTML gefunden. Möglicherweise erzeugt JavaScript die Tabellen erst im Browser.`);
      }
      result.buildings[slug] = {name, subtitle, url, columns, levels: Object.fromEntries([...levels].sort(([a], [b]) => a - b))};
      options.onProgress?.(++done, buildings.size, slug);
    }
    if (previous && Object.keys(result.buildings).length < Object.keys(previous.buildings).length) {
      throw new Error('Es wurden weniger LGs als beim vorherigen Import gefunden.');
    }
    const summary = result.updateSummary;
    if (previous) {
      for (const [slug, building] of Object.entries(result.buildings)) {
        const old = previous.buildings[slug];
        if (!old) {
          building.updates = [{at: result.updatedAt, type: 'added'}];
          summary.changedBuildings++;
          continue;
        }
        if (old.updates?.length) {
          building.updates = [...old.updates];
        }
        const changedMeta = differences(metadata(old), metadata(building));
        if (Object.keys(changedMeta).length) {
          (building.updates ??= []).push({at: result.updatedAt, type: 'metadata', changes: changedMeta});
        }
        let changed = Object.keys(changedMeta).length > 0;
        for (const [level, data] of Object.entries(building.levels)) {
          const prior = old.levels?.[level];
          if (!prior) {
            data.updates = [{at: result.updatedAt, type: 'added'}];
            summary.addedLevels++;
            changed = true;
            continue;
          }
          if (prior.updates?.length) {
            data.updates = [...prior.updates];
          }
          const delta = levelDifferences(prior, data);
          if (Object.keys(delta).length) {
            (data.updates ??= []).push({at: result.updatedAt, type: 'changed', changes: delta});
            summary.changedLevels++;
            summary.changedFields += Object.keys(delta).length;
            changed = true;
          }
        }
        const missing = Object.keys(old.levels ?? {}).filter(level => !(level in building.levels));
        if (missing.length) {
          summary.removedLevels += missing.length;
          throw new Error(`${slug}: ${missing.length} zuvor vorhandene Stufen fehlen (${missing.slice(0, 8).join(', ')}). Import verworfen.`);
        }
        if (changed) {
          summary.changedBuildings++;
        }
      }
    }
    return result;
  }
}
