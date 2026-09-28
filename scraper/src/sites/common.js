// Helpers shared by the site parsers: label/value extraction, media discovery, DOM outline.
import { load } from 'cheerio';
import { absUrl, clean, uniq } from '../util.js';

export { load };

export function text($el) {
  if (!$el || !$el.length) return null;
  return clean($el.text());
}

/** Text of an element with <br> turned into newlines (for song texts). */
export function multilineText($, $el) {
  if (!$el || !$el.length) return null;
  const html = $el.html();
  if (html === null || html === undefined) return null;
  const $tmp = load(`<div>${html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n')}</div>`);
  const t = $tmp('div').text().replace(/ /g, ' ').split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
  return t.length ? t : null;
}

/**
 * Collect label -> value pairs from common markup shapes inside root:
 * <dl><dt>label</dt><dd>value</dd>, <table><tr><th>label</th><td>value</td>,
 * <tr><td>label</td><td>value</td>, and ".label/.value" style pairs.
 * Later duplicates get a numeric suffix (label#2) so nothing is lost.
 */
export function extractPairs($, root) {
  const pairs = {};
  const add = (label, value) => {
    const l = clean(label);
    if (!l) return;
    const key = l.replace(/\s*:\s*$/, '');
    let k = key;
    let i = 2;
    while (k in pairs) k = `${key}#${i++}`;
    pairs[k] = clean(value);
  };
  const $root = root ? $(root) : $.root();
  $root.find('dl').each((_, dl) => {
    const dts = $(dl).children('dt');
    dts.each((__, dt) => {
      const dd = $(dt).next('dd');
      add($(dt).text(), dd.length ? dd.text() : null);
    });
  });
  $root.find('tr').each((_, tr) => {
    const cells = $(tr).children('th,td');
    if (cells.length === 2) add($(cells[0]).text(), $(cells[1]).text());
  });
  $root.find('.label, .field-label, .fieldname, .key').each((_, el) => {
    const $el = $(el);
    const val = $el.next('.value, .field-value, .fieldvalue, .val');
    if (val.length) add($el.text(), val.text());
  });
  return pairs;
}

/** Find the first pair whose label matches one of the regexes. */
export function byLabel(pairs, patterns) {
  for (const re of patterns) {
    for (const [k, v] of Object.entries(pairs)) {
      if (re.test(k.replace(/#\d+$/, ''))) return v;
    }
  }
  return null;
}

export function allByLabel(pairs, patterns) {
  const out = [];
  for (const [k, v] of Object.entries(pairs)) {
    if (patterns.some((re) => re.test(k.replace(/#\d+$/, '')))) out.push(v);
  }
  return out;
}

const AUDIO_RE = /\.(mp3|ogg|wav|m4a|flac)(\?|$)/i;
const IMAGE_RE = /\.(png|jpe?g|gif|svg|webp|tiff?)(\?|$)/i;
const PDF_RE = /\.pdf(\?|$)/i;

export function mimeFor(url) {
  const m = String(url).toLowerCase().match(/\.([a-z0-9]+)(\?|$)/);
  const ext = m ? m[1] : '';
  return { mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav', m4a: 'audio/mp4', flac: 'audio/flac', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp', tif: 'image/tiff', tiff: 'image/tiff', pdf: 'application/pdf' }[ext] || null;
}

/** Audio links: <audio src>, <source src>, <a href=*.mp3>, data-src attributes. */
export function findAudio($, base, root) {
  const $root = root ? $(root) : $.root();
  const found = [];
  $root.find('audio[src], audio source[src], source[src], a[href], [data-src], [data-audio], [data-file]').each((_, el) => {
    const $el = $(el);
    const cand = [$el.attr('src'), $el.attr('href'), $el.attr('data-src'), $el.attr('data-audio'), $el.attr('data-file')].filter(Boolean);
    for (const c of cand) {
      if (AUDIO_RE.test(c) || (el.tagName === 'source' && $el.closest('audio').length)) {
        const url = absUrl(base, c);
        if (url) found.push({ url, type: $el.attr('type') || mimeFor(url), caption: clean($el.attr('title') || $el.attr('alt') || $el.closest('figure').find('figcaption').text() || null) });
      }
    }
  });
  return dedupeMedia(found);
}

/** Notation images: <img> whose src/alt/class hints at notation, and PDF links. */
export function findNotation($, base, root, hintRe = /kotta|notation|score|melody|dallam|lejegyz|notes|record|sheet|img\/|media\/images/i) {
  const $root = root ? $(root) : $.root();
  const found = [];
  $root.find('img[src], a[href]').each((_, el) => {
    const $el = $(el);
    const src = $el.attr('src') || $el.attr('href');
    if (!src) return;
    const isImg = el.tagName === 'img';
    const cls = `${$el.attr('class') || ''} ${$el.attr('alt') || ''} ${$el.attr('id') || ''} ${$el.parent().attr('class') || ''} ${src}`;
    if ((isImg && IMAGE_RE.test(src) && hintRe.test(cls)) || (!isImg && PDF_RE.test(src))) {
      const url = absUrl(base, src);
      if (url) found.push({ url, type: mimeFor(url), caption: clean($el.attr('alt') || $el.attr('title') || null) });
    }
  });
  return dedupeMedia(found);
}

function dedupeMedia(items) {
  const seen = new Set();
  return items.filter((m) => {
    if (seen.has(m.url)) return false;
    seen.add(m.url);
    return true;
  });
}

/** All absolute hrefs in root matching re. */
export function links($, base, re, root) {
  const $root = root ? $(root) : $.root();
  const out = [];
  $root.find('a[href]').each((_, a) => {
    const href = $(a).attr('href');
    const url = absUrl(base, href);
    if (!url) return;
    const u = url.split('#')[0];
    if (re.test(u)) out.push(u);
  });
  return uniq(out);
}

/** Human-readable outline of a page: title, headings, tables, dl, forms, link patterns, ids/classes. */
export function outline(html, base) {
  const $ = load(html);
  const lines = [];
  lines.push(`title: ${clean($('title').text()) || '(none)'}`);
  const scripts = [];
  $('script[src]').each((_, s) => scripts.push($(s).attr('src')));
  if (scripts.length) lines.push(`scripts: ${scripts.join(', ')}`);
  const dataUrls = [];
  $('[data-url], [data-src], [data-json], [data-api]').each((_, el) => {
    for (const a of ['data-url', 'data-src', 'data-json', 'data-api']) if ($(el).attr(a)) dataUrls.push(`${a}=${$(el).attr(a)}`);
  });
  if (dataUrls.length) lines.push(`data attributes: ${dataUrls.slice(0, 20).join(' | ')}`);
  lines.push('headings:');
  $('h1,h2,h3,h4,h5').each((_, h) => {
    const id = $(h).attr('id') ? `#${$(h).attr('id')}` : '';
    lines.push(`  ${h.tagName}${id}: ${clean($(h).text())}`);
  });
  lines.push(`tables: ${$('table').length}`);
  $('table').each((i, t) => {
    if (i >= 8) return;
    const heads = [];
    $(t).find('tr').first().find('th,td').each((_, c) => heads.push(clean($(c).text())));
    lines.push(`  table[${i}] class="${$(t).attr('class') || ''}" rows=${$(t).find('tr').length} first-row: ${heads.join(' | ')}`);
  });
  lines.push(`dl: ${$('dl').length}, dt labels: ${uniq($('dt').map((_, d) => clean($(d).text())).get()).slice(0, 30).join(' | ')}`);
  lines.push(`forms: ${$('form').map((_, f) => `${$(f).attr('method') || 'get'} ${$(f).attr('action') || ''} [${$(f).find('input,select').map((__, i) => $(i).attr('name')).get().filter(Boolean).join(',')}]`).get().join(' ; ')}`);
  lines.push(`audio: ${$('audio, source').length}, img: ${$('img').length}, iframes: ${$('iframe').length}`);
  const imgs = uniq($('img').map((_, i) => $(i).attr('src')).get()).slice(0, 10);
  if (imgs.length) lines.push(`  img src sample: ${imgs.join(' | ')}`);
  const ids = uniq($('[id]').map((_, e) => `${e.tagName}#${$(e).attr('id')}`).get()).slice(0, 40);
  lines.push(`ids: ${ids.join(' ')}`);
  const classCount = {};
  $('[class]').each((_, e) => {
    for (const c of String($(e).attr('class')).split(/\s+/)) if (c) classCount[c] = (classCount[c] || 0) + 1;
  });
  lines.push(`classes: ${Object.entries(classCount).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([c, n]) => `${c}(${n})`).join(' ')}`);
  const patterns = {};
  $('a[href]').each((_, a) => {
    const u = absUrl(base, $(a).attr('href'));
    if (!u) return;
    const p = u.replace(/\d+/g, 'N').replace(/[A-Z]{2}\d{3}-[A-Z0-9-]+/g, 'ID').split('#')[0];
    patterns[p] = (patterns[p] || 0) + 1;
  });
  lines.push('link patterns:');
  for (const [p, n] of Object.entries(patterns).sort((a, b) => b[1] - a[1]).slice(0, 40)) lines.push(`  ${n}\t${p}`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------------------------
// Shared parsers for the ZTI "systems" platform used by systems.zti.hu/br and
// bartok-gyujtesek.zti.hu (same templates: #record table listings, #record <p> label pages).
// CONFIRMED on live gyujtesek pages 2026-09-28; the bsys record page is assumed identical (TO CONFIRM).

/** Listing table: header cells -> keys; rows -> {url, cells{}}. */
export function parseZtiTable($, base, recordUrlRe) {
  const rows = [];
  const $table = $('#record table').first();
  if (!$table.length) return rows;
  const headers = $table.find('thead th').map((_, th) => clean($(th).text()) || '').get();
  $table.find('tbody tr').each((_, tr) => {
    const cells = $(tr).children('td');
    const a = $(cells[0]).find('a[href]').first();
    const url = a.length ? absUrl(base, a.attr('href')) : null;
    if (!url || !recordUrlRe.test(url)) return;
    const row = { url: url.split('#')[0], cells: {} };
    cells.each((i, td) => {
      const key = headers[i] || `col${i}`;
      row.cells[key] = clean($(td).text());
    });
    row.linkText = clean(a.text());
    rows.push(row);
  });
  return rows;
}

/**
 * Record page: #record with an h3 title, <p>Label: value</p> lines, one unlabelled
 * "Place (County), date." line, an image and (when present) an audio player.
 * Returns {title, pairs, placeLine, notation[], audio[], links[]}.
 */
export function parseZtiRecord($, base) {
  const $rec = $('#record').length ? $('#record') : $.root();
  const title = text($rec.find('h3').first());
  const pairs = {};
  let placeLine = null;
  $rec.find('p').each((_, p) => {
    const $p = $(p);
    if ($p.closest('.btn-group').length) return;
    const t = clean($p.text());
    if (!t) return;
    const m = t.match(/^([^:]{2,40}?):\s*(.*)$/);
    if (m) {
      let k = m[1];
      let i = 2;
      while (k in pairs) k = `${m[1]}#${i++}`;
      pairs[k] = clean(m[2]);
      const href = $p.find('a[href]').first().attr('href');
      if (href) pairs[`${m[1]} (link)`] = absUrl(base, href);
    } else if (!placeLine) placeLine = t;
  });
  const notation = [];
  $rec.find('a[href] > img, img').each((_, img) => {
    const $img = $(img);
    const full = $img.closest('a[href]').attr('href') || $img.attr('src');
    const url = absUrl(base, full);
    if (url && IMAGE_RE.test(url) && !notation.some((n) => n.url === url)) notation.push({ url, type: mimeFor(url), caption: clean($img.attr('alt') || $img.closest('a').attr('title') || null) });
  });
  return { title, pairs, placeLine, notation, audio: findAudio($, base, $rec) };
}

/** "Gerlicepuszta (Gömör és Kis-Hont), 1904.11." -> {placeRaw, dateRaw}. */
export function splitPlaceLine(line) {
  const t = clean(line);
  if (!t) return { placeRaw: null, dateRaw: null };
  const m = t.match(/^(.*?)(?:,\s*)((?:\d{1,2}\.\s*)?(?:\d{1,2}\.\s*)?1[89]\d\d\.?(?:\s*\d{1,2}\.?)?(?:\s*\d{1,2}\.?)?)?\s*$/);
  if (m && m[2]) return { placeRaw: clean(m[1].replace(/,\s*$/, '')), dateRaw: clean(m[2]) };
  return { placeRaw: clean(t.replace(/,\s*$/, '')), dateRaw: null };
}
