// Rumanian Folk Music vol. IV (Carols and Christmas Songs, Colinde), 1975 edition.
//
// Page layout of the Music Examples (pp. 47-187): a class heading ("A I.", "A II. a)")
// opens each group; every melody has its bold number left of the first staff ("1a.",
// "2.*", "12bb."), the sung incipit under the staff, prefixed by the Part Two text
// number ("89 b." / "(142.)"), and, below the notation, the data line:
//   [F. 1174 c),] Șoimi (Bihor), Ion Moț (45), II. 1914.
// i.e. optional phonograph record number, village (county, in Bartók's Romanian
// spelling), performer(s) with age, month in Roman numerals and year.
//
// Part Two (texts) closes each text with "(21b. Urviș)" = melody label and village, which
// gives an independent, village-labelled list of melody labels; the Notes to the
// Melodies are headed by labels too ("12b.c. *Change song.").

import { clean, fold, squash, similar, romanMonth, parseLabel, cleanIncipitText } from './util.mjs';
import { LabelEvidence, addNotesEvidence, fixLabel } from './labels.mjs';

export const VOLUME = { number: 4, roman: 'IV', maxNumber: 133, printedTotal: 454, printedTotalNote: 'Preface: "including variants, 454 melodies are published here" (Part One, p. 1)' };

/** Counties as printed in vol. IV (Bartók's Romanian forms) -> pre-1920 Hungarian county used by data/gazetteer.json. */
export const COUNTIES = [
  { printed: 'Bihor', historical: 'Bihar' },
  { printed: 'Hunedoara', historical: 'Hunyad' },
  { printed: 'Mureș-Turda', historical: 'Maros-Torda' },
  { printed: 'Torontal', historical: 'Torontál' },
  { printed: 'Arad', historical: 'Arad' },
  { printed: 'Alba de jos', historical: 'Alsó-Fehér' },
  { printed: 'Timiș', historical: 'Temes' },
  { printed: 'Turda-Arieș', historical: 'Torda-Aranyos' },
  { printed: 'Sătmar', historical: 'Szatmár' },
  { printed: 'Cluj', historical: 'Kolozs' },
  { printed: 'Solnoc-Dobâca', historical: 'Szolnok-Doboka' },
  { printed: 'Maramureș', historical: 'Máramaros' },
  { printed: 'Sălaj', historical: 'Szilágy' },
  { printed: 'Caraș-Severin', historical: 'Krassó-Szörény' },
  { printed: 'Bistrița-Năsăud', historical: 'Beszterce-Naszód' },
  { printed: 'Târnava-Mică', historical: 'Kis-Küküllő' },
  { printed: 'Târnava-Mare', historical: 'Nagy-Küküllő' },
  { printed: 'Făgăraș', historical: 'Fogaras' },
  { printed: 'Sibiu', historical: 'Szeben' },
  { printed: 'Ugocea', historical: 'Ugocsa' }
];

/** OCR county token -> COUNTIES entry or null ("Hunedioara", "Mures - Turda", "Torontal," all resolve). */
export function matchCounty(token) {
  const t = squash(token);
  if (!t) return null;
  let best = null;
  for (const c of COUNTIES) {
    const p = squash(c.printed);
    if (t === p) return c;
    const tol = p.length <= 5 ? 1 : 2;
    if (similar(t, p, tol) && (!best || p.length > squash(best.printed).length)) best = c;
  }
  return best;
}

/** Phonograph reference anywhere in a line: "F. 1174 c)", "M.F. 1457 b)", "ME 1375 b)", "M.-F. 1725 d)", "F.1009c),1010c)*", "M.F. 1922 6)". */
export const REF = /(?<prefix>\b[MF][A-Za-z.,_¥\s-]{0,6}?)?(?<![\d])(?<rec>\d{3,4})\s?[.,]?\s?(?<recl>[a-z0-9]{1,2})?(?:\s?[)}\]]\*?|(?<=[a-z])(?=\s*[,.]))(?<more>\s?[.,]?\s?\d{3,4}\s?[a-z0-9]?\s?[)}\]]\*?)?/;

/** Class heading: "A I.", "A II. a)", "B III. b)", "C." (OCR: l -> I). */
export const CLASS_HEADING = /^(?<cls>[ABC])\s?\.?\s?(?<roman>[IlL1]{1,3}|IV|1V)?\s?\.?\s?(?:(?<sub>[a-e])\s?[)\]])?\s?\.?$/;

/** Melody number token at the left of a staff: "1a.", "2.*", "12bb.", OCR "la." */
export const NUMBER_TOKEN = /^(?<tok>[\dlIO]{1,3}\s?[a-z]{0,2}\s?[.,])\s?(?<star>\*)?(?:\s|$)/;

/** Text-number prefix of the incipit line under the staff: "89 b." / "(142.)". */
export const TEXT_NUMBER = /^\(?\s*(\d{1,3})\s?([a-z]{1,2})?\s?[.,]\s?\)?(?:\s|(?=\p{Lu}))/u;

/** Page number line "[ 49 ]". */
export const PAGE_NUMBER = /^\[\s*([\dlIO]{1,3})\s*\]$/;

/** Part Two closing reference "(21b. Urviș ¢)", "(82a. Var. Păucinești)", "(17. Vălcani)". */
export const TEXT_REF = /\(\s*([\dlIO]{1,3})\s?([a-z]{1,2})?\s?[.,]?\s*(?:Var\.?\s*)?([A-Z][A-Za-zÀ-ɏ'’ -]{2,40}?)(?:\s+[a-z¢]\)?)?\s*\)/g;

const DATE = /(?:(?<month>[IVXLTlf|1J]{1,4})\s?[.,]?\s*)?(?<year>19[01]\d)\b/;
const TEMPO = /\b(Parlando|Tempo|giusto|Andante|Allegr|Rubato|rubato|Moderato|Poco|Lento|Vivace|Presto|Largo|Adagio|Sostenuto|acc\.)\b|[=@]\s?\d{2,3}|\d{2,3}\s?[)-]/;

export function normaliseRef(m) {
  if (!m) return null;
  const prefix = (m.groups.prefix || '').replace(/[^A-Za-z]/g, '').toUpperCase();
  const kind = prefix.startsWith('M') ? 'M.F.' : 'F.';
  const letter = m.groups.recl && /^[a-z]$/.test(m.groups.recl) ? ` ${m.groups.recl})` : '';
  const more = m.groups.more ? `, ${clean(m.groups.more.replace(/^[\s.,]+/, ''))}` : '';
  return `${kind} ${m.groups.rec}${letter}${more}`;
}

export function parseClassHeading(text) {
  const m = clean(text)?.match(CLASS_HEADING);
  if (!m) return null;
  const roman = m.groups.roman ? m.groups.roman.replace(/[lL1]/g, 'I').replace(/1V/, 'IV') : '';
  return `${m.groups.cls}${roman ? ` ${roman}.` : '.'}${m.groups.sub ? ` ${m.groups.sub})` : ''}`;
}

/** Find the "(County)" group in a line; returns {index, end, county} or null. */
function findCounty(t) {
  const re = /[(\[@]\s*([^()\[\]]{3,30}?)\s*[,.]?\s*[)\]]/g;
  let m;
  while ((m = re.exec(t))) {
    const c = matchCounty(m[1]);
    if (c) return { index: m.index, end: m.index + m[0].length, county: c, raw: m[1] };
  }
  return null;
}

/** The village is the trailing run of digit-free words before the county parenthesis. */
function villageBefore(pre) {
  let s = pre.replace(/[\u201c\u201d"“”']/g, ' ').replace(/[:;]/g, ' ');
  const lastTech = Math.max(...[...s.matchAll(/[\d)}\]]/g)].map((m) => m.index), -1);
  s = lastTech >= 0 ? s.slice(lastTech + 1) : s;
  s = s.replace(/^[\s.,;:*|_=~\-—]+/, '').replace(/[\s.,;:*|_=~\-—]+$/, '');
  // drop leading junk tokens (all caps <= 3 letters, single letters, lowercase junk)
  const words = s.split(/\s+/).filter(Boolean);
  const junk = (w) => {
    const bare = w.replace(/[^\p{L}]/gu, '');
    return !bare || bare.length === 1 || /^[A-Z]{1,3}$/.test(bare) || /^[a-z]{1,3}$/.test(bare) || /^[^\p{L}]/u.test(w);
  };
  while (words.length > 1 && junk(words[0])) words.shift();
  const v = clean(words.join(' '));
  if (!v || !/[A-Za-zÀ-ɏ]{3}/.test(v)) return null;
  return v;
}

/**
 * Parse one data line (anchored on the county parenthesis, which survives OCR best).
 * Returns null when the line is not a data line.
 */
export function parseDataLine(text) {
  const t = clean(text);
  if (!t) return null;
  const c = findCounty(t);
  if (!c) return null;
  const pre = t.slice(0, c.index);
  const post = t.slice(c.end);
  const village = villageBefore(pre);
  if (!village) return null;
  const ref = pre.match(REF);
  const d = post.match(DATE);
  const perfEnd = d ? d.index : post.length;
  let perf = clean(post.slice(0, perfEnd).replace(/^[,.;:\s]+|[,.;:\s]+$/g, ''));
  const rest = d ? clean(post.slice(d.index + d[0].length).replace(/^[,.;:\s]+/, '')) : null;
  const out = {
    raw: t,
    referenceCode: normaliseRef(ref),
    referenceRaw: ref ? clean(ref[0]) : null,
    village,
    countyPrinted: c.county.printed,
    countyHistorical: c.county.historical,
    countyRaw: clean(c.raw),
    performerRaw: perf,
    month: d ? romanMonth(d.groups.month) : null,
    monthRaw: d ? (d.groups.month || null) : null,
    year: d ? parseInt(d.groups.year, 10) : null,
    rest,
    dated: !!d
  };
  if (!out.dated && !out.referenceCode && !/\(\d|\b(un|o|doi|doua|două|fecior|fete|tigan|țigan|oameni|muier|om|dascal|preot)\b/i.test(perf || '')) return null;
  return out;
}

/** Second pass for lines whose county was lost by the OCR: a known village followed by performer and date. */
export function rescueDataLine(text, knownVillages) {
  const t = clean(text);
  if (!t) return null;
  const d = t.match(DATE);
  if (!d) return null;
  const pre = t.slice(0, d.index);
  for (const kv of knownVillages) {
    const re = new RegExp(`(^|[\\s,.)\\]])(${kv.pattern})\\b[\\s,.;:]*`, 'i');
    const m = pre.match(re);
    if (!m) continue;
    const refPart = pre.slice(0, m.index + m[1].length);
    const ref = refPart.match(REF);
    const perfStart = m.index + m[0].length;
    let perf = clean(pre.slice(perfStart).replace(/^[(\[]?[^)\]]{0,25}[)\]]\s*[,.;]?\s*/, (x) => (matchCounty(x.replace(/[()\[\],.;\s]/g, '')) ? '' : x)).replace(/^[,.;:\s]+|[,.;:\s]+$/g, ''));
    return {
      raw: t,
      referenceCode: normaliseRef(ref),
      referenceRaw: ref ? clean(ref[0]) : null,
      village: kv.village,
      countyPrinted: kv.countyPrinted,
      countyHistorical: kv.countyHistorical,
      countyRaw: null,
      performerRaw: perf,
      month: romanMonth(d.groups.month),
      monthRaw: d.groups.month || null,
      year: parseInt(d.groups.year, 10),
      rest: clean(t.slice(d.index + d[0].length).replace(/^[,.;:\s]+/, '')),
      dated: true,
      rescued: true
    };
  }
  return null;
}

/** Sung-text incipit (shared cleaner). */
export function cleanIncipit(text) {
  return cleanIncipitText(text);
}

export function looksLikeIncipit(line) {
  const t = line.text;
  if (TEMPO.test(t)) return false;
  const letters = (t.match(/\p{L}/gu) || []).length;
  if (letters < 10) return false;
  if (/^(\d\)\s*)+/.test(t)) return false; // footnote marks "1) 3) 4)"
  if (/^\[\s*\d+\s*\]$/.test(t)) return false;
  const upper = (t.match(/\p{Lu}/gu) || []).length;
  if (upper > letters / 2) return false;
  return /-|,/.test(t) || letters >= 16;
}

/**
 * Walk the music-example pages and return the ordered entries (one per data line).
 * pages: djvu pages restricted to the Music Examples range.
 */
export function extractEntries(pages) {
  const entries = [];
  let classHeading = null;
  let pending = { number: null, incipit: null };
  const known = new Map(); // fold(village) -> {village, countyPrinted, countyHistorical}
  const pass = (rescue) => {
    entries.length = 0;
    classHeading = null;
    pending = { number: null, incipit: null };
    const knownList = rescue ? [...known.values()].map((k) => ({ ...k, pattern: k.village.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s?') })) : [];
    for (const page of pages) {
      let printedPage = null;
      for (const line of page.lines) {
        const pm = line.text.match(PAGE_NUMBER);
        if (pm) printedPage = pm[1].replace(/[lI]/g, '1').replace(/O/g, '0');
      }
      for (const line of page.lines) {
        const text = line.text;
        if (PAGE_NUMBER.test(text)) continue;
        const cls = parseClassHeading(text);
        if (cls && line.x > 450) { classHeading = cls; pending = { number: null, incipit: null }; continue; }
        const nm = text.match(NUMBER_TOKEN);
        if (nm && line.x < 380 && line.words[0].text.length <= 6 && line.h >= 34) {
          const lab = parseLabel(nm.groups.tok);
          if (lab && lab.number <= VOLUME.maxNumber) {
            pending.number = { ...lab, raw: nm.groups.tok, star: !!nm.groups.star, y: line.y, page: page.index };
            pending.incipit = null;
            continue;
          }
        }
        let data = line.x < 520 ? parseDataLine(text) : null;
        if (!data && rescue && line.x < 520) data = rescueDataLine(text, knownList);
        if (data) {
          if (!rescue && !data.rescued) {
            const k = fold(data.village);
            if (k && !known.has(k)) known.set(k, { village: data.village, countyPrinted: data.countyPrinted, countyHistorical: data.countyHistorical, count: 0 });
            if (k) known.get(k).count++;
          }
          if (rescue) normaliseVillage(data, known);
          let token = pending.number;
          let tokenRejected = null;
          if (token) {
            const dist = (page.index - token.page) * page.height + (line.y - token.y);
            token = { ...token, distance: dist };
            if (dist > 950) { tokenRejected = token; token = null; }
          }
          entries.push({
            ...data,
            page: page.index,
            printedPageOcr: printedPage,
            y: line.y,
            lineConf: line.conf,
            classHeading,
            numberToken: token,
            numberTokenRejected: tokenRejected,
            incipitRaw: pending.incipit,
            incipit: pending.incipit ? cleanIncipit(pending.incipit) : null,
            textNumber: pending.incipit ? textNumberOf(pending.incipit) : null
          });
          pending = { number: null, incipit: null };
          continue;
        }
        if (!pending.incipit && looksLikeIncipit(line)) pending.incipit = text;
      }
    }
  };
  pass(false);
  pass(true);
  return entries;
}

/**
 * OCR junk in front of a village ("bj, Sebis", "and:Chincis") or a damaged spelling
 * ("Nucscara"): replace with the village name seen most often on other data lines of
 * the same county when a trailing word run matches it.
 */
export function normaliseVillage(data, known) {
  const k = fold(data.village);
  if (known.has(k) && known.get(k).count > 1) return;
  const words = data.village.split(' ');
  const cands = [...known.values()].filter((v) => v.countyHistorical === data.countyHistorical && v.count > 1).sort((a, b) => b.count - a.count);
  for (let take = Math.min(4, words.length); take >= 1; take--) {
    const suffix = words.slice(words.length - take).join(' ');
    for (const v of cands) {
      if (similar(suffix, v.village)) {
        if (fold(suffix) !== fold(v.village)) data.villageOcr = data.village;
        data.village = v.village;
        return;
      }
    }
  }
}

export function textNumberOf(incipitLine) {
  const m = clean(incipitLine)?.match(TEXT_NUMBER);
  return m ? `${m[1]}${m[2] || ''}` : null;
}

/**
 * Ordered label list: Part Two references (with village), Notes headings and the
 * number tokens caught on the melody pages.
 */
export function extractLabels({ text, entries, notesPages }) {
  const ev = new LabelEvidence(VOLUME.maxNumber, { strong: ['text-ref', 'notes'], weak: ['page-token'], weakSlack: 1, weakMaxAlone: 2 });
  const re = new RegExp(TEXT_REF.source, 'g');
  let m;
  while ((m = re.exec(text))) {
    const f = fixLabel(m[1], m[2] || '', VOLUME.maxNumber);
    if (!f) continue;
    const village = clean(m[3].replace(/\s+[a-z¢]$/, ''));
    if (!village || village.length < 3) continue;
    if (/^(Var|Cf|No|Nos|Mar|Text|Mus|See|Vol)$/i.test(village)) continue;
    ev.bump(f.number, f.letter, 'text-ref');
    ev.village(f.number, f.letter, village);
  }
  if (notesPages) addNotesEvidence(ev, notesPages, 'notes');
  for (const e of entries || []) if (e.numberToken) ev.bump(e.numberToken.number, e.numberToken.letter, 'page-token');
  return ev.build();
}

/** Page ranges: Music Examples heading page -> Notes to the Melodies -> Part Two. */
export function ranges(pages) {
  const r = { music: null, notes: null, partTwo: null };
  for (const p of pages) {
    const first = p.lines.slice(0, 3).map((l) => l.text).join(' | ');
    if (r.music === null && p.lines.length <= 3 && /Music Examples/.test(first)) r.music = p.index + 1;
    else if (r.music !== null && r.notes === null && p.index > r.music && /Notes to the Melodies/.test(first)) r.notes = p.index;
    else if (r.notes !== null && r.partTwo === null && p.lines.length <= 3 && /Part Two/.test(first)) { r.partTwo = p.index; break; }
  }
  return r;
}

export const CLASS_NOTE = 'Class letters: A = six-syllable lines, B = eight-syllable lines, C = indeterminate form; Roman numeral = number of melody lines (Appendix II).';

export function genreFor() {
  return { genre: 'colinda', performance: 'vocal', instrument: [] };
}
