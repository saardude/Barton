// Site 2: systems.zti.hu/br/en ("The Bartok System"). Records are cards on category pages.
// Record id: normalised system position, e.g. "A 204/3" -> A204-3 (fallback: data-id or card link id).
// robots.txt on this host disallows all non-Googlebot agents; crawl only with --ignore-robots
// (owner decision, docs/SCRAPER.md).
import { load, extractPairs, byLabel, findAudio, findNotation, links, text, multilineText } from './common.js';
import { absUrl, clean, sha1 } from '../util.js';

export const name = 'bsys';
export const host = 'https://systems.zti.hu';
export const kind = 'cards';
export const seeds = [`${host}/br/en/browse`];
export const robotsNote = 'robots.txt: User-agent: * Disallow: / (Googlebot allowed). Crawl requires --ignore-robots.';

export const SELECTORS = {
  // CONFIRMED (live /br/en/browse fetched 2026-09-28): category links in the accordion.
  browseTree: '#accordian',
  categoryLink: 'a[href*="/br/en/browse/"]',
  categoryUrl: /\/br\/en\/browse\/(\d+)\/?$/,
  // TO CONFIRM: category page contents. Cards may be paginated (?page=N or rel=next).
  pagination: 'a[rel="next"], .pagination a, ul.pager a, a.next',
  paginationUrl: /[?&](page|p|offset|start)=\d+/,
  // TO CONFIRM: one card per melody. Try specific classes first, then generic containers that
  // hold a system-position marker.
  card: '.record, .card, .melody, .item, .panel, article, .well',
  systemPosition: '.sys, .system, .position, .signature, h3, h4, strong',
  systemPositionRe: /\b([ABC])\s*[\.\-]?\s*(\d{1,4})\s*([a-z]?)\s*(?:[\/\.\-,]\s*(\d{1,3}))?\b/,
  recordLink: 'a[href*="/br/en/record/"], a[href*="/br/en/melody/"], a[href*="/br/en/search?sys="]',
  incipit: '.incipit, .text, .title, em, i',
  notationHint: /kotta|notation|score|melody|dallam|img\//i,
  labels: {
    locality: [/^(locality|place|collection place|village|origin)/i, /^(helys[eé]g|gy[uű]jt[eé]s helye)/i],
    date: [/^(date|time|year)/i, /^(id[oő]|d[aá]tum|[eé]v)/i],
    informant: [/^(informant|performer|singer|sung by)/i, /^(adatk[oö]zl[oő]|el[oő]ad[oó])/i],
    age: [/age/i, /kor/i],
    collector: [/^(collector|collected by)/i, /^gy[uű]jt[oő]/i],
    systemPosition: [/^(system|position|bartok system|sys\.?)/i, /^(rendszer|jelzet)/i],
    incipit: [/^(incipit|text incipit|first line|title)/i, /^(sz[oö]vegkezdet|kezd[oő]sor|c[ií]m)/i],
    cadences: [/^cadenc/i, /^(kadencia|z[aá]r[oó]hang)/i],
    rhythm: [/^rhythm/i, /^ritmus/i],
    syllables: [/^syllab/i, /^sz[oó]tag/i],
    ambitus: [/^(ambitus|range)/i, /^hangterjedelem/i],
    mode: [/^(mode|scale|tonality)/i, /^hangsor/i],
    form: [/^(form|structure)/i, /^(forma|szerkezet)/i],
    style: [/^(style|class)/i, /^(st[ií]lus|oszt[aá]ly)/i],
    genre: [/^(genre|type|function)/i, /^(m[uű]faj|t[ií]pus)/i],
    remarks: [/^(remarks?|notes?|comment)/i, /^(megjegyz[eé]s)/i],
    performance: [/^(performance|instrument)/i, /^(el[oő]ad[aá]sm[oó]d|hangszer)/i],
    ethnicity: [/^(ethnicity|nationality)/i, /^nemzetis[eé]g/i],
    referenceCode: [/^(reference|source|signature|call number)/i, /^(forr[aá]s|jelzet)/i]
  }
};

export function normalizeSystemPosition(s) {
  const m = String(s || '').match(SELECTORS.systemPositionRe);
  if (!m) return null;
  return `${m[1]}${m[2]}${m[3] || ''}${m[4] ? `-${m[4]}` : ''}`;
}

/** Browse page -> category listings; category page -> next pages. */
export function discover($, url) {
  const listings = [];
  const isBrowseRoot = /\/br\/en\/browse\/?$/.test(url);
  if (isBrowseRoot) listings.push(...links($, url, SELECTORS.categoryUrl, SELECTORS.browseTree));
  else {
    $(SELECTORS.pagination).each((_, a) => {
      const u = absUrl(url, $(a).attr('href'));
      if (u && SELECTORS.paginationUrl.test(u) && u !== url) listings.push(u);
    });
  }
  return { records: [], listings: [...new Set(listings)] };
}

function cardsOf($) {
  let cards = $(SELECTORS.card).filter((_, el) => SELECTORS.systemPositionRe.test($(el).text() || ''));
  // Keep only innermost matching containers (avoid a wrapper that contains all cards).
  cards = cards.filter((_, el) => $(el).find(SELECTORS.card).filter((__, inner) => SELECTORS.systemPositionRe.test($(inner).text() || '')).length === 0);
  return cards;
}

/** Parse all melody cards on a category or search page. Never throws. */
export function parseListing(html, url, context = {}) {
  const $ = load(html);
  const categoryLabel = text($('h2').first()) || null;
  const out = [];
  cardsOf($).each((i, el) => {
    const $c = $(el);
    const pairs = extractPairs($, $c);
    const L = SELECTORS.labels;
    const get = (k) => byLabel(pairs, L[k]);
    const sysText = get('systemPosition') || text($c.find(SELECTORS.systemPosition).first()) || clean($c.text().slice(0, 80));
    const systemPosition = sysText && SELECTORS.systemPositionRe.test(sysText) ? clean(sysText.match(SELECTORS.systemPositionRe)[0]) : null;
    const recLink = $c.find(SELECTORS.recordLink).first();
    const recUrl = recLink.length ? absUrl(url, recLink.attr('href')) : null;
    let siteRecordId = normalizeSystemPosition(systemPosition) || $c.attr('data-id') || $c.attr('id') || null;
    if (!siteRecordId && recUrl) siteRecordId = (recUrl.match(/(\d+)\/?$/) || [])[1] || null;
    if (!siteRecordId) siteRecordId = `card-${sha1(url + '#' + i).slice(0, 10)}`;
    const incipit = get('incipit') || text($c.find(SELECTORS.incipit).first());
    const textEl = $c.find('.lyrics, .text, pre, blockquote').first();
    out.push({
      site: name,
      siteRecordId,
      siteId: systemPosition || siteRecordId,
      url: recUrl || url, // the listing page is the canonical fetched URL when cards have no own page
      title: incipit,
      incipit,
      genreRaw: get('genre'),
      style: get('style') || (context.style || null),
      performanceRaw: get('performance'),
      instrumentRaw: null,
      performerRaw: get('informant'),
      ageRaw: get('age'),
      sexRaw: null,
      ethnicityRaw: get('ethnicity'),
      collectorRaw: get('collector'),
      dateRaw: get('date'),
      placeRaw: get('locality'),
      referenceCode: get('referenceCode') || systemPosition,
      volume: null,
      number: null,
      notation: findNotation($, url, $c, SELECTORS.notationHint),
      audio: findAudio($, url, $c),
      text: multilineText($, textEl),
      remarks: get('remarks'),
      systemPosition,
      cadences: get('cadences'),
      rhythm: get('rhythm'),
      mode: get('mode'),
      ambitus: get('ambitus'),
      syllables: get('syllables'),
      form: get('form'),
      related: [],
      composition: [],
      fields: { ...pairs, ...(categoryLabel ? { _category: categoryLabel } : {}) }
    });
  });
  return out;
}

export default { name, host, kind, seeds, robotsNote, SELECTORS, discover, parseListing, normalizeSystemPosition };
