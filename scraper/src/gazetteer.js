// Gazetteer: diacritics-insensitive lookup of localities by modern, historical or alias name.
import path from 'node:path';
import { PATHS, fold, readJson } from './util.js';

export const GAZETTEER_FILE = path.join(PATHS.data, 'gazetteer.json');

/** Strip trailing county hints and qualifiers: "Kerpenyét (Bihar)" -> "Kerpenyét". */
export function stripQualifiers(name) {
  if (!name) return null;
  return String(name)
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s*\[[^\]]*\]\s*/g, ' ')
    .replace(/\s*,\s*[^,]*(vm\.|vármegye|megye|county|jud\.|județ|judet)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim() || null;
}

export class Gazetteer {
  constructor(data) {
    this.data = data || { counties: [], places: [] };
    this.byName = new Map(); // folded name -> [{entry, via}]
    this.countyByName = new Map(); // folded county (modern or historical) -> county entry
    for (const c of this.data.counties || []) {
      this.countyByName.set(fold(c.name), c);
      for (const h of c.historical || []) if (!this.countyByName.has(fold(h))) this.countyByName.set(fold(h), c);
    }
    for (const p of this.data.places || []) {
      this.index(p.name, p, 'modern');
      if (p.nameHistorical) this.index(p.nameHistorical, p, 'historical');
      for (const a of p.aliases || []) this.index(a, p, 'alias');
    }
  }

  index(name, entry, via) {
    const k = fold(name);
    if (!k) return;
    if (!this.byName.has(k)) this.byName.set(k, []);
    this.byName.get(k).push({ entry, via });
  }

  static async load(file = GAZETTEER_FILE) {
    return new Gazetteer(await readJson(file));
  }

  /** Resolve a modern or historical county name to the county entry, or null. */
  county(name) {
    if (!name) return null;
    const k = fold(stripQualifiers(name) || name);
    if (this.countyByName.has(k)) return this.countyByName.get(k);
    // "Bihar vm." / "Bihar county"
    const k2 = k.replace(/\b(vm|varmegye|megye|county|jud|judet)\b/g, '').trim();
    return this.countyByName.get(k2) || null;
  }

  /**
   * Look up a locality. `hint` may hold {county} (modern or historical county name).
   * Returns {entry, via, ambiguous} or null. When several places share a name and no hint
   * disambiguates, the first by county order is returned with ambiguous=true.
   */
  lookup(name, hint = {}) {
    const bare = stripQualifiers(name);
    if (!bare) return null;
    let cands = this.byName.get(fold(bare)) || [];
    if (!cands.length) {
      // Try without a leading article / trailing descriptors like "de Sus" left intact but "com." prefixes removed
      const alt = bare.replace(/^(com\.|comuna|sat|satul)\s+/i, '');
      cands = this.byName.get(fold(alt)) || [];
    }
    if (!cands.length) return null;
    const countyHint = hint.county ? this.county(hint.county) : null;
    if (countyHint) {
      const inCounty = cands.filter((c) => fold(c.entry.county) === fold(countyHint.name));
      if (inCounty.length) return { ...inCounty[0], ambiguous: inCounty.length > 1 };
      const inHist = cands.filter((c) => fold(c.entry.countyHistorical) === fold(hint.county));
      if (inHist.length) return { ...inHist[0], ambiguous: inHist.length > 1 };
    }
    const distinct = new Set(cands.map((c) => `${c.entry.name}|${c.entry.county}`));
    return { ...cands[0], ambiguous: distinct.size > 1 };
  }

  /**
   * Pre-1920 county (as printed) -> {country, region, county, exclusive, countries} from
   * data/gazetteer.json historicalCounties, or null. Diacritics-insensitive; strips "vm."/"county".
   */
  historicalCounty(name) {
    if (!name) return null;
    if (!this.histIndex) {
      this.histIndex = new Map();
      for (const [k, v] of Object.entries(this.data.historicalCounties || {})) this.histIndex.set(fold(k), { name: k, ...v });
    }
    const k = fold(stripQualifiers(name) || name).replace(/\b(vm|varmegye|megye|county|countye|comitatus)\b/g, '').trim();
    return this.histIndex.get(k) || null;
  }

  /** Country code for a modern county name. */
  countryOf(countyName) {
    const c = this.county(countyName);
    return c ? c.country : null;
  }

  regionOf(countyName) {
    const c = this.county(countyName);
    return c ? c.region : null;
  }
}

export default Gazetteer;
