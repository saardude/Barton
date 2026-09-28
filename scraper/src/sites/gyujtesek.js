// Site 3: bartok-gyujtesek.zti.hu ("Bela Bartok, the Ethnomusicologist"): collections by trip.
// Record id: "<collectionId>-<recordId>" from the URL /en/browse/<collectionId>/<recordId>.
import { load, extractPairs, byLabel, findAudio, findNotation, links, text, multilineText } from './common.js';
import { absUrl, clean } from '../util.js';

export const name = 'gyuj';
export const host = 'https://bartok-gyujtesek.zti.hu';
export const kind = 'pages';
export const seeds = [`${host}/en/browse`];

export const SELECTORS = {
  // CONFIRMED (live /en/browse fetched 2026-09-28): collection links in the accordion,
  // labelled "Month, Year. Place (count)" or "dd. mm. yyyy. Region".
  browseTree: '#accordian',
  collectionLink: 'a.list[href*="/en/browse/"], #accordian a[href*="/en/browse/"]',
  collectionUrl: /\/en\/browse\/(\d+)\/?$/,
  // Record URL pattern from CONTEXT.md (/en/browse/21/5398). TO CONFIRM on a collection page:
  // whether records are listed as links, and whether the list is paginated.
  recordUrl: /\/en\/browse\/(\d+)\/(\d+)\/?$/,
  pagination: 'a[rel="next"], .pagination a, ul.pager a, a.next',
  paginationUrl: /[?&](page|p|offset|start)=\d+/,
  // TO CONFIRM: record page fields (English and Hungarian labels both tried).
  pageTitle: 'h1, h2, .record-title',
  notationHint: /kotta|notation|score|melody|dallam|lejegyz|img\//i,
  labels: {
    place: [/^(place|locality|village|collection place|place of collection)/i, /^(helys[eé]g|gy[uű]jt[eé]s helye|hely)/i],
    county: [/^county/i, /^(megye|v[aá]rmegye)/i],
    date: [/^(date|time|year|date of collection)/i, /^(id[oő]|d[aá]tum|[eé]v|gy[uű]jt[eé]s ideje)/i],
    informant: [/^(informant|performer|singer|sung by|played by)/i, /^(adatk[oö]zl[oő]|el[oő]ad[oó]|[eé]nekes)/i],
    age: [/age/i, /\bkor/i, /[eé]letkor/i],
    sex: [/^(sex|gender)/i, /^nem$/i],
    collector: [/^(collector|collected by)/i, /^gy[uű]jt[oő]/i],
    ethnicity: [/^(ethnicity|nationality|language)/i, /^(nemzetis[eé]g|nyelv)/i],
    genre: [/^(genre|type|category|function|kind)/i, /^(m[uű]faj|t[ií]pus|funkci[oó])/i],
    style: [/^(style|class)/i, /^(st[ií]lus|oszt[aá]ly)/i],
    performance: [/^(performance|manner|way of performance|instrument)/i, /^(el[oő]ad[aá]sm[oó]d|hangszer)/i],
    title: [/^(title|incipit|first line)/i, /^(c[ií]m|sz[oö]vegkezdet|kezd[oő]sor)/i],
    text: [/^(text|lyrics|words)/i, /^sz[oö]veg/i],
    remarks: [/^(remarks?|notes?|comment)/i, /^megjegyz[eé]s/i],
    referenceCode: [/^(reference|signature|call number|source|catalogue|inventory|number|no\.?|id)/i, /^(jelzet|lelt[aá]ri sz[aá]m|forr[aá]s|sorsz[aá]m)/i],
    volume: [/^(published|publication|edition|volume)/i, /^(kiad[aá]s|k[oö]tet|publik[aá]ci[oó])/i],
    systemPosition: [/^(system|classification|bartok system|position)/i, /^(rendszer|oszt[aá]lyoz[aá]s)/i],
    cadences: [/^cadenc/i, /^kadencia/i],
    rhythm: [/^rhythm/i, /^ritmus/i],
    syllables: [/^syllab/i, /^sz[oó]tag/i],
    ambitus: [/^(ambitus|range)/i, /^hangterjedelem/i],
    mode: [/^(mode|scale|tonality)/i, /^hangsor/i],
    form: [/^(form|structure)/i, /^(forma|szerkezet)/i],
    phonograph: [/^(phonograph|recording|audio|sound)/i, /^(fonogr[aá]f|hangfelv[eé]tel|henger)/i]
  }
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
  // Date part ends at the first ". " after a 4-digit year, or at ", " after "yyyy" in "March 1907, Nyitra county".
  let dateRaw = null;
  let place = rest;
  const m = rest.match(/^(.*?\b1[89]\d\d\b[^.,]*)[.,]\s+(.*)$/) || rest.match(/^(.*?\b1[89]\d\d\.)\s*(.*)$/);
  if (m) {
    dateRaw = clean(m[1].replace(/\.$/, ''));
    place = clean(m[2]) || null;
  }
  return { dateRaw, place, count, raw: l };
}

export function discover($, url) {
  const records = [];
  const listings = [];
  const isBrowseRoot = /\/en\/browse\/?$/.test(url);
  if (isBrowseRoot) {
    $(SELECTORS.browseTree).find('a[href]').each((_, a) => {
      const u = absUrl(url, $(a).attr('href'));
      if (u && SELECTORS.collectionUrl.test(u)) listings.push(u);
    });
  } else {
    const label = text($('h2').first()) || text($(SELECTORS.browseTree).find('li.active > a, a.active').first());
    const collection = parseCollectionLabel(label);
    const collectionId = (url.match(SELECTORS.collectionUrl) || [])[1] || (url.match(/\/en\/browse\/(\d+)/) || [])[1] || null;
    $('a[href]').each((_, a) => {
      const u = absUrl(url, $(a).attr('href'));
      if (!u) return;
      const m = u.split('?')[0].match(SELECTORS.recordUrl);
      if (m) records.push({ url: u.split('?')[0].split('#')[0], context: { collectionId: m[1], collectionLabel: label, collectionDate: collection.dateRaw, collectionPlace: collection.place, listLabel: clean($(a).text()) } });
      else if (SELECTORS.paginationUrl.test(u) && u !== url && (!collectionId || u.includes(`/en/browse/${collectionId}`))) listings.push(u);
    });
    // also follow pagination controls without query strings (e.g. /en/browse/56/page/2)
    $(SELECTORS.pagination).each((_, a) => {
      const u = absUrl(url, $(a).attr('href'));
      if (u && u !== url && !SELECTORS.recordUrl.test(u) && !SELECTORS.collectionUrl.test(u)) listings.push(u);
    });
  }
  const seen = new Set();
  return { records: records.filter((r) => (seen.has(r.url) ? false : seen.add(r.url))), listings: [...new Set(listings)] };
}

export function parseRecord(html, url, context = {}) {
  const $ = load(html);
  const m = url.match(SELECTORS.recordUrl);
  const siteRecordId = m ? `${m[1]}-${m[2]}` : null;
  const pairs = extractPairs($);
  const L = SELECTORS.labels;
  const get = (k) => byLabel(pairs, L[k]);
  const title = get('title') || text($(SELECTORS.pageTitle).first()) || context.listLabel || null;
  let placeRaw = get('place');
  const county = get('county');
  if (placeRaw && county && !/\(/.test(placeRaw)) placeRaw = `${placeRaw} (${county})`;
  if (!placeRaw && context.collectionPlace) placeRaw = context.collectionPlace;
  const dateRaw = get('date') || context.collectionDate || null;
  const textEl = $('.text, .lyrics, pre, blockquote').first();
  const related = links($, url, SELECTORS.recordUrl).filter((u) => u !== url).map((u) => {
    const mm = u.match(SELECTORS.recordUrl);
    return { id: mm ? `gyuj-${mm[1]}-${mm[2]}` : null, url: u, label: null, relation: 'link' };
  });
  return {
    site: name,
    siteRecordId,
    siteId: get('referenceCode') || (m ? m[2] : null) || siteRecordId,
    url,
    title,
    incipit: null,
    genreRaw: get('genre'),
    style: get('style'),
    performanceRaw: get('performance'),
    instrumentRaw: null,
    performerRaw: get('informant'),
    ageRaw: get('age'),
    sexRaw: get('sex'),
    ethnicityRaw: get('ethnicity'),
    collectorRaw: get('collector'),
    dateRaw,
    placeRaw,
    referenceCode: get('referenceCode'),
    volume: get('volume'),
    number: m ? m[2] : null,
    notation: findNotation($, url, null, SELECTORS.notationHint),
    audio: findAudio($, url),
    text: multilineText($, textEl) || get('text'),
    remarks: get('remarks'),
    systemPosition: get('systemPosition'),
    cadences: get('cadences'),
    rhythm: get('rhythm'),
    mode: get('mode'),
    ambitus: get('ambitus'),
    syllables: get('syllables'),
    form: get('form'),
    related,
    composition: [],
    fields: { ...pairs, ...(context.collectionLabel ? { _collection: context.collectionLabel } : {}) }
  };
}

export default { name, host, kind, seeds, SELECTORS, discover, parseRecord, parseCollectionLabel };
