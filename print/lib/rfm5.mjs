// Rumanian Folk Music vol. V (Maramureș County), 1975 edition.
//
// Music Examples (pp. 47-186 of the reprint): the melody number opens the notation line
// ("12a." at the left margin), the sung incipit follows under the staff and the data line
// closes the melody:
//   F. 2133 b), Dragomirești, Erina Vlad (26).
// i.e. optional phonograph record number, village (all in Maramureș county, so no county
// is printed), performer(s) and age in parentheses. No date is printed: the whole material
// was collected on Bartók's Maramureș trip, March 15-27, 1913 (Editor's preface, and
// Bartók's introduction: "... 27th of March, 1913, in the following villages ...").
//
// The Systematic Index of Melodies (front matter) gives the class for each number range;
// the Statistical Data table gives 375 items (209 numbers plus variants) in 12 villages.

import { clean, fold, squash, similar, parseLabel, cleanIncipitText } from './util.mjs';
import { LabelEvidence, addNotesEvidence } from './labels.mjs';

export const VOLUME = {
  number: 5,
  roman: 'V',
  maxNumber: 209,
  printedTotal: 375,
  printedTotalNote: 'Statistical Data Concerning the Output in Villages: total 375 (209 numbered melodies plus variants; Systematic Index of Melodies: "Total number: 209")',
  collected: { year: 1913, month: 3, day: null, raw: 'not printed on the melody; Bartók\'s Maramureș trip, March 15-27, 1913 (Introduction to Part One)' },
  countyPrinted: 'Maramureș',
  countyHistorical: 'Máramaros'
};

/** The twelve villages of the volume (Statistical Data table), printed spelling -> modern name. */
export const VILLAGES = [
  { printed: 'Bocicoiel', modern: 'Bocicoiel', pattern: 'B[ao]cico[ie]+l' },
  { printed: 'Breb', modern: 'Breb', pattern: 'Breb' },
  { printed: 'Cuhea', modern: 'Bogdan Vodă', pattern: 'Cuhea' },
  { printed: 'Dragomirești', modern: 'Dragomirești', pattern: 'Dragomire[sșş$]t?i' },
  { printed: 'Glod', modern: 'Glod', pattern: 'Gl[oe]d' },
  { printed: 'Ieud', modern: 'Ieud', pattern: '[IJTlLf\\[]l?eud' },
  { printed: 'Nănești', modern: 'Nănești', pattern: 'N[aăâA]+ne[sșş$]ti' },
  { printed: 'Oncești', modern: 'Oncești', pattern: 'Once[sșş$]ti' },
  { printed: 'Petrova', modern: 'Petrova', pattern: 'P[aeă]trova' },
  { printed: 'Poieni', modern: 'Poienile Izei', pattern: 'Poieni' },
  { printed: 'Văleni', modern: 'Văleni', pattern: 'V[aăâ]leni' },
  { printed: 'Vișeul de jos', modern: 'Vișeu de Jos', pattern: 'Vi[sșş$][aăâeiî]ul?\\s?-?\\s?de\\s?-?\\s?[jJ]os' }
];

const VILLAGE_RE = new RegExp(`(^|[^A-Za-z])(?<village>${VILLAGES.map((v) => `(?:${v.pattern})`).join('|')})(?![a-z])`);

/** Phonograph reference anywhere in the line: "F. 2133 b)", "FE 2093 a)", "EF 2129)", "F_ 2151 d)", "F, 2114 a)". */
export const REF = /(?<prefix>\b[FEP][FE]?[.,_]?\s?)?(?<![\d])(?<rec>\d{3,4})\s?[.,]?\s?(?<recl>[a-z0-9]{1,2})?\s?[)}\]]\*?/;

/** Melody number token: "12a." / "1." / OCR "l3b." at the start of the notation line. */
export const NUMBER_TOKEN = /^(?<tok>[\dlIO]{1,3}\s?[a-z]{0,2}\s?[.,])\s?(?<star>\*)?(?:\s|$)/;

/** Page number line "[ 49 ]". */
export const PAGE_NUMBER = /^\[\s*([\dlIO]{1,3})\s*\]$/;

/** Class/group heading printed centred above a group: "A 2.", "C II. 3.)", "B I.", "D II. 1. (1)" */
export const CLASS_HEADING = /^(?<cls>[A-E])\s?\.?\s?(?<roman>[IlL1]{1,3}|IV)?\s?\.?\s?(?<group>\d)?\s?[.)]*(?:\s?\(\d\))?$/;

/** Classes from the Systematic Index of Melodies (p. xli of the reprint). */
export const CLASSES = [
  { from: 1, to: 19, code: 'A', name: 'Class A (Colinde)', genre: 'colinda', performance: 'vocal' },
  { from: 20, to: 22, code: 'B', name: 'Class B (Mourning-song melodies)', genre: 'bocet', performance: 'vocal' },
  { from: 23, to: 23, code: 'C I', name: 'Class C, Subclass I (Hora lungă)', genre: 'doina', performance: 'vocal' },
  { from: 24, to: 135, code: 'C II', name: 'Class C, Subclass II (Hore; non-ceremonial songs)', genre: 'cantec', performance: 'vocal' },
  { from: 136, to: 163, code: 'D I', name: 'Class D, Subclass I (Dance melodies, free form)', genre: 'joc', performance: 'instrumental' },
  { from: 164, to: 192, code: 'D II', name: 'Class D, Subclass II (Dance melodies, strict form)', genre: 'joc', performance: 'instrumental' },
  { from: 193, to: 209, code: 'E', name: 'Class E (Various instrumental melodies: alphorn, fluier, violin)', genre: 'other', performance: 'instrumental' }
];

/** Instruments: named on the line, else from the Systematic Index for Class E. */
export function instrumentsFor(number, performerRaw) {
  const out = new Set();
  const p = fold(performerRaw || '');
  if (/bucium|alphorn|tulnic/.test(p)) out.add('alphorn (bucium)');
  if (/fluier|flu[ie]r|fluer/.test(p)) out.add('fluier');
  if (/vioar|violin|ceter|lauta|laut/.test(p)) out.add('violin');
  if (/cimpoi|bagpipe/.test(p)) out.add('bagpipe');
  if (/guitar|chitar|zongor/.test(p)) out.add('guitar');
  if (!out.size && number >= 193) {
    if ((number >= 193 && number <= 203) || number === 205) out.add('alphorn (bucium)');
    else if (number === 204 || number === 207 || number === 208) out.add('fluier');
    else if (number === 206 || number === 209) out.add('violin');
  }
  return [...out];
}

export function classFor(number) {
  return CLASSES.find((c) => number >= c.from && number <= c.to) || null;
}

export function matchVillage(token) {
  const t = clean(token) || '';
  for (const v of VILLAGES) if (new RegExp(`^(?:${v.pattern})$`, 'i').test(t)) return v;
  const s = squash(t);
  for (const v of VILLAGES) if (similar(s, v.printed, v.printed.length <= 5 ? 1 : 2)) return v;
  return null;
}

export function normaliseRef(m) {
  if (!m) return null;
  return `F. ${m.groups.rec}${m.groups.recl ? ` ${m.groups.recl})` : ''}`;
}

/**
 * Parse one data line. Anchors: the phonograph reference and/or one of the twelve village
 * names, then the performer(s) up to the age parenthesis. Null when it is not a data line.
 */
export function parseDataLine(text) {
  const t = clean(text);
  if (!t) return null;
  const ref = t.match(REF);
  const vm = t.match(VILLAGE_RE);
  if (!ref && !vm) return null;
  let start;
  let village = null;
  let villageRaw = null;
  if (vm && (!ref || vm.index >= ref.index)) {
    village = matchVillage(vm.groups.village);
    villageRaw = vm.groups.village;
    start = vm.index + vm[0].length;
  } else if (ref) {
    start = ref.index + ref[0].length;
  }
  const post = t.slice(start);
  const age = post.match(/\(\s*(?<age>(?:ca\.?\s*)?\d{1,2}[^()]{0,12})\)/);
  if (!village && !age) return null;
  if (!ref && !age) return null;
  if (!village && (!ref.groups.prefix || parseInt(age.groups.age.replace(/\D+/g, ' ').trim().split(' ')[0], 10) < 5)) return null;
  const perfEnd = age ? age.index : post.length;
  let perf = clean(post.slice(0, perfEnd).replace(/^[,.;:\s]+|[,.;:\s]+$/g, ''));
  if (perf && /^[^A-Za-zÀ-ɏ]*$/.test(perf)) perf = null;
  if (perf && perf.length > 70) perf = clean(perf.slice(0, 70));
  const rest = age ? clean(post.slice(age.index + age[0].length).replace(/^[,.;:\s]+/, '')) : null;
  return {
    raw: t,
    referenceCode: normaliseRef(ref),
    referenceRaw: ref ? clean(ref[0]) : null,
    recNumber: ref ? parseInt(ref.groups.rec, 10) : null,
    village: village ? village.printed : null,
    villageModern: village ? village.modern : null,
    villageRaw: villageRaw ? clean(villageRaw) : null,
    performerRaw: perf ? `${perf}${age ? ` (${clean(age.groups.age)})` : ''}` : (age ? `(${clean(age.groups.age)})` : null),
    ageRaw: age ? clean(age.groups.age) : null,
    rest
  };
}

export function parseClassHeading(text) {
  const m = clean(text)?.match(CLASS_HEADING);
  if (!m) return null;
  const roman = m.groups.roman ? m.groups.roman.replace(/[lL1]/g, 'I') : '';
  return `${m.groups.cls}${roman ? ` ${roman}.` : '.'}${m.groups.group ? ` ${m.groups.group}.` : ''}`;
}

const TEMPO = /\b(Parlando|Tempo|giusto|Andante|Allegr|Rubato|rubato|Moderato|Poco|Lento|Vivace|Presto|Largo|Adagio|Sostenuto|Var\.|Ossia)\b|[=@]\s?\d{2,3}|\d{2,3}\s?[)-]/;

export function looksLikeIncipit(line) {
  const t = line.text;
  if (TEMPO.test(t)) return false;
  const letters = (t.match(/\p{L}/gu) || []).length;
  if (letters < 10) return false;
  if (/^(\d\)\s*)+/.test(t)) return false;
  const upper = (t.match(/\p{Lu}/gu) || []).length;
  if (upper > letters / 2) return false;
  return /-|,/.test(t) || letters >= 16;
}

export function cleanIncipit(text) {
  return cleanIncipitText(text);
}

export function extractEntries(pages) {
  const entries = [];
  let classHeading = null;
  let pending = { number: null, incipit: null };
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
      if (cls && line.x > 600) { classHeading = cls; continue; }
      const nm = text.match(NUMBER_TOKEN);
      if (nm && line.x < 400 && line.words[0].text.length <= 6) {
        const lab = parseLabel(nm.groups.tok);
        if (lab && lab.number <= VOLUME.maxNumber) {
          pending.number = { ...lab, raw: nm.groups.tok, star: !!nm.groups.star, y: line.y, page: page.index };
          pending.incipit = null;
          continue;
        }
      }
      const data = line.x < 700 ? parseDataLine(text) : null;
      if (data) {
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
          incipit: pending.incipit ? cleanIncipit(pending.incipit) : null
        });
        pending = { number: null, incipit: null };
        continue;
      }
      if (!pending.incipit && looksLikeIncipit(line)) pending.incipit = text;
    }
  }
  inferVillages(entries);
  return entries;
}

/** A phonograph cylinder (F. 2133 a-d) was recorded in one village: fill lines whose village the OCR lost. */
export function inferVillages(entries) {
  const byRec = new Map();
  for (const e of entries) if (e.recNumber && e.village) {
    if (!byRec.has(e.recNumber)) byRec.set(e.recNumber, new Map());
    const m = byRec.get(e.recNumber);
    m.set(e.village, (m.get(e.village) || 0) + 1);
  }
  for (const e of entries) {
    if (e.village || !e.recNumber) continue;
    const m = byRec.get(e.recNumber) || byRec.get(e.recNumber - 1) || byRec.get(e.recNumber + 1);
    if (!m) continue;
    const best = [...m].sort((a, b) => b[1] - a[1])[0];
    const v = VILLAGES.find((x) => x.printed === best[0]);
    e.village = v.printed;
    e.villageModern = v.modern;
    e.villageInferred = `from phonograph number ${e.recNumber} (same cylinder as other melodies from ${v.printed})`;
  }
}

/**
 * Labels for vol. V: numbers 1..209 with variant letters. Evidence for letters comes from
 * (a) number tokens caught on the melody pages, (b) the Notes to the Melodies, headed by
 * the label ("160b. *The melody of var. a. ..."), and (c) the text part, where each text is
 * headed by its number and closed by "(Village)".
 */
export function extractLabels({ entries, notesPages, textPages }) {
  const ev = new LabelEvidence(VOLUME.maxNumber, { strong: ['page-token', 'text-heading'], weak: ['notes'], weakSlack: 2, weakMaxAlone: 3 });
  for (const e of entries) if (e.numberToken) ev.bump(e.numberToken.number, e.numberToken.letter, 'page-token');
  if (notesPages) addNotesEvidence(ev, notesPages, 'notes');
  let current = null;
  for (const p of textPages || []) {
    for (const line of p.lines) {
      const t = clean(line.text);
      const h = t.match(/^(\d{1,3})\s?([a-z]{1,2})?\s?\.$/);
      if (h) {
        const letter = h[2] || '';
        if (letter.length === 2 && letter[0] !== letter[1]) { current = null; continue; }
        const number = parseInt(h[1], 10);
        if (number >= 1 && number <= VOLUME.maxNumber) { current = { number, letter }; ev.bump(number, letter, 'text-heading'); }
        continue;
      }
      const vm = t.match(/^\(?\s*([A-Z][A-Za-zÀ-ɏ -]{2,20}?)\s*[¢c)\s]*$/);
      if (vm && current) {
        const v = matchVillage(vm[1]);
        if (v) { ev.village(current.number, current.letter, v.printed); current = null; }
      }
    }
  }
  return ev.build();
}

/** Page ranges: Music Examples heading page -> Notes to the Melodies -> Texts and Translations -> Appendix. */
export function ranges(pages) {
  const r = { music: null, notes: null, texts: null, end: null };
  for (const p of pages) {
    const first = p.lines.slice(0, 2).map((l) => l.text).join(' | ');
    if (r.music === null && p.lines.length <= 3 && /Music Examples/.test(first)) r.music = p.index + 1;
    else if (r.music !== null && r.notes === null && /Notes to the Melodies/.test(first)) r.notes = p.index;
    else if (r.notes !== null && r.texts === null && /Texts and Translations/.test(first)) r.texts = p.index;
    else if (r.texts !== null && /Appendix/.test(first)) { r.end = p.index; break; }
  }
  return r;
}
