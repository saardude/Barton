#!/usr/bin/env node
// Derives Bartok's field trips (journeys).
// Specification: docs/JOURNEY-SPEC.md. Output schema: data/schema/journey.schema.json.
//
// Primary source: data/collections-gyuj.json, the curated trip index of
// bartok-gyujtesek.zti.hu (101 entries, produced by geo/parse-gyuj-collections.mjs).
// Records of data/songs.json are attached to their collection through the record URL
// (/en/browse/<collection>/<record>). Records that belong to no collection (the other two
// sites) fall back to the date-gap derivation (trips = runs of dated records with no gap
// larger than gapDays and no jump larger than jumpKm on consecutive days).
//
//   node geo/derive-journeys.mjs                       # data/songs.json (+ collections) -> data/journeys.json
//   node geo/derive-journeys.mjs --in qa/fixtures/songs.sample.json --out /tmp/j.json
//   node geo/derive-journeys.mjs --gap 10 --jump 250 --collector "bart[oó]k" --no-collections
//
// Deterministic: sorted keys, stable ids, no randomness, no network.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const GENERATOR = 'geo/derive-journeys.mjs';

export const DEFAULT_CONFIG = {
  collectorPattern: /bart[oó]k/i,
  gapDays: 10,
  jumpKm: 250,
  departure: {
    name: 'Budapest',
    lat: 47.4979,
    lng: 19.0402,
    confidence: 'assumed',
    note: "Default departure point: Budapest, Bartok's home base from 1907 (Academy of Music). Not documented per trip; the UI labels it as assumed."
  },
  collections: null // parsed collections-gyuj.json, or null to disable
};

// ------------------------------------------------------------------ helpers

export function fold(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
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
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]));
  return v;
}
const pad = (n) => String(n).padStart(2, '0');
export function precisionOf(c) {
  if (!c || c.year == null) return null;
  if (c.month == null) return 'year';
  if (c.day == null) return 'month';
  return 'day';
}
export function isoOf(c) {
  const p = precisionOf(c);
  if (!p) return null;
  if (p === 'year') return String(c.year);
  if (p === 'month') return `${c.year}-${pad(c.month)}`;
  return `${c.year}-${pad(c.month)}-${pad(c.day)}`;
}
function dayNumber(c) {
  return Math.round(Date.UTC(c.year, c.month - 1, c.day) / 86400000);
}
function dayNumberIso(s) {
  const [y, m, d] = s.split('-').map(Number);
  return Math.round(Date.UTC(y, (m || 1) - 1, d || 1) / 86400000);
}
function stopKey(loc) {
  return loc.placeId || (loc.village ? `v:${fold(loc.village)}|${fold(loc.county)}` : loc.villageHistorical ? `h:${fold(loc.villageHistorical)}|${fold(loc.countyHistorical)}` : `raw:${fold(loc.raw)}`);
}
function addCount(map, key) {
  if (key == null || key === '') return;
  map[key] = (map[key] || 0) + 1;
}
const COLL_URL = /bartok-gyujtesek\.zti\.hu\/(?:en|hu)\/browse\/(\d+)(?:\/\d+)?/;
const COLL_ID = /^gyuj-(\d+)-\d+$/;
/** Collection membership: the merged record's `journey.collectionId`, then any gyuj alternate id/url, then the record's own url/id. */
export function collectionIdOf(song) {
  if (song.journey && song.journey.collectionId != null) return String(song.journey.collectionId);
  if (song.journey && song.journey.url) { const m = String(song.journey.url).match(COLL_URL); if (m) return m[1]; }
  for (const a of (song.source && song.source.alternates) || []) {
    const m = String(a.id || '').match(COLL_ID) || String(a.url || '').match(COLL_URL);
    if (m) return m[1];
  }
  const m = String(song.source && song.source.url || '').match(COLL_URL) || String(song.id || '').match(COLL_ID);
  return m ? m[1] : null;
}

// Records printed in the Rumanian Folk Music volumes (site "rfm") carry no collection id;
// only they are attached by date and county: to an index entry when exactly one entry overlaps the record's month
// and names the record's county (modern or historical) or a region containing it.
const REGION_COUNTIES = {
  Banat: ['Timiș', 'Caraș-Severin', 'Arad'], 'Transylvanian Plain': ['Cluj', 'Mureș', 'Bistrița-Năsăud'],
  'Land of the Moți (Munții Apuseni)': ['Alba', 'Cluj', 'Bihor', 'Arad', 'Hunedoara'], 'Someșul Mic valley': ['Cluj'],
  'Upper Mureș valley': ['Mureș'], 'Niraj valley': ['Mureș'], 'Crișul Negru valley': ['Bihor'], 'Upper Crișul Negru valley (Beiuș and Vașcău districts)': ['Bihor']
};
function monthWindow(c) {
  const y = c.year, m = c.month;
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return [`${y}-${pad(m)}-01`, `${y}-${pad(m)}-${pad(last)}`];
}
function isoEndOf(iso) {
  if (/^\d{4}$/.test(iso)) return iso + '-12-31';
  if (/^\d{4}-\d{2}$/.test(iso)) { const [y, m] = iso.split('-').map(Number); return `${iso}-${pad(new Date(Date.UTC(y, m, 0)).getUTCDate())}`; }
  return iso;
}
function isoStartOf(iso) { return /^\d{4}$/.test(iso) ? iso + '-01-01' : /^\d{4}-\d{2}$/.test(iso) ? iso + '-01' : iso; }
function placeCoversCounty(pl, county, countyHist) {
  if (county && pl.county === county) return true;
  if (countyHist && pl.countyHistorical && fold(pl.countyHistorical).split(' / ').some((h) => h === fold(countyHist)) ) return true;
  if (countyHist && pl.countyHistorical && fold(pl.countyHistorical).includes(fold(countyHist))) return true;
  const rc = REGION_COUNTIES[pl.name];
  return !!(rc && county && rc.includes(county));
}
export function attachByDateCounty(song, collections) {
  const c = song.collected;
  if (!c || c.year == null || c.month == null) return null;
  const [ws, we] = c.day ? [isoOf(c), isoOf(c)] : monthWindow(c);
  const county = song.location.county, countyHist = song.location.countyHistorical;
  if (!county && !countyHist) return null;
  const hits = collections.filter((coll) => isoStartOf(coll.date.start) <= we && isoEndOf(coll.date.end) >= ws && coll.places.some((pl) => placeCoversCounty(pl, county, countyHist)));
  if (!hits.length) return null;
  if (hits.length === 1) return hits[0].id;
  // several entries in the same month and county: prefer the entry whose place is the county/region (the umbrella), else the earliest id
  const umbrella = hits.filter((coll) => coll.places.some((pl) => pl.kind === 'county' || pl.kind === 'region'));
  return (umbrella.length ? umbrella : hits).sort((a, b) => +a.id - +b.id)[0].id;
}
const PRECISION_RANK = { day: 0, phrase: 1, month: 2, season: 3, year: 4 };

// ------------------------------------------------------------------ stops and facts (shared)

function groupStops(records) {
  const byStop = new Map();
  for (const s of records) {
    const k = stopKey(s.location);
    if (!byStop.has(k)) byStop.set(k, { key: k, loc: s.location, songs: [], dates: [] });
    const st = byStop.get(k);
    st.songs.push(s);
    st.dates.push(isoOf(s.collected) || '');
  }
  for (const st of byStop.values()) st.dates.sort();
  return [...byStop.values()];
}

function stopsFromRecords(records, kind, cfg) {
  const stops = groupStops(records);
  if (kind === 'route') stops.sort((a, b) => (a.dates[0] < b.dates[0] ? -1 : a.dates[0] > b.dates[0] ? 1 : a.key < b.key ? -1 : 1));
  else stops.sort((a, b) => (fold(a.loc.village || a.loc.villageHistorical || a.loc.raw) < fold(b.loc.village || b.loc.villageHistorical || b.loc.raw) ? -1 : 1));
  let prevPt = kind === 'route' ? { lat: cfg.departure.lat, lng: cfg.departure.lng } : null;
  let distance = 0;
  let anyKm = false;
  const out = stops.map((st, i) => {
    const loc = st.loc;
    const resolved = loc.lat != null && loc.lng != null;
    let km = null;
    if (kind === 'route' && resolved && prevPt) {
      km = Number(haversineKm(prevPt.lat, prevPt.lng, loc.lat, loc.lng).toFixed(1));
      distance += km;
      anyKm = true;
    }
    if (resolved && kind === 'route') prevPt = { lat: loc.lat, lng: loc.lng };
    return {
      seq: i + 1,
      placeId: loc.placeId ?? null,
      village: loc.village ?? null,
      villageHistorical: loc.villageHistorical ?? null,
      county: loc.county ?? null,
      countyHistorical: loc.countyHistorical ?? null,
      country: loc.country ?? null,
      lat: resolved ? loc.lat : null,
      lng: resolved ? loc.lng : null,
      arrival: st.dates[0] || null,
      departure: st.dates[st.dates.length - 1] || null,
      recordCount: st.songs.length,
      songIds: st.songs.map((s) => s.id).sort(),
      kmFromPrevious: km,
      locationConfidence: resolved ? 'resolved' : 'unresolved'
    };
  });
  return { stops: out, distanceKm: kind === 'route' && anyKm ? Number(distance.toFixed(1)) : null };
}

function stopsFromLabel(coll) {
  return coll.places.map((p, i) => ({
    seq: i + 1,
    placeId: p.placeId ?? null,
    village: p.name ?? p.text ?? null,
    villageHistorical: p.nameHu ?? (p.resolution === 'unresolved' || p.resolution === 'ambiguous' ? p.text : null),
    county: p.county ?? null,
    countyHistorical: p.countyHistorical ?? null,
    country: p.nowIn ?? null,
    lat: p.lat ?? null,
    lng: p.lng ?? null,
    arrival: coll.date.start,
    departure: coll.date.end,
    recordCount: 0,
    songIds: [],
    kmFromPrevious: null,
    locationConfidence: p.resolution === 'gazetteer' ? 'label' : p.resolution === 'region-table' ? 'label-region' : 'unresolved'
  }));
}

function facts(records, stops) {
  const f = { counties: new Set(), countiesHistorical: new Set(), ethnicGroups: {}, instruments: {}, genres: {}, performers: new Set() };
  for (const s of records) {
    if (s.location.county) f.counties.add(s.location.county);
    if (s.location.countyHistorical) f.countiesHistorical.add(s.location.countyHistorical);
    addCount(f.ethnicGroups, s.performer && s.performer.ethnicity);
    for (const ins of s.instrument || []) addCount(f.instruments, ins);
    addCount(f.genres, s.genre);
    if (s.performer && s.performer.name) f.performers.add(fold(s.performer.name));
  }
  for (const st of stops) {
    if (st.county) f.counties.add(st.county);
    if (st.countyHistorical) f.countiesHistorical.add(st.countyHistorical);
  }
  return {
    villages: stops.filter((st) => st.placeId || st.village).length,
    counties: [...f.counties].sort(),
    countiesHistorical: [...f.countiesHistorical].sort(),
    ethnicGroups: f.ethnicGroups,
    instruments: f.instruments,
    genres: f.genres,
    performers: f.performers.size
  };
}

// ------------------------------------------------------------------ primary: gyuj collections

function collectionJourney(coll, records, cfg) {
  const allDay = records.length > 0 && records.every((s) => precisionOf(s.collected) === 'day');
  const kind = allDay ? 'route' : 'cluster';
  const fromRecords = records.length ? stopsFromRecords(records, kind, cfg) : null;
  const stops = fromRecords ? fromRecords.stops : stopsFromLabel(coll);
  const recDates = records.map((s) => isoOf(s.collected)).filter(Boolean).sort();
  const dateStart = coll.date.start;
  const dateEnd = coll.date.end;
  const days = /^\d{4}-\d{2}-\d{2}$/.test(dateStart) && /^\d{4}-\d{2}-\d{2}$/.test(dateEnd) ? dayNumberIso(dateEnd) - dayNumberIso(dateStart) + 1 : null;
  return sortKeys({
    id: coll.journeyId,
    derivedFrom: 'gyuj-collections',
    kind,
    collector: records[0] ? records[0].collector : 'Bartok Bela',
    label: coll.label,
    labelDateRaw: coll.dateRaw,
    labelPlaceRaw: coll.placeRaw,
    sourceUrl: coll.url,
    countOnline: coll.countOnline,
    recordsOnline: coll.hasOnlineRecords,
    dateStart,
    dateEnd,
    dateConfidence: coll.date.precision,
    datePeriods: coll.date.periods,
    recordDateRange: recDates.length ? { start: recDates[0], end: recDates[recDates.length - 1] } : null,
    days,
    departure: { ...cfg.departure },
    stops,
    distanceKm: fromRecords ? fromRecords.distanceKm : null,
    recordCount: records.length,
    facts: facts(records, stops),
    songIds: records.map((s) => s.id).sort(),
    nowIn: coll.nowIn,
    romanianMaterial: coll.romanianMaterial,
    derivation: {
      gapDays: cfg.gapDays, jumpKm: cfg.jumpKm, splitReasons: ['collection'], generator: GENERATOR,
      attachedRecords: {
        byMembership: records.filter((s) => (cfg._attachment || new Map()).get(s.id) !== 'date-county').length,
        byDateCounty: records.filter((s) => (cfg._attachment || new Map()).get(s.id) === 'date-county').length
      }
    }
  });
}

// ------------------------------------------------------------------ fallback: date-gap derivation

function gapJourneys(dated, cfg) {
  const full = dated.filter((s) => precisionOf(s.collected) === 'day')
    .map((s) => ({ s, day: dayNumber(s.collected), key: stopKey(s.location) }))
    .sort((a, b) => a.day - b.day || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0) || (a.s.id < b.s.id ? -1 : 1));
  const routes = [];
  let current = null;
  let prev = null;
  for (const r of full) {
    const reasons = [];
    if (!current) reasons.push('start');
    else {
      if (r.day - prev.day > cfg.gapDays) reasons.push('gap');
      const a = prev.s.location, b = r.s.location;
      if (r.day - prev.day <= 1 && r.key !== prev.key && a.lat != null && b.lat != null && haversineKm(a.lat, a.lng, b.lat, b.lng) > cfg.jumpKm) reasons.push('jump');
    }
    if (reasons.length) {
      current = { records: [], reasons };
      routes.push(current);
    }
    current.records.push(r.s);
    prev = r;
  }
  const fuzzy = new Map();
  for (const s of dated) {
    const p = precisionOf(s.collected);
    if (p === 'day') continue;
    const k = p === 'month' ? `${s.collected.year}-${pad(s.collected.month)}` : `${s.collected.year}-00`;
    if (!fuzzy.has(k)) fuzzy.set(k, { records: [], reasons: [p === 'month' ? 'precision' : 'year'], precision: p });
    fuzzy.get(k).records.push(s);
  }
  const groups = [
    ...routes.map((g) => ({ ...g, kind: 'route', precision: 'day' })),
    ...[...fuzzy.values()].map((g) => ({ ...g, kind: 'cluster' }))
  ].map((g) => {
    const dates = g.records.map((s) => isoOf(s.collected)).sort();
    return { ...g, dateStart: dates[0], dateEnd: dates[dates.length - 1] };
  }).sort((a, b) => (a.dateStart < b.dateStart ? -1 : a.dateStart > b.dateStart ? 1 : a.kind === 'route' ? -1 : 1));
  const seqByMonth = {};
  return groups.map((g) => {
    const ym = g.precision === 'year' ? `${g.dateStart.slice(0, 4)}-00` : g.dateStart.slice(0, 7);
    seqByMonth[ym] = (seqByMonth[ym] || 0) + 1;
    const { stops, distanceKm } = stopsFromRecords(g.records, g.kind, cfg);
    const sorted = g.kind === 'route' ? g.records.map((s) => s.collected).sort((a, b) => dayNumber(a) - dayNumber(b)) : null;
    return sortKeys({
      id: `J-${ym}-${pad(seqByMonth[ym])}`,
      derivedFrom: 'date-gap',
      kind: g.kind,
      collector: g.records[0].collector,
      label: null,
      labelDateRaw: null,
      labelPlaceRaw: null,
      sourceUrl: null,
      countOnline: null,
      recordsOnline: true,
      dateStart: g.dateStart,
      dateEnd: g.dateEnd,
      dateConfidence: g.precision,
      datePeriods: [{ raw: null, start: g.dateStart, end: g.dateEnd, precision: g.precision, qualifiers: [], uncertain: false }],
      recordDateRange: { start: g.dateStart, end: g.dateEnd },
      days: sorted ? dayNumber(sorted.at(-1)) - dayNumber(sorted[0]) + 1 : null,
      departure: { ...cfg.departure },
      stops,
      distanceKm,
      recordCount: g.records.length,
      facts: facts(g.records, stops),
      songIds: g.records.map((s) => s.id).sort(),
      nowIn: [...new Set(g.records.map((s) => s.location.country).filter(Boolean))].sort(),
      romanianMaterial: null,
      derivation: { gapDays: cfg.gapDays, jumpKm: cfg.jumpKm, splitReasons: g.reasons, generator: GENERATOR }
    });
  });
}

// ------------------------------------------------------------------ entry point

export function deriveJourneys(songs, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config, departure: { ...DEFAULT_CONFIG.departure, ...(config.departure || {}) } };
  const collections = cfg.collections ? cfg.collections.collections : [];
  const collIds = new Set(collections.map((c) => c.id));
  // Records of an index entry are Bartok's by definition (the index is his collecting
  // trips), even when the record page prints no collector; count how often we rely on that.
  let collectorAssumedFromIndex = 0;
  let rfmRecords = 0;
  const bartok = songs.filter((s) => {
    if (s.source && s.source.site === 'rfm') { rfmRecords++; return true; } // Bartok's own printed collection
    if (s.collector && cfg.collectorPattern.test(s.collector)) return true;
    if (!s.collector && collIds.has(collectionIdOf(s))) { collectorAssumedFromIndex++; return true; }
    return false;
  });
  const byColl = new Map();
  const rest = [];
  let orphanCollectionRecords = 0;
  let attachedByDateCounty = 0;
  const attachment = new Map(); // song id -> 'membership' | 'date-county'
  for (const s of bartok) {
    let cid = collectionIdOf(s);
    let how = 'membership';
    if (!cid && s.source && s.source.site === 'rfm') { cid = attachByDateCounty(s, collections); how = 'date-county'; }
    if (cid && collIds.has(cid)) {
      if (!byColl.has(cid)) byColl.set(cid, []);
      byColl.get(cid).push(s);
      attachment.set(s.id, how);
      if (how === 'date-county') attachedByDateCounty++;
    } else {
      if (cid) orphanCollectionRecords++;
      rest.push(s);
    }
  }
  cfg._attachment = attachment;
  const primary = collections.map((c) => collectionJourney(c, (byColl.get(c.id) || []).sort((a, b) => (a.id < b.id ? -1 : 1)), cfg));
  const dated = rest.filter((s) => s.collected && s.collected.year != null);
  const fallback = gapJourneys(dated, cfg);
  const journeys = [...primary, ...fallback].sort((a, b) => (a.dateStart < b.dateStart ? -1 : a.dateStart > b.dateStart ? 1 : a.id < b.id ? -1 : 1));
  return {
    _meta: {
      title: "Bartok's field trips: the bartok-gyujtesek.zti.hu trip index, with records attached, plus date-gap derived trips for records outside that index",
      spec: 'docs/JOURNEY-SPEC.md',
      schema: 'data/schema/journey.schema.json',
      generator: GENERATOR,
      sources: {
        primary: cfg.collections ? { file: 'data/collections-gyuj.json', ...cfg.collections._meta.source } : null,
        fallback: 'date-gap derivation over records with no collection'
      },
      config: { gapDays: cfg.gapDays, jumpKm: cfg.jumpKm, departure: cfg.departure, collectorPattern: String(cfg.collectorPattern) },
      counts: {
        inputRecords: songs.length,
        bartokRecords: bartok.length,
        collectorAssumedFromIndex,
        rfmRecords,
        attachedByDateCounty,
        recordsInCollections: bartok.length - rest.length,
        recordsOutsideCollections: rest.length,
        orphanCollectionRecords,
        recordsWithoutYear: rest.length - dated.length,
        collectionJourneys: primary.length,
        collectionJourneysWithRecords: primary.filter((j) => j.recordCount > 0).length,
        collectionJourneysWithoutOnlineRecords: primary.filter((j) => !j.recordsOnline).length,
        gapJourneys: fallback.length,
        routes: journeys.filter((j) => j.kind === 'route').length,
        clusters: journeys.filter((j) => j.kind === 'cluster').length
      },
      note: 'A journey is either an entry of the curated trip index (derivedFrom gyuj-collections; label verbatim) or a run of dated records (derivedFrom date-gap). Stops are where records were made, or, for index entries without online records, the places named in the label. Travel between stops, the departure point and the return are inferred and labelled as such.'
    },
    journeys
  };
}

// ------------------------------------------------------------------ CLI

function main() {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(n); return i === -1 ? d : args[i + 1]; };
  const inPath = resolve(opt('--in', join(ROOT, 'data', 'songs.json')));
  const outPath = resolve(opt('--out', join(ROOT, 'data', 'journeys.json')));
  const collPath = resolve(opt('--collections', join(ROOT, 'data', 'collections-gyuj.json')));
  let songs = [];
  if (existsSync(inPath)) {
    const raw = JSON.parse(readFileSync(inPath, 'utf8'));
    songs = Array.isArray(raw) ? raw : raw.songs || [];
  } else {
    console.error(`No records at ${inPath}; journeys will come from the collection index only.`);
  }
  const cfg = { gapDays: Number(opt('--gap', DEFAULT_CONFIG.gapDays)), jumpKm: Number(opt('--jump', DEFAULT_CONFIG.jumpKm)) };
  const coll = opt('--collector', null);
  if (coll) cfg.collectorPattern = new RegExp(coll, 'i');
  if (!args.includes('--no-collections') && existsSync(collPath)) cfg.collections = JSON.parse(readFileSync(collPath, 'utf8'));
  if (!songs.length && !cfg.collections) {
    console.error('Nothing to derive from: no songs and no collections file.');
    process.exit(2);
  }
  const out = deriveJourneys(songs, cfg);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  console.log(JSON.stringify({ written: outPath, ...out._meta.counts }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
