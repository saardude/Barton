#!/usr/bin/env node
// Parses the curated index of Bartok's collecting trips on bartok-gyujtesek.zti.hu
// (/en/browse: 101 entries grouped by year, each "date expression. place (count)") into
// data/collections-gyuj.json, the primary source for data/journeys.json.
//
//   node geo/parse-gyuj-collections.mjs             # uses the scraper's cached page if present, else fetches (cached under geo/cache/gyuj)
//   node geo/parse-gyuj-collections.mjs --fetch     # force a live fetch (1 request, cached)
//   node geo/parse-gyuj-collections.mjs --no-wikidata  # skip the Wikidata lookup of non-Romanian localities
//
// Labels are kept verbatim. Dates are parsed into start/end with a precision and the
// qualifiers the site uses ("Beginning of", "End of", "Middle of", "After"). Places are
// resolved through data/gazetteer.json where a locality name matches; regions and
// counties come from a small built-in table with approximate centres. Nothing is guessed:
// an unresolved place keeps its text and null coordinates.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY && !process.env.BARTON_NO_REEXEC) {
  const r = spawnSync(process.execPath, process.argv.slice(1), { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1', BARTON_NO_REEXEC: '1' } });
  process.exit(r.status ?? 1);
}

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const INDEX_URL = 'https://bartok-gyujtesek.zti.hu/en/browse';
const SCRAPER_CACHE = join(ROOT, 'scraper', 'cache', 'bartok-gyujtesek.zti.hu');
const GEO_CACHE = join(HERE, 'cache', 'gyuj');
const GAZETTEER = join(ROOT, 'data', 'gazetteer.json');
const OUT = join(ROOT, 'data', 'collections-gyuj.json');
const USER_AGENT = 'BartonViewer/0.1 (journey mapper; tsaar@maltandbrew.com)';

export function fold(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
const slug = (s) => fold(s).replace(/ /g, '-');
function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]));
  return v;
}

// ------------------------------------------------------------------ input page

async function loadIndexHtml(forceFetch) {
  if (!forceFetch && existsSync(SCRAPER_CACHE)) {
    // The scraper stores <sha>.html with a <sha>.json sidecar carrying the url.
    const { readdirSync } = await import('node:fs');
    for (const f of readdirSync(SCRAPER_CACHE)) {
      if (!f.endsWith('.json')) continue;
      try {
        const side = JSON.parse(readFileSync(join(SCRAPER_CACHE, f), 'utf8'));
        if (/^https:\/\/bartok-gyujtesek\.zti\.hu\/en\/browse\/?$/.test(side.url || side.finalUrl || '')) {
          return { html: readFileSync(join(SCRAPER_CACHE, f.replace(/\.json$/, '.html')), 'utf8'), from: 'scraper-cache', fetchedAt: side.fetchedAt || null };
        }
      } catch { /* ignore unreadable sidecars */ }
    }
  }
  mkdirSync(GEO_CACHE, { recursive: true });
  const cacheFile = join(GEO_CACHE, createHash('sha1').update(INDEX_URL).digest('hex') + '.html');
  if (!forceFetch && existsSync(cacheFile)) return { html: readFileSync(cacheFile, 'utf8'), from: 'geo-cache', fetchedAt: null };
  const res = await fetch(INDEX_URL, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${INDEX_URL}`);
  const html = await res.text();
  writeFileSync(cacheFile, html);
  return { html, from: 'network', fetchedAt: new Date().toISOString() };
}

const decode = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export function parseIndex(html) {
  const entries = [];
  let year = null;
  const re = /<h3><a href="#">(\d{4})<\/a><\/h3>|href="(?:https:\/\/bartok-gyujtesek\.zti\.hu)?\/en\/browse\/(\d+)\/?"[^>]*>(.*?)<\/a>/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[1]) { year = +m[1]; continue; }
    entries.push({ id: m[2], groupYear: year, label: decode(m[3].replace(/<[^>]+>/g, ' ')) });
  }
  return entries;
}

// ------------------------------------------------------------------ dates

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  januar: 1, februar: 2, marcius: 3, aprilis: 4, majus: 5, junius: 6, julius: 7, augusztus: 8, szeptember: 9, oktober: 10, november_hu: 11, december_hu: 12
};
const QUALIFIERS = [
  [/\b(beginning of|eleje|elejen)\b/, 'beginning'],
  [/\b(end of|vege|vegen)\b/, 'end'],
  [/\b(middle of|kozepe|kozepen)\b/, 'middle'],
  [/\bafter\b/, 'after']
];
const SEASONS = { spring: [3, 5], summer: [6, 8], autumn: [9, 11], fall: [9, 11], winter: [12, 2], tavasz: [3, 5], nyar: [6, 8], osz: [9, 11], tel: [12, 2] };
const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const iso = (y, m, d) => (d ? `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` : m ? `${y}-${String(m).padStart(2, '0')}` : String(y));

/** One endpoint of a range: "end of august", "march 24", "23. december 1911", "07", "1914. aprilis 3" */
function parseEndpoint(raw) {
  const s = fold(raw);
  const e = { year: null, month: null, day: null, day2: null, qualifier: null, season: null, uncertain: /\?/.test(raw) };
  for (const [re, q] of QUALIFIERS) if (re.test(s)) e.qualifier = q;
  const y = s.match(/\b(1[89]\d\d)\b/);
  if (y) e.year = +y[1];
  for (const [name, mm] of Object.entries(MONTHS)) {
    if (new RegExp(`\\b${name.replace(/_hu$/, '')}\\b`).test(s)) { e.month = mm; break; }
  }
  for (const [name, [a]] of Object.entries(SEASONS)) if (new RegExp(`\\b${name}\\b`).test(s)) { e.season = name; e.month = e.month ?? a; }
  // numbers other than the year: day(s) and possibly a numeric month ("27 12", "07 08", "03")
  const nums = [...s.replace(/\b1[89]\d\d\b/g, ' ').matchAll(/\b(\d{1,2})\b/g)].map((x) => +x[1]);
  if (e.month) {
    if (nums.length >= 1) e.day = nums[0];
    if (nums.length >= 2) e.day2 = nums[1];
  } else if (nums.length === 1) {
    if (nums[0] >= 1 && nums[0] <= 12) e.month = nums[0]; // "03. 1907"
  } else if (nums.length === 2) {
    // "27. 12." day month, or "07-08." month range handled by caller; assume day month when the second <= 12
    if (nums[1] <= 12) { e.day = nums[0]; e.month = nums[1]; }
  } else if (nums.length === 3) {
    // "27-29. 12." -> day day2 month
    if (nums[2] <= 12) { e.day = nums[0]; e.day2 = nums[1]; e.month = nums[2]; }
  }
  return e;
}

/** Turn an endpoint into an inclusive ISO window and a precision. */
function endpointWindow(e, side) {
  const y = e.year;
  if (!y) return null;
  if (!e.month) return { start: `${y}`, end: `${y}`, precision: e.season ? 'season' : 'year' };
  const m = e.month;
  const last = daysInMonth(y, m);
  if (e.day && e.day2) return { start: iso(y, m, e.day), end: iso(y, m, e.day2), precision: 'day' };
  if (e.day && !e.qualifier) return { start: iso(y, m, e.day), end: iso(y, m, e.day), precision: 'day' };
  if (e.qualifier === 'after' && e.day) return { start: iso(y, m, Math.min(e.day + 1, last)), end: iso(y, m, last), precision: 'phrase' };
  if (e.qualifier === 'beginning') return { start: iso(y, m, 1), end: iso(y, m, 10), precision: 'phrase' };
  if (e.qualifier === 'middle') return { start: iso(y, m, 11), end: iso(y, m, 20), precision: 'phrase' };
  if (e.qualifier === 'end') return { start: iso(y, m, 21), end: iso(y, m, last), precision: 'phrase' };
  if (e.season) return { start: iso(y, m), end: iso(y, SEASONS[e.season][1]), precision: 'season' };
  return side === 'start' ? { start: iso(y, m), end: iso(y, m), precision: 'month' } : { start: iso(y, m), end: iso(y, m), precision: 'month' };
}

const PRECISION_RANK = { day: 0, phrase: 1, month: 2, season: 3, year: 4 };

/** "End of March – Beginning of April, November 5–6, 1910" -> periods[] */
export function parseDateExpression(dateRaw, groupYear) {
  const norm = dateRaw.replace(/[–—]/g, '-').replace(/\s+/g, ' ').replace(/,\s*(?=1[89]\d\d\b)/g, ' ').trim();
  // Split into comma-separated periods when more than one contains a month word/number
  const chunks = norm.split(/,\s*/).map((c) => c.trim()).filter(Boolean);
  const periods = [];
  let pending = [];
  for (const c of chunks) {
    const hasMonth = Object.keys(MONTHS).some((n) => new RegExp(`\\b${n.replace(/_hu$/, '')}\\b`).test(fold(c))) || /\b\d{1,2}\b/.test(fold(c).replace(/\b1[89]\d\d\b/g, ''));
    const onlyYear = /^\s*1[89]\d\d\s*\.?\s*$/.test(c);
    if (onlyYear && pending.length) { pending[pending.length - 1] += ', ' + c; continue; }
    if (hasMonth || onlyYear) pending.push(c);
  }
  for (const p of pending) {
    // range split: a hyphen between two expressions that both carry a month or qualifier; "5-6" and "07-08" stay inside one endpoint
    let parts = p.split(/\s-\s|(?<=[a-zA-ZÀ-ſ.])-(?=[a-zA-ZÀ-ſ])|\.-(?=\d)/).map((x) => x.trim()).filter(Boolean);
    if (parts.length > 2) parts = [parts[0], parts[parts.length - 1]];
    let a = parseEndpoint(parts[0]);
    let b = parts.length > 1 ? parseEndpoint(parts[1]) : null;
    // "07-08. 1915": month range written numerically inside one endpoint
    if (!b && a.month && a.day && !a.day2 && /^\s*\d{2}-\d{2}\.?\s+1[89]\d\d/.test(p)) { b = { ...a, month: a.month, day: null }; a = { ...a, month: a.day, day: null }; }
    if (b) {
      if (!b.year && a.year) b.year = a.year;
      if (!a.year && b.year) a.year = b.year;
      if (!b.month && a.month && b.day) b.month = a.month; // "November 5-6"
      if (!a.month && b.month && a.day) a.month = b.month; // "23. December 1911.-4. January 1912" already ok; "3-10. April" style
      if (a.year && b.year && a.year > b.year) [a, b] = [b, a];
    }
    for (const e of [a, b]) if (e && !e.year) e.year = groupYear;
    const wa = endpointWindow(a, 'start');
    const wb = b ? endpointWindow(b, 'end') : null;
    if (!wa) continue;
    periods.push({
      raw: p,
      start: wa.start,
      end: (wb || wa).end,
      precision: wb ? Object.entries(PRECISION_RANK).find(([, r]) => r === Math.max(PRECISION_RANK[wa.precision], PRECISION_RANK[wb.precision]))[0] : wa.precision,
      qualifiers: [a.qualifier, b && b.qualifier].filter(Boolean),
      uncertain: a.uncertain || (b && b.uncertain) || false
    });
  }
  if (!periods.length && groupYear) periods.push({ raw: dateRaw, start: String(groupYear), end: String(groupYear), precision: 'year', qualifiers: [], uncertain: true });
  const start = periods.map((p) => p.start).sort()[0];
  const end = periods.map((p) => p.end).sort().at(-1);
  const precision = periods.map((p) => p.precision).sort((x, y) => PRECISION_RANK[y] - PRECISION_RANK[x])[0];
  return { start, end, precision, periods, yearFromGroup: periods.some((p) => !/\b1[89]\d\d\b/.test(p.raw)) };
}

// ------------------------------------------------------------------ label split

/** "February, 1910. Upper region ...: district of Belenyes and Vaskoh (12)" -> { dateRaw, placeRaw, countOnline } */
export function splitLabel(label) {
  let rest = label.replace(/\s+/g, ' ').trim();
  let countOnline = null;
  const cm = rest.match(/\((\d+)\)\s*$/);
  if (cm) { countOnline = +cm[1]; rest = rest.slice(0, cm.index).trim(); }
  rest = rest.replace(/^L[aá]sd:\s*/i, '');
  // Hungarian form "1914. aprilis 3-10. Place" / "1915. januar-februar. Place"
  const HU_PART = '1[89]\\d\\d\\.\\s*[a-záéíóöőúüű]+(?:[–-][a-záéíóöőúüű]+)?(?:\\s*\\d{1,2}(?:[–-]\\d{1,2})?)?\\.?(?:\\s*(?:eleje|közepe|vége))?\\.?';
  let m = rest.match(new RegExp(`^(${HU_PART}(?:\\s*[–-]\\s*${HU_PART})?)\\s+(.*)$`, 'i'));
  if (!m) m = rest.match(/^(.*?\b1[89]\d\d\b(?:\s*[–-]\s*[^.,]*?\b1[89]\d\d\b)?)[.,]\s+(.*)$/);
  if (!m) m = rest.match(/^((?:\d{1,2}[.\s-]*)*1[89]\d\d)\s+(.*)$/); // "11. 1915 Zolyom county"
  if (!m) m = rest.match(/^([^.]*?)\.\s+(.*)$/); // no year in the label ("End of August - Beginning of September. Mezoseg")
  if (!m) return { dateRaw: rest, placeRaw: null, countOnline };
  return { dateRaw: m[1].replace(/[.,]\s*$/, '').trim(), placeRaw: m[2].trim() || null, countOnline };
}

// ------------------------------------------------------------------ places

// Regions and counties named in the index. Coordinates are approximate centres for
// drawing a cluster, not localities; `nowIn` is the present-day country.
const REGIONS = {
  'fekete koros': { name: 'Crișul Negru valley', nameHu: 'Fekete-Körös völgye', nameRo: 'Valea Crișului Negru', kind: 'region', county: 'Bihor', countyHistorical: 'Bihar', lat: 46.62, lng: 22.42, nowIn: 'RO' },
  'upper region of the river fekete koros': { name: 'Upper Crișul Negru valley (Beiuș and Vașcău districts)', nameHu: 'Fekete-Körös felső vidéke', nameRo: 'Valea superioară a Crișului Negru', kind: 'region', county: 'Bihor', countyHistorical: 'Bihar', lat: 46.55, lng: 22.45, nowIn: 'RO' },
  mezoseg: { name: 'Transylvanian Plain', nameHu: 'Mezőség', nameRo: 'Câmpia Transilvaniei', kind: 'region', county: null, countyHistorical: 'Kolozs / Szolnok-Doboka / Maros-Torda', lat: 46.85, lng: 24.1, nowIn: 'RO' },
  'kis szamos': { name: 'Someșul Mic valley', nameHu: 'Kis-Szamos vidéke', nameRo: 'Valea Someșului Mic', kind: 'region', county: 'Cluj', countyHistorical: 'Kolozs / Szolnok-Doboka', lat: 47.0, lng: 23.8, nowIn: 'RO' },
  'region of the river kis szamos': { name: 'Someșul Mic valley', nameHu: 'Kis-Szamos vidéke', nameRo: 'Valea Someșului Mic', kind: 'region', county: 'Cluj', countyHistorical: 'Kolozs / Szolnok-Doboka', lat: 47.0, lng: 23.8, nowIn: 'RO' },
  mocvidek: { name: 'Land of the Moți (Munții Apuseni)', nameHu: 'Mócvidék', nameRo: 'Țara Moților', kind: 'region', county: 'Alba', countyHistorical: 'Torda-Aranyos / Alsó-Fehér', lat: 46.4, lng: 22.9, nowIn: 'RO' },
  'land of': { name: 'Land of the Moți (Munții Apuseni)', nameHu: 'Mócvidék', nameRo: 'Țara Moților', kind: 'region', county: 'Alba', countyHistorical: 'Torda-Aranyos / Alsó-Fehér', lat: 46.4, lng: 22.9, nowIn: 'RO', note: 'label truncated on the site ("Land of"); the Hungarian entry 65 reads Mócvidék' },
  'felso maros mente': { name: 'Upper Mureș valley', nameHu: 'Felső-Maros mente', nameRo: 'Valea superioară a Mureșului', kind: 'region', county: 'Mureș', countyHistorical: 'Maros-Torda', lat: 46.85, lng: 24.85, nowIn: 'RO' },
  'nyarad mente': { name: 'Niraj valley', nameHu: 'Nyárád mente', nameRo: 'Valea Nirajului', kind: 'region', county: 'Mureș', countyHistorical: 'Maros-Torda', lat: 46.55, lng: 24.75, nowIn: 'RO' },
  banat: { name: 'Banat', nameHu: 'Bánság', nameRo: 'Banat', kind: 'region', county: null, countyHistorical: 'Temes / Torontál / Krassó-Szörény', lat: 45.75, lng: 21.3, nowIn: 'RO' },
  algeria: { name: 'Algeria (Biskra region)', nameHu: 'Algéria', nameRo: 'Algeria', kind: 'country', county: null, countyHistorical: null, lat: 34.85, lng: 5.73, nowIn: 'DZ' },
  'gomor county': { name: 'Gömör county', nameHu: 'Gömör és Kis-Hont vármegye', nameRo: null, kind: 'county', county: null, countyHistorical: 'Gömör és Kis-Hont', lat: 48.5, lng: 20.2, nowIn: 'SK' },
  gomor: { name: 'Gömör county', nameHu: 'Gömör és Kis-Hont vármegye', nameRo: null, kind: 'county', county: null, countyHistorical: 'Gömör és Kis-Hont', lat: 48.5, lng: 20.2, nowIn: 'SK' },
  'nyitra county': { name: 'Nyitra county', nameHu: 'Nyitra vármegye', nameRo: null, kind: 'county', county: null, countyHistorical: 'Nyitra', lat: 48.4, lng: 18.1, nowIn: 'SK' },
  'temes county': { name: 'Temes county', nameHu: 'Temes vármegye', nameRo: 'Timiș', kind: 'county', county: 'Timiș', countyHistorical: 'Temes', lat: 45.7, lng: 21.5, nowIn: 'RO' },
  'torontal county': { name: 'Torontál county', nameHu: 'Torontál vármegye', nameRo: 'Torontal', kind: 'county', county: 'Timiș', countyHistorical: 'Torontál', lat: 45.8, lng: 20.7, nowIn: 'RO' },
  'hont county': { name: 'Hont county', nameHu: 'Hont vármegye', nameRo: null, kind: 'county', county: null, countyHistorical: 'Hont', lat: 48.1, lng: 18.9, nowIn: 'SK' },
  'maramaros county': { name: 'Máramaros county', nameHu: 'Máramaros vármegye', nameRo: 'Maramureș', kind: 'county', county: 'Maramureș', countyHistorical: 'Máramaros', lat: 47.75, lng: 24.3, nowIn: 'RO' },
  'hunyad county': { name: 'Hunyad county', nameHu: 'Hunyad vármegye', nameRo: 'Hunedoara', kind: 'county', county: 'Hunedoara', countyHistorical: 'Hunyad', lat: 45.8, lng: 23.0, nowIn: 'RO' },
  'bihar county': { name: 'Bihar county', nameHu: 'Bihar vármegye', nameRo: 'Bihor', kind: 'county', county: 'Bihor', countyHistorical: 'Bihar', lat: 46.9, lng: 22.0, nowIn: 'RO' },
  bihar: { name: 'Bihar county', nameHu: 'Bihar vármegye', nameRo: 'Bihor', kind: 'county', county: 'Bihor', countyHistorical: 'Bihar', lat: 46.9, lng: 22.0, nowIn: 'RO' },
  'zolyom county': { name: 'Zólyom county', nameHu: 'Zólyom vármegye', nameRo: null, kind: 'county', county: null, countyHistorical: 'Zólyom', lat: 48.7, lng: 19.2, nowIn: 'SK' },
  'zolyom county slovakian': { name: 'Zólyom county', nameHu: 'Zólyom vármegye', nameRo: null, kind: 'county', county: null, countyHistorical: 'Zólyom', lat: 48.7, lng: 19.2, nowIn: 'SK' },
  budapest: { name: 'Budapest', nameHu: 'Budapest', nameRo: 'Budapesta', kind: 'city', county: null, countyHistorical: 'Pest-Pilis-Solt-Kiskun', lat: 47.4979, lng: 19.0402, nowIn: 'HU' }
};

// Trips whose material is Romanian according to Bartok's own account of his Romanian
// collecting (Rumanian Folk Music, ed. Suchoff, vol. I introduction and the village lists
// in vols I-V). 'documented' = the county/region and date appear in RFM's collecting
// chronology; 'inferred' = the place is in a Romanian-speaking area of the collection but
// this specific entry was not checked against RFM. Entries not listed get null.
const ROMANIAN_MATERIAL = {
  50: 'documented', 56: 'documented', 66: 'documented', 64: 'documented', 65: 'documented', 79: 'documented', 71: 'documented',
  81: 'documented', 82: 'documented', 84: 'documented', 86: 'documented', 87: 'documented', 55: 'inferred', 60: 'inferred',
  51: 'inferred', 70: 'inferred', 78: 'inferred', 74: 'inferred', 69: 'inferred', 15: 'inferred'
};

function loadGazetteer() {
  if (!existsSync(GAZETTEER)) return { byName: new Map() };
  const g = JSON.parse(readFileSync(GAZETTEER, 'utf8'));
  const byName = new Map();
  const REGION_BY_COUNTY = { Bihor: 'Crisana', Arad: 'Crisana', 'Satu Mare': 'Crisana', 'Sălaj': 'Crisana', 'Timiș': 'Banat', 'Caraș-Severin': 'Banat', 'Maramureș': 'Maramures' };
  for (const p of g.places || []) {
    const id = p.id || `${(p.country || 'xx').toLowerCase()}/${slug(p.region || REGION_BY_COUNTY[p.county] || 'transylvania')}/${slug(p.county || 'unresolved')}/${slug(p.name)}`;
    for (const n of [p.name, p.nameHistorical, ...(p.aliases || [])]) {
      if (!n) continue;
      const k = fold(n);
      if (!byName.has(k)) byName.set(k, []);
      if (!byName.get(k).some((x) => x.id === id)) byName.get(k).push({ ...p, id });
    }
  }
  return { byName };
}

function resolvePlace(text, gaz) {
  const clean = text.replace(/\(\?\)/g, '').replace(/\s+/g, ' ').trim();
  const alt = (clean.match(/\(([^)]+)\)/) || [])[1] || null;
  const main = clean.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/:\s.*$/, '').trim(); // drop ": district of ..." tail
  const k = fold(main);
  const base = { text, nameAlt: alt, uncertain: /\(\?\)/.test(text) };
  if (!k) return { ...base, resolution: 'unresolved', name: null, placeId: null, lat: null, lng: null, county: null, countyHistorical: null, nowIn: null, kind: null };
  const fullKey = fold(clean.replace(/\s*\([^)]*\)\s*/g, ' '));
  const region = REGIONS[fullKey] || REGIONS[k] || Object.entries(REGIONS).find(([rk]) => k.includes(rk) && rk.length > 5)?.[1];
  if (region) return { ...base, resolution: 'region-table', placeId: null, ...region };
  const hits = gaz.byName.get(k) || [];
  if (hits.length === 1) {
    const p = hits[0];
    return { ...base, resolution: 'gazetteer', kind: p.type || 'village', name: p.name, nameHu: p.nameHistorical, nameRo: p.name, placeId: p.id, lat: p.lat, lng: p.lng, county: p.county, countyHistorical: p.countyHistorical, nowIn: p.country || 'RO', confidence: p.confidence || null };
  }
  if (hits.length > 1) return { ...base, resolution: 'ambiguous', name: main, placeId: null, lat: null, lng: null, county: null, countyHistorical: null, nowIn: null, kind: null, candidates: hits.map((h) => h.id) };
  return { ...base, resolution: 'unresolved', name: main, placeId: null, lat: null, lng: null, county: null, countyHistorical: null, nowIn: null, kind: null };
}

export function parsePlaces(placeRaw, gaz) {
  if (!placeRaw) return [];
  let s = placeRaw.replace(/\s+/g, ' ').trim();
  // "Ipolyság. Shepherd's horn and bagpipe competition" -> keep the event as a note
  let note = null;
  const ev = s.match(/^([^.]+)\.\s+(.+)$/);
  if (ev) { s = ev[1]; note = ev[2]; }
  let language = null;
  const lm = s.match(/,\s*(Slovakian|Slovak|Romanian|Rumanian|Hungarian|Ruthenian|Serbian|Arab)\s*$/i);
  if (lm) { language = lm[1]; s = s.slice(0, lm.index); }
  const parts = s.split(/\s*\/\s*|,\s*/).map((x) => x.trim()).filter((x) => x && x !== '(?)');
  const places = parts.map((t) => resolvePlace(t, gaz));
  for (const p of places) { if (note) p.note = note; if (language) p.languageNote = language; }
  return places;
}

// ------------------------------------------------------------------ Wikidata fallback for unresolved localities

// The gazetteer covers present-day Romania only. Localities of the index in present-day
// Hungary, Slovakia, Ukraine, Serbia or Croatia are looked up on Wikidata by their
// Hungarian label (1 request/s, cached under geo/cache/wikidata/, same cache as
// enrich-wikidata.mjs). Only a single unambiguous settlement hit is accepted.
const WD_ENDPOINT = 'https://query.wikidata.org/sparql';
const sparqlString = (v) => '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
const WD_CACHE = join(HERE, 'cache', 'wikidata');
const WD_COUNTRIES = { Q28: 'HU', Q214: 'SK', Q212: 'UA', Q403: 'RS', Q224: 'HR', Q218: 'RO', Q40: 'AT' };
let wdLast = 0;
async function wdQuery(query) {
  const key = createHash('sha1').update(query).digest('hex');
  const file = join(WD_CACHE, key + '.json');
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')).data;
  const wait = wdLast + 1000 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  wdLast = Date.now();
  const res = await fetch(WD_ENDPOINT + '?format=json&query=' + encodeURIComponent(query), { headers: { 'User-Agent': USER_AGENT, Accept: 'application/sparql-results+json' } });
  if (!res.ok) throw new Error(`Wikidata HTTP ${res.status}`);
  const data = await res.json();
  mkdirSync(WD_CACHE, { recursive: true });
  writeFileSync(file, JSON.stringify({ query, fetchedAt: new Date().toISOString(), data }));
  return data;
}
async function resolveViaWikidata(place) {
  const name = (place.name || place.text || '').replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  if (!name) return place;
  const q = `SELECT ?item ?itemLabel ?country ?coord ?labelHu ?labelLocal WHERE {
  { ?item rdfs:label ${sparqlString(name)}@hu } UNION { ?item skos:altLabel ${sparqlString(name)}@hu }
  ?item wdt:P17 ?country . VALUES ?country { ${Object.keys(WD_COUNTRIES).map((c) => 'wd:' + c).join(' ')} }
  ?item wdt:P31 ?inst . FILTER EXISTS { ?inst wdt:P279* wd:Q486972 }
  OPTIONAL { ?item wdt:P625 ?coord }
  OPTIONAL { ?item rdfs:label ?labelHu FILTER(LANG(?labelHu) = "hu") }
  OPTIONAL { ?item wdt:P1705 ?labelLocal }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,hu" . }
} LIMIT 50`;
  let data;
  try { data = await wdQuery(q); } catch (e) { return { ...place, wikidataNote: 'query failed: ' + e.message }; }
  const items = new Map();
  for (const b of data.results.bindings) {
    const id = b.item.value.replace(/.*\//, '');
    const it = items.get(id) || { qid: id, label: b.itemLabel && b.itemLabel.value, country: WD_COUNTRIES[b.country.value.replace(/.*\//, '')], coord: null, labelHu: null, local: null };
    const m = b.coord && /Point\(([-\d.]+) ([-\d.]+)\)/.exec(b.coord.value);
    if (m && !it.coord) it.coord = { lng: +m[1], lat: +m[2] };
    it.labelHu = it.labelHu || (b.labelHu && b.labelHu.value);
    it.local = it.local || (b.labelLocal && b.labelLocal.value);
    items.set(id, it);
  }
  const hits = [...items.values()].filter((i) => i.coord);
  if (hits.length === 1) {
    const h = hits[0];
    return { ...place, resolution: 'wikidata', kind: 'settlement', name: h.label || name, nameHu: h.labelHu || name, nameRo: null, placeId: null, qid: h.qid, wikidataUrl: 'https://www.wikidata.org/wiki/' + h.qid, lat: h.coord.lat, lng: h.coord.lng, county: null, countyHistorical: place.countyHistorical || null, nowIn: h.country };
  }
  return { ...place, resolution: hits.length ? 'ambiguous' : 'unresolved', candidates: hits.length ? hits.map((h) => h.qid).sort() : undefined, wikidataNote: hits.length ? `${hits.length} settlements with this Hungarian label` : 'no settlement with this Hungarian label in HU/SK/UA/RS/HR/RO/AT' };
}

// ------------------------------------------------------------------ main

async function main() {
  const forceFetch = process.argv.includes('--fetch');
  const { html, from, fetchedAt } = await loadIndexHtml(forceFetch);
  const entries = parseIndex(html);
  if (entries.length < 50) throw new Error(`only ${entries.length} entries parsed; page layout changed?`);
  const gaz = loadGazetteer();
  const collections = [];
  for (const e of entries) {
    const { dateRaw, placeRaw, countOnline } = splitLabel(e.label);
    const date = parseDateExpression(dateRaw, e.groupYear);
    let places = parsePlaces(placeRaw, gaz);
    if (!process.argv.includes('--no-wikidata')) {
      places = await Promise.all(places.map((p) => (p.resolution === 'unresolved' ? resolveViaWikidata(p) : p)));
    }
    const nowIn = [...new Set(places.map((p) => p.nowIn).filter(Boolean))].sort();
    const rm = ROMANIAN_MATERIAL[e.id];
    collections.push(sortKeys({
      id: e.id,
      journeyId: `gyuj-${e.id}`,
      url: `https://bartok-gyujtesek.zti.hu/en/browse/${e.id}`,
      label: e.label,
      groupYear: e.groupYear,
      dateRaw,
      placeRaw,
      countOnline,
      hasOnlineRecords: countOnline != null && countOnline > 0,
      date,
      places,
      nowIn,
      romanianMaterial: rm ? { value: true, confidence: rm } : nowIn.includes('RO') ? { value: null, confidence: 'unknown', note: 'in present-day Romania; material language not checked' } : { value: false, confidence: 'inferred' }
    }));
  }
  collections.sort((a, b) => (a.date.start < b.date.start ? -1 : a.date.start > b.date.start ? 1 : +a.id - +b.id));
  const out = {
    _meta: {
      title: "Bartok's collecting trips as indexed by bartok-gyujtesek.zti.hu (Bela Bartok, the Ethnomusicologist)",
      source: { site: 'gyuj', url: INDEX_URL, loadedFrom: from, fetchedAt, attribution: 'Trip index: HUN-REN BTK Institute for Musicology, Budapest, "Bela Bartok, the Ethnomusicologist" (bartok-gyujtesek.zti.hu)' },
      generator: 'geo/parse-gyuj-collections.mjs',
      generatedAt: new Date().toISOString().slice(0, 10),
      counts: {
        collections: collections.length,
        withOnlineRecords: collections.filter((c) => c.hasOnlineRecords).length,
        withoutOnlineRecords: collections.filter((c) => !c.hasOnlineRecords).length,
        precision: Object.fromEntries(['day', 'phrase', 'month', 'season', 'year'].map((p) => [p, collections.filter((c) => c.date.precision === p).length])),
        placesResolved: collections.reduce((n, c) => n + c.places.filter((p) => p.resolution === 'gazetteer' || p.resolution === 'region-table' || p.resolution === 'wikidata').length, 0),
        placesViaWikidata: collections.reduce((n, c) => n + c.places.filter((p) => p.resolution === 'wikidata').length, 0),
        placesUnresolved: collections.reduce((n, c) => n + c.places.filter((p) => p.resolution === 'unresolved' || p.resolution === 'ambiguous').length, 0),
        romanianDocumented: collections.filter((c) => c.romanianMaterial.confidence === 'documented').length,
        romanianInferred: collections.filter((c) => c.romanianMaterial.confidence === 'inferred' && c.romanianMaterial.value).length
      },
      notes: [
        'label is verbatim from the site (English index). Entry 64 is truncated on the site ("Land of"); entry 65 is its Hungarian cross-reference (Mocvidek).',
        'date.precision: day (explicit days), phrase (Beginning of / Middle of / End of / After: a 10-day window), month, season, year. Where the label carries no year the accordion year is used and yearFromGroup is true.',
        'places[].resolution: gazetteer (locality in data/gazetteer.json), region-table (built-in region or county centre, approximate), wikidata (locality outside Romania found by its Hungarian label on Wikidata, single settlement hit, coordinates from P625), ambiguous, unresolved. Region centres are for clusters, not routes.',
        'romanianMaterial: documented = matches the collecting chronology in Rumanian Folk Music (Suchoff ed.); inferred = Romanian-speaking area, not checked entry by entry; unknown = present-day Romania but language of the material not checked (Szekely and other Hungarian villages fall here too).'
      ]
    },
    collections
  };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  console.log(JSON.stringify({ written: OUT, ...out._meta.counts, loadedFrom: from }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
