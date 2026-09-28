// Site 3: bartok-gyujtesek.zti.hu ("Bela Bartok, the Ethnomusicologist"): collections by trip.
// Record id: "<collectionId>-<recordId>" from the URL /en/browse/<collectionId>/<recordId>.
// SELECTORS CONFIRMED against live pages fetched 2026-09-28 (browse, 101 collection pages, 95 record pages).
import { load, links, parseZtiTable, parseZtiRecord, splitPlaceLine, styleFromSystem, text } from './common.js';
import { absUrl, clean } from '../util.js';

export const name = 'gyuj';
export const host = 'https://bartok-gyujtesek.zti.hu';
export const kind = 'pages';
export const seeds = [`${host}/en/browse`];

export const SELECTORS = {
  // CONFIRMED: collection links in the accordion, labelled "Month, Year. Place (count)".
  browseTree: '#accordian',
  collectionUrl: /\/en\/browse\/(\d+)\/?$/,
  // CONFIRMED: collection page = #record > p "Number of melodies in the database: N" + table
  // thead: Text incipit or designation | Locality | County | Date | Informant | Sound
  // first cell: <a class="link" href="/en/browse/68/1046">Gyantai iskolában</a>. No pagination; "?sort=N" ignored.
  table: '#record table',
  recordUrl: /\/en\/browse\/(\d+)\/(\d+)\/?$/,
  columns: { incipit: /incipit/i, locality: /^Locality/i, county: /^County/i, date: /^Date/i, informant: /^Informant/i, sound: /^Sound/i },
  // CONFIRMED: record page = #record; h3 title; .col-md-7 <p>: unlabelled "Place (County), 1904.11.",
  // "Informant: Dósa Lidi (18)", "Place of origin: Kibéd (Maros-Torda)", "Collector: Bartók Béla",
  // "Inventory number: BR_12388", sometimes "Publication: ..."; .col-md-5 <p>: "BR number: C 1231a",
  // "Number of melodic variants: <a href=sys.zti.hu/br/en/search?sys=C+1231>3</a>", "Cadence: (1) 1";
  // notation image /media/images/BR/BR_12388_01.jpg; previous/next buttons in .btn-group.
  record: '#record',
  labels: {
    informant: [/^informant/i, /^adatk/i],
    origin: [/^place of origin/i, /^sz[aá]rmaz/i],
    collector: [/^collector/i, /^gy[uű]jt[oő]/i],
    inventory: [/^inventory number/i, /^lelt/i],
    brNumber: [/^br number/i],
    variants: [/^number of melodic variants/i],
    cadence: [/^cadence/i, /^kadencia/i],
    publication: [/^publication/i, /^kiad/i],
    rhythm: [/^rhythm/i],
    syllables: [/^(number of )?syllab/i],
    genre: [/^(genre|type|function|designation)/i],
    performance: [/^(performance|instrument)/i],
    ethnicity: [/^(ethnicity|nationality)/i],
    remarks: [/^(remarks?|notes?|comment)/i]
  }
};

const byLabel = (pairs, res) => {
  for (const re of res) for (const [k, v] of Object.entries(pairs)) if (re.test(k.replace(/#\d+$/, ''))) return v;
  return null;
};

/** "February, 1910. Upper region of the river Fekete-Koros: district of Belenyes and Vaskoh" -> parts. */
export function parseCollectionLabel(label) {
  const l = clean(label);
  if (!l) return { dateRaw: null, place: null, count: null, raw: null };
  let count = null;
  let rest = l;
  const cm = rest.match(/\((\d+)\)\s*$/);
  if (cm) {
    count = +cm[1];
    rest = rest.slice(0, cm.index).trim();
  }
  let dateRaw = null;
  let place = rest;
  const hu = rest.match(/^(1[89]\d\d\.\s*[a-záéíóöőúüű]+(?:[–-][a-záéíóöőúüű]+)?(?:\s*\d{1,2}(?:[–-]\d{1,2})?)?)\.?\s+(.*)$/i);
  const m = hu || rest.match(/^(.*?\b1[89]\d\d\b[^.,]*)[.,]\s+(.*)$/) || rest.match(/^(.*?\b1[89]\d\d\.)\s*(.*)$/);
  if (m) {
    dateRaw = clean(m[1].replace(/\.$/, ''));
    place = clean(m[2]) || null;
  }
  return { dateRaw, place, count, raw: l };
}

function idFromUrl(url) {
  const m = String(url).match(SELECTORS.recordUrl);
  return m ? `${m[1]}-${m[2]}` : null;
}

function columnKey(cells, re) {
  for (const [k, v] of Object.entries(cells)) if (re.test(k)) return v;
  return null;
}

export function discover($, url) {
  if (/\/en\/browse\/?$/.test(url)) {
    const listings = [];
    $(SELECTORS.browseTree).find('a[href]').each((_, a) => {
      const u = absUrl(url, $(a).attr('href'));
      if (u && SELECTORS.collectionUrl.test(u)) listings.push(u);
    });
    return { records: [], listings: [...new Set(listings)] };
  }
  const collectionId = (url.match(SELECTORS.collectionUrl) || [])[1] || null;
  const label = text($(SELECTORS.browseTree).find('li.active > a, a.active').first()) || text($('h2').first()) || null;
  const collection = parseCollectionLabel(label);
  const records = parseZtiTable($, url, SELECTORS.recordUrl).map((row) => ({
    url: row.url,
    context: {
      collectionId,
      collectionLabel: label,
      collectionDate: collection.dateRaw,
      collectionPlace: collection.place,
      collectionUrl: url,
      incipit: row.linkText || columnKey(row.cells, SELECTORS.columns.incipit),
      locality: columnKey(row.cells, SELECTORS.columns.locality),
      county: columnKey(row.cells, SELECTORS.columns.county),
      date: columnKey(row.cells, SELECTORS.columns.date),
      informant: columnKey(row.cells, SELECTORS.columns.informant),
      sound: columnKey(row.cells, SELECTORS.columns.sound)
    }
  }));
  return { records, listings: [] };
}

function base(url, context) {
  const c = context || {};
  const m = url.match(SELECTORS.recordUrl);
  return {
    site: name,
    siteRecordId: idFromUrl(url),
    siteId: m ? m[2] : idFromUrl(url),
    url,
    title: c.incipit || null,
    incipit: c.incipit || null,
    genreRaw: null,
    style: null,
    styleRaw: null,
    performanceRaw: null,
    instrumentRaw: null,
    performerRaw: c.informant || null,
    ageRaw: null,
    sexRaw: null,
    ethnicityRaw: null,
    collectorRaw: null,
    dateRaw: c.date || c.collectionDate || null,
    placeRaw: c.locality ? (c.county ? `${c.locality} (${c.county})` : c.locality) : c.collectionPlace || null,
    place: null,
    originRaw: null,
    referenceCode: null,
    volume: null,
    number: m ? m[2] : null,
    notation: [],
    audio: [],
    text: null,
    remarks: null,
    systemPosition: null,
    cadences: null,
    rhythm: null,
    mode: null,
    ambitus: null,
    syllables: null,
    form: null,
    related: [],
    composition: [],
    journey: c.collectionId ? { collectionId: c.collectionId, label: c.collectionLabel || null, dateRaw: c.collectionDate || null, place: c.collectionPlace || null, url: c.collectionUrl || `${host}/en/browse/${c.collectionId}` } : null,
    fields: { ...(c.collectionLabel ? { _collection: c.collectionLabel } : {}), ...(c.sound ? { Sound: c.sound } : {}) }
  };
}

export function fromContext(url, context) {
  const r = base(url, context);
  r.fields._partial = 'listing row only; record page not fetched';
  return r;
}

export function parseRecord(html, url, context = {}) {
  const $ = load(html);
  const r = base(url, context);
  const z = parseZtiRecord($, url);
  const L = SELECTORS.labels;
  const get = (k) => byLabel(z.pairs, L[k]);
  const pl = splitPlaceLine(z.placeLine);
  if (z.title) {
    r.title = z.title;
    r.incipit = r.incipit || z.title;
  }
  if (pl.placeRaw) r.placeRaw = pl.placeRaw;
  if (pl.dateRaw) r.dateRaw = pl.dateRaw;
  r.originRaw = get('origin');
  r.performerRaw = get('informant') || r.performerRaw;
  r.collectorRaw = get('collector');
  r.siteId = get('inventory') || r.siteId;
  r.referenceCode = get('brNumber');
  r.systemPosition = get('brNumber');
  Object.assign(r, styleFromSystem(r.systemPosition, null));
  const pubTitle = $(SELECTORS.record).find('p:contains("Publication") a[title]').first().attr('title');
  if (pubTitle) r.fields.PublicationFull = clean(pubTitle.replace(/<[^>]+>/g, ''));
  const sound = byLabel(z.pairs, [/^sound recording/i]);
  if (sound) r.fields['Sound recording'] = sound;
  r.cadences = get('cadence');
  r.volume = get('publication');
  r.rhythm = get('rhythm');
  r.syllables = get('syllables');
  r.genreRaw = get('genre');
  r.performanceRaw = get('performance');
  r.ethnicityRaw = get('ethnicity');
  r.remarks = get('remarks');
  r.notation = z.notation;
  r.audio = z.audio;
  const variantsLink = z.pairs['Number of melodic variants (link)'];
  if (variantsLink) r.related.push({ id: null, url: variantsLink, label: `melodic variants (${get('variants') || '?'})`, relation: 'variant' });
  const $rec = $(SELECTORS.record);
  for (const u of links($, url, SELECTORS.recordUrl, $rec.length ? $rec : null)) if (u !== url) r.related.push({ id: `gyuj-${idFromUrl(u)}`, url: u, label: null, relation: 'link' });
  r.fields = { ...r.fields, ...z.pairs };
  return r;
}

export default { name, host, kind, seeds, SELECTORS, discover, parseRecord, fromContext, parseCollectionLabel };
