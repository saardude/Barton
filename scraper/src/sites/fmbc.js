// Site 1: bartok-nepzene.zti.hu ("Folk Music in Bartok's Compositions").
// Record id: the URL id, e.g. BB057-L155-01 (BB = Somfai work number, L = Lampert source number, nn = movement).
import { load, extractPairs, byLabel, allByLabel, findAudio, findNotation, links, text, multilineText } from './common.js';
import { absUrl, clean } from '../util.js';

export const name = 'fmbc';
export const host = 'https://bartok-nepzene.zti.hu';
export const kind = 'pages';
export const seeds = [`${host}/en/browse/`];

export const SELECTORS = {
  // CONFIRMED (live /en/browse/ fetched 2026-09-28): one page, all records in the accordion.
  browseTree: '#accordian',
  workLink: 'li > a[href="#"]', // <a href="#"><strong>BB 57</strong> Two Romanian Folk Songs ...</a>
  recordLink: 'a[href*="/en/browse/record/"]',
  recordUrl: /\/en\/browse\/record\/([A-Za-z0-9-]+)\/?$/,
  sectionHeading: 'h3',
  // TO CONFIRM: record page. The "Folk Music Source" tab and its field labels are described in
  // CONTEXT.md; the markup is guessed. The parser first looks for a tab pane whose heading or
  // tab title contains "Folk Music Source", then falls back to the whole page.
  tabLink: 'a[data-toggle="tab"], .nav-tabs a, .nav a[href^="#"]',
  sourceTabTitle: /folk\s*music\s*source|source/i,
  compositionTabTitle: /composition|work/i,
  pageTitle: 'h1, h2, .record-title, main h3',
  notationHint: /kotta|notation|score|melody|source|record|img\//i,
  labels: {
    referenceCode: [/^reference\s*code/i, /^ref\.?\s*code/i, /^code$/i, /^reference$/i],
    place: [/^place(\s+and\s+date)?/i, /^locality/i, /^village/i, /^collected\s+in/i],
    date: [/^date/i, /^time/i],
    collector: [/^collector/i, /^collected\s+by/i],
    informant: [/^informant(?!\s*age)/i, /^performer/i, /^singer/i, /^sung by/i, /^played by/i],
    age: [/^informant.*age/i, /^age/i],
    performance: [/^performance/i, /^manner/i, /^way of performance/i],
    ethnicity: [/^ethnicity/i, /^nationality/i],
    genre: [/^genre/i, /^type/i, /^category/i, /^function/i],
    title: [/^title/i, /^incipit/i, /^first line/i],
    text: [/^text/i, /^lyrics/i, /^words/i],
    remarks: [/^remarks?/i, /^notes?/i, /^comment/i],
    volume: [/^(published|publication|edition|volume|source publication)/i, /^printed/i],
    number: [/^(number|no\.?)\b/i],
    phonograph: [/^phonograph/i, /^recording/i, /^audio/i, /^sound/i],
    style: [/^style/i, /^class/i],
    rhythm: [/^rhythm/i],
    form: [/^form/i, /^structure/i],
    cadences: [/^cadence/i],
    syllables: [/^syllab/i],
    ambitus: [/^ambitus/i, /^range/i],
    mode: [/^(mode|scale|tonality)/i]
  }
};

function idFromUrl(url) {
  const m = String(url).match(SELECTORS.recordUrl);
  return m ? m[1] : null;
}

/** Walk the browse accordion: records with their work / movement context. */
export function discover($, url) {
  const records = [];
  const $tree = $(SELECTORS.browseTree);
  $tree.find(SELECTORS.recordLink).each((_, a) => {
    const $a = $(a);
    const href = $a.attr('href');
    const abs = absUrl(url, href);
    const id = idFromUrl(abs || '');
    if (!abs || !id) return; // skips the "/en/browse/record//" placeholder
    const $work = $a.closest('ul').prev('a');
    const workLabel = text($work);
    const catalogue = clean($work.find('strong').first().text());
    const lampert = clean($a.find('strong').first().text());
    const movement = clean($a.clone().children('strong').remove().end().text());
    const section = text($a.parents('li').last().children(SELECTORS.sectionHeading).first());
    records.push({
      url: abs,
      context: {
        work: workLabel && catalogue ? clean(workLabel.replace(catalogue, '')) : workLabel,
        catalogue,
        movement,
        lampert,
        section
      }
    });
  });
  return { records, listings: [] };
}

function findSourcePane($) {
  // Prefer an explicit tab whose title matches; resolve its target pane.
  let pane = null;
  $(SELECTORS.tabLink).each((_, a) => {
    if (pane) return;
    const $a = $(a);
    if (SELECTORS.sourceTabTitle.test($a.text() || '')) {
      const target = $a.attr('href') || $a.attr('data-target');
      if (target && target.startsWith('#') && $(target).length) pane = $(target);
    }
  });
  if (pane) return pane;
  // Otherwise a heading that says "Folk Music Source" followed by a container.
  $('h1,h2,h3,h4,h5,legend,summary').each((_, h) => {
    if (pane) return;
    if (/folk\s*music\s*source/i.test($(h).text())) {
      const $next = $(h).next();
      pane = $next.length ? $next : $(h).parent();
    }
  });
  return pane;
}

/** Parse one record page. Never throws: missing nodes give nulls. */
export function parseRecord(html, url, context = {}) {
  const $ = load(html);
  const siteRecordId = idFromUrl(url) || context.id || null;
  const pane = findSourcePane($);
  const pairs = { ...extractPairs($, pane), ...(pane ? {} : {}) };
  const allPairs = pane ? { ...extractPairs($), ...pairs } : pairs; // page-level fallback
  const L = SELECTORS.labels;
  const get = (key) => byLabel(pairs, L[key]) ?? byLabel(allPairs, L[key]);
  const placeAndDate = get('place');
  let placeRaw = placeAndDate;
  let dateRaw = get('date');
  // "Place and date": "Belényes (Bihar), 1909. jún." -> split on the first comma before a year
  if (placeAndDate && !dateRaw) {
    const m = placeAndDate.match(/^(.*?)[,;]\s*((?:.*?\b1[89]\d\d\b.*)|(?:\d{1,2}\.\s*\d{1,2}\.\s*1[89]\d\d.*))$/);
    if (m) {
      placeRaw = clean(m[1]);
      dateRaw = clean(m[2]);
    }
  }
  const informant = get('informant');
  const ageRaw = get('age');
  const title = text($(SELECTORS.pageTitle).first()) || get('title') || context.movement || null;
  const compositionTab = (() => {
    let p = null;
    $(SELECTORS.tabLink).each((_, a) => {
      if (p) return;
      if (SELECTORS.compositionTabTitle.test($(a).text() || '')) {
        const t = $(a).attr('href') || $(a).attr('data-target');
        if (t && t.startsWith('#') && $(t).length) p = $(t);
      }
    });
    return p;
  })();
  const compPairs = compositionTab ? extractPairs($, compositionTab) : {};
  const composition = [];
  if (context.work || context.catalogue || context.movement) {
    composition.push({ work: context.work || null, movement: context.movement || null, catalogue: context.catalogue || null, raw: [context.catalogue, context.work, context.movement].filter(Boolean).join(' | ') || null });
  }
  for (const v of allByLabel(compPairs, [/^(work|composition|title of work)/i])) {
    if (v && !composition.some((c) => c.raw === v)) composition.push({ work: v, movement: byLabel(compPairs, [/^(movement|number|no\.?)/i]), catalogue: byLabel(compPairs, [/^(bb|sz\.?|catalogue)/i]), raw: v });
  }
  const textEl = pane ? pane.find('.text, .lyrics, pre, blockquote').first() : $('.text, .lyrics, pre, blockquote').first();
  const related = links($, url, SELECTORS.recordUrl).filter((u) => u !== url).map((u) => ({ id: `fmbc-${idFromUrl(u)}`, url: u, label: null, relation: 'link' }));
  return {
    site: name,
    siteRecordId,
    siteId: get('referenceCode') || context.lampert || siteRecordId,
    url,
    title,
    incipit: get('title') && get('title') !== title ? get('title') : null,
    genreRaw: get('genre'),
    style: get('style'),
    performanceRaw: get('performance'),
    instrumentRaw: null,
    performerRaw: informant,
    ageRaw,
    sexRaw: null,
    ethnicityRaw: get('ethnicity'),
    collectorRaw: get('collector'),
    dateRaw,
    placeRaw,
    referenceCode: get('referenceCode') || context.lampert || null,
    volume: get('volume'),
    number: get('number'),
    notation: findNotation($, url, pane, SELECTORS.notationHint),
    audio: findAudio($, url),
    text: multilineText($, textEl) || get('text'),
    remarks: get('remarks'),
    systemPosition: null,
    cadences: get('cadences'),
    rhythm: get('rhythm'),
    mode: get('mode'),
    ambitus: get('ambitus'),
    syllables: get('syllables'),
    form: get('form'),
    related,
    composition,
    fields: allPairs
  };
}

export default { name, host, kind, seeds, SELECTORS, discover, parseRecord };
