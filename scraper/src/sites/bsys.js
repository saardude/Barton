// Site 2: systems.zti.hu/br/en ("The Bartok System", >13,000 melodies).
// Category pages /br/en/browse/<10..83>/ list every melody in one table (no pagination; largest
// category 1448 rows). Each row links to a record page /br/en/browse/<cat>/<rec>.
// Record id: "<cat>-<rec>" from the URL; siteId: the BR number as displayed ("A 1101a").
// robots.txt on this host disallows all non-Googlebot agents; crawl only with --ignore-robots
// (owner decision, docs/SCRAPER.md).
import { load, links, parseZtiTable, parseZtiRecord, splitPlaceLine } from './common.js';
import { absUrl, clean } from '../util.js';

export const name = 'bsys';
export const host = 'https://systems.zti.hu';
export const kind = 'pages';
export const seeds = [`${host}/br/en/browse`];
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
    sound: [/^(sound|recording|phonograph)/i]
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
  const categoryLabel = clean($('#record').prev('h2').text()) || clean($('h2').first().text()) || null;
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
    style: null,
    performanceRaw: null,
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
    rhythm: null,
    mode: null,
    ambitus: null,
    syllables: null,
    form: null,
    related: [],
    composition: [],
    fields: { ...(c.categoryLabel ? { _category: c.categoryLabel } : {}), ...(c.sound ? { Sound: c.sound } : {}) }
  };
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
  r.performerRaw = get('informant');
  r.collectorRaw = get('collector') || r.collectorRaw;
  r.referenceCode = get('brNumber') || r.referenceCode;
  r.systemPosition = get('brNumber') || r.systemPosition;
  r.siteId = get('brNumber') || r.siteId;
  r.number = get('inventory');
  r.volume = get('publication');
  r.cadences = get('cadence');
  r.rhythm = get('rhythm');
  r.syllables = get('syllables');
  r.ambitus = get('ambitus');
  r.mode = get('mode');
  r.form = get('form');
  r.style = get('style');
  r.genreRaw = get('genre');
  r.performanceRaw = get('performance');
  r.ethnicityRaw = get('ethnicity');
  r.remarks = get('remarks');
  r.notation = z.notation;
  r.audio = z.audio;
  const variantsLink = z.pairs['Number of melodic variants (link)'];
  if (variantsLink) r.related.push({ id: null, url: variantsLink, label: `melodic variants (${get('variants') || '?'})`, relation: 'variant' });
  const $rec = $(SELECTORS.record);
  for (const u of links($, url, SELECTORS.recordUrl, $rec.length ? $rec : null)) if (u !== url && !/btn/.test(u)) r.related.push({ id: `bsys-${idFromUrl(u)}`, url: u, label: null, relation: 'link' });
  r.fields = { ...r.fields, ...z.pairs };
  return r;
}

export default { name, host, kind, seeds, robotsNote, SELECTORS, discover, parseRecord, fromContext };
