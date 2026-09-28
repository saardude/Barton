// Fold the places that bartok-nepzene.zti.hu prints (historical name, modern name, county,
// country, map coordinates) into data/gazetteer.json. Site coordinates are authoritative over the
// approximate seed. Only present-day Romania entries are added (the gazetteer's county list is RO).
import path from 'node:path';
import { PATHS, readJson, writeJson, exists, fold, clean } from './util.js';
import { Gazetteer, GAZETTEER_FILE } from './gazetteer.js';
import { countryCode } from './normalize.js';

export async function extendGazetteer({ log = () => {} } = {}) {
  const file = path.join(PATHS.raw, 'fmbc', 'records.json');
  if (!(await exists(file))) return { added: 0, updated: 0, skipped: 0, reason: 'raw/fmbc/records.json missing' };
  const records = await readJson(file);
  const data = await readJson(GAZETTEER_FILE);
  const gaz = new Gazetteer(data);
  let added = 0;
  let updated = 0;
  let skipped = 0;
  const seen = new Set();
  for (const r of records) {
    const p = r.place;
    if (!p || typeof p.lat !== 'number' || typeof p.lng !== 'number') continue;
    const hist = clean(p.villageHistorical);
    const modern = clean(p.village);
    if (!hist && !modern) continue;
    const key = `${fold(hist || modern)}|${fold(p.countyHistorical)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // country: stated, or via the county (the site may print a Romanian form of the historical county)
    let country = countryCode(p.country);
    let county = clean(p.county);
    const hc = gaz.historicalCounty(p.countyHistorical) || gaz.historicalCounty(county);
    if (county && !gaz.county(county)) county = hc && hc.county ? hc.county : null;
    else if (county) county = gaz.county(county).name;
    if (!country && county) country = gaz.countryOf(county);
    if (!country && hc && hc.exclusive) country = hc.country;
    if (country !== 'RO') {
      skipped += 1;
      continue;
    }
    if (!county && hc && hc.county) county = hc.county;
    const hit = gaz.lookup(hist || modern, { county: p.countyHistorical || county }) || (modern ? gaz.lookup(modern, { county: p.countyHistorical || county }) : null);
    if (!hit && !county) {
      skipped += 1;
      log(`skip ${hist}/${modern}: no modern county (${p.countyHistorical})`);
      continue;
    }
    const countyEntry = county ? gaz.county(county) : null;
    if (hit) {
      const e = hit.entry;
      const changed = e.lat !== p.lat || e.lng !== p.lng || (modern && e.name !== modern && !e.aliases.includes(modern));
      e.lat = p.lat;
      e.lng = p.lng;
      e.coordSource = 'site:fmbc';
      e.coordNote = 'from bartok-nepzene.zti.hu map link';
      e.confidence = 'high';
      if (hist && e.nameHistorical !== hist && !e.aliases.includes(hist)) e.aliases.push(hist);
      if (modern && e.name !== modern && !e.aliases.includes(modern)) e.aliases.push(modern);
      if (changed) updated += 1;
    } else {
      data.places.push({
        name: modern || hist,
        nameHistorical: hist || null,
        aliases: [],
        county: countyEntry.name,
        countyHistorical: clean(p.countyHistorical) || countyEntry.historical[0] || null,
        region: countyEntry.region,
        country: 'RO',
        lat: p.lat,
        lng: p.lng,
        type: 'village',
        confidence: 'high',
        coordSource: 'site:fmbc',
        coordNote: 'from bartok-nepzene.zti.hu map link'
      });
      added += 1;
    }
  }
  data.places.sort((a, b) => a.county.localeCompare(b.county) || a.name.localeCompare(b.name));
  data._meta.placeCount = data.places.length;
  data._meta.siteExtended = `extended from ${records.length} bartok-nepzene.zti.hu records: ${added} added, ${updated} updated`;
  await writeJson(GAZETTEER_FILE, data);
  return { added, updated, skipped, places: data.places.length };
}
