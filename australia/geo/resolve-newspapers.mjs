#!/usr/bin/env node
// Resolve the newspaper titles cited in the notes (australia/data/sources.json) to a place of
// publication, using Wikidata: every newspaper published in Australia (or New Zealand) with its
// place of publication (P291) and that place's coordinates and state. Matches are by folded
// title (leading "The" dropped) against labels and aliases; a title shared by papers in several
// places becomes an entry with `variants`, one per state, which the build resolves per record
// from the state the notes name. Curated fixes live in data/newspapers-overrides.json and win.
//
// Usage: node resolve-newspapers.mjs [--offline]   (cache: geo/cache/wikidata-newspapers.json)
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(HERE, '..', 'data');
const CACHE = path.join(HERE, 'cache', 'wikidata-newspapers.json');
const OUT = path.join(DATA, 'newspapers.json');
const OVERRIDES = path.join(DATA, 'newspapers-overrides.json');
const REPORT = path.join(HERE, 'cache', 'resolve-report.json');
const UA = 'CulegeriAustralia/0.1 (+https://culegeri.vercel.app/australia; contact tsaar@maltandbrew.com)';

if (process.env.HTTPS_PROXY || process.env.https_proxy) {
  try {
    setGlobalDispatcher(new EnvHttpProxyAgent());
  } catch {
    // direct
  }
}

const STATE_QID = {
  Q3224: 'NSW',
  Q36687: 'VIC',
  Q36074: 'QLD',
  Q35715: 'SA',
  Q3206: 'WA',
  Q34366: 'TAS',
  Q3235: 'NT',
  Q3258: 'ACT',
  Q664: 'NZ'
};

const SPARQL = `
SELECT ?paper ?paperLabel ?alias ?trove ?place ?placeLabel ?coord ?admin ?inception ?dissolved WHERE {
  { ?paper wdt:P5603 ?trove . }
  UNION
  { ?paper wdt:P31/wdt:P279* wd:Q11032 . { ?paper wdt:P17 wd:Q408 } UNION { ?paper wdt:P17 wd:Q664 } UNION { ?paper wdt:P291 ?pl0 . ?pl0 wdt:P17 wd:Q408 } }
  OPTIONAL { ?paper skos:altLabel ?alias FILTER (lang(?alias) = "en") }
  OPTIONAL { ?paper wdt:P291 ?place . OPTIONAL { ?place wdt:P625 ?coord } OPTIONAL { ?place wdt:P131+ ?admin . FILTER(?admin IN (wd:Q3224, wd:Q36687, wd:Q36074, wd:Q35715, wd:Q3206, wd:Q34366, wd:Q3235, wd:Q3258)) } }
  OPTIONAL { ?paper wdt:P571 ?inception }
  OPTIONAL { ?paper wdt:P576 ?dissolved }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}`;

function fold(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
function key(s) {
  return fold(s).replace(/^the /, '');
}
/** sources.json keys are hyphenated slugs; matching happens on the space-separated form. */
function spaced(k) {
  return String(k || '').replace(/-/g, ' ');
}
function slug(k) {
  return String(k || '').trim().replace(/\s+/g, '-');
}

async function fetchWikidata(offline) {
  if (offline || (await fs.stat(CACHE).catch(() => null))) {
    try {
      return JSON.parse(await fs.readFile(CACHE, 'utf8'));
    } catch (e) {
      if (offline) throw e;
    }
  }
  const url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(SPARQL);
  const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/sparql-results+json' } });
  if (!r.ok) throw new Error(`wikidata HTTP ${r.status}`);
  const json = await r.json();
  await fs.mkdir(path.dirname(CACHE), { recursive: true });
  await fs.writeFile(CACHE, JSON.stringify(json));
  return json;
}

/** Rows -> papers: { qid, label, aliases[], place, lat, lng, state, from, to } */
function toPapers(json) {
  const papers = new Map();
  for (const b of json.results.bindings) {
    const qid = b.paper.value.split('/').pop();
    const p = papers.get(qid) || { qid, label: b.paperLabel ? b.paperLabel.value : null, trove: b.trove ? b.trove.value : null, aliases: new Set(), place: null, placeQid: null, lat: null, lng: null, state: null, from: null, to: null };
    if (b.alias) p.aliases.add(b.alias.value);
    if (b.placeLabel && !p.place) {
      p.place = b.placeLabel.value;
      p.placeQid = b.place.value.split('/').pop();
    }
    if (b.coord && p.lat === null) {
      const m = b.coord.value.match(/Point\(([-\d.]+) ([-\d.]+)\)/);
      if (m) {
        p.lng = parseFloat(m[1]);
        p.lat = parseFloat(m[2]);
      }
    }
    if (b.admin && !p.state) p.state = STATE_QID[b.admin.value.split('/').pop()] || null;
    if (b.inception && !p.from) p.from = parseInt(b.inception.value.slice(0, 4), 10);
    if (b.dissolved && !p.to) p.to = parseInt(b.dissolved.value.slice(0, 4), 10);
    papers.set(qid, p);
  }
  for (const p of papers.values()) {
    p.aliases = [...p.aliases];
    if (!p.state && p.placeQid && STATE_QID[p.placeQid]) p.state = STATE_QID[p.placeQid];
    if (!p.state && p.place) {
      const f = fold(p.place);
      if (/^(sydney|newcastle|wollongong|broken hill)$/.test(f)) p.state = 'NSW';
      else if (/^(melbourne|ballarat|bendigo|geelong)$/.test(f)) p.state = 'VIC';
      else if (/^(brisbane|townsville|rockhampton|cairns|toowoomba)$/.test(f)) p.state = 'QLD';
      else if (/^adelaide$/.test(f)) p.state = 'SA';
      else if (/^(perth|fremantle|kalgoorlie)$/.test(f)) p.state = 'WA';
      else if (/^(hobart|launceston)$/.test(f)) p.state = 'TAS';
      else if (/^darwin$/.test(f)) p.state = 'NT';
      else if (/^canberra$/.test(f)) p.state = 'ACT';
    }
  }
  return [...papers.values()];
}

function hintState(hints) {
  // The state most often named next to this title in the notes.
  const counts = {};
  for (const [h, n] of Object.entries(hints || {})) {
    const f = fold(h);
    let st = null;
    if (/new south wales|nsw|sydney|newcastle|broken hill|wagga/.test(f)) st = 'NSW';
    else if (/queen|brisbane|rockham|townsville|cairns/.test(f)) st = 'QLD';
    else if (/victori|vic|melbourne|ballarat|bendigo|geelong/.test(f)) st = 'VIC';
    else if (/south a|adelaide/.test(f)) st = 'SA';
    else if (/west|perth|kalgoorlie|fremantle|\bwa\b/.test(f)) st = 'WA';
    else if (/tasman|hobart|launceston/.test(f)) st = 'TAS';
    else if (/darwin|northern territory/.test(f)) st = 'NT';
    else if (/canberra|act|federal/.test(f)) st = 'ACT';
    if (st) counts[st] = (counts[st] || 0) + n;
  }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : null;
}

function overlaps(p, years) {
  if (!years || years.min === null) return true;
  if (p.from && years.max !== null && p.from > years.max + 1) return false;
  if (p.to && years.min !== null && p.to < years.min - 1) return false;
  return true;
}

function entryFrom(p, k, title, confidence, note) {
  return { key: k, title, town: p.place, state: p.state, lat: p.lat, lng: p.lng, wikidata: p.qid, wikidataLabel: p.label, troveTitleId: p.trove || null, confidence, note: note || null };
}


// ---- GeoNames: populated places of Australia (feature class P) -------------------------------
// geo/cache/AU.txt, extracted from https://download.geonames.org/export/dump/AU.zip (CC BY 4.0). Gives the
// coordinates for curated towns and the town-in-title matches ("Townsville Daily Bulletin").
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const GEONAMES_ZIP = path.join(HERE, 'cache', 'AU.zip');
const GEONAMES_TXT = path.join(HERE, 'cache', 'AU.txt');
const ADMIN1 = { '01': 'ACT', '02': 'NSW', '03': 'NT', '04': 'QLD', '05': 'SA', '06': 'TAS', '07': 'VIC', '08': 'WA' };
// Words that name places in GeoNames but mean something else in a masthead.
const TOWN_STOP = new Set(['advocate', 'sun', 'star', 'mail', 'chronicle', 'times', 'herald', 'independent', 'register', 'observer', 'leader', 'argus', 'express', 'standard', 'mercury', 'guardian', 'news', 'courier', 'bulletin', 'age', 'truth', 'week', 'land', 'australian', 'southern', 'northern', 'western', 'eastern', 'central', 'union', 'border', 'coast', 'valley', 'river', 'bay', 'point', 'mount', 'port', 'north', 'south', 'east', 'west', 'new', 'old', 'grange', 'free', 'press', 'record', 'review', 'gazette', 'examiner', 'post', 'dispatch', 'pioneer', 'witness', 'echo', 'spectator', 'telegraph', 'journal', 'tribune', 'reporter', 'sentinel', 'banner', 'champion', 'miner', 'liberal', 'critic', 'weekly', 'daily', 'evening', 'morning', 'sunday', 'colonial', 'colonist', 'patriot', 'federal', 'capital', 'country', 'life', 'stock', 'station', 'irrigator', 'grazier', 'settler', 'district', 'districts', 'general', 'advertiser', 'intelligencer', 'recorder', 'punch', 'figaro', 'call', 'clipper', 'bunyip', 'tocsin', 'socialist', 'worker', 'workman', 'labor', 'mirror', 'lance', 'reformer', 'sport', 'quiz', 'lantern', 'catholic', 'exile', 'freedom', 'irish', 'britannia', 'trades', 'commercial', 'illustrated', 'wool', 'women', 'people', 'paper', 'newsletter', 'united', 'darling', 'downs', 'wide', 'burnett', 'wallaroo', 'peninsula', 'miners', 'mining', 'shire', 'county', 'counties', 'hunter', 'clarence', 'richmond', 'macquarie', 'lachlan', 'murray', 'ovens', 'derwent', 'huon', 'swan', 'snowy', 'tweed', 'manning', 'shoalhaven', 'illawarra', 'riverina', 'riverine', 'gippsland', 'monaro', 'manaro', 'rodney', 'evelyn', 'bourke', 'normanby', 'berrima', 'vernon', 'cornwall', 'yarra']);

function loadGeonames() {
  let text;
  try {
    text = readFileSync(GEONAMES_TXT, 'utf8');
  } catch {
    try {
      text = execFileSync('unzip', ['-p', GEONAMES_ZIP, 'AU.txt'], { maxBuffer: 256 * 1024 * 1024 }).toString('utf8');
    } catch (e) {
      console.error(`geonames: cannot read ${GEONAMES_TXT} or ${GEONAMES_ZIP} (${e.message}); town matching disabled`);
      return { byName: new Map(), towns: [] };
    }
  }
  const towns = [];
  for (const line of text.split('\n')) {
    const c = line.split('\t');
    if (c[6] !== 'P') continue;
    const state = ADMIN1[c[10]];
    if (!state) continue;
    const t = { id: c[0], name: c[1], names: [c[1], ...(c[3] ? c[3].split(',') : [])], lat: parseFloat(c[4]), lng: parseFloat(c[5]), code: c[7], state, population: parseInt(c[14] || '0', 10) || 0 };
    towns.push(t);
  }
  const byName = new Map();
  for (const t of towns) {
    for (const n of new Set(t.names.map(fold))) {
      if (!n || n.length < 3) continue;
      if (!byName.has(n)) byName.set(n, []);
      byName.get(n).push(t);
    }
  }
  return { byName, towns };
}

/** The GeoNames place for a curated (town, state): the most populous of that name in the state. */
function geoTown(geo, town, state) {
  const list = (geo.byName.get(fold(town)) || []).filter((t) => !state || t.state === state);
  list.sort((a, b) => b.population - a.population || (a.code === 'PPL' ? -1 : 1));
  return list[0] || null;
}

/** Longest GeoNames name that appears as whole words in the title, preferring the hint state. */
function townInTitle(geo, k, hint) {
  const words = k.split(' ');
  const cands = [];
  for (let len = Math.min(3, words.length); len >= 1; len--) {
    for (let i = 0; i + len <= words.length; i++) {
      const phrase = words.slice(i, i + len).join(' ');
      if (len === 1 && (TOWN_STOP.has(phrase) || phrase.length < 5)) continue;
      if (len > 1 && words.slice(i, i + len).every((w) => TOWN_STOP.has(w))) continue;
      const list = geo.byName.get(phrase);
      if (!list) continue;
      for (const t of list) cands.push({ t, phrase, len });
    }
  }
  if (!cands.length) return null;
  cands.sort((a, b) => (hint ? Number(b.t.state === hint) - Number(a.t.state === hint) : 0) || b.len - a.len || b.t.population - a.t.population || (a.t.code === 'PPL' ? -1 : 1));
  const best = cands[0];
  // A one-word match against the wrong state with no population is too weak.
  if (best.len === 1 && hint && best.t.state !== hint && best.t.population === 0) return null;
  return best;
}

async function main() {
  const offline = process.argv.includes('--offline');
  const sources = JSON.parse(await fs.readFile(path.join(DATA, 'sources.json'), 'utf8'));
  const overrides = JSON.parse(await fs.readFile(OVERRIDES, 'utf8').catch(() => '[]'));
  const json = await fetchWikidata(offline);
  const papers = toPapers(json).filter((p) => p.label);
  console.error(`wikidata: ${papers.length} newspapers, ${papers.filter((p) => p.place).length} with a place`);

  // Index by folded label and alias.
  const byKey = new Map();
  const add = (k, p) => {
    if (!k) return;
    if (!byKey.has(k)) byKey.set(k, []);
    if (!byKey.get(k).includes(p)) byKey.get(k).push(p);
  };
  for (const p of papers) {
    add(key(p.label), p);
    for (const a of p.aliases) add(key(a), p);
  }
  const overrideByKey = new Map();
  for (const o of overrides) {
    overrideByKey.set(spaced(o.key), o);
    for (const a of o.aliases || []) overrideByKey.set(spaced(a), o);
  }
  const geo = loadGeonames();
  console.error(`geonames: ${geo.towns.length} populated places`);
  const withCoords = (o) => {
    const fill = (x) => {
      const g = geoTown(geo, x.town, x.state);
      return { ...x, lat: g ? g.lat : (x.lat ?? null), lng: g ? g.lng : (x.lng ?? null), geonames: g ? g.id : null };
    };
    const out = fill(o);
    if (Array.isArray(o.variants)) out.variants = o.variants.map(fill);
    return out;
  };

  const out = [];
  const report = { resolved: [], ambiguous: [], unresolved: [] };
  for (const n of sources.newspapers) {
    const k = spaced(n.key);
    const outKey = slug(n.key);
    if (overrideByKey.has(k)) {
      const o = overrideByKey.get(k);
      out.push({ ...withCoords(o), key: outKey, title: o.title || n.title, confidence: 'curated', aliases: undefined });
      report.resolved.push({ key: outKey, via: 'override', place: o.town, state: o.state });
      continue;
    }
    const hint = hintState(n.stateHints);
    let candidates = (byKey.get(k) || []).filter((p) => p.place);
    let via = 'label';
    if (!candidates.length) {
      // Prefix match: "Kiama Independent, and Shoalhaven Advertiser" vs "Kiama Independent".
      const short = k.split(' and ')[0].replace(/,$/, '').trim();
      for (const [kk, ps] of byKey) if ((kk.startsWith(k + ' ') || (short.length > 8 && kk.startsWith(short))) && ps.some((p) => p.place)) candidates.push(...ps.filter((p) => p.place));
      candidates = [...new Set(candidates)];
      via = 'prefix';
    }
    candidates = candidates.filter((p) => overlaps(p, n.years));
    if (!candidates.length) {
      const m = townInTitle(geo, k, hint);
      if (m) {
        out.push({ key: outKey, title: n.title, town: m.t.name, state: m.t.state, lat: m.t.lat, lng: m.t.lng, wikidata: null, geonames: m.t.id, confidence: m.len > 1 || m.t.state === hint || m.t.population > 1000 ? 'medium' : 'low', note: `town "${m.phrase}" in the title (GeoNames ${m.t.id})` });
        report.resolved.push({ key: outKey, via: 'town-in-title', place: m.t.name, state: m.t.state, phrase: m.phrase });
        continue;
      }
      report.unresolved.push({ key: outKey, title: n.title, count: n.count, hint, years: n.years });
      continue;
    }
    // Group by state: one variant per state.
    const byState = new Map();
    for (const p of candidates) {
      const st = p.state || 'XX';
      if (!byState.has(st)) byState.set(st, p);
    }
    if (byState.size === 1) {
      const p = candidates[0];
      out.push(entryFrom(p, outKey, n.title, via === 'label' ? 'high' : 'medium', via === 'prefix' ? `prefix match on "${p.label}"` : null));
      report.resolved.push({ key: outKey, via, qid: p.qid, place: p.place, state: p.state });
      continue;
    }
    const variants = [...byState.entries()]
      .filter(([st]) => st !== 'XX')
      .map(([st, p]) => ({ town: p.place, state: st, lat: p.lat, lng: p.lng, wikidata: p.qid, wikidataLabel: p.label, troveTitleId: p.trove || null, default: false }));
    const def = variants.find((v) => v.state === hint) || variants[0];
    if (def) def.default = true;
    out.push({ key: outKey, title: n.title, town: null, state: null, lat: null, lng: null, wikidata: null, confidence: 'medium', note: `ambiguous title; ${variants.length} papers, default by the notes' state hints (${hint || 'none'})`, variants });
    report.ambiguous.push({ key: outKey, title: n.title, count: n.count, hint, variants: variants.map((v) => `${v.town} (${v.state})`) });
  }
  out.sort((a, b) => a.key.localeCompare(b.key));
  await fs.writeFile(OUT, JSON.stringify(out, null, 2) + '\n');
  await fs.mkdir(path.dirname(REPORT), { recursive: true });
  await fs.writeFile(REPORT, JSON.stringify(report, null, 2) + '\n');
  const songsResolved = sources.newspapers.filter((n) => out.some((o) => o.key === slug(n.key))).reduce((s, n) => s + n.count, 0);
  const songsTotal = sources.newspapers.reduce((s, n) => s + n.count, 0);
  console.error(`resolved ${report.resolved.length}, ambiguous ${report.ambiguous.length}, unresolved ${report.unresolved.length} of ${sources.newspapers.length} titles; ${songsResolved}/${songsTotal} newspaper-sourced songs covered`);
  console.error('unresolved (by count):');
  for (const u of report.unresolved.sort((a, b) => b.count - a.count).slice(0, 40)) console.error(`  ${u.count}  ${u.title}  [${u.hint || '-'}]`);
}

main().catch((e) => {
  console.error(e.stack || String(e));
  process.exit(1);
});
