// Normaliser: raw parsed record -> canonical song record (data/schema/song.schema.json).
// Everything here is a heuristic over Mark Gregory's prose notes. Rules are conservative:
// a field is filled only by an explicit pattern, otherwise it stays null, and the raw
// sentence that produced it is kept next to it so a reader can check.
import { clean, fold, slugify, uniq } from './util.js';
import { statePlaceId } from './build.js';

export const SITE_NAME = 'Australian Folk Songs (folkstream.com, Mark Gregory)';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function monthIndex(s) {
  const i = MONTHS.indexOf(String(s).slice(0, 3).toLowerCase());
  return i >= 0 ? i + 1 : null;
}

/** Find a date like "9 Nov 1929", "28th February 1891", "February 28, 1891", "Saturday 9 November 1929" in text. */
export function findDate(text) {
  if (!text) return null;
  const t = String(text);
  const re1 = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?,?\s+(\d{4})\b/i;
  const re2 = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/i;
  const re3 = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?,?\s+(\d{4})\b/i;
  let m = t.match(re1);
  if (m) return { year: +m[3], month: monthIndex(m[2]), day: +m[1], raw: m[0], index: m.index };
  m = t.match(re2);
  if (m) return { year: +m[3], month: monthIndex(m[1]), day: +m[2], raw: m[0], index: m.index };
  m = t.match(re3);
  if (m) return { year: +m[2], month: monthIndex(m[1]), day: null, raw: m[0], index: m.index };
  return null;
}

const TROVE_ARTICLE = /trove\.nla\.gov\.au\/(?:newspaper\/article|ndp\/del\/article)\/(\d+)|nla\.gov\.au\/nla\.news-article(\d+)/i;

// Folded regexes tolerate the typos in the notes ("Queenland", "South Astralian", "Victoian").
const STATE_PATTERNS = [
  [/new south wales|\bn\s*s\s*w\b|sydney|newcastle|broken hill|wagga|wollongong|bathurst|goulburn/, 'NSW'],
  [/queen?s?land|brisbane|rockham|townsville|cairns|toowoomba|\bqld\b/, 'QLD'],
  [/victori|vic?toian|melbourne|ballarat|bendigo|geelong|\bvic\b/, 'VIC'],
  [/south\s+a\w*|adelaide|\bs\.?\s*a\.?\b/, 'SA'],
  [/west(?:ern)?\s+a\w*|perth|kalgoorlie|fremantle|\bw\.?\s*a\.?\b/, 'WA'],
  [/tasmani|hobart|launceston|\btas\b/, 'TAS'],
  [/northern territory|darwin|\bn\.?\s*t\.?\b/, 'NT'],
  [/canberra|\ba\.?\s*c\.?\s*t\.?\b|federal capital/, 'ACT'],
  [/new zealand|auckland|wellington nz|dunedin|christchurch/, 'NZ'],
  [/\bengland\b|\bscotland\b|\bireland\b|\blondon\b|\bglasgow\b|\bdublin\b|\bbritish\b/, 'UK'],
  [/\bamerican\b|\bnew york\b|\bboston\b|\bchicago\b/, 'US']
];

/** State abbreviation from a phrase like "the Queensland newspaper" / "Sydney newspaper". */
export function stateFromHint(s) {
  const f = fold(s);
  if (!f) return null;
  for (const [re, code] of STATE_PATTERNS) if (re.test(f)) return code;
  return null;
}

/** Strip a trailing date, page or stray connective from a newspaper title read from the notes. */
export function cleanNewspaperTitle(title) {
  let t = clean(title) || '';
  t = t.replace(/^["'\u201c\u2018]+|["'\u201d\u2019]+$/g, '');
  t = t.replace(/\s+(?:on|of|in|which|that|where|for)(?:\s+[\s\S]*)?$/i, '');
  t = t.replace(/\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*$/i, '');
  t = t.replace(/\s+\(?\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s+\d{4}[\s\S]*$/i, '');
  t = t.replace(/\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}[\s\S]*$/i, '');
  t = t.replace(/\s+(?:page|p\.)\s*\d+[\s\S]*$/i, '');
  t = t.replace(/\s+\d{4}[\s\S]*$/, '');
  t = t.replace(/[\s,.;:]+$/, '');
  t = t.replace(/^the\s+/i, 'The ');
  return clean(t) || '';
}

/**
 * Newspaper provenance from the notes. The canonical form on the site is
 *   "From the <State|City> newspaper <a href=trove>The Kiama Independent</a> 9 Nov 1929 Page 5."
 * Returns null when no Trove link and no "newspaper" sentence is found.
 */
export function extractNewspaper(raw) {
  const notes = raw.notesText || '';
  const troveLink = (raw.links || []).find((l) => TROVE_ARTICLE.test(l.href));
  let title = null;
  let stateHint = null;
  let context = null;
  if (troveLink) {
    title = clean(troveLink.text);
    const idx = title ? notes.indexOf(title) : -1;
    if (idx >= 0) {
      const before = notes.slice(Math.max(0, idx - 80), idx);
      const m = before.match(/(?:from|in|published in)\s+(?:the\s+)?([A-Z][A-Za-z.\s]+?)\s+(?:newspaper|paper|weekly|daily|journal)\s*(?:,\s*)?$/i);
      if (m) stateHint = clean(m[1]);
      context = clean(notes.slice(Math.max(0, idx - 80), idx + (title ? title.length : 0) + 60));
    } else context = clean(notes.slice(0, 160));
  } else {
    // No link: look for "From the <X> newspaper <Title> <date>".
    const m = notes.match(/(?:From|In|Published in)\s+the\s+([A-Z][A-Za-z.\s]+?)\s+(?:newspaper|paper)\s+([A-Z][^.\d]{2,80}?)(?=\s+\d{1,2}\s|\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)|\s+in\s+\d{4}|\s*[.,(]|\s*$)/i);
    if (m) {
      stateHint = clean(m[1]);
      title = clean(m[2]);
      context = clean(m[0]);
    }
  }
  if (!title) return null;
  title = cleanNewspaperTitle(title);
  if (!title || title.length < 3) return null;
  const troveId = troveLink ? (troveLink.href.match(TROVE_ARTICLE) || []).slice(1).find(Boolean) || null : null;
  // Date and page: search after the title mention, else anywhere in the notes.
  const idx = notes.indexOf(title);
  const tail = idx >= 0 ? notes.slice(idx + title.length, idx + title.length + 160) : notes;
  const date = findDate(tail) || findDate(notes);
  const pm = tail.match(/\b(?:page|p\.)\s*(\d{1,3})\b/i) || notes.match(/\b(?:page|p\.)\s*(\d{1,3})\b/i);
  return {
    title,
    key: slugify(title.replace(/^the\s+/i, '')),
    troveArticleId: troveId,
    troveUrl: troveLink ? troveLink.href : null,
    date: date ? { year: date.year, month: date.month, day: date.day, raw: date.raw } : null,
    page: pm ? +pm[1] : null,
    stateHint,
    state: stateFromHint(stateHint),
    context
  };
}

// A personal name: optional initials ("A.L.", "A. L."), a capitalised word, up to four more parts.
const NAME = "((?:[A-Z]\\.\\s?){0,3}[A-Z][A-Za-z'\\-]+(?:\\s+(?:[A-Z]\\.|[A-Z][A-Za-z'\\-]+|de|of|von|van|and|&)){0,4})";
// Single final lines that are structure, not a signature.
const SIGNATURE_STOP = /^(?:chorus|refrain|verse|encore|finis|the end|end|repeat|unknown|anon\.?|anonymous|composer unknown|author unknown)$/i;
const PERSON_STOP = /\b(the|a|an|his|her|this|that|it|in|on|at|of|and|for|by|from|with|to|Mr|Mrs|Miss|Dr)$/i;

function tidyName(s) {
  if (!s) return null;
  let n = clean(s.replace(/\s+(?:in|at|of|on|from|who|which|via|for|and)\s.*$/i, ''));
  if (n) n = n.replace(/\s+(?:the|a|an|his|her|this|that|it|Mr|Mrs|Miss|Dr)$/i, '');
  if (!n) return null;
  n = n.replace(/[.,;:]+$/, '').trim();
  if (!n || PERSON_STOP.test(n) || n.split(/\s+/).length > 5) return null;
  return n;
}

/**
 * People from the notes: singers ("from the singing of X", "sung by X", "collected from X"),
 * collectors ("collected by X"), and an author ("written by X", "by X" as a lyric attribution).
 */
export function extractPeople(raw) {
  const notes = raw.notesText || '';
  const singers = [];
  const collectors = [];
  let author = null;
  let authorRaw = null;
  for (const m of notes.matchAll(new RegExp(`(?:[Ff]rom the singing of|[Ss]ung by|[Aa]s sung by|[Ss]inging of|[Ll]earned from|[Rr]ecorded from|[Cc]ollected from|[Gg]ot it from|[Ff]rom the repertoire of)\\s+(?:Mr\\.?|Mrs\\.?|Miss|Dr\\.?|Ms\\.?)?\\s*${NAME}`, 'g'))) {
    const n = tidyName(m[1]);
    if (n) singers.push(n);
  }
  for (const m of notes.matchAll(new RegExp(`(?:[Cc]ollected|[Rr]ecorded|[Nn]oted|[Tt]ranscribed)\\s+(?:in\\s+\\d{4}\\s+)?by\\s+${NAME}(?:\\s+from\\s+(?:Mr\\.?|Mrs\\.?|Miss|Dr\\.?|Ms\\.?)?\\s*${NAME})?`, 'g'))) {
    const n = tidyName(m[1]);
    if (n) collectors.push(n);
    const from = m[2] ? tidyName(m[2]) : null;
    if (from) singers.push(from);
  }
  let m = notes.match(new RegExp(`(?:[Ww]ritten|[Cc]omposed|[Pp]enned|[Aa]uthored)\\s+by\\s+(?:the\\s+)?${NAME}`));
  if (m) {
    author = tidyName(m[1]);
    authorRaw = clean(m[0]);
  }
  // Lyric attribution lines: "(By the Man from Jugiong.)" or a line "By W. T. Goodge." that is
  // the first line or a one-line stanza. Every word after "By" must be capitalised or a
  // connective, so lyric lines such as "By the rolling of her dark blue eye" do not match.
  const stanzas = raw.stanzas || [];
  const candidates = [];
  if (stanzas.length && stanzas[0].length) candidates.push(stanzas[0][0]);
  for (const st of stanzas) if (st.length === 1) candidates.push(st[0]);
  const byLine = candidates.find((l) => {
    const m = l.match(/^\(?\s*by\s+(.{2,60}?)\s*[.)]*\s*$/i);
    if (!m) return false;
    const words = m[1].replace(/[.,]/g, ' ').split(/\s+/).filter(Boolean);
    return words.length <= 6 && words.some((w) => /^[A-Z]/.test(w)) && !/^\d/.test(words[0]) && words.every((w) => /^[A-Z]/.test(w) || /^(?:the|of|from|and|de|von|van|a)$/i.test(w));
  });
  if (byLine) {
    const a = clean(byLine.replace(/^\(?\s*by\s+/i, '').replace(/[.)\s]+$/, ''));
    if (a && !author) {
      author = a;
      authorRaw = byLine;
    }
  }
  // Signature: a single short final line such as "H.S.B., Dunmore." or "MARY GILMORE" or
  // "Sydney, May, 1858. C. J. W". Kept verbatim; used as the author only when it is a bare name.
  let signature = null;
  const last = stanzas.length > 1 ? stanzas[stanzas.length - 1] : null;
  if (last && last.length === 1) {
    const l = last[0].trim();
    const words = l.split(/\s+/);
    if (words.length <= 8 && /^["'(A-Z]/.test(l) && !/[,;]$/.test(l) && !/\b(?:and|the|of|my|we|you|I|is|are|was)\b\s+\w+\s+\w+/i.test(l)) signature = l.replace(/[.\s]+$/, '');
  }
  if (signature && !author) {
    // "H.S.B., Dunmore" signs with a name and a place: the name is the part before the comma.
    const bare = signature.replace(/^\(|\)$/g, '').replace(/^["\u201c]|["\u201d]$/g, '').split(',')[0].trim();
    const w = bare.split(/\s+/);
    if (bare && !/\d/.test(bare) && w.length <= 4 && w.every((x) => /^[A-Z]/.test(x)) && !SIGNATURE_STOP.test(bare)) {
      author = bare;
      authorRaw = signature;
    }
  }
  return { singers: uniq(singers), collectors: uniq(collectors), author, authorRaw, signature };
}

/** Songbooks cited in the notes, matched against the bibliography (title substrings, folded). */
export function matchSongbooks(notesText, songbooks) {
  const f = fold(notesText);
  if (!f) return [];
  const hits = [];
  for (const b of songbooks) {
    const t = fold(b.title);
    if (t.length < 10) continue; // too short to be safe ("Singabout")
    if (f.includes(t)) hits.push(b.id);
  }
  return uniq(hits);
}

/** Song or poem: explicit signals only. */
export function classifyKind(raw, people) {
  const t = fold(raw.title || '');
  const n = fold(raw.notesText || '');
  const hasTune = (raw.mediaImages || []).some((i) => i.role === 'notation') || raw.media.midi.length > 0 || (raw.media.audio || []).length > 0;
  if (hasTune) return 'song';
  if (/\b(tune|air|sung|singing|to the tune of|melody|chorus)\b/.test(n)) return 'song';
  if (/\b(poem|verses|recitation|ode|lines|rhyme|rhymes)\b/.test(t) || /\b(poem|verses|recitation)\b/.test(n)) return 'poem';
  if (/\bsong\b/.test(t) || /\bchorus\b/.test(fold((raw.stanzas || []).flat().join(' ')))) return 'song';
  return 'unknown';
}

/** Cross-references to other songs on the site: "See 'The Stockman' in this collection", or links to NNN.html. */
export function extractRelated(raw, byTitle) {
  const out = [];
  for (const l of raw.links || []) {
    const m = l.href.match(/folkstream\.com\/(\d{1,4}[a-z]?)\.html$/i);
    if (m && m[1] !== raw.pageId) out.push({ id: `afs-${m[1].toLowerCase()}`, relation: 'linked', title: l.text || null });
  }
  const notes = raw.notesText || '';
  for (const m of notes.matchAll(/See(?: also)?\s+['"‘“]([^'"’”]{3,80})['"’”]/g)) {
    const key = fold(m[1]);
    const ids = byTitle.get(key) || [];
    for (const id of ids) if (id !== `afs-${raw.pageId}`) out.push({ id, relation: 'see', title: m[1] });
  }
  const seen = new Set();
  return out.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
}

/**
 * Notation scan or newspaper masthead? The original 1994 pages carry GIF notation (about
 * 510 x 280 px); the Trove-era pages carry a PNG crop of the paper's masthead (wide and under
 * 200 px tall). Without probed dimensions a GIF counts as notation and a PNG on a Trove-sourced
 * record as a masthead.
 */
export function classifyImage(url, probe, newspaper) {
  const type = ((url.match(/\.(\w+)$/) || [])[1] || '').toLowerCase();
  const width = probe && probe.width != null ? probe.width : null;
  const height = probe && probe.height != null ? probe.height : null;
  let role;
  if (height !== null && width !== null) role = height < 200 && width / height > 2.5 ? 'masthead' : 'notation';
  else role = type === 'gif' ? 'notation' : newspaper ? 'masthead' : 'notation';
  return { url, type, role, width, height };
}

export function decadeOf(year) {
  return year ? `${Math.floor(year / 10) * 10}s` : null;
}

/**
 * Build the canonical song record.
 * @param raw parsed record from site.parseRecord
 * @param ctx { songbooks: [{id,title,...}], byTitle: Map<foldedTitle, id[]>, newspapers: Map<key, gazetteerEntry> }
 */
export function normalizeRecord(raw, ctx) {
  const id = `afs-${raw.pageId}`;
  const newspaper = extractNewspaper(raw);
  const people = extractPeople(raw);
  const songbookIds = matchSongbooks(raw.notesText, ctx.songbooks);
  const images = raw.media.notation.map((url) => classifyImage(url, ctx.images ? ctx.images[url] : null, newspaper));
  const kind = classifyKind({ ...raw, mediaImages: images }, people);

  // Year: title first, then the index listing, then the newspaper date, then a bare year in the notes.
  let year = raw.year;
  let yearFrom = raw.year ? 'title' : null;
  if (!year && raw.indexYear) {
    year = raw.indexYear;
    yearFrom = 'index';
  }
  if (!year && newspaper && newspaper.date) {
    year = newspaper.date.year;
    yearFrom = 'newspaper';
  }
  if (!year) {
    const m = (raw.notesText || '').match(/\b(1[789]\d{2}|20[01]\d)\b/);
    if (m && /(?:published|printed|appeared|written|composed|collected|recorded)\b[^.]{0,60}\b1[789]\d{2}\b|\bin\s+1[789]\d{2}\b/i.test(raw.notesText || '')) {
      year = +m[1];
      yearFrom = 'notes';
    }
  }
  if (year && (year < 1780 || year > 2030)) {
    year = null;
    yearFrom = null;
  }

  // Location: the newspaper's place of publication, via the gazetteer; else the state hint.
  // A title shared by papers in several cities ("Worker", "Herald") is resolved per record by
  // the state the notes name, else by the gazetteer's default variant.
  let gaz = newspaper ? ctx.newspapers.get(newspaper.key) || null : null;
  if (gaz && gaz.variants && gaz.variants.length) {
    const byState = newspaper.state ? gaz.variants.find((v) => v.state === newspaper.state) : null;
    gaz = byState || gaz.variants.find((v) => v.default) || gaz.variants[0];
  }
  const location = {
    basis: gaz ? 'newspaper' : newspaper && newspaper.state ? 'newspaper-state' : null,
    state: gaz ? gaz.state : newspaper ? newspaper.state : null,
    town: gaz ? gaz.town : null,
    lat: gaz ? gaz.lat : null,
    lng: gaz ? gaz.lng : null,
    placeId: gaz ? gaz.placeId : newspaper && newspaper.state ? statePlaceId(newspaper.state, null) : null,
    raw: newspaper ? newspaper.stateHint : null
  };

  const lines = (raw.stanzas || []).flat();
  const titles = uniq([raw.title, raw.indexTitle, ...(raw.indexTitleAlt || [])].map((t) => clean(t)));
  const titleAlt = titles.filter((t) => t !== raw.title);

  return {
    id,
    source: {
      site: 'afs',
      siteName: SITE_NAME,
      siteId: raw.pageId,
      url: raw.url,
      fetchedAt: raw.fetchedAt || null
    },
    title: raw.title || raw.indexTitle || `Untitled (${raw.pageId})`,
    titleRaw: raw.titleRaw || null,
    titleAlt,
    kind,
    year: { value: year, approx: !!raw.yearApprox, from: yearFrom, decade: decadeOf(year) },
    author: { name: people.author, raw: people.authorRaw, signature: people.signature },
    text: {
      incipit: lines.length ? lines[0] : null,
      stanzas: raw.stanzas || [],
      lineCount: lines.length,
      wordCount: lines.join(' ').split(/\s+/).filter(Boolean).length
    },
    notes: {
      text: raw.notesText || null,
      links: (raw.links || []).map((l) => ({ text: l.text || null, href: l.href }))
    },
    provenance: {
      newspaper: newspaper
        ? {
            title: newspaper.title,
            key: newspaper.key,
            troveArticleId: newspaper.troveArticleId,
            troveUrl: newspaper.troveUrl,
            date: newspaper.date,
            page: newspaper.page,
            stateHint: newspaper.stateHint,
            context: newspaper.context
          }
        : null,
      songbooks: songbookIds,
      singers: people.singers,
      collectors: people.collectors
    },
    media: {
      images,
      midi: raw.media.midi.map((url) => ({ url })),
      audio: (raw.media.audio || []).map((url) => ({ url }))
    },
    location,
    related: [],
    themes: [],
    warnings: raw.warnings || []
  };
}
