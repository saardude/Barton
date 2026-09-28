#!/usr/bin/env node
// Derives Bartok's field trips (journeys) from dated song records.
// Specification: docs/JOURNEY-SPEC.md. Output schema: data/schema/journey.schema.json.
//
//   node geo/derive-journeys.mjs                       # data/songs.json -> data/journeys.json
//   node geo/derive-journeys.mjs --in qa/fixtures/songs.sample.json --out /tmp/j.json
//   node geo/derive-journeys.mjs --gap 10 --jump 250 --collector "Bartok"
//
// Deterministic: sorted keys, stable ids, no randomness.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

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
  generator: 'geo/derive-journeys.mjs'
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
  if (c.year == null) return null;
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
  // days since epoch for full dates (UTC, no DST issues)
  return Math.round(Date.UTC(c.year, c.month - 1, c.day) / 86400000);
}
function stopKey(loc) {
  return loc.placeId || (loc.village ? `v:${fold(loc.village)}|${fold(loc.county)}` : loc.villageHistorical ? `h:${fold(loc.villageHistorical)}|${fold(loc.countyHistorical)}` : `raw:${fold(loc.raw)}`);
}
function addCount(map, key) {
  if (key == null || key === '') return;
  map[key] = (map[key] || 0) + 1;
}

// ------------------------------------------------------------------ core

export function deriveJourneys(songs, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config, departure: { ...DEFAULT_CONFIG.departure, ...(config.departure || {}) } };
  const dated = songs.filter((s) => s.collector && cfg.collectorPattern.test(s.collector) && s.collected && s.collected.year != null);
  const skipped = songs.length - dated.length;

  // 1. Route trips: full dates only.
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

  // 2. Fuzzy trips: year+month records grouped per month, year-only per year, per collector.
  const fuzzy = new Map();
  for (const s of dated) {
    const p = precisionOf(s.collected);
    if (p === 'day') continue;
    const k = p === 'month' ? `${s.collected.year}-${pad(s.collected.month)}` : `${s.collected.year}-00`;
    if (!fuzzy.has(k)) fuzzy.set(k, { records: [], reasons: [p === 'month' ? 'precision' : 'year'], precision: p });
    fuzzy.get(k).records.push(s);
  }

  // 3. Assemble, assign ids (J-YYYY-MM-nn, nn per year-month across both kinds, routes first).
  const groups = [
    ...routes.map((g) => ({ ...g, kind: 'route', precision: 'day' })),
    ...[...fuzzy.values()].map((g) => ({ ...g, kind: 'cluster' }))
  ].map((g) => {
    const dates = g.records.map((s) => isoOf(s.collected)).sort();
    return { ...g, dateStart: dates[0], dateEnd: dates[dates.length - 1] };
  }).sort((a, b) => (a.dateStart < b.dateStart ? -1 : a.dateStart > b.dateStart ? 1 : a.kind === 'route' ? -1 : 1));
  const seqByMonth = {};
  const journeys = groups.map((g) => {
    const ym = g.precision === 'year' ? `${g.dateStart.slice(0, 4)}-00` : g.dateStart.slice(0, 7);
    seqByMonth[ym] = (seqByMonth[ym] || 0) + 1;
    return buildJourney(`J-${ym}-${pad(seqByMonth[ym])}`, g, cfg);
  });

  return {
    _meta: {
      title: "Bartok's field trips reconstructed from dated records",
      spec: 'docs/JOURNEY-SPEC.md',
      schema: 'data/schema/journey.schema.json',
      generator: cfg.generator,
      config: { gapDays: cfg.gapDays, jumpKm: cfg.jumpKm, departure: cfg.departure, collectorPattern: String(cfg.collectorPattern) },
      counts: {
        inputRecords: songs.length,
        usedRecords: dated.length,
        skippedRecords: skipped,
        routes: journeys.filter((j) => j.kind === 'route').length,
        clusters: journeys.filter((j) => j.kind === 'cluster').length
      },
      note: 'A journey is a run of dated records, not a documented itinerary. Stops are where records were made; travel between them, the departure point and the return are inferred and labelled as such.'
    },
    journeys
  };
}

function buildJourney(id, g, cfg) {
  const byStop = new Map();
  for (const s of g.records) {
    const k = stopKey(s.location);
    if (!byStop.has(k)) byStop.set(k, { key: k, loc: s.location, songs: [], dates: [] });
    const st = byStop.get(k);
    st.songs.push(s);
    st.dates.push(isoOf(s.collected));
  }
  let stops = [...byStop.values()].map((st) => {
    st.dates.sort();
    return st;
  });
  if (g.kind === 'route') {
    stops.sort((a, b) => (a.dates[0] < b.dates[0] ? -1 : a.dates[0] > b.dates[0] ? 1 : a.key < b.key ? -1 : 1));
  } else {
    stops.sort((a, b) => (fold(a.loc.village || a.loc.villageHistorical) < fold(b.loc.village || b.loc.villageHistorical) ? -1 : 1));
  }
  let prevPt = g.kind === 'route' ? { lat: cfg.departure.lat, lng: cfg.departure.lng } : null;
  let distance = 0;
  let anyKm = false;
  const outStops = stops.map((st, i) => {
    const loc = st.loc;
    const resolved = loc.lat != null && loc.lng != null;
    let km = null;
    if (g.kind === 'route' && resolved && prevPt) {
      km = Number(haversineKm(prevPt.lat, prevPt.lng, loc.lat, loc.lng).toFixed(1));
      distance += km;
      anyKm = true;
    }
    if (resolved && g.kind === 'route') prevPt = { lat: loc.lat, lng: loc.lng };
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
      arrival: st.dates[0],
      departure: st.dates[st.dates.length - 1],
      recordCount: st.songs.length,
      songIds: st.songs.map((s) => s.id).sort(),
      kmFromPrevious: km,
      locationConfidence: resolved ? 'resolved' : 'unresolved'
    };
  });
  const facts = { villages: 0, counties: new Set(), countiesHistorical: new Set(), ethnicGroups: {}, instruments: {}, genres: {}, performers: new Set() };
  for (const s of g.records) {
    if (s.location.county) facts.counties.add(s.location.county);
    if (s.location.countyHistorical) facts.countiesHistorical.add(s.location.countyHistorical);
    addCount(facts.ethnicGroups, s.performer && s.performer.ethnicity);
    for (const ins of s.instrument || []) addCount(facts.instruments, ins);
    addCount(facts.genres, s.genre);
    if (s.performer && s.performer.name) facts.performers.add(fold(s.performer.name));
  }
  facts.villages = outStops.filter((st) => st.placeId || st.village).length;
  const days = g.kind === 'route' ? dayNumber(g.records.map((s) => s.collected).sort((a, b) => dayNumber(a) - dayNumber(b)).at(-1)) - dayNumber(g.records.map((s) => s.collected).sort((a, b) => dayNumber(a) - dayNumber(b))[0]) + 1 : null;
  return sortKeys({
    id,
    kind: g.kind,
    collector: g.records[0].collector,
    dateStart: g.dateStart,
    dateEnd: g.dateEnd,
    dateConfidence: g.precision,
    days,
    departure: { ...cfg.departure },
    stops: outStops,
    distanceKm: g.kind === 'route' && anyKm ? Number(distance.toFixed(1)) : null,
    recordCount: g.records.length,
    facts: {
      villages: facts.villages,
      counties: [...facts.counties].sort(),
      countiesHistorical: [...facts.countiesHistorical].sort(),
      ethnicGroups: facts.ethnicGroups,
      instruments: facts.instruments,
      genres: facts.genres,
      performers: facts.performers.size
    },
    songIds: g.records.map((s) => s.id).sort(),
    derivation: { gapDays: cfg.gapDays, jumpKm: cfg.jumpKm, splitReasons: g.reasons, generator: cfg.generator }
  });
}

// ------------------------------------------------------------------ CLI

function main() {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(n); return i === -1 ? d : args[i + 1]; };
  const inPath = resolve(opt('--in', join(ROOT, 'data', 'songs.json')));
  const outPath = resolve(opt('--out', join(ROOT, 'data', 'journeys.json')));
  if (!existsSync(inPath)) {
    console.error(`No input at ${inPath}. Run the scraper first (data/songs.json) or pass --in.`);
    process.exit(2);
  }
  const songs = JSON.parse(readFileSync(inPath, 'utf8'));
  const cfg = {
    gapDays: Number(opt('--gap', DEFAULT_CONFIG.gapDays)),
    jumpKm: Number(opt('--jump', DEFAULT_CONFIG.jumpKm))
  };
  const coll = opt('--collector', null);
  if (coll) cfg.collectorPattern = new RegExp(coll, 'i');
  const out = deriveJourneys(Array.isArray(songs) ? songs : songs.songs || [], cfg);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  console.log(JSON.stringify({ written: outPath, ...out._meta.counts }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
