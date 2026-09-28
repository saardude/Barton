// Map raw parser output (site-specific label/value pairs) to the canonical song schema.
import { clean, fold, toInt, uniq } from './util.js';
import { stripQualifiers } from './gazetteer.js';

export const GENRES = ['colinda', 'doina', 'bocet', 'cantec', 'joc', 'nunta', 'other'];

export const SITE_NAMES = {
  fmbc: "Folk Music in Bartok's Compositions (HUN-REN BTK ZTI, bartok-nepzene.zti.hu)",
  bsys: 'The Bartok System (HUN-REN BTK ZTI, systems.zti.hu/br)',
  gyuj: 'Bela Bartok, the Ethnomusicologist (HUN-REN BTK ZTI, bartok-gyujtesek.zti.hu)'
};

// Order matters: the first matching rule wins. Patterns are tested on the folded label.
const GENRE_RULES = [
  ['nunta', /\b(nunta|nunti|nuntii|wedding|lakodalm|bridal|mireas|menyasszony|hora miresii|cantec de nunta)\b/],
  ['colinda', /\b(colind|colinde|colinda|carol|karacsony|christmas|kolinda|kolenda|koleda|star song|cantec de stea|turca)\b/],
  ['bocet', /\b(bocet|bocete|lament|dirge|sirato|halott|funeral|mourning|cantec de mort|zori|zorile|siratoenek)\b/],
  ['doina', /\b(doina|doine|hora lunga|dojna|cantec lung|long song|parlando song)\b/],
  ['joc', /\b(joc|jocuri|dance|tanc|tancdal|tancdallam|ardeleana|invartita|hora|sarba|sirba|batuta|briu|briul|pe loc|de doi|mananjelul|manaea|instrumental dance|dance tune)\b/],
  ['cantec', /\b(cantec|cantece|song|dal|nepdal|lied|enek|cantec propriu zis|proper song|ballad|balada|lullaby|leganat|cantec de leagan|de dragoste|de jale|de catanie|soldier)\b/]
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

/** "Pop Ioan (45)" / "Ioan Pop, 45 years" / "Maria Bud, 19 é." -> {name, age}. */
export function parsePerformer(raw) {
  const r = clean(raw);
  if (!r) return { name: null, age: null };
  let age = null;
  let name = r;
  const m = r.match(/\(?\b(\d{1,3})\s*(é\.?|éves|years?|yrs?|ani|de ani|j\.)?\)?\s*$/i) || r.match(/\((\d{1,3})\)/);
  if (m) {
    age = +m[1];
    name = r.replace(m[0], '').replace(/[,(]\s*$/, '').trim();
  }
  name = name.replace(/[,;:]\s*$/, '').trim() || null;
  if (age !== null && (age < 3 || age > 110)) age = null;
  return { name, age };
}

/** m | f | null from a sex label in en/hu/ro. */
export function mapSex(raw) {
  const f = fold(raw);
  if (!f) return null;
  if (/\b(f|female|woman|women|girl|no|noi|asszony|leany|lany|femeie|fata|w)\b/.test(f)) return 'f';
  if (/\b(m|male|man|men|boy|ferfi|barbat|baiat|legeny)\b/.test(f)) return 'm';
  return null;
}

/** Resolve a parsed locality half against the gazetteer. */
export function resolvePlace(half, gazetteer) {
  const out = { village: null, villageHistorical: half ? half.name : null, county: null, countyHistorical: half ? half.county : null, region: null, country: null, lat: null, lng: null, placeId: null, resolution: 'unresolved', confidence: null };
  if (!half || !half.name) return out;
  const countyEntry = half.county && gazetteer ? gazetteer.county(half.county) : null;
  if (countyEntry) {
    out.county = countyEntry.name;
    out.region = countyEntry.region;
    out.country = countyEntry.country;
  }
  const hit = gazetteer ? gazetteer.lookup(half.name, { county: half.county }) : null;
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

function placeIdFor(loc) {
  const slug = (s) => fold(s).replace(/\s+/g, '-');
  if (!loc.village) return null;
  const country = loc.country ? loc.country.toLowerCase() : 'xx';
  if (loc.county && loc.region) return `${country}/${slug(loc.region)}/${slug(loc.county)}/${slug(loc.village)}`;
  return `${country}/unresolved/${slug(loc.village)}`;
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
  const instruments = uniq([...(raw.instrumentRaw ? extractInstruments(raw.instrumentRaw) : []), ...extractInstruments(raw.performanceRaw)]);
  const loc = parseLocality(raw.placeRaw);
  const main = resolvePlace(loc.main, gazetteer);
  const origin = loc.origin ? resolvePlace(loc.origin, gazetteer) : null;
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
      fetchedAt: raw.fetchedAt || null
    },
    title: clean(raw.title),
    incipit: clean(raw.incipit),
    genre: mapGenre(raw.genreRaw),
    genreRaw: clean(raw.genreRaw),
    style: clean(raw.style),
    performance,
    instrument: instruments,
    performer: {
      name: performer.name,
      age: age !== null && age >= 0 && age <= 120 ? age : null,
      sex: mapSex(raw.sexRaw),
      ethnicity: clean(raw.ethnicityRaw)
    },
    collector: clean(raw.collectorRaw),
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
