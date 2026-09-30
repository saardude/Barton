// folkstream.com ("Australian Folk Songs", Mark Gregory, online since 1994).
// Flat hand-written HTML: one numbered page per song or poem (001.html .. 1100.html, plus
// 052a.html), listed on songs.html. Ancillary pages: songbooks.html (bibliography),
// reviews/ (articles index), data/ (discography), glossary.html.
//
// A record page has, in order: an optional notation image (<img src="NNN.gif|png">),
// an optional "play MIDI" link (NNN.mid), the title in <em>, the lyrics as <br>-separated
// lines in one or more <p>, a "Notes" heading (<small>Notes</small> or <em>Notes</em>), the
// notes paragraphs (prose with links to Trove, songbooks, singers), and a "Top" link.
// Nothing is structured, so the parser keeps the raw pieces and the build step derives
// provenance from the notes text.
import { load } from 'cheerio';
import { absUrl, clean, uniq } from './util.js';

export const name = 'afs';
export const host = 'https://folkstream.com';
export const kind = 'pages';
export const seeds = [`${host}/songs.html`];
export const auxPages = {
  songbooks: `${host}/songbooks.html`,
  articles: `${host}/reviews/`,
  discographyAL: `${host}/data/AFS_A-L.html`,
  discographyMZ: `${host}/data/AFS_M-Z.html`,
  glossary: `${host}/glossary.html`,
  home: `${host}/index.html`
};

const RECORD_HREF = /^(\d{1,4}[a-z]?)\.html$/i;

/** Discover record pages from songs.html. Context keeps the index's own title and year. */
export function discover($, url) {
  const records = new Map();
  $('a[href]').each((_, a) => {
    const href = $(a).attr('href') || '';
    const m = href.match(RECORD_HREF);
    if (!m) return;
    const abs = absUrl(url, href);
    if (!abs) return;
    const indexTitle = clean($(a).text());
    // The year follows the link as a text node: <a>Title</a> (1897)<br>
    const after = a.nextSibling && a.nextSibling.type === 'text' ? String(a.nextSibling.data) : '';
    const ym = after.match(/\((?:c\.?\s*)?(\d{4})s?\)/);
    const ctx = { pageId: m[1].toLowerCase(), indexTitle, indexYear: ym ? parseInt(ym[1], 10) : null };
    if (!records.has(abs)) records.set(abs, { url: abs, context: ctx });
    else {
      // The same page can be listed under two titles (e.g. 619.html); keep both.
      const r = records.get(abs);
      r.context.indexTitleAlt = uniq([r.context.indexTitleAlt, indexTitle].flat());
    }
  });
  return { records: [...records.values()], listings: [] };
}

/** Media URLs on the site come in http/https and www/no-www forms; one canonical host. */
export function canonicalMedia(url) {
  return String(url).replace(/^http:\/\/(?:www\.)?folkstream\.com/i, 'https://folkstream.com').replace(/^https:\/\/www\.folkstream\.com/i, 'https://folkstream.com');
}

const BR = '\u0001';
const PARA = '\u0002';

/** HTML fragment -> plain text where <br> is a line break and <p> a paragraph break. */
export function htmlToText(html) {
  if (!html) return '';
  const marked = String(html)
    .replace(/<br\s*\/?>/gi, BR)
    .replace(/<\/p\s*>|<p\b[^>]*>|<\/div\s*>|<div\b[^>]*>|<\/blockquote\s*>|<blockquote\b[^>]*>/gi, PARA);
  const $ = load(`<div id="x">${marked}</div>`, null, false);
  let t = $('#x').text();
  t = t.replace(/ /g, ' ');
  t = t.replace(/[ \t\r\f\v]*\n[ \t\r\f\v]*/g, ' '); // source line wraps are not breaks
  t = t.replace(/[ \t]+/g, ' ');
  t = t.split(BR).map((s) => s.trim()).join('\n');
  t = t.split(PARA).map((s) => s.replace(/^\n+|\n+$/g, '').trim()).filter(Boolean).join('\n\n');
  return t.replace(/\n{3,}/g, '\n\n').trim();
}

/** Split lyric text into stanzas (arrays of lines). */
export function toStanzas(text) {
  return String(text || '')
    .split(/\n\s*\n/)
    .map((s) => s.split('\n').map((l) => l.trim()).filter(Boolean))
    .filter((s) => s.length);
}

function stripHeaderFooter(bodyHtml) {
  let h = bodyHtml;
  // Drop the site header (<big>Australian Folk Songs</big>) and the nav (<cite>...</cite>).
  h = h.replace(/<big>\s*Australian Folk Songs\s*<\/big>/i, '');
  h = h.replace(/<cite>[\s\S]*?<\/cite>/i, '');
  // Drop everything from the "Top" link on (footer with the mailto and byline).
  const top = h.search(/<a\s+href="#top"[^>]*>/i);
  if (top >= 0) h = h.slice(0, top);
  else {
    const by = h.search(/australian traditional songs\s*\.\s*\.\s*\./i);
    if (by >= 0) h = h.slice(0, by);
  }
  return h;
}

const NOTES_MARK = /<(small|em|b|strong|i)>\s*Notes?\s*:?\s*<\/\1>|<p[^>]*>\s*Notes?\s*:?\s*<\/p>/i;

/**
 * Parse one record page into a raw record. Fields:
 *   pageId, url, title, titleRaw, year (from the title), lyricsText, stanzas, notesText,
 *   notesHtml, links[{text, href}], media{notation[], midi[]}, fetchedAt, warnings[]
 */
export function parseRecord(html, url, context = {}) {
  const $ = load(html);
  const warnings = [];
  const pageId = context.pageId || (url.match(/\/(\d{1,4}[a-z]?)\.html$/i) || [])[1] || null;

  // Title: <title> is "Australian Folk Songs | Title (year)" on most pages, bare on some.
  let titleRaw = clean($('title').first().text());
  if (titleRaw && /^Australian Folk Songs\s*\|/i.test(titleRaw)) titleRaw = clean(titleRaw.replace(/^Australian Folk Songs\s*\|/i, ''));
  if (titleRaw && /^Australian Folk Songs$/i.test(titleRaw)) titleRaw = null;

  const bodyHtml = $('body').html() || '';
  let content = stripHeaderFooter(bodyHtml);
  // Audio: a few pages embed a Flash MP3 player (script + <noscript><object>); keep the file, drop the markup.
  const audio = uniq([...content.matchAll(/https?:\/\/[^\s"'&<>]+\.mp3/gi)].map((m) => canonicalMedia(m[0])));
  content = content.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<noscript\b[\s\S]*?<\/noscript>/gi, '').replace(/<object\b[\s\S]*?<\/object>/gi, '').replace(/<embed\b[^>]*>/gi, '').replace(/<param\b[^>]*>/gi, '');

  // Media: notation images and MIDI files, hot-linked from the source site.
  const notation = [];
  const midi = [];
  load(`<div>${content}</div>`)('img[src]').each((_, img) => {
    const src = absUrl(url, (img.attribs && img.attribs.src) || '');
    if (src && /\.(gif|png|jpe?g)$/i.test(src)) notation.push(src);
  });
  // Some pages have a malformed <img src="500.png" without a closing >; catch those too.
  for (const m of content.matchAll(/<img\s+src\s*=\s*"?([^"\s>]+\.(?:gif|png|jpe?g))"?/gi)) {
    const src = absUrl(url, m[1]);
    if (src) notation.push(src);
  }
  const links = [];
  load(`<div>${content}</div>`)('a[href]').each((_, a) => {
    const href = absUrl(url, a.attribs.href || '');
    if (!href) return;
    const text = clean(load(a).text());
    if (/\.(mid|midi)$/i.test(href)) midi.push(href);
    else if (/\.mp3$/i.test(href)) audio.push(href);
    else if (!/^mailto:/i.test(href) && !/#top$/.test(href)) links.push({ text, href });
  });

  // Title in the content: the first <em> that is not "Notes".
  const ems = [...content.matchAll(/<em>([\s\S]*?)<\/em>/gi)];
  let titleEm = null;
  let titlePos = -1;
  for (const m of ems) {
    const t = clean(htmlToText(m[1]));
    if (t && !/^notes?:?$/i.test(t)) {
      titleEm = t;
      titlePos = m.index + m[0].length;
      break;
    }
  }
  if (!titleRaw) titleRaw = titleEm;
  const stripYear = (t) => (t || '').replace(/\s*\((?:c\.?\s*)?\d{4}s?\)+\s*$/, '').replace(/[.\s]+$/, '').toLowerCase();
  if (titleEm && titleRaw && stripYear(titleEm) !== stripYear(titleRaw)) {
    // A few pages carry a <title> copied from another page; the songs index decides.
    const idx = stripYear(context.indexTitle);
    if (idx && idx === stripYear(titleEm)) {
      warnings.push(`title from <em> (page <title> "${titleRaw}" disagrees with the index)`);
      titleRaw = titleEm;
    } else if (idx && idx === stripYear(titleRaw)) {
      // <title> agrees with the index; keep it silently.
    } else {
      warnings.push(`title mismatch: <title> "${titleRaw}" vs <em> "${titleEm}"`);
    }
  }
  titleRaw = titleRaw ? clean(titleRaw.replace(/\)\)+$/, ')').replace(/^[>\s.,;:-]+/, '')) : titleRaw;

  // Split lyrics / notes.
  const nm = content.slice(Math.max(titlePos, 0)).search(NOTES_MARK);
  let lyricsHtml;
  let notesHtml;
  if (nm >= 0) {
    const abs = Math.max(titlePos, 0) + nm;
    lyricsHtml = content.slice(Math.max(titlePos, 0), abs);
    notesHtml = content.slice(abs).replace(NOTES_MARK, '');
  } else {
    lyricsHtml = content.slice(Math.max(titlePos, 0));
    notesHtml = '';
    warnings.push('no Notes heading found');
  }
  // Remove media markup from the lyric block before converting.
  lyricsHtml = lyricsHtml.replace(/<img[^>]*>?/gi, '').replace(/<a\s+href="[^"]*\.midi?"[^>]*>[\s\S]*?<\/a>/gi, '');
  const lyricsText = htmlToText(lyricsHtml).replace(/^play MIDI\s*/i, '').trim();
  const notesText = htmlToText(notesHtml);
  const stanzas = toStanzas(lyricsText);
  if (!stanzas.length) warnings.push('no lyrics found');

  const title = titleRaw ? clean(titleRaw.replace(/\s*\((?:c\.?\s*)?\d{4}s?\)\s*(\(\d{4}\))?\s*$/, '')) : null;
  const ym = titleRaw ? titleRaw.match(/\((?:c\.?\s*)?(\d{4})(s?)\)\s*(?:\(\d{4}\))?\s*$/) : null;
  const year = ym ? parseInt(ym[1], 10) : null;
  const yearApprox = ym ? ym[2] === 's' || /\(c\.?\s*\d{4}/i.test(titleRaw) : false;

  return {
    pageId,
    url,
    title,
    titleRaw,
    indexTitle: context.indexTitle || null,
    indexTitleAlt: context.indexTitleAlt || [],
    indexYear: context.indexYear ?? null,
    year,
    yearApprox,
    lyricsText,
    stanzas,
    notesText,
    notesHtml: clean(notesHtml) ? notesHtml.trim() : null,
    links,
    media: { notation: uniq(notation.map(canonicalMedia)), midi: uniq(midi.map(canonicalMedia)), audio: uniq(audio.map(canonicalMedia)) },
    fetchedAt: context.fetchedAt || null,
    warnings
  };
}

/** songbooks.html -> [{year, yearRaw, title, author, url}] */
export function parseSongbooks(html, url) {
  const $ = load(html);
  const body = stripHeaderFooter($('body').html() || '');
  const text = htmlToText(body);
  const out = [];
  for (const rawLine of text.split('\n')) {
    const line = clean(rawLine);
    if (!line) continue;
    const m = line.match(/^(\d{4})(?:\s*-\s*(\d{2,4}))?\s+(.+)$/);
    if (!m) continue;
    let rest = m[3];
    let author = null;
    const comma = rest.lastIndexOf(',');
    if (comma > 0) {
      author = clean(rest.slice(comma + 1));
      rest = clean(rest.slice(0, comma));
    }
    out.push({ year: parseInt(m[1], 10), yearRaw: m[2] ? `${m[1]} - ${m[2]}` : m[1], title: rest, author, url });
  }
  // Links inside the list (a few entries point at record pages or external sites)
  const links = {};
  load(`<div>${body}</div>`)('a[href]').each((_, a) => {
    const t = clean(load(a).text());
    const h = absUrl(url, a.attribs.href || '');
    if (t && h && t.length > 8) links[t] = h;
  });
  for (const b of out) {
    const k = Object.keys(links).find((t) => t.includes(b.title));
    b.link = k ? links[k] : null;
  }
  return out;
}

/** reviews/ -> [{title, url}] */
export function parseArticles(html, url) {
  const $ = load(html);
  const out = [];
  $('blockquote a[href]').each((_, a) => {
    const href = $(a).attr('href') || '';
    if (/^mailto:|#top$/i.test(href)) return;
    if (/^\.\.\/(songs|songbooks|glossary|musites|search|response|index)\.html$|^\.\.\/(data|reviews)\/$/.test(href)) return;
    const t = clean($(a).text());
    const abs = absUrl(url, href);
    if (t && abs) out.push({ title: t, url: abs });
  });
  return out;
}

export default { name, host, kind, seeds, auxPages, discover, parseRecord, parseSongbooks, parseArticles };
