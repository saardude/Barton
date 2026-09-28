#!/usr/bin/env node
// Village existence and naming enrichment from Wikidata.
//
// For every locality in data/gazetteer.json (or, when it exists, every village node in
// data/places.json) this script asks the Wikidata SPARQL endpoint for the matching item
// and writes data/villages.json keyed by gazetteer id.
//
//   node geo/enrich-wikidata.mjs                 # gazetteer + places if present
//   node geo/enrich-wikidata.mjs --limit 20      # first 20 places (smoke test)
//   node geo/enrich-wikidata.mjs --no-cache      # ignore geo/cache/wikidata
//   node geo/enrich-wikidata.mjs --only beius    # ids containing the string
//
// Rules: 1 request per second, every response cached under geo/cache/wikidata/, no
// guessing: a place that cannot be matched with confidence is status "unknown" and the
// evidence says why. Output is deterministic (sorted keys) so re-runs diff cleanly.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const CACHE_DIR = join(HERE, 'cache', 'wikidata');
const GAZETTEER = join(ROOT, 'data', 'gazetteer.json');
const PLACES = join(ROOT, 'data', 'places.json');
const OUT = join(ROOT, 'data', 'villages.json');
const ENDPOINT = 'https://query.wikidata.org/sparql';
const USER_AGENT = 'BartonViewer/0.1 (Bartok field-collection viewer; geo enrichment script; tsaar@maltandbrew.com)';
const MIN_INTERVAL_MS = 1000;
const MAX_KM_FROM_GAZETTEER = 40; // beyond this a name match is not trusted

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i === -1 ? dflt : args[i + 1];
};
const LIMIT = Number(opt('--limit', 0)) || 0;
const ONLY = opt('--only', null);
const NO_CACHE = args.includes('--no-cache');

// Wikidata class ids we treat as "a settlement". Anything else is reported but not matched.
const SETTLEMENT_CLASSES = {
  Q532: 'village',
  Q3558970: 'village of Romania',
  Q659103: 'commune of Romania',
  Q640364: 'town of Romania',
  Q3685430: 'city of Romania',
  Q16898115: 'urban settlement',
  Q15921247: 'town of Romania (statistical)',
  Q34842776: 'municipality of Romania',
  Q486972: 'human settlement',
  Q5084: 'hamlet',
  Q3957: 'town',
  Q515: 'city',
  Q123705: 'neighbourhood',
  Q1115575: 'civil parish',
  Q74047: 'abandoned village',
  Q2116450: 'ghost town',
  Q19860854: 'destroyed settlement',
  Q1637706: 'city with millions of inhabitants',
  Q15284: 'municipality',
  Q7930989: 'city/town',
  Q3327873: 'suburb'
};
const ABANDONED_CLASSES = new Set(['Q74047', 'Q2116450', 'Q19860854']);
const COUNTY_CLASS = 'Q1776764'; // county of Romania

// ---------------------------------------------------------------- helpers

export function fold(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
export function slug(s) {
  return fold(s).replace(/ /g, '-');
}
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]));
  }
  return v;
}
const REGION_BY_COUNTY = {
  Bihor: 'Crisana', Arad: 'Crisana', 'Satu Mare': 'Crisana', 'Sălaj': 'Crisana',
  'Timiș': 'Banat', 'Caraș-Severin': 'Banat', 'Maramureș': 'Maramures'
};
export function gazetteerId(place) {
  // Mirrors place.schema.json ids: <country>/<region>/<county>/<village>.
  const country = (place.country || 'xx').toLowerCase();
  const region = slug(place.region || REGION_BY_COUNTY[place.county] || 'transylvania');
  return `${country}/${region}/${slug(place.county || 'unresolved')}/${slug(place.name)}`;
}

// ---------------------------------------------------------------- input

function loadTargets() {
  const targets = [];
  if (existsSync(GAZETTEER)) {
    const g = JSON.parse(readFileSync(GAZETTEER, 'utf8'));
    const places = Array.isArray(g) ? g : g.places || [];
    for (const p of places) {
      targets.push({
        id: p.id || gazetteerId(p),
        source: 'gazetteer',
        name: p.name,
        nameHistorical: p.nameHistorical || null,
        aliases: p.aliases || [],
        county: p.county || null,
        countyHistorical: p.countyHistorical || null,
        country: p.country || 'RO',
        type: p.type || null,
        lat: p.lat ?? null,
        lng: p.lng ?? null
      });
    }
  }
  if (existsSync(PLACES)) {
    const seen = new Set(targets.map((t) => t.id));
    const nodes = JSON.parse(readFileSync(PLACES, 'utf8'));
    for (const n of Array.isArray(nodes) ? nodes : []) {
      if (n.type !== 'village' || seen.has(n.id)) continue;
      targets.push({
        id: n.id,
        source: 'places',
        name: n.name,
        nameHistorical: n.nameHistorical || null,
        aliases: [],
        county: n.county || null,
        countyHistorical: n.countyHistorical || null,
        country: n.country || 'RO',
        type: 'village',
        lat: n.lat ?? null,
        lng: n.lng ?? null
      });
    }
  }
  return targets.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// ---------------------------------------------------------------- SPARQL

const COUNTRY_QID = { RO: 'Q218', HU: 'Q28', RS: 'Q403', UA: 'Q212', SK: 'Q214', MD: 'Q217', BG: 'Q219' };

function sparqlString(s) {
  return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function buildQuery(t) {
  const country = COUNTRY_QID[t.country] || 'Q218';
  const parts = [];
  if (t.name) {
    parts.push(`{ ?item rdfs:label ${sparqlString(t.name)}@ro . BIND("label-ro" AS ?via) }`);
    parts.push(`{ ?item skos:altLabel ${sparqlString(t.name)}@ro . BIND("alias-ro" AS ?via) }`);
  }
  if (t.nameHistorical) {
    parts.push(`{ ?item rdfs:label ${sparqlString(t.nameHistorical)}@hu . BIND("label-hu" AS ?via) }`);
    parts.push(`{ ?item skos:altLabel ${sparqlString(t.nameHistorical)}@hu . BIND("alias-hu" AS ?via) }`);
  }
  for (const a of t.aliases || []) {
    if (!a || a === t.name || a === t.nameHistorical) continue;
    parts.push(`{ ?item rdfs:label ${sparqlString(a)}@hu . BIND("alias-gazetteer-hu" AS ?via) }`);
    parts.push(`{ ?item rdfs:label ${sparqlString(a)}@ro . BIND("alias-gazetteer-ro" AS ?via) }`);
  }
  return `
SELECT ?item ?via ?inst ?coord ?labelRo ?labelHu ?labelEn ?native ?dissolved ?inception ?replacedBy ?replacedByLabel
       ?pop ?popTime ?county ?countyLabel ?countyLabelRo ?parent ?parentLabel ?officialName ?officialEnd ?aliasRo ?aliasHu ?aliasDe
WHERE {
  ${parts.join('\n  UNION\n  ')}
  ?item wdt:P17 wd:${country} .
  ?item wdt:P31 ?inst .
  OPTIONAL { ?item wdt:P625 ?coord }
  OPTIONAL { ?item rdfs:label ?labelRo FILTER(LANG(?labelRo) = "ro") }
  OPTIONAL { ?item rdfs:label ?labelHu FILTER(LANG(?labelHu) = "hu") }
  OPTIONAL { ?item rdfs:label ?labelEn FILTER(LANG(?labelEn) = "en") }
  OPTIONAL { ?item wdt:P1705 ?native }
  OPTIONAL { ?item wdt:P576 ?dissolved }
  OPTIONAL { ?item wdt:P571 ?inception }
  OPTIONAL { ?item wdt:P1366 ?replacedBy }
  OPTIONAL { ?item p:P1082 ?popStmt . ?popStmt ps:P1082 ?pop . OPTIONAL { ?popStmt pq:P585 ?popTime } }
  OPTIONAL { ?item wdt:P131 ?parent }
  OPTIONAL { ?item wdt:P131* ?county . ?county wdt:P31 wd:${COUNTY_CLASS} .
             OPTIONAL { ?county rdfs:label ?countyLabelRo FILTER(LANG(?countyLabelRo) = "ro") } }
  OPTIONAL { ?item p:P1448 ?onStmt . ?onStmt ps:P1448 ?officialName . OPTIONAL { ?onStmt pq:P582 ?officialEnd } }
  OPTIONAL { ?item skos:altLabel ?aliasRo FILTER(LANG(?aliasRo) = "ro") }
  OPTIONAL { ?item skos:altLabel ?aliasHu FILTER(LANG(?aliasHu) = "hu") }
  OPTIONAL { ?item skos:altLabel ?aliasDe FILTER(LANG(?aliasDe) = "de") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,ro,hu" . }
}
LIMIT 400`;
}

let lastRequestAt = 0;
async function sparql(query) {
  const key = createHash('sha1').update(query).digest('hex');
  const file = join(CACHE_DIR, key + '.json');
  if (!NO_CACHE && existsSync(file)) {
    return { fromCache: true, data: JSON.parse(readFileSync(file, 'utf8')) };
  }
  const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
  const url = ENDPOINT + '?format=json&query=' + encodeURIComponent(query);
  let res;
  for (let attempt = 0; attempt < 4; attempt++) {
    res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/sparql-results+json' } });
    if (res.status === 429 || res.status >= 500) {
      const retry = Number(res.headers.get('retry-after')) || 5 * (attempt + 1);
      process.stderr.write(`  HTTP ${res.status}, retrying in ${retry}s\n`);
      await new Promise((r) => setTimeout(r, retry * 1000));
      continue;
    }
    break;
  }
  if (!res.ok) throw new Error(`Wikidata HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(file, JSON.stringify({ query, fetchedAt: new Date().toISOString(), data }, null, 0));
  return { fromCache: false, data: { query, data } };
}

// ---------------------------------------------------------------- matching

function qid(uri) {
  return uri ? uri.replace(/^.*\/(Q\d+)$/, '$1') : null;
}
function parsePoint(wkt) {
  const m = /Point\(([-\d.]+) ([-\d.]+)\)/.exec(wkt || '');
  return m ? { lng: Number(m[1]), lat: Number(m[2]) } : null;
}
function groupCandidates(bindings) {
  const byItem = new Map();
  for (const b of bindings) {
    const id = qid(b.item.value);
    const c = byItem.get(id) || {
      qid: id, via: new Set(), inst: new Set(), coord: null, labelRo: null, labelHu: null, labelEn: null,
      native: new Set(), dissolved: null, inception: null, replacedBy: null, replacedByLabel: null,
      pops: [], counties: new Map(), parent: null, parentLabel: null, officialNames: [],
      aliasRo: new Set(), aliasHu: new Set(), aliasDe: new Set()
    };
    const v = (k) => (b[k] ? b[k].value : null);
    if (v('via')) c.via.add(v('via'));
    if (v('inst')) c.inst.add(qid(v('inst')));
    if (!c.coord && v('coord')) c.coord = parsePoint(v('coord'));
    c.labelRo = c.labelRo || v('labelRo');
    c.labelHu = c.labelHu || v('labelHu');
    c.labelEn = c.labelEn || v('labelEn');
    if (v('native')) c.native.add(v('native'));
    c.dissolved = c.dissolved || v('dissolved');
    c.inception = c.inception || v('inception');
    if (v('replacedBy')) { c.replacedBy = qid(v('replacedBy')); c.replacedByLabel = v('replacedByLabel'); }
    if (v('pop')) c.pops.push({ value: Number(v('pop')), time: v('popTime') });
    if (v('county')) c.counties.set(qid(v('county')), { en: v('countyLabel'), ro: v('countyLabelRo') });
    if (v('parent')) { c.parent = qid(v('parent')); c.parentLabel = v('parentLabel'); }
    if (v('officialName')) c.officialNames.push({ name: v('officialName'), end: v('officialEnd') });
    if (v('aliasRo')) c.aliasRo.add(v('aliasRo'));
    if (v('aliasHu')) c.aliasHu.add(v('aliasHu'));
    if (v('aliasDe')) c.aliasDe.add(v('aliasDe'));
    byItem.set(id, c);
  }
  return [...byItem.values()];
}

function countyMatches(c, t) {
  if (!t.county) return null;
  const want = fold(t.county);
  for (const [, labels] of c.counties) {
    const en = fold((labels.en || '').replace(/ county$/i, ''));
    const ro = fold((labels.ro || '').replace(/^judetul /i, ''));
    if (en === want || ro === want) return true;
  }
  return c.counties.size ? false : null;
}

function typeScore(c, t) {
  const inst = c.inst;
  const isVillage = inst.has('Q532') || inst.has('Q3558970') || inst.has('Q5084');
  const isCommune = inst.has('Q659103');
  const isTown = inst.has('Q640364') || inst.has('Q3685430') || inst.has('Q3957') || inst.has('Q515') || inst.has('Q15921247') || inst.has('Q34842776') || inst.has('Q16898115');
  const want = t.type || 'village';
  if (want === 'village' || want === 'hamlet') return isVillage ? 3 : isTown ? 1 : isCommune ? 0 : 1;
  if (want === 'town' || want === 'city') return isTown ? 3 : isVillage ? 1 : 0;
  if (want === 'commune') return isCommune ? 3 : isVillage ? 1 : 0;
  return 1;
}

function pickCandidate(cands, t) {
  const settlements = cands.filter((c) => [...c.inst].some((q) => SETTLEMENT_CLASSES[q]));
  const evidence = [];
  if (!cands.length) return { match: null, evidence: ['no Wikidata item with this label (ro) or historical label (hu) in the country'] };
  if (!settlements.length) {
    return { match: null, evidence: [`label matched ${cands.length} item(s) but none is a settlement class: ${cands.map((c) => c.qid + ' [' + [...c.inst].join(',') + ']').join('; ')}`] };
  }
  const scored = settlements.map((c) => {
    let score = 0;
    const why = [];
    const cm = countyMatches(c, t);
    if (cm === true) { score += 10; why.push('county matches'); }
    else if (cm === false) { score -= 10; why.push('county differs: ' + [...c.counties.values()].map((l) => l.en || l.ro).join('/')); }
    else why.push('county unknown on item');
    let km = null;
    if (c.coord && t.lat != null && t.lng != null) {
      km = haversineKm(c.coord.lat, c.coord.lng, t.lat, t.lng);
      why.push(`${km.toFixed(1)} km from gazetteer coordinate`);
      if (km <= 10) score += 5; else if (km <= MAX_KM_FROM_GAZETTEER) score += 2; else score -= 20;
    }
    const ts = typeScore(c, t);
    score += ts;
    why.push('type score ' + ts + ' (' + [...c.inst].map((q) => SETTLEMENT_CLASSES[q] || q).join(', ') + ')');
    if (c.via.has('label-ro')) score += 2;
    if (c.via.has('label-hu')) score += 1;
    return { c, score, why, km };
  }).sort((a, b) => b.score - a.score || (a.c.qid < b.c.qid ? -1 : 1));
  const best = scored[0];
  for (const s of scored) evidence.push(`${s.c.qid} score ${s.score}: ${s.why.join('; ')}`);
  if (best.score < 3) {
    return { match: null, evidence: ['no candidate passed the confidence threshold', ...evidence] };
  }
  if (scored.length > 1 && scored[1].score === best.score) {
    return { match: null, evidence: ['ambiguous: two candidates tie on score', ...evidence] };
  }
  return { match: best, evidence };
}

function deriveStatus(c, t) {
  const insts = [...c.inst];
  if (c.replacedBy) return 'merged';
  if (c.dissolved || insts.some((q) => ABANDONED_CLASSES.has(q))) return 'abandoned';
  const formerOfficial = c.officialNames.filter((o) => o.end);
  const currentRo = c.labelRo || '';
  if (formerOfficial.length && formerOfficial.every((o) => fold(o.name) !== fold(currentRo))) return 'renamed';
  if (t.name && currentRo && fold(currentRo) !== fold(t.name) && !c.via.has('label-ro')) return 'renamed';
  return 'existing';
}

function latestPopulation(pops) {
  if (!pops.length) return null;
  const sorted = [...pops].sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')));
  return { value: sorted[0].value, asOf: sorted[0].time ? sorted[0].time.slice(0, 10) : null };
}

function record(t, picked, allCands, fromCache) {
  const base = {
    id: t.id,
    name: t.name,
    nameHistorical: t.nameHistorical,
    county: t.county,
    countyHistorical: t.countyHistorical,
    gazetteerSource: t.source,
    status: 'unknown',
    qid: null,
    wikidataUrl: null,
    coord: null,
    distanceFromGazetteerKm: null,
    names: { ro: null, hu: null, en: null, native: [], historical: [], aliasesRo: [], aliasesHu: [], aliasesDe: [] },
    admin: { commune: null, communeQid: null, county: null, countyRo: null, countyQid: null },
    dissolved: null,
    inception: null,
    replacedBy: null,
    population: null,
    instanceOf: [],
    candidates: allCands.map((c) => c.qid).sort(),
    evidence: picked.evidence,
    cached: fromCache
  };
  if (!picked.match) return base;
  const c = picked.match.c;
  const countyEntry = [...c.counties.entries()].find(([, l]) => fold((l.en || '').replace(/ county$/i, '')) === fold(t.county || '')) || [...c.counties.entries()][0] || null;
  const historical = c.officialNames.filter((o) => o.end).map((o) => ({ name: o.name, until: o.end.slice(0, 10) }));
  return {
    ...base,
    status: deriveStatus(c, t),
    qid: c.qid,
    wikidataUrl: 'https://www.wikidata.org/wiki/' + c.qid,
    coord: c.coord,
    distanceFromGazetteerKm: picked.match.km == null ? null : Number(picked.match.km.toFixed(1)),
    names: {
      ro: c.labelRo, hu: c.labelHu, en: c.labelEn,
      native: [...c.native].sort(),
      historical: historical.sort((a, b) => (a.until < b.until ? -1 : 1)),
      aliasesRo: [...c.aliasRo].sort(), aliasesHu: [...c.aliasHu].sort(), aliasesDe: [...c.aliasDe].sort()
    },
    admin: {
      commune: c.parentLabel, communeQid: c.parent,
      county: countyEntry ? countyEntry[1].en : null,
      countyRo: countyEntry ? countyEntry[1].ro : null,
      countyQid: countyEntry ? countyEntry[0] : null
    },
    dissolved: c.dissolved ? c.dissolved.slice(0, 10) : null,
    inception: c.inception ? c.inception.slice(0, 10) : null,
    replacedBy: c.replacedBy ? { qid: c.replacedBy, label: c.replacedByLabel } : null,
    population: latestPopulation(c.pops),
    instanceOf: [...c.inst].sort().map((q) => ({ qid: q, label: SETTLEMENT_CLASSES[q] || null })),
    matchedVia: [...c.via].sort()
  };
}

// ---------------------------------------------------------------- main

async function main() {
  let targets = loadTargets();
  if (ONLY) targets = targets.filter((t) => t.id.includes(ONLY));
  if (LIMIT) targets = targets.slice(0, LIMIT);
  if (!targets.length) {
    console.error('No targets: expected data/gazetteer.json (places[]) or data/places.json');
    process.exit(1);
  }
  const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')).villages || {} : {};
  const villages = ONLY || LIMIT ? { ...previous } : {};
  const counts = { existing: 0, renamed: 0, merged: 0, abandoned: 0, unknown: 0 };
  let network = 0;
  for (const [i, t] of targets.entries()) {
    let rec;
    try {
      const { fromCache, data } = await sparql(buildQuery(t));
      if (!fromCache) network++;
      const cands = groupCandidates(data.data.results.bindings);
      rec = record(t, pickCandidate(cands, t), cands, fromCache);
    } catch (err) {
      rec = record(t, { match: null, evidence: ['query failed: ' + err.message] }, [], false);
    }
    villages[t.id] = sortKeys(rec);
    counts[rec.status]++;
    process.stderr.write(`[${i + 1}/${targets.length}] ${rec.status.padEnd(9)} ${t.id}${rec.qid ? ' ' + rec.qid : ''}\n`);
  }
  const statusCounts = { existing: 0, renamed: 0, merged: 0, abandoned: 0, unknown: 0 };
  for (const v of Object.values(villages)) statusCounts[v.status]++;
  const out = {
    _meta: {
      title: 'Village existence and naming, derived from Wikidata',
      generatedAt: new Date().toISOString().slice(0, 10),
      generator: 'geo/enrich-wikidata.mjs',
      source: 'Wikidata SPARQL endpoint (https://query.wikidata.org/sparql), data CC0 1.0',
      attribution: 'Village names, coordinates, administrative units and status: Wikidata contributors (CC0)',
      statusValues: {
        existing: 'matched item is a current settlement with the same Romanian name',
        renamed: 'matched item has a former official name (P1448 with end time) or its current Romanian label differs from the gazetteer name',
        merged: 'matched item has a replaced-by (P1366) statement',
        abandoned: 'matched item has a dissolved date (P576) or is an instance of abandoned village / ghost town / destroyed settlement',
        unknown: 'no confident match; evidence lists the candidates and why they were rejected. Never guessed.'
      },
      matching: 'label@ro or alias@ro = modern name, or label@hu / alias@hu = historical name, restricted to P17 = country; candidates scored by county (P131* to a county of Romania), distance from the gazetteer coordinate (<= 10 km strong, <= 40 km weak, further rejected), settlement type and which label matched; ties and low scores are unknown.',
      idNote: 'Keys are gazetteer ids: <country>/<region>/<county-slug>/<name-slug>, the same shape as place.schema.json ids. When data/places.json exists its village ids are used directly.',
      counts: statusCounts,
      targets: Object.keys(villages).length,
      networkRequests: network
    },
    villages: sortKeys(villages)
  };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  console.log(JSON.stringify({ written: OUT, counts: statusCounts, targets: out._meta.targets, networkRequests: network }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
