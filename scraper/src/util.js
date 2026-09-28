// Shared helpers: paths, hashing, deterministic JSON, string folding.
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const PATHS = {
  scraper: path.resolve(HERE, '..'),
  repo: path.resolve(HERE, '..', '..'),
  cache: path.resolve(HERE, '..', 'cache'),
  raw: path.resolve(HERE, '..', 'raw'),
  data: path.resolve(HERE, '..', '..', 'data'),
  schema: path.resolve(HERE, '..', '..', 'data', 'schema'),
  fixtures: path.resolve(HERE, '..', 'fixtures')
};

export const USER_AGENT =
  'BartokRomaniaViewer/0.1 (+https://github.com/maltandbrew/Barton; research scraper of HUN-REN BTK ZTI Bartok databases; 1 req/s; contact tsaar@maltandbrew.com)';

export function sha1(s) {
  return createHash('sha1').update(String(s)).digest('hex');
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Collapse whitespace, trim; null for empty/undefined. */
export function clean(s) {
  if (s === undefined || s === null) return null;
  const t = String(s).replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
  return t.length ? t : null;
}

/** Diacritics-insensitive, case-insensitive folding for lookups. */
export function fold(s) {
  if (s === undefined || s === null) return '';
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    // Romanian cedilla vs comma-below variants and stray forms that NFD does not unify.
    .replace(/[şș]/g, 's')
    .replace(/[ţț]/g, 't')
    .replace(/[đ]/g, 'd')
    .replace(/[ł]/g, 'l')
    .replace(/[ß]/g, 'ss')
    .toLowerCase()
    .replace(/[’'`´]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function slugify(s) {
  return fold(s).replace(/\s+/g, '-');
}

/** Recursively sort object keys so output is diffable. Arrays keep order. */
export function sortKeysDeep(v) {
  if (Array.isArray(v)) return v.map(sortKeysDeep);
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = sortKeysDeep(v[k]);
    return out;
  }
  return v;
}

export function stableStringify(v) {
  return JSON.stringify(sortKeysDeep(v), null, 2) + '\n';
}

export async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (e) {
    if (fallback !== undefined && (e.code === 'ENOENT')) return fallback;
    throw e;
  }
}

export async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, stableStringify(value), 'utf8');
}

export async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

export function absUrl(base, href) {
  if (!href) return null;
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

export function uniq(arr) {
  return [...new Set(arr.filter((x) => x !== null && x !== undefined))];
}

export function toInt(s) {
  if (s === null || s === undefined) return null;
  const m = String(s).match(/-?\d+/);
  return m ? parseInt(m[0], 10) : null;
}
