// Build: raw/afs/*.json + data/newspapers.json (curated gazetteer) -> data/songs.json,
// places.json, facets.json, sources.json. Deterministic: sorted keys, stable ids, sorted arrays.
import path from 'node:path';
import { PATHS, readJson, writeJson, fold, slugify, uniq } from './util.js';
import { normalizeRecord, extractRelated } from './normalize.js';

const STATES = {
  NSW: { name: 'New South Wales', lat: -32.5, lng: 147.0 },
  VIC: { name: 'Victoria', lat: -37.0, lng: 144.5 },
  QLD: { name: 'Queensland', lat: -22.5, lng: 145.0 },
  SA: { name: 'South Australia', lat: -30.0, lng: 135.5 },
  WA: { name: 'Western Australia', lat: -26.0, lng: 121.0 },
  TAS: { name: 'Tasmania', lat: -42.0, lng: 146.8 },
  NT: { name: 'Northern Territory', lat: -19.5, lng: 133.5 },
  ACT: { name: 'Australian Capital Territory', lat: -35.5, lng: 149.0 },
  NZ: { name: 'New Zealand', lat: -41.0, lng: 174.0 },
  UK: { name: 'United Kingdom', lat: 54.0, lng: -2.5 },
  US: { name: 'United States', lat: 39.0, lng: -98.0 }
};

function inc(map, key) {
  const k = key === null || key === undefined || key === '' ? 'null' : String(key);
  map[k] = (map[k] || 0) + 1;
}

function sortedCountMap(m) {
  const out = {};
  for (const k of Object.keys(m).sort()) out[k] = m[k];
  return out;
}

const FOREIGN = new Set(['NZ', 'UK', 'US']);

/** 'au/nsw' or 'au/nsw/kiama'; foreign places are a country id alone ('nz'). */
export function statePlaceId(state, town) {
  if (!state) return null;
  const base = FOREIGN.has(state) ? state.toLowerCase() : `au/${state.toLowerCase()}`;
  return town ? `${base}/${slugify(town)}` : base;
}

/** Newspaper gazetteer: data/newspapers.json is a curated map key -> {title, town, state, lat, lng, ...}. */
export function loadGazetteer(entries) {
  const map = new Map();
  for (const e of entries || []) {
    if (!e.key) continue;
    const placeId = statePlaceId(e.state, e.town);
    const entry = { ...e, placeId, lat: e.lat ?? null, lng: e.lng ?? null, town: e.town || null, state: e.state || null };
    if (Array.isArray(e.variants)) entry.variants = e.variants.map((v) => ({ ...v, placeId: statePlaceId(v.state, v.town), lat: v.lat ?? null, lng: v.lng ?? null, town: v.town || null, state: v.state || null }));
    map.set(e.key, entry);
    for (const alias of e.aliases || []) map.set(alias, entry);
  }
  return map;
}

export function assemble(rawRecords, { songbooksRaw = [], articlesRaw = [], gazetteer = [], images = {} } = {}) {
  const songbooks = songbooksRaw.map((b, i) => ({ id: `book-${String(i + 1).padStart(3, '0')}`, ...b }));
  const byTitle = new Map();
  for (const r of rawRecords) {
    for (const t of uniq([r.title, r.indexTitle, ...(r.indexTitleAlt || [])])) {
      const key = fold(t);
      if (!key) continue;
      if (!byTitle.has(key)) byTitle.set(key, []);
      byTitle.get(key).push(`afs-${r.pageId}`);
    }
  }
  const newspapers = loadGazetteer(gazetteer);
  const ctx = { songbooks, byTitle, newspapers, images };
  const songs = rawRecords.map((r) => normalizeRecord(r, ctx));
  const ids = new Set(songs.map((s) => s.id));
  const rawById = new Map(rawRecords.map((r) => [`afs-${r.pageId}`, r]));
  for (const s of songs) {
    const related = extractRelated(rawById.get(s.id), byTitle).filter((x) => ids.has(x.id));
    // Same base title ("Moreton Bay", "Moreton Bay 2") are variants of one another.
    const base = fold(s.title).replace(/\s+\d+$/, '');
    for (const o of songs) {
      if (o.id === s.id) continue;
      if (fold(o.title).replace(/\s+\d+$/, '') === base && !related.some((x) => x.id === o.id)) related.push({ id: o.id, relation: 'variant', title: o.title });
    }
    s.related = related.sort((a, b) => a.id.localeCompare(b.id));
  }
  songs.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));

  // Places: country > state > town; songs sit at the town when the newspaper resolved, else at the state.
  const places = new Map();
  const ensure = (id, node) => {
    if (!places.has(id)) places.set(id, { id, songIds: [], counts: { total: 0, byDecade: {}, byKind: {} }, years: { min: null, max: null }, newspapers: {}, ...node });
    return places.get(id);
  };
  ensure('au', { type: 'country', name: 'Australia', parent: null, state: null, lat: -27.0, lng: 133.0, coordSource: 'fixed' });
  for (const s of songs) {
    const st = s.location.state;
    if (!st) continue;
    const stInfo = STATES[st];
    if (!stInfo) continue;
    const isAu = !['NZ', 'UK', 'US'].includes(st);
    const stateId = isAu ? `au/${st.toLowerCase()}` : st.toLowerCase();
    if (!isAu) ensure(stateId, { type: 'country', name: stInfo.name, parent: null, state: st, lat: stInfo.lat, lng: stInfo.lng, coordSource: 'fixed' });
    else ensure(stateId, { type: 'state', name: stInfo.name, parent: 'au', state: st, lat: stInfo.lat, lng: stInfo.lng, coordSource: 'fixed' });
    let node = places.get(stateId);
    if (s.location.town && s.location.placeId) {
      node = ensure(s.location.placeId, { type: 'town', name: s.location.town, parent: stateId, state: st, lat: s.location.lat, lng: s.location.lng, coordSource: s.location.lat != null ? 'gazetteer' : null });
      node.songIds.push(s.id);
    }
    // Count at the node and every ancestor.
    let cur = node;
    while (cur) {
      cur.counts.total += 1;
      inc(cur.counts.byDecade, s.year.decade);
      inc(cur.counts.byKind, s.kind);
      if (s.provenance.newspaper) inc(cur.newspapers, s.provenance.newspaper.title);
      if (s.year.value) {
        cur.years.min = cur.years.min === null ? s.year.value : Math.min(cur.years.min, s.year.value);
        cur.years.max = cur.years.max === null ? s.year.value : Math.max(cur.years.max, s.year.value);
      }
      cur = cur.parent ? places.get(cur.parent) : null;
    }
  }
  const placeList = [...places.values()]
    .map((p) => ({ ...p, songIds: p.songIds.sort(), counts: { total: p.counts.total, byDecade: sortedCountMap(p.counts.byDecade), byKind: sortedCountMap(p.counts.byKind) }, newspapers: sortedCountMap(p.newspapers) }))
    .sort((a, b) => a.id.localeCompare(b.id));

  // Facets
  const facets = { _meta: { songCount: songs.length, builtWith: 'australia/scraper/src/build.js' }, decade: {}, year: {}, kind: {}, state: {}, town: {}, newspaper: {}, songbook: {}, singer: {}, collector: {}, author: {}, hasNotation: {}, hasMasthead: {}, hasMidi: {}, hasAudio: {}, yearFrom: {} };
  const bookTitle = new Map(songbooks.map((b) => [b.id, b.title]));
  for (const s of songs) {
    inc(facets.decade, s.year.decade);
    inc(facets.year, s.year.value);
    inc(facets.kind, s.kind);
    inc(facets.state, s.location.state);
    inc(facets.town, s.location.town);
    inc(facets.newspaper, s.provenance.newspaper ? s.provenance.newspaper.title : null);
    if (s.provenance.songbooks.length) for (const b of s.provenance.songbooks) inc(facets.songbook, bookTitle.get(b) || b);
    else inc(facets.songbook, null);
    if (s.provenance.singers.length) for (const x of s.provenance.singers) inc(facets.singer, x);
    else inc(facets.singer, null);
    if (s.provenance.collectors.length) for (const x of s.provenance.collectors) inc(facets.collector, x);
    else inc(facets.collector, null);
    inc(facets.author, s.author.name);
    inc(facets.hasNotation, s.media.images.some((i) => i.role === 'notation') ? 'yes' : 'no');
    inc(facets.hasMasthead, s.media.images.some((i) => i.role === 'masthead') ? 'yes' : 'no');
    inc(facets.hasMidi, s.media.midi.length ? 'yes' : 'no');
    inc(facets.hasAudio, s.media.audio.length ? 'yes' : 'no');
    inc(facets.yearFrom, s.year.from);
  }
  for (const k of Object.keys(facets)) if (k !== '_meta') facets[k] = sortedCountMap(facets[k]);

  // Sources: bibliography, articles, newspapers (with counts), site.
  const newspaperCounts = {};
  for (const s of songs) {
    const n = s.provenance.newspaper;
    if (!n) continue;
    const e = (newspaperCounts[n.key] ||= { key: n.key, title: n.title, count: 0, songIds: [], years: { min: null, max: null }, stateHints: {} });
    e.count += 1;
    e.songIds.push(s.id);
    if (n.date && n.date.year) {
      e.years.min = e.years.min === null ? n.date.year : Math.min(e.years.min, n.date.year);
      e.years.max = e.years.max === null ? n.date.year : Math.max(e.years.max, n.date.year);
    }
    if (n.stateHint) inc(e.stateHints, n.stateHint);
  }
  const newspaperList = Object.values(newspaperCounts)
    .map((e) => {
      const g = newspapers.get(e.key) || null;
      const v = g && g.variants && g.variants.length ? g.variants.find((x) => x.default) || g.variants[0] : g;
      return { ...e, songIds: e.songIds.sort(), stateHints: sortedCountMap(e.stateHints), town: v ? v.town : null, state: v ? v.state : null, lat: v ? v.lat : null, lng: v ? v.lng : null, wikidata: v ? v.wikidata || null : null, troveTitleId: v ? v.troveTitleId || null : null, variants: g && g.variants ? g.variants.map((x) => ({ town: x.town, state: x.state })) : [], resolved: !!v && !!v.town };
    })
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
  const bookCounts = {};
  for (const s of songs) for (const b of s.provenance.songbooks) bookCounts[b] = (bookCounts[b] || 0) + 1;
  const sources = {
    site: { name: 'Australian Folk Songs', url: 'https://folkstream.com/', editor: 'Mark Gregory', since: 1994 },
    songbooks: songbooks.map((b) => ({ ...b, url: b.link || b.url, link: undefined, songCount: bookCounts[b.id] || 0 })).map((b) => {
      const { link, ...rest } = b;
      return rest;
    }),
    articles: articlesRaw.map((a, i) => ({ id: `article-${String(i + 1).padStart(3, '0')}`, ...a })),
    newspapers: newspaperList
  };
  return { songs, places: placeList, facets, sources };
}

export async function build(log = () => {}) {
  const raw = path.join(PATHS.raw, 'afs');
  const rawRecords = await readJson(path.join(raw, 'records.json'));
  const songbooksRaw = await readJson(path.join(raw, 'songbooks.json'), []);
  const articlesRaw = await readJson(path.join(raw, 'articles.json'), []);
  const gazetteer = await readJson(path.join(PATHS.data, 'newspapers.json'), []);
  const images = await readJson(path.join(raw, 'images.json'), {});
  const { songs, places, facets, sources } = assemble(rawRecords, { songbooksRaw, articlesRaw, gazetteer, images });
  await writeJson(path.join(PATHS.data, 'songs.json'), songs);
  await writeJson(path.join(PATHS.data, 'places.json'), places);
  await writeJson(path.join(PATHS.data, 'facets.json'), facets);
  await writeJson(path.join(PATHS.data, 'sources.json'), sources);
  const unresolved = sources.newspapers.filter((n) => !n.resolved);
  log(`built ${songs.length} songs, ${places.length} places, ${sources.newspapers.length} newspapers (${unresolved.length} unresolved), ${sources.songbooks.length} songbooks, ${sources.articles.length} articles`);
  return { songs: songs.length, places: places.length, newspapers: sources.newspapers.length, unresolvedNewspapers: unresolved.length, withNewspaper: songs.filter((s) => s.provenance.newspaper).length, withYear: songs.filter((s) => s.year.value).length, withLocation: songs.filter((s) => s.location.state).length, kinds: facets.kind };
}
