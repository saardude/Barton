// Merge raw records from all sites, normalise, dedupe, derive places and facets, write data/*.json.
import path from 'node:path';
import { PATHS, fold, readJson, writeJson, exists } from './util.js';
import { Gazetteer } from './gazetteer.js';
import { normalizeRecord } from './normalize.js';

const SITES = ['fmbc', 'bsys', 'gyuj'];
const slug = (s) => fold(s).replace(/\s+/g, '-');

function inc(map, key) {
  const k = key === null || key === undefined || key === '' ? 'null' : String(key);
  map[k] = (map[k] || 0) + 1;
}

/** Cross-site relations: same reference code or same (village, date, informant) => 'cross-site'. */
export function linkRelated(songs) {
  const byRef = new Map();
  for (const s of songs) {
    const ref = s.source.referenceCode && fold(s.source.referenceCode);
    if (ref) {
      if (!byRef.has(ref)) byRef.set(ref, []);
      byRef.get(ref).push(s);
    }
  }
  for (const group of byRef.values()) {
    if (group.length < 2) continue;
    for (const a of group) {
      for (const b of group) {
        if (a === b || a.source.site === b.source.site) continue;
        if (!a.related.some((r) => r.id === b.id)) a.related.push({ id: b.id, url: b.source.url, label: b.title, relation: 'cross-site' });
      }
    }
  }
  // resolve related ids that point at records we hold; drop dangling ids but keep the url
  const ids = new Set(songs.map((s) => s.id));
  for (const s of songs) {
    s.related = s.related.map((r) => ({ ...r, id: r.id && ids.has(r.id) ? r.id : null })).filter((r) => r.id || r.url);
    s.related.sort((a, b) => String(a.id || a.url).localeCompare(String(b.id || b.url)));
  }
}

/** Build the place hierarchy (country > region > county > village) with counts. */
export function buildPlaces(songs, gazetteer) {
  const nodes = new Map();
  const node = (id, props) => {
    if (!nodes.has(id)) {
      nodes.set(id, {
        id,
        type: props.type,
        name: props.name,
        nameHistorical: props.nameHistorical ?? null,
        parent: props.parent ?? null,
        country: props.country ?? null,
        region: props.region ?? null,
        county: props.county ?? null,
        countyHistorical: props.countyHistorical ?? null,
        lat: props.lat ?? null,
        lng: props.lng ?? null,
        coordSource: props.coordSource ?? null,
        counts: { total: 0, byGenre: {}, byPerformance: {}, bySite: {} },
        years: { min: null, max: null },
        songIds: [],
        confidence: props.confidence ?? null
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
    const countryCode = loc.country ? loc.country.toLowerCase() : 'xx';
    const chain = [];
    const countryNode = node(countryCode, { type: 'country', name: loc.country || 'unknown', country: loc.country });
    chain.push(countryNode);
    if (loc.region && loc.county) {
      const regionNode = node(`${countryCode}/${slug(loc.region)}`, { type: 'region', name: loc.region, parent: countryNode.id, country: loc.country, region: loc.region });
      const countyEntry = gazetteer ? gazetteer.county(loc.county) : null;
      const countyNode = node(`${regionNode.id}/${slug(loc.county)}`, {
        type: 'county', name: loc.county, nameHistorical: loc.countyHistorical, parent: regionNode.id, country: loc.country, region: loc.region, county: loc.county, countyHistorical: loc.countyHistorical,
        lat: countyEntry ? countyEntry.lat : null, lng: countyEntry ? countyEntry.lng : null, coordSource: countyEntry ? 'gazetteer-approx' : null
      });
      chain.push(regionNode, countyNode);
      const villageNode = node(`${countyNode.id}/${slug(loc.village)}`, {
        type: 'village', name: loc.village, nameHistorical: loc.villageHistorical, parent: countyNode.id, country: loc.country, region: loc.region, county: loc.county, countyHistorical: loc.countyHistorical,
        lat: loc.lat, lng: loc.lng, coordSource: loc.lat !== null ? (loc.resolution === 'site' ? 'site' : 'gazetteer-approx') : null
      });
      chain.push(villageNode);
    } else {
      const unresolved = node(`${countryCode}/unresolved`, { type: 'region', name: 'unresolved', parent: countryNode.id, country: loc.country });
      const villageNode = node(`${unresolved.id}/${slug(villageName)}`, { type: 'village', name: villageName, nameHistorical: loc.villageHistorical, parent: unresolved.id, country: loc.country, countyHistorical: loc.countyHistorical, lat: loc.lat, lng: loc.lng, coordSource: loc.lat !== null ? 'site' : null });
      chain.push(unresolved, villageNode);
    }
    for (const n of chain) count(n, s);
    chain[chain.length - 1].songIds.push(s.id);
  }
  // centroid coordinates for aggregates that have none
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
  const songs = [];
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
  songs.sort((a, b) => a.id.localeCompare(b.id));
  linkRelated(songs);
  const places = buildPlaces(songs, gazetteer);
  const facets = buildFacets(songs);
  return { songs, places, facets, duplicates };
}

export async function build({ log = () => {} } = {}) {
  const gazetteer = await Gazetteer.load();
  const rawBySite = {};
  const perSite = {};
  for (const site of SITES) {
    const file = path.join(PATHS.raw, site, 'records.json');
    rawBySite[site] = (await exists(file)) ? await readJson(file) : [];
    perSite[site] = rawBySite[site].length;
    log(`${site}: ${perSite[site]} raw records`);
  }
  const { songs, places, facets, duplicates } = assemble(rawBySite, gazetteer);
  await writeJson(path.join(PATHS.data, 'songs.json'), songs);
  await writeJson(path.join(PATHS.data, 'places.json'), places);
  await writeJson(path.join(PATHS.data, 'facets.json'), facets);
  const romania = songs.filter((s) => s.location.country === 'RO').length;
  const withCoords = songs.filter((s) => s.location.lat !== null).length;
  const unresolved = {};
  for (const s of songs) if (s.location.village && s.location.resolution === 'unresolved') inc(unresolved, s.location.raw);
  const summary = { songs: songs.length, perSite, duplicates, romania, withCoords, places: places.length, unresolvedPlaces: Object.keys(unresolved).length };
  await writeBuildReport(summary, unresolved);
  return summary;
}

async function writeBuildReport(summary, unresolved) {
  const lines = [
    '# Build report',
    '',
    'Generated by `node src/cli.js build` (scraper/src/build.js). Regenerated on every build.',
    '',
    `- songs: ${summary.songs} (duplicates dropped: ${summary.duplicates})`,
    `- per site: ${Object.entries(summary.perSite).map(([k, v]) => `${k}=${v}`).join(', ')}`,
    `- resolve to present-day Romania: ${summary.romania}`,
    `- with coordinates: ${summary.withCoords}`,
    `- place nodes: ${summary.places}`,
    `- unresolved place strings: ${summary.unresolvedPlaces}`,
    '',
    '## Unresolved place strings (add to data/gazetteer.json)',
    '',
    ...Object.entries(unresolved).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k, v]) => `- ${v} x ${k}`),
    ''
  ];
  const { promises: fs } = await import('node:fs');
  await fs.writeFile(path.join(PATHS.data, 'BUILD.md'), lines.join('\n'), 'utf8');
}
