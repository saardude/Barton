// Site 2: systems.zti.hu/br/en ("The Bartok System", >13,000 melodies).
// Category pages /br/en/browse/<10..83>/ list every melody in one table (no pagination; largest
// category 1448 rows). Each row links to a record page /br/en/browse/<cat>/<rec>.
// Record id: "<cat>-<rec>" from the URL; siteId: the BR number as displayed ("A 1101a").
// robots.txt on this host disallows all non-Googlebot agents; crawl only with --ignore-robots
// (owner decision, docs/SCRAPER.md).
import { load, links, parseZtiTable, parseZtiRecord, splitPlaceLine, styleFromSystem } from './common.js';
import { absUrl, clean } from '../util.js';

export const name = 'bsys';
export const host = 'https://systems.zti.hu';
export const kind = 'pages';
export const seeds = [`${host}/br/en/browse`];
// CONFIRMED (from /br/en/browse, 2026-09-28): category id -> [class, subclass, group/syllables].
export const CATEGORIES = {
  '10': ["Class C: mixed, not unified style", "III. 3-liners"],
  '11': ["Class C: mixed, not unified style", "IV. 2-liners, half melody, or fragment"],
  '12': ["Class A: old style", "I. parlando-rubato or fixed rhythm", "number of syllables: 5"],
  '13': ["Class A: old style", "I. parlando-rubato or fixed rhythm", "number of syllables: 6"],
  '14': ["Class A: old style", "I. parlando-rubato or fixed rhythm", "number of syllables: 7"],
  '15': ["Class A: old style", "I. parlando-rubato or fixed rhythm", "number of syllables: 8"],
  '16': ["Class A: old style", "I. parlando-rubato or fixed rhythm", "number of syllables: 9"],
  '17': ["Class A: old style", "I. parlando-rubato or fixed rhythm", "number of syllables: 10"],
  '18': ["Class A: old style", "I. parlando-rubato or fixed rhythm", "number of syllables: 11"],
  '19': ["Class A: old style", "I. parlando-rubato or fixed rhythm", "number of syllables: 12"],
  '20': ["Class A: old style", "I. parlando-rubato or fixed rhythm", "number of syllables: 13-16"],
  '21': ["Class A: old style", "II. adjustable rhythm", "number of syllables: 6"],
  '22': ["Class A: old style", "II. adjustable rhythm", "number of syllables: 7"],
  '23': ["Class A: old style", "II. adjustable rhythm", "number of syllables: 8"],
  '24': ["Class A: old style", "II. adjustable rhythm", "number of syllables: 10"],
  '25': ["Class A: old style", "II. adjustable rhythm", "number of syllables: 11"],
  '26': ["Class A: old style", "II. adjustable rhythm", "number of syllables: 12"],
  '27': ["Class A: old style", "II. adjustable rhythm", "number of syllables: 14"],
  '28': ["Class B: new style", "number of syllables: 5"],
  '29': ["Class B: new style", "number of syllables: 6"],
  '30': ["Class B: new style", "number of syllables: 7"],
  '31': ["Class B: new style", "number of syllables: 8"],
  '32': ["Class B: new style", "number of syllables: 9"],
  '33': ["Class B: new style", "number of syllables: 10"],
  '34': ["Class B: new style", "number of syllables: 11"],
  '35': ["Class B: new style", "number of syllables: 12"],
  '36': ["Class B: new style", "number of syllables: 13"],
  '37': ["Class B: new style", "number of syllables: 14-15"],
  '38': ["Class B: new style", "number of syllables: 16-25"],
  '39': ["Class C: mixed, not unified style", "I. adjustable rhythm, 4 or more lines", "1st group"],
  '40': ["Class C: mixed, not unified style", "I. adjustable rhythm, 4 or more lines", "2nd group"],
  '41': ["Class C: mixed, not unified style", "I. adjustable rhythm, 4 or more lines", "3rd group"],
  '42': ["Class C: mixed, not unified style", "I. adjustable rhythm, 4 or more lines", "4th group"],
  '43': ["Class C: mixed, not unified style", "I. adjustable rhythm, 4 or more lines", "5th group"],
  '44': ["Class C: mixed, not unified style", "I. adjustable rhythm, 4 or more lines", "6th group"],
  '45': ["Class C: mixed, not unified style", "I. adjustable rhythm, 4 or more lines", "8th group"],
  '46': ["Class C: mixed, not unified style", "I. adjustable rhythm, 4 or more lines", "9th group"],
  '47': ["Class C: mixed, not unified style", "I. adjustable rhythm, 4 or more lines", "11st group"],
  '48': ["Class C: mixed, not unified style", "I. adjustable rhythm, 4 or more lines", "12nd group"],
  '49': ["Class C: mixed, not unified style", "I. adjustable rhythm, 4 or more lines", "13rd group"],
  '50': ["Class C: mixed, not unified style", "I. adjustable rhythm, 4 or more lines", "14th group"],
  '51': ["Class C: mixed, not unified style", "I. adjustable rhythm, 4 or more lines", "15th group"],
  '52': ["Class C: mixed, not unified style", "I. adjustable rhythm, 4 or more lines", "16th group"],
  '53': ["Class C: mixed, not unified style", "I. adjustable rhythm, 4 or more lines", "17th group"],
  '54': ["Class C: mixed, not unified style", "I. adjustable rhythm, 4 or more lines", "19th group"],
  '55': ["Class C: mixed, not unified style", "I. adjustable rhythm, 4 or more lines", "21st group"],
  '56': ["Class C: mixed, not unified style", "I. adjustable rhythm, 4 or more lines", "22nd group"],
  '57': ["Class C: mixed, not unified style", "I. adjustable rhythm, 4 or more lines", "23rd group"],
  '58': ["Class C: mixed, not unified style", "I. adjustable rhythm, 4 or more lines", "24th group"],
  '59': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "1st group"],
  '60': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "2nd group"],
  '61': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "3rd group"],
  '62': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "4th group"],
  '63': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "5th group"],
  '64': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "6th group"],
  '65': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "7th group"],
  '66': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "8th group"],
  '67': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "9th group"],
  '68': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "10th group"],
  '69': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "11st group"],
  '70': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "12nd group"],
  '71': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "13rd group"],
  '72': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "14th group"],
  '73': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "15th group"],
  '74': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "16th group"],
  '75': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "17th group"],
  '76': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "18th group"],
  '77': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "20th group"],
  '78': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "21st group"],
  '79': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "22nd group"],
  '80': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "23rd group"],
  '81': ["Class C: mixed, not unified style", "II. fixed rhythm, 4 or more lines", "24th group"],
  '82': ["Appendix", "instrumental"],
  '83': ["Appendix", "not classified"]
};

export const robotsNote = 'robots.txt: User-agent: * Disallow: / (Googlebot allowed). Crawl requires --ignore-robots.';

export const SELECTORS = {
  // CONFIRMED (live 2026-09-28): category links in the accordion of /br/en/browse.
  browseTree: '#accordian',
  categoryUrl: /\/br\/en\/browse\/(\d+)\/?$/,
  // CONFIRMED: category page = #record > p "Number of results: N" + table
  // thead: BR number | Text incipit or designation | Locality | County | Year | Collector | Sound
  // first cell: <a class="link" href="/br/en/browse/20/3417"><strong>A 1101a</strong></a>
  // "?sort=N" links re-order the same table: ignored.
  table: '#record table',
  recordUrl: /\/br\/en\/browse\/(\d+)\/(\d+)\/?$/,
  columns: { br: /^BR number/i, incipit: /incipit/i, locality: /^Locality/i, county: /^County/i, year: /^Year/i, collector: /^Collector/i, sound: /^Sound/i },
  // TO CONFIRM: record page. Assumed identical to the bartok-gyujtesek record template
  // (#record, h3 title, <p>Label: value</p>, unlabelled "Place (County), date." line, image).
  record: '#record',
  labels: {
    informant: [/^informant/i, /^adatk/i],
    origin: [/^place of origin/i, /^sz[aá]rmaz/i],
    collector: [/^collector/i, /^gy[uű]jt[oő]/i],
    inventory: [/^inventory number/i, /^lelt/i],
    brNumber: [/^br number/i],
    variants: [/^number of melodic variants/i],
    cadence: [/^cadence/i, /^kadencia/i],
    rhythm: [/^rhythm/i, /^ritmus/i],
    syllables: [/^(number of )?syllab/i, /^sz[oó]tag/i],
    ambitus: [/^(ambitus|range)/i],
    mode: [/^(mode|scale|tonality)/i],
    form: [/^(form|structure)/i],
    style: [/^(style|class)/i],
    genre: [/^(genre|type|function|designation)/i],
    performance: [/^(performance|instrument)/i],
    ethnicity: [/^(ethnicity|nationality)/i],
    remarks: [/^(remarks?|notes?|comment)/i],
    publication: [/^publication/i],
    sound: [/^sound recording/i, /^(sound|recording|phonograph)/i]
  }
};

const byLabel = (pairs, res) => {
  for (const re of res) for (const [k, v] of Object.entries(pairs)) if (re.test(k.replace(/#\d+$/, ''))) return v;
  return null;
};

function idFromUrl(url) {
  const m = String(url).match(SELECTORS.recordUrl);
  return m ? `${m[1]}-${m[2]}` : null;
}

function columnKey(cells, re) {
  for (const [k, v] of Object.entries(cells)) if (re.test(k)) return v;
  return null;
}

/** Browse root -> category pages; category page -> record links with the row as context. */
export function discover($, url) {
  if (/\/br\/en\/browse\/?$/.test(url)) return { records: [], listings: links($, url, SELECTORS.categoryUrl, SELECTORS.browseTree) };
  const category = (url.match(SELECTORS.categoryUrl) || [])[1] || null;
  const categoryLabel = category && CATEGORIES[category] ? CATEGORIES[category].join(' > ') : null;
  const records = parseZtiTable($, url, SELECTORS.recordUrl).map((row) => ({
    url: row.url,
    context: {
      category,
      categoryLabel,
      brNumber: row.linkText || columnKey(row.cells, SELECTORS.columns.br),
      incipit: columnKey(row.cells, SELECTORS.columns.incipit),
      locality: columnKey(row.cells, SELECTORS.columns.locality),
      county: columnKey(row.cells, SELECTORS.columns.county),
      year: columnKey(row.cells, SELECTORS.columns.year),
      collector: columnKey(row.cells, SELECTORS.columns.collector),
      sound: columnKey(row.cells, SELECTORS.columns.sound)
    }
  }));
  return { records, listings: [] };
}

function base(url, context) {
  const c = context || {};
  const placeRaw = c.locality ? (c.county ? `${c.locality} (${c.county})` : c.locality) : null;
  return {
    site: name,
    siteRecordId: idFromUrl(url),
    siteId: c.brNumber || idFromUrl(url),
    url,
    title: c.incipit || null,
    incipit: c.incipit || null,
    genreRaw: null,
    style: styleFromSystem(c.brNumber, c.categoryLabel || null).style,
    styleRaw: c.categoryLabel || styleFromSystem(c.brNumber, null).styleRaw,
    performanceRaw: c.categoryLabel && /instrumental/i.test(c.categoryLabel) ? 'instrumental' : null,
    instrumentRaw: null,
    performerRaw: null,
    ageRaw: null,
    sexRaw: null,
    ethnicityRaw: null,
    collectorRaw: c.collector || null,
    dateRaw: c.year || null,
    placeRaw,
    place: null,
    originRaw: null,
    referenceCode: c.brNumber || null,
    volume: null,
    number: null,
    notation: [],
    audio: [],
    text: null,
    remarks: null,
    systemPosition: c.brNumber || null,
    cadences: null,
    rhythm: c.categoryLabel ? rhythmFromCategory(c.categoryLabel) : null,
    mode: null,
    ambitus: null,
    syllables: c.categoryLabel ? ((c.categoryLabel.match(/number of syllables:\s*([\d-]+)/) || [])[1] || null) : null,
    form: c.categoryLabel ? formFromCategory(c.categoryLabel) : null,
    related: [],
    composition: [],
    journey: null,
    fields: { ...(c.categoryLabel ? { _category: c.categoryLabel } : {}), ...(c.sound ? { Sound: c.sound } : {}) }
  };
}

function rhythmFromCategory(label) {
  if (/parlando-rubato or fixed rhythm/i.test(label)) return 'parlando-rubato or fixed rhythm';
  if (/adjustable rhythm/i.test(label)) return 'adjustable rhythm';
  if (/fixed rhythm/i.test(label)) return 'fixed rhythm';
  return null;
}

function formFromCategory(label) {
  if (/3-liners/i.test(label)) return '3 lines';
  if (/2-liners/i.test(label)) return '2 lines, half melody or fragment';
  if (/4 or more lines/i.test(label)) return '4 or more lines';
  if (/class [AB]/i.test(label)) return 'isometric four-liner';
  return null;
}

/** Record from the listing row only (used while record pages are not yet cached). */
export function fromContext(url, context) {
  const r = base(url, context);
  r.fields._partial = 'listing row only; record page not fetched';
  return r;
}

/** Parse a record page (TO CONFIRM), merged over the listing-row context. Never throws. */
export function parseRecord(html, url, context = {}) {
  const $ = load(html);
  const r = base(url, context);
  const z = parseZtiRecord($, url);
  const L = SELECTORS.labels;
  const get = (k) => byLabel(z.pairs, L[k]);
  const pl = splitPlaceLine(z.placeLine);
  if (z.title) r.title = z.title;
  if (!r.incipit) r.incipit = z.title;
  if (pl.placeRaw) r.placeRaw = pl.placeRaw;
  if (pl.dateRaw) r.dateRaw = pl.dateRaw;
  r.originRaw = get('origin');
  r.performerRaw = get('informant') || r.performerRaw;
  r.collectorRaw = get('collector') || r.collectorRaw;
  r.referenceCode = get('brNumber') || r.referenceCode;
  r.systemPosition = get('brNumber') || r.systemPosition;
  r.siteId = get('brNumber') || r.siteId;
  r.number = get('inventory');
  r.volume = get('publication');
  const pubTitle = $(SELECTORS.record).find('p:contains("Publication") a[title]').first().attr('title');
  if (pubTitle) r.fields.PublicationFull = clean(pubTitle.replace(/<[^>]+>/g, ''));
  if (!r.style) Object.assign(r, styleFromSystem(r.systemPosition, null));
  const sound = get('sound');
  if (sound) r.fields['Sound recording'] = sound;
  // page labels win when present; otherwise keep what the category tree / listing row gave
  r.cadences = get('cadence') || r.cadences;
  r.rhythm = get('rhythm') || r.rhythm;
  r.syllables = get('syllables') || r.syllables;
  r.ambitus = get('ambitus') || r.ambitus;
  r.mode = get('mode') || r.mode;
  r.form = get('form') || r.form;
  r.genreRaw = get('genre') || r.genreRaw;
  r.performanceRaw = get('performance') || r.performanceRaw;
  r.ethnicityRaw = get('ethnicity') || r.ethnicityRaw;
  r.remarks = get('remarks') || r.remarks;
  r.notation = z.notation;
  r.audio = z.audio;
  const variantsLink = z.pairs['Number of melodic variants (link)'];
  if (variantsLink) r.related.push({ id: null, url: variantsLink, label: `melodic variants (${get('variants') || '?'})`, relation: 'variant' });
  const $rec = $(SELECTORS.record);
  for (const u of links($, url, SELECTORS.recordUrl, $rec.length ? $rec : null)) if (u !== url && !/btn/.test(u)) r.related.push({ id: `bsys-${idFromUrl(u)}`, url: u, label: null, relation: 'link' });
  r.fields = { ...r.fields, ...z.pairs };
  return r;
}

export default { name, host, kind, seeds, robotsNote, SELECTORS, CATEGORIES, discover, parseRecord, fromContext };
