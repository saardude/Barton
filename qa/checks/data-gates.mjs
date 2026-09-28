#!/usr/bin/env node
/**
 * data-gates.mjs - data quality gates for the scraped Bartok song records.
 *
 * Runs in CI after `scraper build`. Reads data/songs.json (or --file) and
 * data/schema/song.schema.json (or --schema), prints a pass/warn/fail report
 * per gate, and exits non-zero when a blocking gate fails.
 *
 * Usage:
 *   node qa/checks/data-gates.mjs
 *   node qa/checks/data-gates.mjs --file data/songs.sample.json
 *   node qa/checks/data-gates.mjs --file qa/fixtures/songs.sample.json --schema data/schema/song.schema.json
 *   node qa/checks/data-gates.mjs --report qa/out/gates.json   (also write a JSON report)
 *   node qa/checks/data-gates.mjs --strict                     (warnings also fail)
 *
 * Dependencies: Node 22 built-ins only, plus `ajv` which the scraper installs
 * (imported from ../../scraper/node_modules/ajv/dist/ajv2020.js). If ajv or the
 * schema file is missing, the schema gate is skipped with a warning.
 *
 * Record shape: data/schema/song.schema.json (summary; the schema is authoritative).
 * The accessors below also tolerate the older draft names (place.*, year, informant)
 * so the script does not crash on a pre-schema sample.
 *
 *   {
 *     id: "bsys-A204",                         // ^(fmbc|bsys|gyuj|rfm)-...; unique
 *     source: { site: "bsys", siteName, siteId, url, referenceCode, volume, number, siteRecordId?, fetchedAt? },
 *     title, incipit,                          // string | null
 *     genre: "colinda"|"doina"|"bocet"|"cantec"|"joc"|"nunta"|"other"|null,
 *     genreRaw, style,                         // string | null
 *     performance: "vocal"|"instrumental"|"mixed"|"unknown",
 *     instrument: string[],
 *     performer: { name, age, sex, ethnicity },
 *     collector,
 *     collected: { year, month, day, raw },    // year integer 1880..1945 | null
 *     location: { country, region, county, countyHistorical, village, villageHistorical,
 *                 lat, lng, raw, placeId?, origin?, resolution? },
 *     media: { notation: [{url,type,caption}], audio: [{url,type,caption}] },
 *     music: { systemPosition, cadences, rhythm, mode, ambitus, syllables, form },
 *     text, remarks, related: [], composition: [],
 *     rawFields: { label: value } | null      // verbatim page fields; not scanned for HTML
 *   }
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ROMANIA_BBOX = { latMin: 43.6, latMax: 48.3, lngMin: 20.2, lngMax: 29.7 };
const BARTOK_YEARS = { min: 1904, max: 1918 };        // Bartok's own field years (warn only)
const SCHEMA_YEARS_FALLBACK = { min: 1800, max: 1960 }; // used when the song schema has no year bounds
const BARTOK_RE = /bart[o\u00f3]k/i;                     // "Bartók Béla", "Bartok Bela", "Béla Bartók"
const COUNTY_RESOLUTION_MIN = 0.95;
const MAX_LISTED = 10; // offenders printed per gate in the terminal; the JSON report holds all

// Fallback genre vocabulary, used only when neither the schema enum nor
// data/facets.json provides one. Keep in sync with docs/DATA-SCHEMA.md.
const DEFAULT_GENRE_VOCAB = ['colinda', 'doina', 'bocet', 'cantec', 'joc', 'nunta', 'other', null];

// String fields under these keys are URLs or opaque, so they are not HTML-scanned.
const URL_LIKE_KEY = /url|href|src|image|audio|link|thumbnail/i;

// Source record pages must live on one of the three ZTI databases (academic integrity, AC-36),
// or on archive.org for the printed Rumanian Folk Music volumes (site 'rfm', data/rfm.json,
// docs/PRINT-SOURCES.md), whose records link to the exact scanned page.
const SOURCE_HOSTS = new Set(['bartok-nepzene.zti.hu', 'systems.zti.hu', 'sys.zti.hu', 'bartok-gyujtesek.zti.hu', 'archive.org']);
const VILLAGE_STATUSES = new Set(['existing', 'renamed', 'merged', 'abandoned', 'unknown']);
const TRIP_MAX_GAP_DAYS = 10;

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    file: resolve(REPO_ROOT, 'data', 'songs.json'),
    schema: resolve(REPO_ROOT, 'data', 'schema', 'song.schema.json'),
    facets: resolve(REPO_ROOT, 'data', 'facets.json'),
    gazetteer: resolve(REPO_ROOT, 'data', 'gazetteer.json'),
    journeys: resolve(REPO_ROOT, 'data', 'journeys.json'),
    journeySchema: resolve(REPO_ROOT, 'data', 'schema', 'journey.schema.json'),
    villages: resolve(REPO_ROOT, 'data', 'villages.json'),
    report: null,
    strict: false,
    help: false,
  };
  const explicit = new Set();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    explicit.add(a.split('=')[0]);
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`Missing value for ${a}`);
      return v;
    };
    if (a === '--file' || a === '-f') args.file = resolve(next());
    else if (a.startsWith('--file=')) args.file = resolve(a.slice(7));
    else if (a === '--schema' || a === '-s') args.schema = resolve(next());
    else if (a.startsWith('--schema=')) args.schema = resolve(a.slice(9));
    else if (a === '--facets') args.facets = resolve(next());
    else if (a === '--gazetteer') args.gazetteer = resolve(next());
    else if (a === '--journeys') args.journeys = resolve(next());
    else if (a === '--journey-schema') args.journeySchema = resolve(next());
    else if (a === '--villages') args.villages = resolve(next());
    else if (a === '--report' || a === '-r') args.report = resolve(next());
    else if (a === '--strict') args.strict = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${a}`);
  }
  args.explicit = explicit;
  return args;
}

function usage() {
  return [
    'Usage: node qa/checks/data-gates.mjs [--file data/songs.json] [--schema data/schema/song.schema.json]',
    '                                   [--facets data/facets.json] [--gazetteer data/gazetteer.json]',
    '                                   [--journeys data/journeys.json] [--journey-schema data/schema/journey.schema.json]',
    '                                   [--villages data/villages.json] [--report out.json] [--strict]',
    '',
    'Exit codes: 0 all blocking gates passed, 1 a blocking gate failed (or a warning under --strict),',
    '            2 usage or input error.',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isNil = (v) => v === null || v === undefined;

function rel(p) {
  return p.startsWith(REPO_ROOT) ? p.slice(REPO_ROOT.length + 1) : p;
}

function loadJson(path, label) {
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch (e) {
    throw new Error(`Cannot read ${label} at ${rel(path)}: ${e.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`${label} at ${rel(path)} is not valid JSON: ${e.message}`);
  }
}

/** Accept a bare array, or an object wrapping it under records/songs/items/data. */
function extractRecords(doc) {
  if (Array.isArray(doc)) return doc;
  if (doc && typeof doc === 'object') {
    for (const k of ['records', 'songs', 'items', 'data']) {
      if (Array.isArray(doc[k])) return doc[k];
    }
  }
  throw new Error('Input JSON must be an array of records or an object with a records/songs/items/data array');
}

// Tolerant accessors while the schema settles.
const loc = (r) => r?.location ?? r?.place ?? null;
const get = {
  id: (r) => r?.id,
  site: (r) => r?.source?.site ?? r?.site ?? null,
  siteRecordId: (r) => r?.source?.siteRecordId ?? r?.source?.siteId ?? r?.source?.number ?? r?.source?.referenceCode ?? r?.source?.recordId ?? null,
  siteIdStrict: (r) => r?.source?.siteId ?? r?.source?.siteRecordId ?? null,
  sourceUrl: (r) => r?.source?.url ?? r?.sourceUrl ?? null,
  country: (r) => loc(r)?.country ?? null,
  county: (r) => loc(r)?.county ?? null,
  countyHistorical: (r) => loc(r)?.countyHistorical ?? null,
  village: (r) => loc(r)?.village ?? loc(r)?.villageHistorical ?? null,
  lat: (r) => loc(r)?.lat ?? null,
  lng: (r) => loc(r)?.lng ?? null,
  year: (r) => r?.collected?.year ?? r?.year ?? null,
  genre: (r) => (r?.genre === undefined ? null : r.genre),
  title: (r) => r?.title ?? r?.incipit ?? null,
};

function label(r, i) {
  const id = get.id(r);
  return isNil(id) ? `#${i}` : String(id);
}

/** Normalise a string for duplicate comparison: NFD, strip diacritics, casefold, collapse spaces. */
function norm(s) {
  if (isNil(s)) return '';
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const HTML_TAG = /<\/?[a-zA-Z][^<>]*>/;
const HTML_ENTITY = /&(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);/;

/** Walk every string in a record except URL-like keys and the `raw` subtree. */
function* stringFields(value, path = []) {
  if (typeof value === 'string') {
    yield { path: path.join('.'), value };
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) yield* stringFields(value[i], [...path, String(i)]);
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if ((k === 'rawFields' || k === 'raw') && path.length === 0) continue;
      if (URL_LIKE_KEY.test(k)) continue;
      yield* stringFields(v, [...path, k]);
    }
  }
}

/** journeys.json is { _meta, journeys: [] }; also accept a bare array or { trips: [] }. */
function journeyList(doc) {
  if (Array.isArray(doc)) return doc;
  if (doc && typeof doc === 'object') {
    for (const k of ['journeys', 'trips']) if (Array.isArray(doc[k])) return doc[k];
  }
  return [];
}

/**
 * Compare two ISO dates that may be YYYY, YYYY-MM or YYYY-MM-DD at their shared precision.
 * Returns -1/0/1, or 0 when either side is missing (nothing to assert).
 */
function cmpIsoPrefix(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return 0;
  const n = Math.min(a.length, b.length);
  const x = a.slice(0, n); const y = b.slice(0, n);
  return x < y ? -1 : x > y ? 1 : 0;
}

/** Whole days from a to b when both are day-precise (YYYY-MM-DD); null otherwise. */
function daysBetween(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== 10 || b.length !== 10) return null;
  const ta = Date.parse(`${a}T00:00:00Z`); const tb = Date.parse(`${b}T00:00:00Z`);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return null;
  return Math.round((tb - ta) / 86400000);
}

// ---------------------------------------------------------------------------
// Gate framework
// ---------------------------------------------------------------------------

/**
 * A gate result: { name, blocking, status: 'pass'|'warn'|'fail'|'skip',
 *                  metric, threshold, details: string[] }
 */
function gate(name, blocking, threshold, fn) {
  return { name, blocking, threshold, fn };
}

async function loadAjv() {
  const candidates = [
    resolve(REPO_ROOT, 'scraper', 'node_modules', 'ajv', 'dist', '2020.js'),
    resolve(REPO_ROOT, 'scraper', 'node_modules', 'ajv', 'dist', 'ajv2020.js'),
  ];
  for (const c of candidates) {
    if (existsSync(c)) {
      const mod = await import(pathToFileURL(c).href);
      const Ajv = mod.default?.default ?? mod.default ?? mod.Ajv2020 ?? mod;
      let addFormats = null;
      const fmtPath = resolve(REPO_ROOT, 'scraper', 'node_modules', 'ajv-formats', 'dist', 'index.js');
      if (existsSync(fmtPath)) {
        const f = await import(pathToFileURL(fmtPath).href);
        addFormats = f.default?.default ?? f.default ?? f;
      }
      return { Ajv, addFormats, path: c };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Gates
// ---------------------------------------------------------------------------

const GATES = [
  gate('schema-valid', true, '100% of records validate against song.schema.json', async (records, ctx) => {
    if (!ctx.schema) {
      return { status: 'skip', metric: 'schema file missing', details: [
        `Schema not found at ${rel(ctx.schemaPath)}; gate skipped. It becomes blocking once the schema exists.`,
      ] };
    }
    const ajv = await loadAjv();
    if (!ajv) {
      return { status: 'skip', metric: 'ajv missing', details: [
        'ajv not found under scraper/node_modules (expected scraper/node_modules/ajv/dist/2020.js).',
        'Run `npm i` inside scraper/ (ajv must be a dependency there). Gate skipped.',
      ] };
    }
    let validate;
    try {
      const inst = new ajv.Ajv({ allErrors: true, strict: false, allowUnionTypes: true });
      if (ajv.addFormats) ajv.addFormats(inst);
      validate = inst.compile(ctx.schema);
    } catch (e) {
      return { status: 'fail', metric: 'schema does not compile', details: [String(e.message)] };
    }
    const details = [];
    let bad = 0;
    records.forEach((r, i) => {
      if (!validate(r)) {
        bad++;
        const first = (validate.errors ?? []).slice(0, 3)
          .map((e) => `${e.instancePath || '/'} ${e.message}`)
          .join('; ');
        details.push(`${label(r, i)}: ${first}`);
      }
    });
    const pct = records.length ? ((records.length - bad) / records.length) * 100 : 100;
    return { status: bad === 0 ? 'pass' : 'fail', metric: `${pct.toFixed(2)}% valid (${bad} invalid)`, details };
  }),

  gate('id-unique', true, '0 duplicate or missing ids', (records) => {
    const seen = new Map();
    const details = [];
    let missing = 0;
    records.forEach((r, i) => {
      const id = get.id(r);
      if (isNil(id) || String(id).trim() === '') { missing++; details.push(`#${i}: missing id`); return; }
      const k = String(id);
      if (seen.has(k)) details.push(`${k}: duplicate of #${seen.get(k)} (at #${i})`);
      else seen.set(k, i);
    });
    const dups = details.length - missing;
    return { status: details.length ? 'fail' : 'pass', metric: `${dups} duplicate, ${missing} missing`, details };
  }),

  gate('source-url', true, 'every record has an absolute http(s) source url on a zti.hu source host (or archive.org for site rfm) and a non-empty source.siteId', (records) => {
    const details = [];
    records.forEach((r, i) => {
      const u = get.sourceUrl(r);
      let host = null;
      if (typeof u !== 'string' || !/^https?:\/\/\S+$/.test(u)) {
        details.push(`${label(r, i)}: url ${JSON.stringify(u)}`);
      } else {
        try { host = new URL(u).hostname.toLowerCase(); } catch { host = null; }
        if (!host || !SOURCE_HOSTS.has(host)) details.push(`${label(r, i)}: host ${JSON.stringify(host)} not in ${[...SOURCE_HOSTS].join(', ')}`);
      }
      const sid = get.siteIdStrict(r);
      if (typeof sid !== 'string' || sid.trim() === '') details.push(`${label(r, i)}: source.siteId ${JSON.stringify(sid)} is empty`);
    });
    const badRecords = new Set(details.map((d) => d.split(':')[0])).size;
    return { status: details.length ? 'fail' : 'pass', metric: `${records.length - badRecords}/${records.length} records ok (${details.length} problem(s))`, details };
  }),

  gate('county-resolved', true, `>= ${COUNTY_RESOLUTION_MIN * 100}% of present-day-Romania records (country RO, or historical county mapped to RO by the gazetteer) resolve to a modern county; other records informational`, (records, ctx) => {
    const details = [];
    const hasCounty = (r) => { const c = get.county(r); return typeof c === 'string' && c.trim() !== ''; };
    const inScope = (r) => {
      const country = get.country(r);
      if (country === 'RO') return true;
      if (!isNil(country)) return false;
      const ch = get.countyHistorical(r);
      return !isNil(ch) && ctx.roHistoricalCounties.has(norm(ch));
    };
    let scoped = 0; let ok = 0;
    const outCountry = new Map(); // country -> {n, unresolved}
    records.forEach((r, i) => {
      if (inScope(r)) {
        scoped++;
        if (hasCounty(r)) ok++;
        else details.push(`${label(r, i)}: village=${JSON.stringify(get.village(r))} countyHistorical=${JSON.stringify(get.countyHistorical(r))} raw=${JSON.stringify(loc(r)?.raw ?? null)}`);
      } else {
        const c = get.country(r) ?? 'null';
        const e = outCountry.get(c) ?? { n: 0, unresolved: 0 };
        e.n++; if (!hasCounty(r)) e.unresolved++;
        outCountry.set(c, e);
      }
    });
    const ratio = scoped ? ok / scoped : 1;
    const breakdown = [...outCountry].sort((a, b) => b[1].n - a[1].n)
      .map(([c, e]) => `${c}=${e.n}${e.unresolved ? ` (${e.unresolved} without county)` : ''}`).join(' ');
    const info = `out of scope (informational): ${breakdown || 'none'}${ctx.roHistoricalCounties.size ? '' : '; no gazetteer loaded, scope = country RO only'}`;
    return {
      status: ratio >= COUNTY_RESOLUTION_MIN ? (details.length ? 'warn' : 'pass') : 'fail',
      metric: `${(ratio * 100).toFixed(2)}% of ${scoped} in-scope records resolved (${details.length} unresolved); ${info}`,
      details,
    };
  }),

  gate('coords-in-romania', true, `country RO: lat ${ROMANIA_BBOX.latMin}-${ROMANIA_BBOX.latMax}, lng ${ROMANIA_BBOX.lngMin}-${ROMANIA_BBOX.lngMax}, or both null; other countries exempt`, (records) => {
    const details = [];   // blocking
    const warnings = [];  // non-blocking: null-country records outside the box
    let inBoxCount = 0;
    let nullCount = 0;
    let foreign = 0;
    records.forEach((r, i) => {
      const lat = get.lat(r);
      const lng = get.lng(r);
      const country = get.country(r);
      if (isNil(lat) && isNil(lng)) { nullCount++; return; }
      if (isNil(lat) !== isNil(lng)) { details.push(`${label(r, i)}: only one of lat/lng set (${lat}, ${lng})`); return; }
      if (!isNum(lat) || !isNum(lng)) { details.push(`${label(r, i)}: non-numeric coordinates (${lat}, ${lng})`); return; }
      if (!isNil(country) && country !== 'RO') { foreign++; return; }
      const inBox = lat >= ROMANIA_BBOX.latMin && lat <= ROMANIA_BBOX.latMax
        && lng >= ROMANIA_BBOX.lngMin && lng <= ROMANIA_BBOX.lngMax;
      if (inBox) inBoxCount++;
      else if (country === 'RO') details.push(`${label(r, i)}: (${lat}, ${lng}) outside Romania bbox`);
      else warnings.push(`${label(r, i)}: country null, (${lat}, ${lng}) outside Romania bbox`);
    });
    return {
      status: details.length ? 'fail' : (warnings.length ? 'warn' : 'pass'),
      metric: `${inBoxCount} in bbox, ${foreign} non-RO (exempt), ${nullCount} null, ${details.length} bad, ${warnings.length} suspicious`,
      details: [...details, ...warnings],
    };
  }),

  gate('year-range', true, 'block: collected.year outside the schema range; warn: Bartok-collected records outside 1904-1918 (his own field years)', (records, ctx) => {
    const yr = ctx.schema?.properties?.collected?.properties?.year ?? {};
    const min = Number.isInteger(yr.minimum) ? yr.minimum : SCHEMA_YEARS_FALLBACK.min;
    const max = Number.isInteger(yr.maximum) ? yr.maximum : SCHEMA_YEARS_FALLBACK.max;
    const details = [];   // blocking
    const warnings = [];  // Bartok field-years
    let nulls = 0; let bartokTotal = 0; let bartokNull = 0; let bartokOut = 0;
    records.forEach((r, i) => {
      const y = get.year(r);
      const isBartok = BARTOK_RE.test(String(r?.collector ?? ''));
      if (isBartok) bartokTotal++;
      if (isNil(y)) { nulls++; if (isBartok) bartokNull++; return; }
      if (!Number.isInteger(y) || y < min || y > max) { details.push(`${label(r, i)}: year ${JSON.stringify(y)} outside schema range ${min}-${max} (raw ${JSON.stringify(r?.collected?.raw ?? null)})`); return; }
      if (isBartok && (y < BARTOK_YEARS.min || y > BARTOK_YEARS.max)) { bartokOut++; warnings.push(`${label(r, i)}: Bartok-collected, year ${y} outside ${BARTOK_YEARS.min}-${BARTOK_YEARS.max}`); }
    });
    const all = [...details, ...warnings];
    if (bartokNull) all.push(`${bartokNull} Bartok-collected record(s) with null year`);
    return {
      status: details.length ? 'fail' : ((bartokOut || bartokNull) ? 'warn' : 'pass'),
      metric: `${details.length} outside schema range ${min}-${max} (blocking); Bartok: ${bartokOut} of ${bartokTotal} outside ${BARTOK_YEARS.min}-${BARTOK_YEARS.max}, ${bartokNull} null; all records: ${nulls} null year`,
      details: all,
    };
  }),

  gate('genre-vocab', true, 'every genre is in the vocabulary', (records, ctx) => {
    const vocab = ctx.genreVocab;
    const nullAllowed = vocab.has(null);
    const details = [];
    const unknown = new Map();
    let nulls = 0;
    let others = 0;
    records.forEach((r, i) => {
      const g = get.genre(r);
      if (g === null && nullAllowed) { nulls++; return; }
      if (g === 'other') others++;
      if (!vocab.has(g)) {
        const k = JSON.stringify(g);
        if (!unknown.has(k)) unknown.set(k, []);
        unknown.get(k).push(label(r, i));
      }
    });
    for (const [g, ids] of unknown) details.push(`genre ${g} (${ids.length}): ${ids.slice(0, 5).join(', ')}${ids.length > 5 ? ', ...' : ''}`);
    const bad = [...unknown.values()].reduce((n, a) => n + a.length, 0);
    const otherRatio = records.length ? others / records.length : 0;
    if (otherRatio > 0.25) details.push(`${others} record(s) (${(otherRatio * 100).toFixed(1)}%) mapped to "other": review the genre mapping table`);
    return {
      status: bad ? 'fail' : (otherRatio > 0.25 ? 'warn' : 'pass'),
      metric: `${bad} outside vocabulary, ${nulls} null, ${others} "other" (${ctx.genreVocabSource})`,
      details,
    };
  }),

  gate('no-html', true, 'no HTML tags or entities in text fields (rawFields and url-like fields excluded)', (records) => {
    const details = [];
    records.forEach((r, i) => {
      for (const { path, value } of stringFields(r)) {
        const tag = value.match(HTML_TAG);
        const ent = value.match(HTML_ENTITY);
        if (tag || ent) details.push(`${label(r, i)}: ${path} contains ${JSON.stringify((tag ?? ent)[0])}`);
      }
    });
    return { status: details.length ? 'fail' : 'pass', metric: `${details.length} offending field(s)`, details };
  }),

  gate('dup-site-record', true, 'no site record id scraped twice', (records) => {
    const seen = new Map();
    const details = [];
    records.forEach((r, i) => {
      const site = get.site(r);
      const rid = get.siteRecordId(r);
      if (isNil(site) || isNil(rid)) return; // source-url / schema gates cover missing source blocks
      const k = `${site}::${norm(rid)}`;
      if (seen.has(k)) details.push(`${site} ${rid}: ${label(r, i)} duplicates ${seen.get(k)}`);
      else seen.set(k, label(r, i));
    });
    return { status: details.length ? 'fail' : 'pass', metric: `${details.length} duplicate site record(s)`, details };
  }),

  gate('dup-cross-site', false, 'report same title+village+year appearing under different sites', (records) => {
    const groups = new Map();
    records.forEach((r, i) => {
      const t = norm(get.title(r));
      const v = norm(get.village(r));
      const y = get.year(r);
      if (!t || !v || isNil(y)) return;
      const k = `${t}|${v}|${y}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push({ id: label(r, i), site: get.site(r) ?? '?' });
    });
    const details = [];
    let sameSite = 0;
    for (const [k, list] of groups) {
      if (list.length < 2) continue;
      const sites = new Set(list.map((x) => x.site));
      if (sites.size > 1) details.push(`${k}: ${list.map((x) => `${x.id}@${x.site}`).join(', ')}`);
      else sameSite++;
    }
    const all = [...details];
    if (sameSite) all.push(`${sameSite} title+village+year group(s) repeated within a single site (review; may be legitimate variants)`);
    return {
      status: details.length || sameSite ? 'warn' : 'pass',
      metric: `${details.length} cross-site group(s), ${sameSite} same-site group(s)`,
      details: all,
    };
  }),

  gate('partial-records', false, 'informational: records with rawFields._partial (listing row only; record page not fetched) per site', (records) => {
    const total = new Map(); const partial = new Map();
    records.forEach((r) => {
      const site = get.site(r) ?? '?';
      total.set(site, (total.get(site) ?? 0) + 1);
      const p = r?.rawFields?._partial;
      if (!isNil(p) && p !== false && p !== '') partial.set(site, (partial.get(site) ?? 0) + 1);
    });
    const n = [...partial.values()].reduce((a, b) => a + b, 0);
    const details = [...total].sort((a, b) => b[1] - a[1]).map(([site, t]) => {
      const p = partial.get(site) ?? 0;
      return `${site}: ${p}/${t} partial (${(t ? (p / t) * 100 : 0).toFixed(1)}%), ${t - p} full`;
    });
    return { status: n ? 'warn' : 'pass', metric: `${n}/${records.length} partial (${records.length ? ((n / records.length) * 100).toFixed(1) : '0.0'}%)`, details };
  }),

  gate('journeys-valid', true, 'journeys.json validates against journey.schema.json; song ids exist (or are alternates of a merged record); route stops in date order; date-gap routes respect derivation.gapDays', async (records, ctx) => {
    if (!ctx.journeys) {
      return { status: 'skip', metric: ctx.crossFileNote ? 'skipped in sample mode' : 'data/journeys.json missing', details: [ctx.crossFileNote ?? `${rel(ctx.journeysPath)} not found; gate skipped until the journey mapper data exists.`] };
    }
    const journeys = journeyList(ctx.journeys);
    const details = [];   // blocking
    const warnings = [];  // non-blocking consistency notes
    // 1. schema
    if (!ctx.journeySchema) {
      warnings.push(`journey schema not found at ${rel(ctx.journeySchemaPath)}; structural validation skipped`);
    } else {
      const ajv = await loadAjv();
      if (!ajv) warnings.push('ajv not found under scraper/node_modules; structural validation skipped');
      else {
        try {
          const inst = new ajv.Ajv({ allErrors: true, strict: false, allowUnionTypes: true });
          if (ajv.addFormats) ajv.addFormats(inst);
          const validate = inst.compile(ctx.journeySchema);
          journeys.forEach((t, i) => {
            if (!validate(t)) {
              const first = (validate.errors ?? []).slice(0, 3).map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ');
              details.push(`${t?.id ?? `#${i}`}: schema: ${first}`);
            }
          });
        } catch (e) { details.push(`journey schema does not compile: ${e.message}`); }
      }
    }
    // 2. referential integrity
    const ids = new Set(records.map((r) => get.id(r)).filter((x) => !isNil(x)).map(String));
    const altIds = new Set();
    for (const r of records) for (const a of (Array.isArray(r?.source?.alternates) ? r.source.alternates : [])) if (!isNil(a?.id)) altIds.add(String(a.id));
    const known = (id) => ids.has(String(id)) || altIds.has(String(id));
    const seen = new Set();
    let stops = 0; let viaAlt = 0;
    journeys.forEach((t, i) => {
      const tid = isNil(t?.id) ? `#${i}` : String(t.id);
      if (seen.has(tid)) details.push(`${tid}: duplicate journey id`);
      seen.add(tid);
      const tripIds = new Set((Array.isArray(t?.songIds) ? t.songIds : []).map(String));
      for (const sid of tripIds) {
        if (!known(sid)) details.push(`${tid}: songIds has unknown record ${JSON.stringify(sid)}`);
        else if (!ids.has(sid)) viaAlt++;
      }
      const list = Array.isArray(t?.stops) ? t.stops : [];
      list.forEach((st, si) => {
        stops++;
        const label_ = `${tid} stop ${st?.seq ?? si + 1}`;
        for (const sid of (Array.isArray(st?.songIds) ? st.songIds : [])) {
          if (!known(sid)) details.push(`${label_}: unknown record ${JSON.stringify(sid)}`);
          else if (!tripIds.has(String(sid))) details.push(`${label_}: record ${sid} not in the journey's songIds`);
        }
        if (Number.isInteger(st?.recordCount) && Array.isArray(st?.songIds) && st.recordCount !== st.songIds.length) warnings.push(`${label_}: recordCount ${st.recordCount} != songIds.length ${st.songIds.length}`);
      });
      if (Number.isInteger(t?.recordCount) && t.recordCount !== tripIds.size) warnings.push(`${tid}: recordCount ${t.recordCount} != songIds.length ${tripIds.size}`);
      // 3. dates: journey span, route stop order, gap rule
      if (cmpIsoPrefix(t?.dateStart, t?.dateEnd) > 0) details.push(`${tid}: dateStart ${t.dateStart} after dateEnd ${t.dateEnd}`);
      if (t?.kind === 'route') {
        let prevDep = null; let prevArr = null; let prevSeq = 0;
        const gapDays = Number.isInteger(t?.derivation?.gapDays) ? t.derivation.gapDays : TRIP_MAX_GAP_DAYS;
        const gapRule = t?.derivedFrom === 'date-gap';
        list.forEach((st, si) => {
          const label_ = `${tid} stop ${st?.seq ?? si + 1}`;
          if (Number.isInteger(st?.seq) && st.seq <= prevSeq) details.push(`${label_}: seq not increasing`);
          prevSeq = st?.seq ?? prevSeq;
          if (cmpIsoPrefix(st?.arrival, st?.departure) > 0) details.push(`${label_}: departure ${st.departure} before arrival ${st.arrival}`);
          if (prevArr !== null && cmpIsoPrefix(prevArr, st?.arrival) > 0) details.push(`${label_}: arrival ${st.arrival} before previous stop's arrival ${prevArr} (route stops must be ordered in time)`);
          if (gapRule && prevDep !== null) {
            const gap = daysBetween(prevDep, st?.arrival);
            if (gap !== null && gap > gapDays) details.push(`${label_}: ${gap} days after previous stop, more than derivation.gapDays ${gapDays} (should be a new trip)`);
          }
          if (!isNil(st?.departure)) prevDep = st.departure;
          if (!isNil(st?.arrival)) prevArr = st.arrival;
        });
      }
    });
    // 4. file order (schema description: sorted by dateStart then id)
    for (let i = 1; i < journeys.length; i++) {
      const a = journeys[i - 1]; const b = journeys[i];
      const c = cmpIsoPrefix(a?.dateStart, b?.dateStart);
      if (c > 0 || (c === 0 && String(a?.id) > String(b?.id))) { warnings.push(`file order: ${b?.id} should come before ${a?.id} (sorted by dateStart then id)`); break; }
    }
    return {
      status: details.length ? 'fail' : (warnings.length ? 'warn' : 'pass'),
      metric: `${journeys.length} journey(s), ${stops} stop(s), ${viaAlt} id(s) resolved via alternates, ${details.length} problem(s), ${warnings.length} note(s)`,
      details: [...details, ...warnings.map((w) => `note: ${w}`)],
    };
  }),

  gate('villages-valid', true, 'villages.json: status in vocabulary, names non-empty, every journey stop place has an entry', (records, ctx) => {
    if (!ctx.villages) {
      return { status: 'skip', metric: ctx.crossFileNote ? 'skipped in sample mode' : 'data/villages.json missing', details: [ctx.crossFileNote ?? `${rel(ctx.villagesPath)} not found; gate skipped until the journey mapper data exists.`] };
    }
    const doc = ctx.villages;
    const container = Array.isArray(doc) ? doc
      : (doc && typeof doc === 'object' && doc.villages !== undefined) ? doc.villages : doc;
    const list = Array.isArray(container) ? container
      : Object.entries(container ?? {}).filter(([k]) => !k.startsWith('_')).map(([id, v]) => ({ id, ...(v ?? {}) }));
    const metaStatuses = doc && !Array.isArray(doc) && doc._meta?.statusValues && typeof doc._meta.statusValues === 'object'
      ? new Set(Object.keys(doc._meta.statusValues)) : null;
    const statuses = metaStatuses ?? VILLAGE_STATUSES;
    const details = [];
    const known = new Set();
    list.forEach((v, i) => {
      const id = isNil(v?.id) ? `#${i}` : String(v.id);
      known.add(id);
      if (!statuses.has(v?.status)) details.push(`${id}: status ${JSON.stringify(v?.status)} not in ${[...statuses].join(', ')}`);
      const hist = v?.nameHistorical ?? v?.historicalName ?? v?.villageHistorical;
      const mod = v?.name ?? v?.modernName ?? v?.village;
      if (typeof hist !== 'string' || !hist.trim()) details.push(`${id}: historical name empty`);
      if (typeof mod !== 'string' || !mod.trim()) details.push(`${id}: modern name empty`);
    });
    for (const st of VILLAGE_STATUSES) if (!statuses.has(st)) details.push(`_meta.statusValues lacks "${st}" (AC-41 vocabulary)`);
    if (ctx.journeys) {
      const missing = new Set();
      for (const t of journeyList(ctx.journeys)) for (const st of (Array.isArray(t?.stops) ? t.stops : [])) {
        const pid = st?.placeId;
        if (isNil(pid) || st?.locationConfidence === 'unresolved' || /\/unresolved\//.test(String(pid))) continue;
        if (!known.has(String(pid))) missing.add(String(pid));
      }
      if (missing.size) details.push(`${missing.size} resolved journey stop place(s) missing from villages.json (unresolved stops exempt): ${[...missing].slice(0, 5).join(', ')}${missing.size > 5 ? ', ...' : ''}`);
    }
    return { status: details.length ? 'fail' : 'pass', metric: `${list.length} village(s), ${details.length} problem(s)`, details };
  }),
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function loadGenreVocab(schema, facetsPath) {
  // 1. schema enum
  const enumFromSchema = schema?.properties?.genre?.enum
    ?? schema?.$defs?.genre?.enum
    ?? schema?.definitions?.genre?.enum;
  if (Array.isArray(enumFromSchema) && enumFromSchema.length) {
    return { vocab: new Set(enumFromSchema), source: 'schema enum' };
  }
  // schema without an enum but with a type: nothing to check against
  // 2. facets.json
  if (existsSync(facetsPath)) {
    try {
      const f = loadJson(facetsPath, 'facets');
      const list = Array.isArray(f?.genre) ? f.genre
        : Array.isArray(f?.genres) ? f.genres
        : Array.isArray(f?.facets?.genre) ? f.facets.genre : null;
      if (list && list.length) {
        const values = list.map((x) => (typeof x === 'string' ? x : x?.value ?? x?.key ?? x?.id)).filter(Boolean);
        if (values.length) return { vocab: new Set(values), source: rel(facetsPath) };
      }
    } catch { /* fall through */ }
  }
  // 3. built-in default
  return { vocab: new Set(DEFAULT_GENRE_VOCAB), source: 'built-in default list (schema enum and facets.json unavailable)' };
}

const ICON = { pass: 'PASS', warn: 'WARN', fail: 'FAIL', skip: 'SKIP' };

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    console.error(usage());
    return 2;
  }
  if (args.help) { console.log(usage()); return 0; }

  let records;
  try {
    records = extractRecords(loadJson(args.file, 'songs file'));
  } catch (e) {
    console.error(`ERROR: ${e.message}`);
    return 2;
  }

  const ctx = {
    schemaPath: args.schema, schema: null, genreVocab: null, genreVocabSource: '',
    journeysPath: args.journeys, journeys: null, villagesPath: args.villages, villages: null,
    journeySchemaPath: args.journeySchema, journeySchema: null,
    roHistoricalCounties: new Set(),
  };
  if (existsSync(args.journeySchema)) {
    try { ctx.journeySchema = loadJson(args.journeySchema, 'journey schema'); } catch (e) { console.error(`ERROR: ${e.message}`); return 2; }
  }
  if (existsSync(args.gazetteer)) {
    try {
      const g = loadJson(args.gazetteer, 'gazetteer');
      for (const c of (Array.isArray(g?.counties) ? g.counties : [])) {
        if (c?.country !== 'RO') continue;
        for (const h of (Array.isArray(c?.historical) ? c.historical : [])) ctx.roHistoricalCounties.add(norm(h));
        if (typeof c?.name === 'string') ctx.roHistoricalCounties.add(norm(c.name));
      }
    } catch (e) { console.error(`ERROR: ${e.message}`); return 2; }
  }
  // journeys.json and villages.json are cross-file checks against the full songs.json; when the
  // songs file is a sample (--file) they only run if --journeys / --villages are passed explicitly.
  const sampleMode = (args.explicit.has('--file') || args.explicit.has('-f'));
  ctx.crossFileNote = null;
  for (const [key, flag, path] of [['journeys', '--journeys', args.journeys], ['villages', '--villages', args.villages]]) {
    if (sampleMode && !args.explicit.has(flag)) { ctx.crossFileNote = `--file given without ${flag}: cross-file gate skipped (it would compare ${key}.json against a sample)`; continue; }
    if (existsSync(path)) {
      try { ctx[key] = loadJson(path, key); } catch (e) { console.error(`ERROR: ${e.message}`); return 2; }
    }
  }
  const preamble = [];
  if (existsSync(args.schema)) {
    try {
      ctx.schema = loadJson(args.schema, 'schema');
    } catch (e) {
      console.error(`ERROR: ${e.message}`);
      return 2;
    }
  } else {
    preamble.push(`WARN  schema file not found at ${rel(args.schema)}; the schema-valid gate will be skipped.`);
  }
  const gv = loadGenreVocab(ctx.schema, args.facets);
  ctx.genreVocab = gv.vocab;
  ctx.genreVocabSource = gv.source;
  if (gv.source.startsWith('built-in')) preamble.push(`WARN  genre vocabulary: ${gv.source}.`);

  console.log(`Data gates: ${rel(args.file)} (${records.length} record${records.length === 1 ? '' : 's'})`);
  console.log(`Schema:     ${ctx.schema ? rel(args.schema) : '(none)'}`);
  console.log(`Genre vocab: ${gv.source} (${gv.vocab.size} values)`);
  console.log(`Scope:      country RO plus ${ctx.roHistoricalCounties.size} historical county names mapped to RO${ctx.roHistoricalCounties.size ? ` (${rel(args.gazetteer)})` : ' (gazetteer not found)'}`);
  for (const p of preamble) console.log(p);
  console.log('');

  const results = [];
  for (const g of GATES) {
    let res;
    try {
      res = await g.fn(records, ctx);
    } catch (e) {
      res = { status: 'fail', metric: 'gate crashed', details: [String(e.stack ?? e.message)] };
    }
    results.push({ name: g.name, blocking: g.blocking, threshold: g.threshold, ...res, details: res.details ?? [] });
  }

  const nameWidth = Math.max(...results.map((r) => r.name.length));
  for (const r of results) {
    const kind = r.blocking ? 'block' : 'warn ';
    console.log(`${ICON[r.status]}  ${r.name.padEnd(nameWidth)}  [${kind}]  ${r.metric}`);
    console.log(`      threshold: ${r.threshold}`);
    const shown = r.details.slice(0, MAX_LISTED);
    for (const d of shown) console.log(`      - ${d}`);
    if (r.details.length > shown.length) console.log(`      ... ${r.details.length - shown.length} more (see --report)`);
  }

  const failed = results.filter((r) => r.status === 'fail' && r.blocking);
  const warned = results.filter((r) => r.status === 'warn' || r.status === 'skip' || (r.status === 'fail' && !r.blocking));
  const passed = results.filter((r) => r.status === 'pass');
  console.log('');
  console.log(`Summary: ${passed.length} pass, ${warned.length} warn/skip, ${failed.length} blocking fail (of ${results.length} gates)`);

  if (args.report) {
    mkdirSync(dirname(args.report), { recursive: true });
    const report = {
      generatedAt: new Date().toISOString(),
      file: rel(args.file),
      schema: ctx.schema ? rel(args.schema) : null,
      records: records.length,
      gates: results,
      ok: failed.length === 0 && (!args.strict || warned.length === 0),
    };
    writeFileSync(args.report, JSON.stringify(report, null, 2) + '\n');
    console.log(`Report written to ${rel(args.report)}`);
  }

  if (failed.length) {
    console.log(`RESULT: FAIL (${failed.map((r) => r.name).join(', ')})`);
    return 1;
  }
  if (args.strict && warned.length) {
    console.log(`RESULT: FAIL under --strict (${warned.map((r) => r.name).join(', ')})`);
    return 1;
  }
  console.log('RESULT: OK');
  return 0;
}

process.exitCode = await main();
