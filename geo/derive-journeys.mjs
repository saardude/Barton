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
  collections: null, // parsed collections-gyuj.json, or null to disable
  curated: null, // parsed journeys-curated.json, or null to disable
  gazetteer: null // parsed gazetteer.json, used to place curated stops without placeId
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
    quality: 'index only',
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
      quality: 'dates only',
      derivation: { gapDays: cfg.gapDays, jumpKm: cfg.jumpKm, splitReasons: g.reasons, generator: GENERATOR }
    });
  });
}

// ------------------------------------------------------------------ curated layer (data/journeys-curated.json)

function qualityOf(curated) {
  if (!curated) return 'index only';
  const eq = String(curated.evidenceQuality || '');
  if (eq.startsWith('documented itinerary')) {
    return curated.datePrecision === 'day' && curated.stops.every((st) => st.confidence === 'documented') ? 'sourced itinerary' : 'documented itinerary';
  }
  return 'dates only';
}

/** gazetteer index: folded name / historical name / alias + folded county -> entry with id */
function gazetteerIndex(gaz) {
  const byKey = new Map();
  if (!gaz) return byKey;
  const REGION_BY_COUNTY = { Bihor: 'Crisana', Arad: 'Crisana', 'Satu Mare': 'Crisana', 'Sălaj': 'Crisana', 'Timiș': 'Banat', 'Caraș-Severin': 'Banat', 'Maramureș': 'Maramures' };
  const slug = (x) => fold(x).replace(/ /g, '-');
  for (const p of gaz.places || []) {
    const id = p.id || `${(p.country || 'xx').toLowerCase()}/${slug(p.region || REGION_BY_COUNTY[p.county] || 'transylvania')}/${slug(p.county || 'unresolved')}/${slug(p.name)}`;
    for (const n of [p.name, p.nameHistorical, ...(p.aliases || [])]) {
      if (!n) continue;
      const k = fold(n) + '|' + fold(p.county);
      if (!byKey.has(k)) byKey.set(k, []);
      if (!byKey.get(k).some((x) => x.id === id)) byKey.get(k).push({ ...p, id });
    }
  }
  return byKey;
}
function lookupGazetteer(gi, name, county) {
  if (!name || !county) return null;
  const hits = gi.get(fold(name.replace(/\s*\([^)]*\)\s*/g, ' ')) + '|' + fold(county)) || [];
  return hits.length === 1 ? hits[0] : null;
}

function conflictNotes(cur) {
  const notes = [];
  const eq = String(cur.evidenceQuality || '');
  const paren = eq.match(/\(([^)]+)\)/);
  if (paren) notes.push({ kind: 'evidence', text: `Curated evidence quality: ${eq}` });
  for (const st of cur.stops) {
    if (st.note && /\b(gives|differs|instead|however|conflict|disagree|but the|whereas|contradict|not visited|was not)\b/i.test(st.note)) notes.push({ kind: 'source-conflict', stopSeq: st.seq, text: st.note });
  }
  for (const src of cur.sources || []) if (src.note && /\b(conflict|differs|disagree|however|instead)\b/i.test(src.note)) notes.push({ kind: 'source-conflict', text: `${src.key}${src.locator ? ' ' + src.locator : ''}: ${src.note}` });
  if (cur.departure && cur.departure.note) notes.push({ kind: 'departure', text: cur.departure.note });
  if (cur.return && cur.return.note) notes.push({ kind: 'return', text: cur.return.note });
  return notes;
}

/** Build a journey from a curated entry, the index entries it covers and the attached records. */
function curatedJourney(cur, primaryColl, subsumed, records, cfg) {
  const gi = cfg._gazetteerIndex || new Map();
  const attachment = cfg._attachment || new Map();
  const kind = String(cur.evidenceQuality || '').startsWith('documented itinerary') ? 'route' : 'cluster';
  // curated stops in seq order, coordinates from the stop, else the gazetteer
  const stops = [...cur.stops].sort((a, b) => a.seq - b.seq).map((st) => {
    let placeId = st.placeId || null, lat = st.lat ?? null, lng = st.lng ?? null, placeIdSource = st.placeId ? 'curated' : null;
    if (!placeId && st.country === 'RO') {
      const g = lookupGazetteer(gi, st.modernName, st.county) || lookupGazetteer(gi, st.placeName, st.county);
      if (g) { placeId = g.id; placeIdSource = 'gazetteer-lookup'; if (lat == null) { lat = g.lat; lng = g.lng; } }
    } else if (placeId && lat == null) {
      const g = [...gi.values()].flat().find((x) => x.id === placeId);
      if (g) { lat = g.lat; lng = g.lng; }
    }
    return {
      seq: st.seq, curatedSeq: st.seq, placeId, placeIdSource, village: st.modernName || null, villageHistorical: st.placeName || null, placeIdNote: st.placeIdNote || null,
      county: st.county || null, countyHistorical: null, country: st.country || null, lat, lng,
      arrival: st.arrival || null, departure: st.departure || null, recordDateStart: null, recordDateEnd: null,
      confidence: st.confidence || 'inferred', note: st.note || null,
      recordCount: 0, songIds: [], kmFromPrevious: null, locationConfidence: lat != null ? 'resolved' : 'unresolved'
    };
  });
  // Route stops must be in date order. Where the curated seq disagrees with the dated order
  // (or mixes month- and day-precision dates), emit in date order, keep the source order in
  // curatedSeq and say so in notes; nothing is dropped.
  const orderNotes = [];
  if (kind === 'route') {
    const dated = stops.map((st, i) => ({ st, i, key: st.arrival ? isoStartOf(st.arrival) : null }));
    const sorted = [...dated].sort((a, b) => (a.key && b.key && a.key !== b.key ? (a.key < b.key ? -1 : 1) : a.i - b.i));
    if (sorted.some((x, i) => x.i !== i)) {
      orderNotes.push({ kind: 'source-conflict', text: `Curated stop order differs from the dated order for stops ${sorted.filter((x, i) => x.i !== i).map((x) => x.st.curatedSeq).join(', ')}; stops are emitted in date order and curatedSeq keeps the source order.` });
      stops.splice(0, stops.length, ...sorted.map((x, i) => ({ ...x.st, seq: i + 1 })));
    }
  }
  // attach records to curated stops by placeId, then by folded village name (+county when both known)
  const unplaced = [];
  for (const s of records) {
    const loc = s.location;
    let hit = stops.find((st) => st.placeId && loc.placeId && st.placeId === loc.placeId);
    if (!hit && loc.village) hit = stops.find((st) => st.village && fold(st.village) === fold(loc.village) && (!st.county || !loc.county || fold(st.county) === fold(loc.county)));
    if (!hit && loc.villageHistorical) hit = stops.find((st) => st.villageHistorical && fold(st.villageHistorical) === fold(loc.villageHistorical));
    if (hit) { hit.songIds.push(s.id); hit.recordCount++; } else unplaced.push(s);
  }
  // records at places the curated itinerary does not name become extra stops after the itinerary
  if (unplaced.length) {
    const extra = stopsFromRecords(unplaced, 'cluster', cfg).stops;
    for (const st of extra) stops.push({ ...st, seq: stops.length + 1, curatedSeq: null, placeIdSource: st.placeId ? 'record' : null, placeIdNote: null, confidence: 'inferred', note: 'From attached records; not named in the curated itinerary. Position in the route unknown; record dates in recordDateStart/recordDateEnd.', arrival: null, departure: null, recordDateStart: st.arrival, recordDateEnd: st.departure });
  }
  for (const st of stops) st.songIds.sort();
  // distances along the curated order
  let distance = 0, anyKm = false;
  let prev = cfg.departure.lat != null ? { lat: cfg.departure.lat, lng: cfg.departure.lng } : null;
  if (kind === 'route') for (const st of stops) {
    if (st.lat == null) continue;
    if (prev) { st.kmFromPrevious = Number(haversineKm(prev.lat, prev.lng, st.lat, st.lng).toFixed(1)); distance += st.kmFromPrevious; anyKm = true; }
    prev = { lat: st.lat, lng: st.lng };
  }
  const depPlace = cur.departure && cur.departure.place;
  const departure = depPlace
    ? { name: depPlace, lat: /budapest/i.test(depPlace) && !/^pozsony/i.test(depPlace) ? cfg.departure.lat : null, lng: /budapest/i.test(depPlace) && !/^pozsony/i.test(depPlace) ? cfg.departure.lng : null, confidence: cur.departure.evidence || 'inferred', note: cur.departure.note || null }
    : { ...cfg.departure };
  const collLabelParts = [primaryColl, ...subsumed].filter(Boolean);
  const recDates = records.map((s) => isoOf(s.collected)).filter(Boolean).sort();
  const notes = [...conflictNotes(cur), ...orderNotes];
  for (const c of subsumed) notes.push({ kind: 'subsumed-index-entry', text: `Index entry ${c.id} "${c.label}" is part of this trip and is not shown separately.`, collectionId: c.id });
  const days = /^\d{4}-\d{2}-\d{2}$/.test(cur.dateStart) && /^\d{4}-\d{2}-\d{2}$/.test(cur.dateEnd) ? dayNumberIso(cur.dateEnd) - dayNumberIso(cur.dateStart) + 1 : null;
  return sortKeys({
    id: primaryColl ? primaryColl.journeyId : cur.id,
    curatedId: cur.id,
    derivedFrom: primaryColl ? 'gyuj-collections' : 'curated',
    quality: qualityOf(cur),
    evidenceQuality: cur.evidenceQuality || null,
    kind,
    collector: records[0] ? records[0].collector || 'Bartok Bela' : 'Bartok Bela',
    title: cur.title || null,
    summary: cur.summary || null,
    sources: cur.sources || [],
    companions: cur.companions || [],
    label: primaryColl ? primaryColl.label : null,
    labelDateRaw: primaryColl ? primaryColl.dateRaw : null,
    labelPlaceRaw: primaryColl ? primaryColl.placeRaw : null,
    sourceUrl: primaryColl ? primaryColl.url : null,
    countOnline: collLabelParts.length ? collLabelParts.reduce((n, c) => n + (c.countOnline || 0), 0) || (primaryColl ? primaryColl.countOnline : null) : null,
    recordsOnline: collLabelParts.some((c) => c.hasOnlineRecords),
    subsumedCollections: subsumed.map((c) => ({ id: c.id, journeyId: c.journeyId, label: c.label, countOnline: c.countOnline })),
    dateStart: cur.dateStart,
    dateEnd: cur.dateEnd,
    dateConfidence: cur.datePrecision || 'day',
    datePeriods: [{ raw: null, start: cur.dateStart, end: cur.dateEnd, precision: cur.datePrecision || 'day', qualifiers: [], uncertain: false }],
    recordDateRange: recDates.length ? { start: recDates[0], end: recDates[recDates.length - 1] } : null,
    days,
    departure,
    return: cur.return ? { date: cur.return.date || null, place: cur.return.place || null, confidence: cur.return.evidence || 'inferred', note: cur.return.note || null } : null,
    stops,
    distanceKm: kind === 'route' && anyKm ? Number(distance.toFixed(1)) : null,
    recordCount: records.length,
    facts: facts(records, stops),
    songIds: records.map((s) => s.id).sort(),
    nowIn: [...new Set(stops.map((st) => st.country).filter(Boolean))].sort(),
    romanianMaterial: typeof cur.romanianMaterial === 'boolean' ? { value: cur.romanianMaterial, confidence: 'documented' } : primaryColl ? primaryColl.romanianMaterial : null,
    notes,
    derivation: {
      gapDays: cfg.gapDays, jumpKm: cfg.jumpKm, splitReasons: ['collection'], generator: GENERATOR,
      attachedRecords: {
        byMembership: records.filter((s) => attachment.get(s.id) !== 'date-county').length,
        byDateCounty: records.filter((s) => attachment.get(s.id) === 'date-county').length
      }
    }
  });
}

// ------------------------------------------------------------------ entry point

export function deriveJourneys(songs, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config, departure: { ...DEFAULT_CONFIG.departure, ...(config.departure || {}) } };
  const collections = cfg.collections ? cfg.collections.collections : [];
  const collIds = new Set(collections.map((c) => c.id));
  const curated = cfg.curated ? cfg.curated.journeys : [];
  const collById = new Map(collections.map((c) => [c.id, c]));
  const curatedByColl = new Map(); // collection id -> curated entry (primary or subsumed)
  for (const cur of curated) {
    if (cur.matchesCollection) curatedByColl.set(String(cur.matchesCollection), cur);
    for (const a of cur.alsoMatchesCollections || []) curatedByColl.set(String(a), cur);
  }
  cfg._gazetteerIndex = gazetteerIndex(cfg.gazetteer);
  // pseudo-collections for curated-only trips so rfm records can attach by date + county
  const curatedOnlyAnchors = curated.filter((c) => !c.matchesCollection).map((c) => ({
    id: c.id, journeyId: c.id, date: { start: c.dateStart, end: c.dateEnd },
    places: c.stops.map((st) => ({ name: st.modernName, county: st.county && (cfg.gazetteer ? (cfg.gazetteer.counties.find((x) => fold(x.name) === fold(st.county)) || {}).name : st.county) || st.county, countyHistorical: null, kind: 'village' }))
  }));
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
    if (!cid && s.source && s.source.site === 'rfm') { cid = attachByDateCounty(s, [...collections, ...curatedOnlyAnchors]); how = 'date-county'; }
    if (cid && (collIds.has(cid) || curatedOnlyAnchors.some((a) => a.id === cid))) {
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
  const sortIds = (arr) => arr.sort((a, b) => (a.id < b.id ? -1 : 1));
  const primary = [];
  const done = new Set();
  for (const c of collections) {
    if (done.has(c.id)) continue;
    const cur = curatedByColl.get(c.id);
    if (!cur) { primary.push(collectionJourney(c, sortIds(byColl.get(c.id) || []), cfg)); done.add(c.id); continue; }
    const primaryId = String(cur.matchesCollection);
    const primaryColl = collById.get(primaryId) || c;
    const subsumed = (cur.alsoMatchesCollections || []).map(String).filter((id) => id !== primaryId && collById.has(id)).map((id) => collById.get(id));
    const recs = sortIds([primaryColl.id, ...subsumed.map((x) => x.id)].flatMap((id) => byColl.get(id) || []));
    primary.push(curatedJourney(cur, primaryColl, subsumed, recs, cfg));
    done.add(primaryColl.id); for (const x of subsumed) done.add(x.id);
  }
  for (const cur of curated.filter((x) => !x.matchesCollection)) primary.push(curatedJourney(cur, null, [], sortIds(byColl.get(cur.id) || []), cfg));
  for (const j of primary) if (!j.quality) j.quality = 'index only';
  const dated = rest.filter((s) => s.collected && s.collected.year != null);
  const fallback = gapJourneys(dated, cfg);
  // Same ordering as qa/checks/data-gates.mjs: ISO dates compared on their common prefix (a month equals any day of it), then id.
  const journeys = [...primary, ...fallback].sort((a, b) => { const n = Math.min(a.dateStart.length, b.dateStart.length); const ka = a.dateStart.slice(0, n), kb = b.dateStart.slice(0, n); return ka < kb ? -1 : ka > kb ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });
  return {
    _meta: {
      title: "Bartok's field trips: the bartok-gyujtesek.zti.hu trip index, with records attached, plus date-gap derived trips for records outside that index",
      spec: 'docs/JOURNEY-SPEC.md',
      schema: 'data/schema/journey.schema.json',
      generator: GENERATOR,
      sources: {
        primary: cfg.collections ? { file: 'data/collections-gyuj.json', ...cfg.collections._meta.source } : null,
        curated: cfg.curated ? { file: 'data/journeys-curated.json', entries: curated.length, note: cfg.curated._meta && cfg.curated._meta.note } : null,
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
        curatedJourneys: primary.filter((j) => j.curatedId).length,
        curatedOnlyJourneys: primary.filter((j) => j.derivedFrom === 'curated').length,
        indexEntriesSubsumed: primary.reduce((n, j) => n + ((j.subsumedCollections || []).length), 0),
        byQuality: journeys.reduce((m, j) => ((m[j.quality] = (m[j.quality] || 0) + 1), m), {}),
        stopsTotal: journeys.reduce((n, j) => n + j.stops.length, 0),
        stopsWithCoordinates: journeys.reduce((n, j) => n + j.stops.filter((st) => st.lat != null).length, 0),
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
  const curPath = resolve(opt('--curated', join(ROOT, 'data', 'journeys-curated.json')));
  if (!args.includes('--no-curated') && existsSync(curPath)) cfg.curated = JSON.parse(readFileSync(curPath, 'utf8'));
  const gazPath = resolve(opt('--gazetteer', join(ROOT, 'data', 'gazetteer.json')));
  if (existsSync(gazPath)) cfg.gazetteer = JSON.parse(readFileSync(gazPath, 'utf8'));
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
