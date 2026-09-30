// Map raw parser output (site-specific label/value pairs) to the canonical song schema.
import { clean, fold, sha1, toInt, uniq } from './util.js';
import { countryFromPoint } from './geo.js';
import { stripQualifiers } from './gazetteer.js';

/**
 * Collector name normalisation. The sources print Hungarian order ("Bartók Béla"); fmbc prints
 * Western order ("Béla Bartók"). Keys are folded (diacritics/case-insensitive); values are the
 * canonical printed form. Non-Hungarian collectors keep their printed form.
 */
export const COLLECTOR_ALIASES = {
  'bela bartok': 'Bartók Béla',
  'bela bartok bela': 'Bartók Béla',
  'bartok': 'Bartók Béla',
  'b bartok': 'Bartók Béla',
  'bela vikar': 'Vikár Béla',
  'zoltan kodaly': 'Kodály Zoltán',
  'antal molnar': 'Molnár Antal',
  'laszlo lajtha': 'Lajtha László',
  'vilmos seemayer': 'Seemayer Vilmos',
  'akos garay': 'Garay Ákos',
  'gyula sebestyen': 'Sebestyén Gyula',
  'geza baditcs': 'Baditcs Géza',
  'albert osvath': 'Osváth Albert',
  'jozsef szabo': 'Szabó József',
  'kalman kovacs': 'Kovács Kálmán',
  'jozsef farbas': 'Fárbás József',
  'laszlo kun': 'Kún László',
  'marta ziegler': 'Bartók Béláné',
  'ziegler marta': 'Bartók Béláné',
  'bartok belane ziegler marta': 'Bartók Béláné',
  'emma sandor': 'Kodály Zoltánné',
  'sandor emma': 'Kodály Zoltánné',
  'pal peter domokos': 'Domokos Pál Péter',
  'sandor veress': 'Veress Sándor',
  'gyorgy kerenyi': 'Kerényi György',
  'attila peczely': 'Péczely Attila',
  'peter balla': 'Balla Péter',
  'm and k royova': ['M. Royová', 'K. Royová']
};

/**
 * "Seemayer Vilmos, Bartók Béla, Lajtha László" -> ['Seemayer Vilmos', 'Bartók Béla', 'Lajtha László'];
 * "Béla Bartók" -> ['Bartók Béla']; "" -> []. Splits on , ; / " and " " és " (never inside an
 * initial such as "M. and K. Royová", which the alias table expands), trims, applies COLLECTOR_ALIASES.
 */
export function parseCollectors(raw) {
  const r = clean(raw);
  if (!r) return [];
  const out = [];
  const push = (name) => {
    const n = clean(name);
    if (!n) return;
    const alias = COLLECTOR_ALIASES[fold(n)];
    const names = Array.isArray(alias) ? alias : [alias || n];
    for (const x of names) if (!out.includes(x)) out.push(x);
  };
  const whole = COLLECTOR_ALIASES[fold(r)];
  if (whole) {
    for (const x of Array.isArray(whole) ? whole : [whole]) push(x);
    return out;
  }
  for (const part of r.split(/\s*[,;\/]\s*|\s+(?:and|és|und)\s+(?=\S+\s+\S)/i)) push(part);
  return out;
}

export const GENRES = ['colinda', 'doina', 'bocet', 'cantec', 'joc', 'nunta', 'other'];

export const SITE_NAMES = {
  fmbc: "Folk Music in Bartok's Compositions (HUN-REN BTK ZTI, bartok-nepzene.zti.hu)",
  bsys: 'The Bartok System (HUN-REN BTK ZTI, systems.zti.hu/br)',
  gyuj: 'Bela Bartok, the Ethnomusicologist (HUN-REN BTK ZTI, bartok-gyujtesek.zti.hu)'
};

// Order matters: the first matching rule wins. Stems are matched at a word start on the folded
// label (no trailing boundary, so "lakodalmas", "colinde", "jocuri" all match).
const GENRE_RULES = [
  ['nunta', /\b(nunt|wedding|lakodalm|bridal|mireas|menyasszony|hora miresii)/],
  ['colinda', /\b(colind|carol|karacsony|christmas|kolind|kolend|koled|star song|cantec de stea|turca)/],
  ['bocet', /\b(bocet|lament|dirge|sirat|halott|funeral|mourning|cantec de mort|zori)/],
  ['doina', /\b(doin|hora lung|dojn|cantec lung|long song|parlando song)/],
  ['joc', /\b(joc|dance|tanc|ardelean|invartit|hora|sarb|sirb|batut|briu|pe loc|de doi|mananjel|manae)/],
  ['cantec', /\b(cantec|song|dal\b|nepdal|lied|enek|ballad|balad|lullaby|legana|de dragoste|de jale|de catanie|soldier)/]
];

/** Map a site genre label to the controlled vocabulary. null only when the label is empty. */
export function mapGenre(label) {
  const l = clean(label);
  if (!l) return null;
  const f = ` ${fold(l)} `;
  for (const [genre, re] of GENRE_RULES) if (re.test(f)) return genre;
  return 'other';
}

const VOCAL_RE = /\b(vocal|voice|sung|singing|song|enek|enekes|enekelt|cantat|cantata|voce|vocalis|text)\b/;
const INSTR_RE = /\b(instrumental|instrument|hangszer|hangszeres|fluier|fluer|furulya|flute|tilinca|tilinka|caval|kaval|violin|vioara|hegedu|fiddle|bagpipe|cimpoi|duda|clarinet|klarinet|taragot|tarogato|jew s harp|jews harp|drimba|dramba|doromb|bucium|alphorn|havasi kurt|kurt|horn|cobza|koboz|tambal|cimbalom|drum|toba|dob|accordion|harmonica|ocarina|zither|citera|lute|guitar|gitar|trumpet|trombita|whistle|leaf|frunza|falevel|band|taraf|piano)\b/;

/** vocal | instrumental | mixed | unknown from a free-text performance label (+ instrument list). */
export function mapPerformance(label, instruments = []) {
  const f = ` ${fold(label)} `;
  const vocal = VOCAL_RE.test(f);
  const instr = INSTR_RE.test(f) || instruments.length > 0;
  if (vocal && instr) return 'mixed';
  if (vocal) return 'vocal';
  if (instr) return 'instrumental';
  return 'unknown';
}

// canonical name -> aliases (folded)
const INSTRUMENTS = [
  ['violin', ['violin', 'vioara', 'hegedu', 'fiddle', 'violino', 'viola']],
  ['fluier', ['fluier', 'fluer', 'furulya', 'flute', 'fluieras', 'shepherd flute']],
  ['fujara', ['fujara', 'fujera']],
  ['tilinca', ['tilinca', 'tilinka']],
  ['caval', ['caval', 'kaval']],
  ['bagpipe', ['bagpipe', 'bagpipes', 'cimpoi', 'duda', 'gajdy']],
  ['clarinet', ['clarinet', 'klarinet', 'klarinett']],
  ['taragot', ['taragot', 'tarogato', 'taragota']],
  ["jew's harp", ['jew s harp', 'jews harp', 'drimba', 'dramba', 'doromb']],
  ['bucium', ['bucium', 'alphorn', 'havasi kurt', 'tulnic']],
  ['horn', ['horn', 'kurt', 'shepherd s horn', 'shepherds horn']],
  ['cobza', ['cobza', 'koboz']],
  ['cimbalom', ['cimbalom', 'tambal', 'cimbal']],
  ['drum', ['drum', 'toba', 'dob', 'doba']],
  ['accordion', ['accordion', 'harmonika', 'acordeon']],
  ['ocarina', ['ocarina']],
  ['zither', ['zither', 'citera']],
  ['guitar', ['guitar', 'gitar', 'chitara']],
  ['trumpet', ['trumpet', 'trombita']],
  ['leaf', ['leaf', 'frunza', 'falevel']],
  ['whistle', ['whistle']],
  ['piano', ['piano', 'zongora']],
  ['band', ['band', 'taraf', 'zenekar', 'ensemble']]
];

/** Extract canonical instrument names mentioned in one or more free-text fields. */
export function extractInstruments(...texts) {
  const f = ` ${texts.filter(Boolean).map(fold).join(' ')} `;
  const out = [];
  for (const [name, aliases] of INSTRUMENTS) {
    if (aliases.some((a) => f.includes(` ${a} `))) out.push(name);
  }
  return uniq(out);
}

const MONTHS = {
  // english
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4, may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8, september: 9, sep: 9, sept: 9, october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12,
  // hungarian (folded)
  januar: 1, februar: 2, febr: 2, marcius: 3, marc: 3, aprilis: 4, apr_: 4, majus: 5, maj: 5, junius: 6, julius: 7, augusztus: 8, szeptember: 9, szept: 9, oktober: 10, okt: 10, december_: 12,
  // romanian (folded)
  ianuarie: 1, ian: 1, februarie: 2, martie: 3, aprilie: 4, mai: 5, iunie: 6, iun: 6, iulie: 7, iul: 7, septembrie: 9, octombrie: 10, noiembrie: 11, noi: 11, decembrie: 12
};
const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12 };

/**
 * Parse a collection date in the forms seen on the sites:
 *  "1909. jún. 12.", "1909 június", "June 1912", "12 June 1912", "1912. VI. 12", "12.06.1912",
 *  "1909-06-12", "1909", "1909-1910", "March 15-27, 1913", "27. 12. 1910", "1914. április 3-10."
 * Ranges keep the first day/month. Returns {year, month, day, raw}; unknown parts are null.
 */
export function parseDate(raw) {
  const r = clean(raw);
  const out = { year: null, month: null, day: null, raw: r };
  if (!r) return out;
  const f = fold(r); // e.g. "1909 jun 12", "march 15 27 1913"
  const tokens = f.split(' ').filter(Boolean);
  // ISO first
  let m = r.match(/(1[89]\d\d)-(\d{1,2})-(\d{1,2})/);
  if (m) return { year: +m[1], month: +m[2], day: +m[3], raw: r };
  // dd.mm.yyyy or dd. mm. yyyy
  m = r.match(/(?:^|\D)(\d{1,2})\.\s*(\d{1,2})\.\s*(1[89]\d\d)/);
  if (m && +m[2] >= 1 && +m[2] <= 12) return { year: +m[3], month: +m[2], day: +m[1], raw: r };
  // year
  const y = tokens.find((t) => /^1[89]\d\d$/.test(t));
  if (y) out.year = +y;
  else {
    const anyYear = r.match(/\b(1[89]\d\d)\b/);
    if (anyYear) out.year = +anyYear[1];
  }
  // month by name
  let monthIdx = -1;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (MONTHS[t] !== undefined) {
      out.month = MONTHS[t];
      monthIdx = i;
      break;
    }
  }
  // roman month: "1912. VI. 12"
  if (out.month === null) {
    const rm = r.match(/(1[89]\d\d)\.?\s+([IVX]{1,4})\.?\s*(\d{1,2})?/);
    if (rm && ROMAN[rm[2].toLowerCase()]) {
      out.month = ROMAN[rm[2].toLowerCase()];
      if (rm[3]) out.day = +rm[3];
      return out;
    }
  }
  // numeric month after year: "1909. 6. 12."
  if (out.month === null) {
    const nm = r.match(/(1[89]\d\d)\.\s*(\d{1,2})\.\s*(\d{1,2})?/);
    if (nm && +nm[2] >= 1 && +nm[2] <= 12) {
      out.month = +nm[2];
      if (nm[3] && +nm[3] >= 1 && +nm[3] <= 31) out.day = +nm[3];
      return out;
    }
    // "03. 1907" (mm. yyyy)
    const my = r.match(/(?:^|\D)(\d{1,2})\.\s*(1[89]\d\d)/);
    if (my && +my[1] >= 1 && +my[1] <= 12) {
      out.month = +my[1];
      return out;
    }
  }
  // day: first 1-2 digit number adjacent to the month token (either side)
  if (out.month !== null && monthIdx >= 0) {
    const cands = [tokens[monthIdx + 1], tokens[monthIdx - 1]];
    for (const c of cands) {
      if (c && /^\d{1,2}$/.test(c) && +c >= 1 && +c <= 31) {
        out.day = +c;
        break;
      }
    }
  }
  return out;
}

/**
 * Split a place string. Handles "A / B" (collection place / informant origin),
 * "Village (County)", "Village, County vm.", and "Village [County]".
 * Returns {main:{name, county, raw}, origin:{name, county, raw}|null, raw}.
 */
export function parseLocality(raw) {
  const r = clean(raw);
  if (!r) return { main: { name: null, county: null, raw: null }, origin: null, raw: null };
  const parts = r.split(/\s+\/\s+|\s*\/\s*(?=[A-ZÁÉÍÓÖŐÚÜŰĂÂÎȘȚŞŢ])/).map((p) => clean(p)).filter(Boolean);
  const one = (s) => {
    if (!s) return { name: null, county: null, raw: null };
    let county = null;
    const paren = s.match(/\(([^)]+)\)|\[([^\]]+)\]/);
    if (paren) county = clean(paren[1] || paren[2]);
    else {
      const comma = s.match(/,\s*([^,]+?)\s*(vm\.|vármegye|megye|county|m\.|jud\.|județ)?\s*$/i);
      if (comma) county = clean(comma[1]);
    }
    if (county) county = county.replace(/\s*(vm\.?|vármegye|megye|county|m\.|jud\.?|județ)\s*$/i, '').trim() || null;
    // strip a "?" marker used for uncertain places, keep it in raw
    const name = stripQualifiers(s.replace(/\?/g, '').trim());
    return { name: name || null, county, raw: s };
  };
  const main = one(parts[0]);
  const origin = parts.length > 1 ? one(parts[1]) : null;
  // Inherit county from the other half when only one side has it.
  if (origin && !origin.county && main.county) origin.county = main.county;
  if (origin && !main.county && origin.county) main.county = origin.county;
  return { main, origin, raw: r };
}

const DESCRIPTOR_RE = /^(?:(?:elderly|old|older|young|adult|little|small)\s+)?(woman|women|man|men|girl|girls|boy|boys|male|female|lad|lads|lass|child|children|persons|people|soldier|soldiers|shepherd|shepherds|gypsy|gypsies|peasant|peasants|nő|nők|férfi|férfiak|asszony|leány|lány|lányok|legény|legények|fiú|gyerek|gyermek|femeie|bărbat|fată|băiat)(?:\s+(?:and|és|și)\s+.*)?$/i;

/**
 * "Pop Ioan (45)" / "Ioan Pop, 45 years" / "Dósa Lidi, 16 é." / "Nicolaie Bortiș (ca 55)" /
 * "Miklós Pap (elderly man)" / "woman" -> {name, age, sex}. Generic descriptors ("young man",
 * "girls", "old woman") are not names: name stays null and only sex is derived.
 */
export function parsePerformer(raw) {
  const r = clean(raw);
  if (!r) return { name: null, age: null, sex: null };
  let age = null;
  let sex = null;
  let name = r;
  const paren = r.match(/\(([^)]*)\)\s*$/);
  if (paren) {
    const inner = paren[1];
    const am = inner.match(/(?:ca\.?|c\.|about|approx\.?|kb\.?)?\s*(\d{1,3})\s*(é\.?|éves|years?|yrs?|ani|de ani|j\.)?/i);
    if (am) age = +am[1];
    else sex = mapSex(inner);
    name = r.slice(0, paren.index).trim();
  } else {
    const m = r.match(/[,\s]\s*(?:ca\.?\s*)?(\d{1,3})\s*(é\.?|éves|years?|yrs?|ani|de ani|j\.)?\s*$/i);
    if (m) {
      age = +m[1];
      name = r.slice(0, m.index).trim();
    }
  }
  name = name.replace(/[,;:]\s*$/, '').trim() || null;
  if (age !== null && (age < 3 || age > 110)) age = null;
  if (name && DESCRIPTOR_RE.test(name)) {
    sex = sex || mapSex(name);
    name = null;
  }
  return { name, age, sex };
}

/** m | f | null from a sex label in en/hu/ro. */
export function mapSex(raw) {
  const f = fold(raw);
  if (!f) return null;
  if (/\b(f|female|woman|women|girl|girls|lass|no|nok|asszony|leany|lany|lanyok|femeie|fata|w)\b/.test(f)) return 'f';
  if (/\b(m|male|man|men|boy|boys|lad|lads|ferfi|ferfiak|barbat|baiat|legeny|legenyek|fiu|soldier|soldiers|shepherd|shepherds)\b/.test(f)) return 'm';
  return null;
}

/** Resolve a parsed locality half against the gazetteer. */
export function resolvePlace(half, gazetteer) {
  const out = { village: null, villageHistorical: half ? half.name : null, county: null, countyHistorical: half ? half.county : null, region: null, country: null, lat: null, lng: null, placeId: null, resolution: 'unresolved', confidence: null };
  if (!half || !half.name) return out;
  const countyEntry = half.county && gazetteer ? gazetteer.county(half.county) : null;
  const hc = half.county && gazetteer ? gazetteer.historicalCounty(half.county) : null;
  // A modern county name is unambiguous; a historical one only when it lies wholly in one country.
  const isModernName = countyEntry && fold(stripQualifiers(half.county)) === fold(countyEntry.name);
  if (isModernName) {
    out.county = countyEntry.name;
    out.region = countyEntry.region;
    out.country = countyEntry.country;
  } else if (hc && hc.exclusive && hc.country) {
    out.country = hc.country;
    out.region = hc.region;
    out.county = hc.county;
  }
  const hit = gazetteer ? gazetteer.lookup(half.name, { county: half.county }) : null;
  if (!hit && out.country) out.resolution = 'county';
  if (hit) {
    const e = hit.entry;
    out.village = e.name;
    out.villageHistorical = half.name;
    if (hit.via === 'modern' && !half.county && e.nameHistorical) out.villageHistorical = e.nameHistorical;
    out.county = e.county;
    out.countyHistorical = half.county || e.countyHistorical;
    out.region = e.region;
    out.country = e.country;
    out.lat = e.lat;
    out.lng = e.lng;
    out.resolution = 'gazetteer';
    out.confidence = hit.ambiguous ? 'low' : e.confidence || null;
  }
  return out;
}

export const COUNTRY_CODES = { romania: 'RO', hungary: 'HU', slovakia: 'SK', serbia: 'RS', ukraine: 'UA', austria: 'AT', croatia: 'HR', slovenia: 'SI', bulgaria: 'BG', 'czech republic': 'CZ', czechia: 'CZ', poland: 'PL', moldova: 'MD', turkey: 'TR', algeria: 'DZ', 'bosnia and herzegovina': 'BA' };

export function countryCode(name) {
  const f = fold(name);
  if (!f) return null;
  if (/^[a-z]{2}$/.test(f)) return f.toUpperCase();
  return COUNTRY_CODES[f] || null;
}

/**
 * Site-provided structured place (fmbc prints "Hist/Modern (HistCounty/ModernCounty)" or
 * "Hist (HistCounty; now: Modern, Country)" and a map link with coordinates). Gazetteer fills gaps.
 */
export function resolveStructuredPlace(place, gazetteer) {
  const out = { village: null, villageHistorical: null, county: null, countyHistorical: null, region: null, country: null, lat: null, lng: null, placeId: null, resolution: 'unresolved', confidence: null };
  if (!place) return out;
  out.villageHistorical = clean(place.villageHistorical) || clean(place.village) || null;
  out.countyHistorical = clean(place.countyHistorical) || null;
  out.country = countryCode(place.country);
  // The site may print a Romanian form of the historical county after the slash ("Maros-Torda/Mureș-Turda"):
  // accept it as the modern county only when the gazetteer knows it as one.
  const statedCounty = clean(place.county);
  const statedEntry = statedCounty && gazetteer ? gazetteer.county(statedCounty) : null;
  const statedIsModern = statedEntry && fold(statedCounty) === fold(statedEntry.name);
  if (statedIsModern) place = { ...place, county: statedEntry.name };
  if (statedCounty && !statedIsModern && gazetteer) {
    const hc = gazetteer.historicalCounty(statedCounty);
    if (hc && hc.exclusive && hc.county) place = { ...place, county: hc.county };
    else if (statedEntry) place = { ...place, county: statedEntry.name };
    else place = { ...place, county: null };
  }
  const hist = { name: out.villageHistorical, county: out.countyHistorical };
  const g0 = gazetteer ? resolvePlace(hist, gazetteer) : null;
  // Use the gazetteer only when it does not contradict the country the site states.
  const g = g0 && (!out.country || !g0.country || g0.country === out.country) ? g0 : null;
  // Prefer what the site states; fall back to the gazetteer.
  out.village = clean(place.village) || (g && g.village) || null;
  out.county = clean(place.county) || (g && g.county) || null;
  if (!out.country && g && g.country) out.country = g.country;
  if (!out.country && out.county && gazetteer) out.country = gazetteer.countryOf(out.county);
  if (!out.county && out.countyHistorical && gazetteer) {
    const c = gazetteer.county(out.countyHistorical);
    if (c && (!out.country || c.country === out.country)) out.county = c.name;
    const hc = gazetteer.historicalCounty(out.countyHistorical);
    if (hc && hc.exclusive && hc.country && !out.country) out.country = hc.country;
    if (hc && hc.exclusive && hc.country === out.country) {
      out.region = out.region || hc.region;
      out.county = out.county || hc.county;
    }
  }
  out.region = (gazetteer && out.county && gazetteer.regionOf(out.county)) || (g && g.region) || null;
  if (typeof place.lat === 'number' && typeof place.lng === 'number') {
    out.lat = place.lat;
    out.lng = place.lng;
    out.resolution = 'site';
  } else if (g && g.lat !== null) {
    out.lat = g.lat;
    out.lng = g.lng;
    out.resolution = 'gazetteer';
    out.confidence = g.confidence;
  } else if (out.village) out.resolution = 'site';
  else if (g && g.resolution === 'county') out.resolution = 'county';
  if (out.resolution === 'site') out.confidence = 'high';
  return out;
}

export function placeIdFor(loc) {
  const slug = (s) => fold(s).replace(/\s+/g, '-');
  const name = loc.village || loc.villageHistorical;
  if (!name) return null;
  const country = loc.country ? loc.country.toLowerCase() : 'xx';
  const leaf = slug(loc.village) || slug(loc.villageHistorical) || `p-${sha1(name).slice(0, 8)}`;
  if (loc.village && loc.county && loc.region) return `${country}/${slug(loc.region)}/${slug(loc.county)}/${leaf}`;
  if (loc.county && loc.region) return `${country}/${slug(loc.region)}/${slug(loc.county)}/${leaf}`;
  return `${country}/unresolved/${leaf}`;
}

/**
 * Normalise one raw record (as produced by a site parser) into the canonical schema.
 * Raw shape (all optional, null when missing):
 * { site, siteRecordId, url, fetchedAt, title, incipit, genreRaw, style, performanceRaw,
 *   instrumentRaw, performerRaw, ageRaw, sexRaw, ethnicityRaw, collectorRaw, dateRaw, placeRaw,
 *   referenceCode, volume, number, notation[], audio[], text, remarks, systemPosition, cadences,
 *   rhythm, mode, ambitus, syllables, form, related[], composition[], fields{} }
 */
export function normalizeRecord(raw, gazetteer) {
  const site = raw.site;
  const idBody = String(raw.siteRecordId || '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  const id = `${site}-${idBody}`;
  const performer = parsePerformer(raw.performerRaw);
  const age = raw.ageRaw !== undefined && raw.ageRaw !== null ? toInt(raw.ageRaw) : performer.age;
  const sex = mapSex(raw.sexRaw) || performer.sex;
  const instruments = uniq([...(raw.instrumentRaw ? extractInstruments(raw.instrumentRaw) : []), ...extractInstruments(raw.performanceRaw)]);
  let placeRaw = raw.placeRaw;
  if (raw.originRaw && placeRaw && !/\s\/\s/.test(placeRaw)) placeRaw = `${placeRaw} / ${raw.originRaw}`;
  const loc = raw.place ? { main: { name: raw.place.villageHistorical || raw.place.village || null, county: raw.place.countyHistorical || null, raw: raw.placeRaw }, origin: null, raw: clean(raw.placeRaw) } : parseLocality(placeRaw);
  const main = raw.place ? resolveStructuredPlace(raw.place, gazetteer) : resolvePlace(loc.main, gazetteer);
  const origin = loc.origin ? resolvePlace(loc.origin, gazetteer) : null;
  if (!main.country && main.lat !== null && main.lng !== null) {
    const cc = countryFromPoint(main.lat, main.lng);
    if (cc) main.country = cc;
  }
  const location = {
    country: main.country,
    region: main.region,
    county: main.county,
    countyHistorical: main.countyHistorical,
    village: main.village,
    villageHistorical: main.villageHistorical,
    lat: main.lat,
    lng: main.lng,
    raw: loc.raw,
    placeId: placeIdFor(main),
    origin: origin ? { village: origin.village, villageHistorical: origin.villageHistorical, county: origin.county, countyHistorical: origin.countyHistorical, placeId: placeIdFor(origin) } : null,
    resolution: main.resolution
  };
  const media = (arr) => (Array.isArray(arr) ? arr.filter((m) => m && m.url).map((m) => ({ url: m.url, type: m.type ?? null, caption: clean(m.caption) })) : []);
  const performance = raw.performanceRaw || instruments.length ? mapPerformance(raw.performanceRaw, instruments) : 'unknown';
  return {
    id,
    source: {
      site,
      siteName: SITE_NAMES[site] || site,
      siteId: clean(raw.siteId) || clean(raw.referenceCode) || clean(raw.siteRecordId) || idBody,
      url: raw.url,
      referenceCode: clean(raw.referenceCode),
      volume: clean(raw.volume),
      number: clean(raw.number),
      siteRecordId: clean(raw.siteRecordId),
      fetchedAt: raw.fetchedAt || null,
      alternates: []
    },
    journey: raw.journey && (raw.journey.collectionId || raw.journey.label) ? { collectionId: raw.journey.collectionId ?? null, label: clean(raw.journey.label), dateRaw: clean(raw.journey.dateRaw), place: clean(raw.journey.place), url: raw.journey.url ?? null } : null,
    title: clean(raw.title),
    incipit: clean(raw.incipit),
    genre: mapGenre(raw.genreRaw),
    genreRaw: clean(raw.genreRaw),
    style: clean(raw.style),
    styleRaw: clean(raw.styleRaw),
    performance,
    instrument: instruments,
    performer: {
      name: performer.name,
      age: age !== null && age >= 0 && age <= 120 ? age : null,
      sex,
      ethnicity: clean(raw.ethnicityRaw)
    },
    collector: clean(raw.collectorRaw),
    collectorRaw: clean(raw.collectorRaw),
    collectors: parseCollectors(raw.collectorRaw),
    collected: parseDate(raw.dateRaw),
    location,
    media: { notation: media(raw.notation), audio: media(raw.audio) },
    music: {
      systemPosition: clean(raw.systemPosition),
      cadences: clean(raw.cadences),
      rhythm: clean(raw.rhythm),
      mode: clean(raw.mode),
      ambitus: clean(raw.ambitus),
      syllables: clean(raw.syllables),
      form: clean(raw.form)
    },
    text: raw.text ? String(raw.text).trim() || null : null,
    remarks: clean(raw.remarks),
    related: Array.isArray(raw.related) ? raw.related.map((r) => ({ id: r.id ?? null, url: r.url ?? null, label: clean(r.label), relation: r.relation || 'link' })) : [],
    composition: Array.isArray(raw.composition) ? raw.composition.map((c) => ({ work: clean(c.work), movement: clean(c.movement), catalogue: clean(c.catalogue), raw: clean(c.raw) })) : [],
    rawFields: raw.fields && Object.keys(raw.fields).length ? raw.fields : null
  };
}

export default normalizeRecord;
