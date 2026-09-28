// Merge raw records from all sites, normalise, dedupe, derive places and facets, write data/*.json.
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { PATHS, fold, readJson, writeJson, exists, sha1 } from './util.js';
import { Gazetteer } from './gazetteer.js';
import { normalizeRecord } from './normalize.js';

const SITES = ['fmbc', 'bsys', 'gyuj'];
const slug = (s) => fold(s).replace(/\s+/g, '-');

function inc(map, key) {
  const k = key === null || key === undefined || key === '' ? 'null' : String(key);
  map[k] = (map[k] || 0) + 1;
}

/** Backend record id shared by bsys (/br/en/browse/<cat>/<rec>) and gyuj (/en/browse/<coll>/<rec>). */
export function backendId(song) {
  if (song.source.site !== 'bsys' && song.source.site !== 'gyuj') return null;
  const m = String(song.source.siteRecordId || '').match(/^\d+-(\d+)$/);
  return m ? m[1] : null;
}

const isEmpty = (v) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);

/** Deep "fill the gaps": take b's value wherever a's is empty (objects recursively, arrays by union of urls/ids). */
function fillFrom(a, b) {
  if (isEmpty(a)) return b === undefined ? a : b;
  if (Array.isArray(a) && Array.isArray(b)) {
    const key = (x) => (x && typeof x === 'object' ? x.url || x.id || JSON.stringify(x) : String(x));
    const seen = new Set(a.map(key));
    return [...a, ...b.filter((x) => !seen.has(key(x)))];
  }
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) {
    const out = { ...a };
    for (const k of Object.keys(b)) out[k] = fillFrom(a[k], b[k]);
    return out;
  }
  return a;
}

/**
 * bsys and gyuj expose the same underlying records. Keep ONE record per backend id: the bsys
 * record is primary (complete system, class/style), gyuj fills gaps (journey, listing fields),
 * and source.alternates keeps the other site's link. A record that was only parsed from its
 * listing row (rawFields._partial) never wins over one parsed from a page.
 */
export function mergeCrossSite(songs) {
  const groups = new Map();
  for (const s of songs) {
    const bid = backendId(s);
    if (!bid) continue;
    if (!groups.has(bid)) groups.set(bid, []);
    groups.get(bid).push(s);
  }
  const drop = new Set();
  const idMap = new Map();
  let merged = 0;
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    // The bsys record is always the primary (stable id across builds); site order breaks ties.
    group.sort((a, b) => (b.source.site === 'bsys') - (a.source.site === 'bsys') || a.id.localeCompare(b.id));
    const primary = group[0];
    const isPartial = (s) => !!(s.rawFields && s.rawFields._partial);
    for (const other of group.slice(1)) {
      const alt = { site: other.source.site, siteName: other.source.siteName, siteId: other.source.siteId, url: other.source.url };
      if (!primary.source.alternates.some((x) => x.url === alt.url)) primary.source.alternates.push(alt);
      // A record parsed from its page beats one built from a listing row, field by field.
      const otherWins = isPartial(primary) && !isPartial(other);
      for (const k of Object.keys(other)) {
        if (k === 'id' || k === 'source') continue;
        if (k === 'rawFields') {
          const fromOther = { ...(other.rawFields || {}) };
          delete fromOther._partial;
          const own = { ...(primary.rawFields || {}) };
          if (otherWins) delete own._partial;
          primary.rawFields = otherWins ? { ...own, ...fromOther } : { ...fromOther, ...own };
          continue;
        }
        if (k === 'location') {
          const score = (l) => ({ site: 4, gazetteer: 3, county: 2, unresolved: 1 }[l.resolution] || 0) + (l.lat !== null ? 1 : 0);
          const otherBetter = score(other.location) > score(primary.location) || (otherWins && score(other.location) === score(primary.location));
          primary.location = otherBetter ? fillFrom(other.location, primary.location) : fillFrom(primary.location, other.location);
          continue;
        }
        // classification comes from the bsys category tree: the primary always wins there
        const primaryWins = ['style', 'styleRaw', 'music'].includes(k);
        primary[k] = otherWins && !primaryWins ? fillFrom(other[k], primary[k]) : fillFrom(primary[k], other[k]);
      }
      // siteId stays the bsys BR number, but take the page's value when the row had none
      if (!primary.source.siteId || /^\d+-\d+$/.test(primary.source.siteId)) primary.source.siteId = other.source.referenceCode || primary.source.siteId;
      drop.add(other.id);
      idMap.set(other.id, primary.id);
      merged += 1;
    }
  }
  const kept = songs.filter((s) => !drop.has(s.id));
  for (const s of kept) {
    s.related = s.related.map((r) => (r.id && idMap.has(r.id) ? { ...r, id: idMap.get(r.id) } : r)).filter((r) => r.id !== s.id);
    s.source.alternates.sort((a, b) => a.url.localeCompare(b.url));
  }
  return { songs: kept, merged };
}

/** Relations by shared reference code (variants within a site, cross-site otherwise) + resolve ids. */
export function linkRelated(songs) {
  const byRef = new Map();
  for (const s of songs) {
    const ref = s.source.referenceCode && fold(s.source.referenceCode);
    if (!ref) continue;
    if (!byRef.has(ref)) byRef.set(ref, []);
    byRef.get(ref).push(s);
  }
  for (const group of byRef.values()) {
    if (group.length < 2 || group.length > 20) continue;
    for (const a of group) for (const b of group) {
      if (a === b) continue;
      if (!a.related.some((r) => r.id === b.id)) a.related.push({ id: b.id, url: b.source.url, label: b.title, relation: a.source.site === b.source.site ? 'variant' : 'cross-site' });
    }
  }
  const ids = new Set(songs.map((s) => s.id));
  for (const s of songs) {
    const seen = new Set();
    s.related = s.related
      .map((r) => ({ ...r, id: r.id && ids.has(r.id) ? r.id : null }))
      .filter((r) => (r.id || r.url) && !seen.has(r.id || r.url) && seen.add(r.id || r.url));
    s.related.sort((a, b) => String(a.id || a.url).localeCompare(String(b.id || b.url)));
  }
}

/** Build the place hierarchy (country > region > county > village) with counts. */
export function buildPlaces(songs, gazetteer) {
  const nodes = new Map();
  const node = (id, props) => {
    if (!nodes.has(id)) {
      nodes.set(id, {
        id, type: props.type, name: props.name, nameHistorical: props.nameHistorical ?? null, parent: props.parent ?? null,
        country: props.country ?? null, region: props.region ?? null, county: props.county ?? null, countyHistorical: props.countyHistorical ?? null,
        lat: props.lat ?? null, lng: props.lng ?? null, coordSource: props.coordSource ?? null,
        counts: { total: 0, byGenre: {}, byPerformance: {}, bySite: {} }, years: { min: null, max: null }, songIds: [], confidence: props.confidence ?? null
      });
    }
    return nodes.get(id);
  };
  const count = (n, s) => {
    n.counts.total += 1;
    inc(n.counts.byGenre, s.genre);
    inc(n.counts.byPerformance, s.performance);
    inc(n.counts.bySite, s.source.site);
    const y = s.collected.year;
    if (y !== null) {
      n.years.min = n.years.min === null ? y : Math.min(n.years.min, y);
      n.years.max = n.years.max === null ? y : Math.max(n.years.max, y);
    }
  };
  for (const s of songs) {
    const loc = s.location;
    const villageName = loc.village || loc.villageHistorical;
    if (!villageName) continue;
    const leaf = slug(loc.village) || slug(loc.villageHistorical) || `p-${sha1(villageName).slice(0, 8)}`;
    const countryCode = loc.country ? loc.country.toLowerCase() : 'xx';
    const chain = [node(countryCode, { type: 'country', name: loc.country || 'unknown', country: loc.country })];
    if (loc.region && loc.county) {
      const regionNode = node(`${countryCode}/${slug(loc.region)}`, { type: 'region', name: loc.region, parent: chain[0].id, country: loc.country, region: loc.region });
      const countyEntry = gazetteer ? gazetteer.county(loc.county) : null;
      const countyNode = node(`${regionNode.id}/${slug(loc.county)}`, {
        type: 'county', name: loc.county, nameHistorical: loc.countyHistorical, parent: regionNode.id, country: loc.country, region: loc.region, county: loc.county, countyHistorical: loc.countyHistorical,
        lat: countyEntry ? countyEntry.lat : null, lng: countyEntry ? countyEntry.lng : null, coordSource: countyEntry ? 'gazetteer-approx' : null
      });
      const villageNode = node(`${countyNode.id}/${leaf}`, {
        type: 'village', name: villageName, nameHistorical: loc.villageHistorical, parent: countyNode.id, country: loc.country, region: loc.region, county: loc.county, countyHistorical: loc.countyHistorical,
        lat: loc.lat, lng: loc.lng, coordSource: loc.lat !== null ? (loc.resolution === 'site' ? 'site' : 'gazetteer-approx') : null
      });
      chain.push(regionNode, countyNode, villageNode);
    } else {
      const unresolved = node(`${countryCode}/unresolved`, { type: 'region', name: 'unresolved', parent: chain[0].id, country: loc.country });
      const villageNode = node(`${unresolved.id}/${leaf}`, { type: 'village', name: villageName, nameHistorical: loc.villageHistorical, parent: unresolved.id, country: loc.country, countyHistorical: loc.countyHistorical, lat: loc.lat, lng: loc.lng, coordSource: loc.lat !== null ? (loc.resolution === 'site' ? 'site' : 'gazetteer-approx') : null });
      chain.push(unresolved, villageNode);
    }
    for (const n of chain) count(n, s);
    chain[chain.length - 1].songIds.push(s.id);
  }
  const list = [...nodes.values()];
  // bottom-up: deeper nodes first so a parent's centroid sees its children's coordinates
  for (const n of [...list].sort((a, b) => b.id.split('/').length - a.id.split('/').length)) {
    if (n.lat !== null || n.type === 'village') continue;
    const kids = list.filter((k) => k.parent === n.id && k.lat !== null);
    if (kids.length) {
      n.lat = +(kids.reduce((a, k) => a + k.lat, 0) / kids.length).toFixed(4);
      n.lng = +(kids.reduce((a, k) => a + k.lng, 0) / kids.length).toFixed(4);
      n.coordSource = 'centroid-of-children';
    }
  }
  for (const n of list) n.songIds.sort();
  return list.sort((a, b) => a.id.localeCompare(b.id));
}

export function buildFacets(songs) {
  const facets = { _meta: { songCount: songs.length, sites: {}, builtWith: 'scraper/src/build.js' }, genre: {}, style: {}, performance: {}, instrument: {}, year: {}, country: {}, region: {}, county: {}, village: {}, collector: {}, ethnicity: {}, site: {} };
  for (const s of songs) {
    inc(facets._meta.sites, s.source.site);
    for (const a of s.source.alternates) inc(facets._meta.sites, a.site);
    inc(facets.site, s.source.site);
    inc(facets.genre, s.genre);
    inc(facets.style, s.style);
    inc(facets.performance, s.performance);
    if (s.instrument.length) for (const i of s.instrument) inc(facets.instrument, i);
    else inc(facets.instrument, null);
    inc(facets.year, s.collected.year);
    inc(facets.country, s.location.country);
    inc(facets.region, s.location.region);
    inc(facets.county, s.location.county);
    inc(facets.village, s.location.village);
    inc(facets.collector, s.collector);
    inc(facets.ethnicity, s.performer.ethnicity);
  }
  return facets;
}

/** Normalise + merge in memory (used by build() and by tests). */
export function assemble(rawBySite, gazetteer) {
  let songs = [];
  const seen = new Set();
  let duplicates = 0;
  for (const site of SITES) {
    for (const raw of rawBySite[site] || []) {
      const s = normalizeRecord({ ...raw, site }, gazetteer);
      if (seen.has(s.id)) {
        duplicates += 1;
        continue;
      }
      seen.add(s.id);
      songs.push(s);
    }
  }
  const m = mergeCrossSite(songs);
  songs = m.songs;
  songs.sort((a, b) => a.id.localeCompare(b.id));
  linkRelated(songs);
  const places = buildPlaces(songs, gazetteer);
  const facets = buildFacets(songs);
  return { songs, places, facets, duplicates, merged: m.merged };
}

export async function build({ log = () => {} } = {}) {
  const gazetteer = await Gazetteer.load();
  const rawBySite = {};
  const perSite = {};
  for (const site of SITES) {
    const file = path.join(PATHS.raw, site, 'records.json');
    rawBySite[site] = (await exists(file)) ? await readJson(file) : [];
    perSite[site] = { raw: rawBySite[site].length, fromPages: rawBySite[site].filter((r) => !(r.fields && r.fields._partial)).length };
    log(`${site}: ${perSite[site].raw} raw records (${perSite[site].fromPages} from record pages)`);
  }
  const { songs, places, facets, duplicates, merged } = assemble(rawBySite, gazetteer);
  await writeJson(path.join(PATHS.data, 'songs.json'), songs);
  await writeJson(path.join(PATHS.data, 'places.json'), places);
  await writeJson(path.join(PATHS.data, 'facets.json'), facets);
  const summary = buildSummary(songs, places, perSite, duplicates, merged);
  await writeBuildReport(summary);
  const { unresolved, countyOnlyRO, ...compact } = summary;
  return compact;
}

function buildSummary(songs, places, perSite, duplicates, merged) {
  const countBy = (fn) => {
    const m = {};
    for (const s of songs) inc(m, fn(s));
    return Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1]));
  };
  const unresolved = {};
  const countyOnlyRO = {};
  for (const s of songs) {
    const l = s.location;
    if (!l.villageHistorical) continue;
    const key = `${l.villageHistorical}${l.countyHistorical ? ` (${l.countyHistorical})` : ''}`;
    if (l.resolution === 'unresolved') inc(unresolved, key);
    if (l.resolution === 'county' && l.country === 'RO') inc(countyOnlyRO, key);
  }
  const ro = songs.filter((s) => s.location.country === 'RO');
  return {
    songs: songs.length,
    perSite,
    merged,
    duplicates,
    romania: ro.length,
    romaniaBySite: countBy((s) => (s.location.country === 'RO' ? s.source.site : 'not-RO')),
    romaniaWithCoords: ro.filter((s) => s.location.lat !== null).length,
    romaniaByCounty: Object.fromEntries(Object.entries(ro.reduce((a, s) => (inc(a, s.location.county), a), {})).sort((a, b) => b[1] - a[1])),
    withCoords: songs.filter((s) => s.location.lat !== null).length,
    resolution: countBy((s) => s.location.resolution),
    country: countBy((s) => s.location.country),
    style: countBy((s) => s.style),
    genre: countBy((s) => s.genre),
    performance: countBy((s) => s.performance),
    withEthnicity: songs.filter((s) => s.performer.ethnicity).length,
    withAudio: songs.filter((s) => s.media.audio.length).length,
    withNotation: songs.filter((s) => s.media.notation.length).length,
    withText: songs.filter((s) => s.text).length,
    withYear: songs.filter((s) => s.collected.year !== null).length,
    withJourney: songs.filter((s) => s.journey).length,
    partial: songs.filter((s) => s.rawFields && s.rawFields._partial).length,
    places: places.length,
    villages: places.filter((p) => p.type === 'village').length,
    unresolvedPlaces: Object.keys(unresolved).length,
    unresolvedSongs: Object.values(unresolved).reduce((a, b) => a + b, 0),
    countyOnlyROPlaces: Object.keys(countyOnlyRO).length,
    unresolved,
    countyOnlyRO
  };
}

async function writeBuildReport(x) {
  const kv = (o) => Object.entries(o).map(([k, v]) => `${k}=${v}`).join(', ');
  const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n).map(([k, v]) => `- ${v} x ${k}`);
  const lines = [
    '# Build report',
    '',
    'Generated by `node src/cli.js build` (scraper/src/build.js); regenerated on every build. Counts refer to data/songs.json.',
    '',
    '## Records',
    '',
    `- songs: ${x.songs} (bsys/gyuj pairs merged into one record: ${x.merged}; exact duplicates dropped: ${x.duplicates})`,
    ...Object.entries(x.perSite).map(([k, v]) => `- ${k}: ${v.raw} raw records, ${v.fromPages} parsed from record pages, ${v.raw - v.fromPages} from listing rows only`),
    `- still listing-only after merge (rawFields._partial): ${x.partial}`,
    `- with year: ${x.withYear}; with audio: ${x.withAudio}; with notation image: ${x.withNotation}; with sung text: ${x.withText}; with journey (gyuj collection): ${x.withJourney}`,
    `- with informant ethnicity: ${x.withEthnicity} (only bartok-nepzene.zti.hu prints an Ethnicity field; the bsys/gyuj record template has none)`,
    '',
    '## Places',
    '',
    `- resolve to present-day Romania: ${x.romania} (${kv(x.romaniaBySite)})`,
    `- of which with coordinates: ${x.romaniaWithCoords}`,
    `- with coordinates (all countries): ${x.withCoords}`,
    `- resolution: ${kv(x.resolution)}`,
    `- country: ${kv(x.country)}`,
    `- Romania by modern county: ${kv(x.romaniaByCounty)}`,
    `- place nodes: ${x.places} (villages: ${x.villages})`,
    `- Romanian localities resolved to county only: ${x.countyOnlyROPlaces} distinct names`,
    `- unresolved place strings: ${x.unresolvedPlaces} (${x.unresolvedSongs} songs)`,
    '',
    '## Facets',
    '',
    `- style: ${kv(x.style)}`,
    `- genre: ${kv(x.genre)} (no site prints a genre label; see docs/DATA-SCHEMA.md)`,
    `- performance: ${kv(x.performance)}`,
    '',
    '## Romanian localities resolved to county only (village missing from data/gazetteer.json; top 100)',
    '',
    ...top(x.countyOnlyRO, 100),
    '',
    '## Unresolved place strings (top 150; add to data/gazetteer.json places or historicalCounties)',
    '',
    ...top(x.unresolved, 150),
    ''
  ];
  await fs.writeFile(path.join(PATHS.data, 'BUILD.md'), lines.join('\n'), 'utf8');
}
