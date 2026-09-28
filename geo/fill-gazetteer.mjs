#!/usr/bin/env node
// Adds missing present-day-Romanian localities to data/gazetteer.json with coordinates
// from Wikidata. Inputs: curated journey stops with placeId null and country RO
// (data/journeys-curated.json) and the list in docs/JOURNEY-SOURCES.md section 6.
//
//   node geo/fill-gazetteer.mjs            # resolve and append; prints a summary
//   node geo/fill-gazetteer.mjs --dry-run  # resolve only, do not write the gazetteer
//
// Resolution (never guesses): (1) exact label@ro = modern name or label@hu = historical
// name, P17 Romania, human settlement, whose P131* county equals the target county ->
// confidence high; (2) settlements within 20 km of the county centroid whose ro/hu
// label/alias folds to the name -> medium; (3) the same within 80 km (a county is wider
// than 20 km) -> low, only if the item's county is unknown or equal to the target.
// Anything else stays unresolved and is listed.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY && !process.env.BARTON_NO_REEXEC) {
  const r = spawnSync(process.execPath, process.argv.slice(1), { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1', BARTON_NO_REEXEC: '1' } });
  process.exit(r.status ?? 1);
}

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const GAZ = join(ROOT, 'data', 'gazetteer.json');
const CURATED = join(ROOT, 'data', 'journeys-curated.json');
const SOURCES_MD = join(ROOT, 'docs', 'JOURNEY-SOURCES.md');
const CACHE = join(HERE, 'cache', 'wikidata');
const ENDPOINT = 'https://query.wikidata.org/sparql';
const UA = 'BartonViewer/0.1 (gazetteer fill; tsaar@maltandbrew.com)';
const DRY = process.argv.includes('--dry-run');

const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (s) => fold(s).replace(/ /g, '-');
const km = (a, b, c, d) => { const r = (x) => (x * Math.PI) / 180; const h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2; return 2 * 6371 * Math.asin(Math.sqrt(h)); };
const sq = (v) => '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
const REGION_BY_COUNTY = { Bihor: 'Crisana', Arad: 'Crisana', 'Satu Mare': 'Crisana', 'Sălaj': 'Crisana', 'Timiș': 'Banat', 'Caraș-Severin': 'Banat', 'Maramureș': 'Maramures' };
const HIST_COUNTY = { Bihor: 'Bihar', Cluj: 'Kolozs', Alba: 'Alsó-Fehér', 'Maramureș': 'Máramaros', 'Timiș': 'Temes', Arad: 'Arad', Hunedoara: 'Hunyad', 'Mureș': 'Maros-Torda', 'Bistrița-Năsăud': 'Beszterce-Naszód', 'Satu Mare': 'Szatmár', 'Caraș-Severin': 'Krassó-Szörény', Harghita: 'Csík', 'Sălaj': 'Szilágy' };

let last = 0;
async function sparql(q) {
  const f = join(CACHE, createHash('sha1').update(q).digest('hex') + '.json');
  if (existsSync(f)) return JSON.parse(readFileSync(f, 'utf8')).data;
  const w = last + 1000 - Date.now(); if (w > 0) await new Promise((r) => setTimeout(r, w)); last = Date.now();
  const res = await fetch(ENDPOINT + '?format=json&query=' + encodeURIComponent(q), { headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' } });
  if (!res.ok) throw new Error('Wikidata HTTP ' + res.status);
  const data = await res.json();
  mkdirSync(CACHE, { recursive: true }); writeFileSync(f, JSON.stringify({ query: q, fetchedAt: new Date().toISOString(), data }));
  return data;
}
const FIELDS = `
  ?item wdt:P17 wd:Q218 . ?item wdt:P31 ?inst . FILTER EXISTS { ?inst wdt:P279* wd:Q486972 }
  OPTIONAL { ?item wdt:P625 ?coord }
  OPTIONAL { ?item rdfs:label ?labelRo FILTER(LANG(?labelRo) = "ro") }
  OPTIONAL { ?item rdfs:label ?labelHu FILTER(LANG(?labelHu) = "hu") }
  OPTIONAL { ?item skos:altLabel ?aliasRo FILTER(LANG(?aliasRo) = "ro") }
  OPTIONAL { ?item skos:altLabel ?aliasHu FILTER(LANG(?aliasHu) = "hu") }
  OPTIONAL { ?item wdt:P131* ?county . ?county wdt:P31 wd:Q1776764 . ?county rdfs:label ?countyLabel FILTER(LANG(?countyLabel) = "en") }`;
const SELECT = 'SELECT ?item ?coord ?labelRo ?labelHu ?aliasRo ?aliasHu ?countyLabel WHERE {';
function group(bindings) {
  const m = new Map();
  for (const b of bindings) {
    const id = b.item.value.replace(/.*\//, '');
    const it = m.get(id) || { qid: id, coord: null, labelRo: null, labelHu: null, names: new Set(), county: null };
    const c = b.coord && /Point\(([-\d.]+) ([-\d.]+)\)/.exec(b.coord.value); if (c && !it.coord) it.coord = { lng: +c[1], lat: +c[2] };
    it.labelRo = it.labelRo || (b.labelRo && b.labelRo.value); it.labelHu = it.labelHu || (b.labelHu && b.labelHu.value);
    for (const k of ['labelRo', 'labelHu', 'aliasRo', 'aliasHu']) if (b[k]) it.names.add(fold(b[k].value));
    if (b.countyLabel) it.county = b.countyLabel.value.replace(/ County$/i, '');
    m.set(id, it);
  }
  return [...m.values()];
}

async function resolveOne(t, counties) {
  const modern = t.modern.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  const wanted = new Set([fold(modern), fold(t.hist)].filter(Boolean));
  const targetCounties = t.counties.map(fold);
  // stage 1: exact labels
  const q1 = `${SELECT}
  { ?item rdfs:label ${sq(modern)}@ro } UNION { ?item skos:altLabel ${sq(modern)}@ro }${t.hist ? ` UNION { ?item rdfs:label ${sq(t.hist)}@hu } UNION { ?item skos:altLabel ${sq(t.hist)}@hu }` : ''}${FIELDS}
} LIMIT 200`;
  let items = group((await sparql(q1)).results.bindings).filter((i) => i.coord);
  let hits = items.filter((i) => i.county && targetCounties.includes(fold(i.county)));
  if (hits.length === 1) return { ...hits[0], confidence: 'high', how: 'exact label + county' };
  if (hits.length > 1) return { unresolved: `ambiguous exact matches in county: ${hits.map((h) => h.qid).join(', ')}` };
  // stage 2/3: around each target county centroid
  for (const [radius, conf] of [[20, 'medium'], [80, 'low']]) {
    for (const cname of t.counties) {
      const c = counties.find((x) => fold(x.name) === fold(cname)); if (!c) continue;
      const q2 = `${SELECT}
  SERVICE wikibase:around { ?item wdt:P625 ?coord . bd:serviceParam wikibase:center "Point(${c.lng} ${c.lat})"^^geo:wktLiteral . bd:serviceParam wikibase:radius "${radius}" . }${FIELDS}
} LIMIT 6000`;
      let data;
      try { data = await sparql(q2); } catch (e) { return { unresolved: 'around query failed: ' + e.message }; }
      const near = group(data.results.bindings).filter((i) => i.coord && [...i.names].some((n) => wanted.has(n)) && (!i.county || targetCounties.includes(fold(i.county))));
      if (near.length === 1) return { ...near[0], confidence: conf, how: `folded name within ${radius} km of ${c.name} centroid` };
      if (near.length > 1) return { unresolved: `ambiguous within ${radius} km of ${c.name}: ${near.map((h) => h.qid).join(', ')}` };
    }
  }
  // A single settlement in all of Romania with this exact label: the identity is not in
  // doubt, only the list's county grouping was; accept with low confidence and say so.
  if (items.length === 1 && items[0].county) return { ...items[0], confidence: 'low', how: `unique exact label in Romania; county ${items[0].county} differs from the list's grouping (${t.counties.join('/')})` };
  return { unresolved: items.length ? `label matches only outside the county: ${items.map((i) => i.qid + ' (' + (i.county || '?') + ')').join(', ')}` : 'no settlement with this label in Romania' };
}

function targets(gaz) {
  const countyNames = gaz.counties.map((c) => c.name);
  const canon = (c) => countyNames.find((n) => fold(n) === fold(c)) || null;
  const list = new Map();
  const add = (hist, modern, counties, from) => {
    if (!modern) modern = hist;
    const key = fold(modern) + '|' + counties.map(fold).sort().join('/');
    if (!list.has(key)) list.set(key, { hist, modern, counties, from: [] });
    list.get(key).from.push(from);
  };
  if (existsSync(CURATED)) {
    for (const j of JSON.parse(readFileSync(CURATED, 'utf8')).journeys) for (const s of j.stops) {
      if (s.placeId || s.country !== 'RO') continue;
      const c = canon(s.county); if (!c) continue;
      add(s.placeName.replace(/\s*\([^)]*\)\s*/g, ' ').trim(), s.modernName, [c], `${j.id} stop ${s.seq}`);
    }
  }
  if (existsSync(SOURCES_MD)) {
    const txt = readFileSync(SOURCES_MD, 'utf8');
    const i = txt.indexOf('## 6.'); const e = txt.indexOf('## 7.');
    let body = txt.slice(i, e).split('\n\n')[1].replace(/\n/g, ' ');
    body = body.slice(0, body.indexOf('These need gazetteer'));
    for (const grp of body.split(/\s*(?<![A-Za-z/])(?=[A-Z][a-z]+(?:\/[A-Z][a-z]+)?: )/)) {
      const m = grp.trim().match(/^([A-Za-z/]+): (.*)$/); if (!m) continue;
      const cs = m[1].split('/').map((x) => canon(x === 'Bistrita' ? 'Bistrița-Năsăud' : x)).filter(Boolean);
      for (const it of m[2].trim().replace(/\.$/, '').split(/,\s*(?![^()]*\))/)) {
        const mm = it.trim().match(/^([^()]+?)\s*(?:\(([^)]+)\))?$/); if (!mm) continue;
        const modern = (mm[2] || '').replace(/;.*$/, '').replace(/,\s*[A-Z][a-z]+$/, '').trim() || null;
        add(mm[1].trim(), modern, cs, 'JOURNEY-SOURCES section 6');
      }
    }
  }
  // drop those already in the gazetteer (same folded modern or historical name and county)
  const have = new Set();
  for (const p of gaz.places) for (const n of [p.name, p.nameHistorical, ...(p.aliases || [])]) if (n) have.add(fold(n) + '|' + fold(p.county));
  return [...list.values()].filter((t) => !t.counties.some((c) => have.has(fold(t.modern.replace(/\s*\([^)]*\)\s*/g, ' ')) + '|' + fold(c)) || have.has(fold(t.hist) + '|' + fold(c))));
}

async function main() {
  const gaz = JSON.parse(readFileSync(GAZ, 'utf8'));
  const ts = targets(gaz);
  const added = []; const unresolved = [];
  for (const [i, t] of ts.entries()) {
    let r;
    try { r = await resolveOne(t, gaz.counties); } catch (e) { r = { unresolved: 'query failed: ' + e.message }; }
    if (r.unresolved) { unresolved.push({ ...t, reason: r.unresolved }); process.stderr.write(`[${i + 1}/${ts.length}] unresolved ${t.modern} (${t.counties.join('/')}): ${r.unresolved}\n`); continue; }
    const county = r.county && gaz.counties.find((c) => fold(c.name) === fold(r.county)) ? gaz.counties.find((c) => fold(c.name) === fold(r.county)).name : t.counties[0];
    const name = r.labelRo || t.modern;
    const entry = {
      aliases: [], confidence: r.confidence, coordNote: `Wikidata P625 (${r.qid}); ${r.how}`, coordSource: 'wikidata', country: 'RO', county,
      countyHistorical: HIST_COUNTY[county] || null, lat: Number(r.coord.lat.toFixed(4)), lng: Number(r.coord.lng.toFixed(4)), name,
      nameHistorical: r.labelHu || t.hist || null, region: REGION_BY_COUNTY[county] || 'Transylvania', type: 'village', wikidata: r.qid,
      addedBy: 'geo/fill-gazetteer.mjs', addedFor: t.from
    };
    if (t.hist && entry.nameHistorical && fold(t.hist) !== fold(entry.nameHistorical)) entry.aliases.push(t.hist);
    added.push(entry);
    process.stderr.write(`[${i + 1}/${ts.length}] ${r.confidence.padEnd(6)} ${name} (${county}) ${r.qid}\n`);
  }
  if (!DRY && added.length) {
    gaz.places.push(...added);
    const sortedBefore = gaz.places.slice(0, gaz.places.length - added.length).every((p, i, a) => i === 0 || (a[i - 1].county + '|' + a[i - 1].name).localeCompare(p.county + '|' + p.name) <= 0);
    if (sortedBefore) gaz.places.sort((a, b) => (a.county + '|' + a.name).localeCompare(b.county + '|' + b.name));
    gaz._meta.placeCount = gaz.places.length;
    gaz._meta.wikidataFillNote = 'Entries with coordSource "wikidata" were added by geo/fill-gazetteer.mjs for journey stops missing from the gazetteer: coordinates from Wikidata P625 (CC0); confidence high = exact label and county match, medium = folded-name match within 20 km of the county centroid, low = within 80 km.';
    writeFileSync(GAZ, JSON.stringify(gaz, null, 2) + '\n');
  }
  const idOf = (e) => `ro/${slug(e.region)}/${slug(e.county)}/${slug(e.name)}`;
  console.log(JSON.stringify({ targets: ts.length, added: added.length, byConfidence: added.reduce((m, e) => ((m[e.confidence] = (m[e.confidence] || 0) + 1), m), {}), unresolved: unresolved.map((u) => `${u.hist} / ${u.modern} (${u.counties.join('/')}): ${u.reason}`), addedIds: added.map(idOf), dryRun: DRY }, null, 1));
}
main().catch((e) => { console.error(e); process.exit(1); });
