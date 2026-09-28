// Site 1: bartok-nepzene.zti.hu ("Folk Music in Bartok's Compositions").
// Record id: the URL id, e.g. BB057-L155-01 (BB = Somfai work number, L = Lampert source number, nn = movement).
// SELECTORS CONFIRMED against live pages fetched 2026-09-28 (browse page and 190+ record pages).
import { load, findAudio, links, text, multilineText } from './common.js';
import { absUrl, clean } from '../util.js';

export const name = 'fmbc';
export const host = 'https://bartok-nepzene.zti.hu';
export const kind = 'pages';
export const seeds = [`${host}/en/browse/`];

export const SELECTORS = {
  // CONFIRMED: /en/browse/ holds every record link in the accordion.
  browseTree: '#accordian',
  recordLink: 'a[href*="/en/browse/record/"]',
  recordUrl: /\/en\/browse\/record\/([A-Za-z0-9-]+)\/?$/,
  sectionHeading: 'h3',
  // CONFIRMED: record page layout (Bootstrap 4). Sidebar #leftCol repeats the accordion; content is the other column.
  main: 'main',
  lampert: '.col-lg-2 h3', // "L 132"
  title: '.col-lg-10 h3', // "5. Romanian Polka"
  work: 'main > .row > div > h4, main h4:not(.panel-title)', // "Romanian Folk Dances (1915; BB 68)" - first h4 of the content column
  melodyImage: 'a[href*="/media/images/melody/"]', // link to full-size notation of the folk melody
  tabs: 'ul.nav-tabs a[data-toggle="tab"]',
  sourcePane: '#source', // "Folk Music Source"
  recordingPane: '#recording', // "Audio Recording and Score" (the composition, not the folk source)
  wordsPane: '#words',
  comparisonPane: '#comparison',
  datas: '#source .datas', // one block per source (melody, optionally words); rows = label/value
  dataRow: '.row',
  facsimilePanel: '.panel', // facsimile panels inside each .datas block
  audio: '.audiowrapper audio source[src], audio[src]',
  mapLink: 'a[href*="/en/map/?lat="]',
  sourceRemark: '#source > .row:first-child p', // "Bartok's remark in the first edition ..."
  labels: { recording: /^recording/i, collecting: /^collecting/i, informant: /^informant/i, performance: /^performance/i, ethnicity: /^ethnicity/i, remarks: /^remarks?/i }
};

function idFromUrl(url) {
  const m = String(url).match(SELECTORS.recordUrl);
  return m ? m[1] : null;
}

/** Walk the browse accordion: records with their work / movement context. CONFIRMED. */
export function discover($, url) {
  const records = [];
  $(SELECTORS.browseTree).find(SELECTORS.recordLink).each((_, a) => {
    const $a = $(a);
    const abs = absUrl(url, $a.attr('href'));
    const id = idFromUrl(abs || '');
    if (!abs || !id) return; // skips the "/en/browse/record//" placeholder
    const $work = $a.closest('ul').prev('a');
    const workLabel = text($work);
    const catalogue = clean($work.find('strong').first().text());
    const lampert = clean($a.find('strong').first().text());
    const movement = clean($a.clone().children('strong').remove().end().text());
    const section = text($a.parents('li').last().children(SELECTORS.sectionHeading).first());
    records.push({ url: abs, context: { work: workLabel && catalogue ? clean(workLabel.replace(catalogue, '')) : workLabel, catalogue, movement, lampert, section } });
  });
  return { records, listings: [] };
}

const COUNTRY_RE = /^(romania|hungary|slovakia|serbia|ukraine|austria|croatia|slovenia|bulgaria|czech republic|czechia|poland|moldova|turkey|algeria|bosnia and herzegovina|románia|magyarország|szlovákia|szerbia|ukrajna|ausztria|horvátország)$/i;

/**
 * "Belényes/Beiuș (Bihar/Bihor County), February 1910, Béla Bartók"
 * "Székelyvaja (Maros-Torda County; now: Vălenii, Romania), April 1914, Béla Bartók"
 * "Bisztró (Gömör County), 1906, Béla Bartók"
 * -> {villageHistorical, village, countyHistorical, county, country, dateRaw, collector, raw}
 */
export function parseCollecting(raw) {
  // "[...]" marks uncertain data on the site; keep the text, drop the brackets.
  const r = clean(String(raw || '').replace(/^\s*\[/, '').replace(/\]\s*$/, '').replace(/\[|\]/g, ''));
  const out = { villageHistorical: null, village: null, countyHistorical: null, county: null, country: null, dateRaw: null, collector: null, raw: r };
  if (!r) return out;
  const m = r.match(/^(.*?)\s*\(([^)]*)\)\s*(?:,\s*(.*))?$/);
  let placePart = r;
  let parenPart = null;
  let tail = null;
  if (m) {
    placePart = m[1];
    parenPart = m[2];
    tail = m[3] || null;
  } else {
    const c = r.split(/,\s*/);
    placePart = c[0];
    tail = c.slice(1).join(', ') || null;
  }
  const names = placePart.split('/').map((s) => clean(s)).filter(Boolean);
  out.villageHistorical = names[0] || null;
  if (names[1]) out.village = names[1];
  if (parenPart) {
    // "(Bihar/Bihor County)", "(Csík County; now: Tomeşti, Romania)", "(X County; ma: Y)", "(X; now: Y; Ukraine)"
    const [countyPart, nowPart] = parenPart.split(/;\s*(?:now|ma|today|jelenleg):\s*/i);
    const counties = countyPart.replace(/\s*county\w*\s*$/i, '').split('/').map((s) => clean(s)).filter(Boolean);
    out.countyHistorical = counties[0] || null;
    if (counties[1]) out.county = counties[1];
    if (nowPart) {
      const parts = nowPart.split(/[,;]\s*/).map((s) => clean(s)).filter(Boolean);
      for (const part of parts) {
        const cm = part.match(/^(.*?)\s+county$/i);
        if (cm) out.county = clean(cm[1]);
        else if (COUNTRY_RE.test(part)) out.country = part;
        else if (!out.village) out.village = part;
      }
    }
  }
  if (tail) {
    const parts = tail.split(/,\s*/).map((s) => clean(s)).filter(Boolean);
    // last part is the collector when it does not contain a year
    const collectorIdx = parts.length && !/\b1[89]\d\d\b/.test(parts[parts.length - 1]) ? parts.length - 1 : -1;
    if (collectorIdx >= 0) out.collector = parts[collectorIdx];
    const dateParts = parts.filter((_, i) => i !== collectorIdx);
    out.dateRaw = dateParts.join(', ') || null;
  }
  return out;
}

function readDatas($, $block) {
  const pairs = {};
  $block.children(SELECTORS.dataRow).each((_, row) => {
    const kids = $(row).children();
    if (kids.length < 2) return;
    const label = clean($(kids[0]).text());
    if (!label) return;
    const key = label.replace(/:\s*$/, '');
    let k = key;
    let i = 2;
    while (k in pairs) k = `${key}#${i++}`;
    pairs[k] = clean($(kids[1]).text());
    const map = $(kids[1]).find(SELECTORS.mapLink).first().attr('href');
    if (map) pairs[`${key} (map)`] = absUrl('https://bartok-nepzene.zti.hu/', map);
  });
  const facsimiles = [];
  $block.find(SELECTORS.facsimilePanel).each((_, p) => {
    const title = clean($(p).find('.panel-title').text());
    $(p).find('figure a[href], figure img[src]').each((__, el) => {
      const href = $(el).attr('href') || $(el).attr('src');
      if (href && !/\/\.jpg$/.test(href)) facsimiles.push({ href, title });
    });
  });
  return { pairs, facsimiles };
}

function latLngFromMapHref(href) {
  const m = String(href || '').match(/lat=(-?\d+(?:\.\d+)?)&(?:amp;)?lng=(-?\d+(?:\.\d+)?)/);
  return m ? { lat: parseFloat(m[1]), lng: parseFloat(m[2]) } : { lat: null, lng: null };
}

/** Parse one record page. Never throws: missing nodes give nulls. */
export function parseRecord(html, url, context = {}) {
  const $ = load(html);
  const siteRecordId = idFromUrl(url) || context.id || null;
  const $main = $(SELECTORS.main).length ? $(SELECTORS.main) : $.root();
  const lampert = text($main.find(SELECTORS.lampert).first()) || context.lampert || null;
  const title = text($main.find(SELECTORS.title).first()) || context.movement || null;
  const workLine = text($main.find('h4').not('.panel-title').first()) || null;
  const workMatch = workLine ? workLine.match(/^(.*?)\s*\(([^()]*?)\)\s*$/) : null;
  const catalogue = (workMatch && (workMatch[2].match(/BB\s*\d+[a-z]?/) || [])[0]) || context.catalogue || null;
  const composition = [{ work: workMatch ? clean(workMatch[1]) : workLine || context.work || null, movement: title, catalogue, raw: [workLine, title].filter(Boolean).join(' | ') || null }];

  // Sources: first .datas = melody source, second (if any) = words source.
  const blocks = [];
  $(SELECTORS.datas).each((_, b) => blocks.push(readDatas($, $(b))));
  const melody = blocks[0] || { pairs: {}, facsimiles: [] };
  const words = blocks[1] || null;
  const collecting = parseCollecting(melody.pairs.Collecting);
  const { lat, lng } = latLngFromMapHref(melody.pairs['Collecting (map)']);
  const remarkP = clean($(SELECTORS.sourcePane).children('.row').first().find('p').text());
  const remarks = [melody.pairs.Remarks, remarkP].filter(Boolean).join(' | ') || null;

  // Media.
  const notation = [];
  $main.find(SELECTORS.melodyImage).each((_, a) => {
    const u = absUrl(url, $(a).attr('href'));
    if (u && !notation.some((n) => n.url === u)) notation.push({ url: u, type: /png$/i.test(u) ? 'image/png' : 'image/jpeg', caption: clean($(a).attr('title')) || 'melody' });
  });
  for (const f of melody.facsimiles) {
    const u = absUrl(url, f.href);
    if (u && !notation.some((n) => n.url === u)) notation.push({ url: u, type: 'image/jpeg', caption: f.title ? `facsimile: ${f.title}` : 'facsimile' });
  }
  const audio = [];
  $(SELECTORS.sourcePane).find(SELECTORS.audio).each((_, s) => {
    const u = absUrl(url, $(s).attr('src'));
    if (u && !audio.some((a) => a.url === u)) audio.push({ url: u, type: 'audio/mpeg', caption: melody.pairs.Recording ? `source recording ${melody.pairs.Recording}` : 'source recording' });
  });
  const $rec = $(SELECTORS.recordingPane);
  $rec.find(SELECTORS.audio).each((_, s) => {
    const u = absUrl(url, $(s).attr('src'));
    if (u && !audio.some((a) => a.url === u)) audio.push({ url: u, type: 'audio/mpeg', caption: `composition recording: ${clean($rec.find('p').first().text()) || ''}`.trim() });
  });
  $rec.find('figure a[href]').each((_, a) => {
    const u = absUrl(url, $(a).attr('href'));
    if (u && !notation.some((n) => n.url === u)) notation.push({ url: u, type: 'image/jpeg', caption: 'score (composition)' });
  });

  // Words: original text + translation.
  const $cols = $(SELECTORS.wordsPane).find('.col-md-6');
  const textOrig = multilineText($, $cols.first()) || multilineText($, $(SELECTORS.wordsPane));
  const translation = $cols.length > 1 ? multilineText($, $cols.eq(1)) : null;

  const fields = { ...prefix(melody.pairs, ''), ...(words ? prefix(words.pairs, 'Words: ') : {}) };
  if (translation) fields['Words (translation)'] = translation;
  if (workLine) fields.Work = workLine;
  if (lampert) fields['Lampert number'] = lampert;

  const related = links($, url, SELECTORS.recordUrl, $(SELECTORS.comparisonPane).length ? $(SELECTORS.comparisonPane) : $('.tab-content')).filter((u) => u !== url).map((u) => ({ id: `fmbc-${idFromUrl(u)}`, url: u, label: null, relation: 'variant' }));

  return {
    site: name,
    siteRecordId,
    siteId: lampert || siteRecordId,
    url,
    title,
    incipit: null,
    genreRaw: null, // the site prints no genre label; see docs/DATA-SCHEMA.md
    style: null,
    styleRaw: null,
    performanceRaw: melody.pairs.Performance || null,
    instrumentRaw: null,
    performerRaw: melody.pairs.Informant || null,
    ageRaw: null,
    sexRaw: null,
    ethnicityRaw: melody.pairs.Ethnicity || null,
    collectorRaw: collecting.collector,
    dateRaw: collecting.dateRaw,
    placeRaw: melody.pairs.Collecting ? clean(melody.pairs.Collecting.replace(/,\s*[^,]*$/, '').replace(/,\s*(?:[A-Za-z]+\s+)?1[89]\d\d\s*$/, '')) : null,
    place: melody.pairs.Collecting ? { villageHistorical: collecting.villageHistorical, village: collecting.village, countyHistorical: collecting.countyHistorical, county: collecting.county, country: collecting.country, lat, lng } : null,
    originRaw: null,
    referenceCode: lampert,
    volume: null,
    number: melody.pairs.Recording || null,
    notation,
    audio,
    text: textOrig,
    remarks,
    systemPosition: null,
    cadences: null,
    rhythm: null,
    mode: null,
    ambitus: null,
    syllables: null,
    form: null,
    related,
    composition,
    journey: null,
    fields
  };
}

function prefix(obj, pre) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[pre + k] = v;
  return out;
}

export default { name, host, kind, seeds, SELECTORS, discover, parseRecord, parseCollecting };
