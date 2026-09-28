// Small shared helpers for the print-source pipeline (no dependencies).

/** Diacritics-insensitive, case-insensitive folding (same rules as scraper/src/util.js fold()). */
export function fold(s) {
  if (s === undefined || s === null) return '';
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[şș]/g, 's')
    .replace(/[ţț]/g, 't')
    .replace(/[đ]/g, 'd')
    .replace(/[ł]/g, 'l')
    .replace(/[ß]/g, 'ss')
    .toLowerCase()
    .replace(/[’'`´]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** fold() and drop every space and hyphen: "Mures - Turda" -> "muresturda". */
export function squash(s) {
  return fold(s).replace(/\s+/g, '');
}

/** Collapse whitespace; null for empty. */
export function clean(s) {
  if (s === undefined || s === null) return null;
  const t = String(s).replace(/\s+/g, ' ').trim();
  return t.length ? t : null;
}

/** Levenshtein distance (small strings only). */
export function editDistance(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = new Array(n + 1);
  let cur = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}

/** True when two folded strings are the same up to a small OCR error. */
export function similar(a, b, tolerance) {
  const x = squash(a);
  const y = squash(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const tol = tolerance ?? (Math.min(x.length, y.length) >= 8 ? 2 : 1);
  return editDistance(x, y) <= tol;
}

const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };

/**
 * Roman month as OCRed ("II", "Il", "XL", "XT", "VIL", "Xf", "1.") -> 1..12 or null.
 * OCR confuses I with l, T, f, |, 1 and J.
 */
export function romanMonth(s) {
  if (!s) return null;
  const t = String(s).replace(/[.,\s]/g, '').replace(/[lTf|1Jj]/g, 'I').replace(/L/g, 'I').replace(/[xX]/g, 'X').replace(/v/g, 'V').toUpperCase();
  return ROMAN[t] ?? null;
}

/** "la." / "12bb." / "3a" -> {number, letter, label} with OCR fixes (l/I -> 1, O -> 0). */
export function parseLabel(tok) {
  if (!tok) return null;
  const m = String(tok).trim().match(/^([\dlIO]{1,3})\s?([a-z]{1,2})?\s?[.,]?\s?\*?$/);
  if (!m) return null;
  const numStr = m[1].replace(/[lI]/g, '1').replace(/O/g, '0');
  if (!/^\d{1,3}$/.test(numStr)) return null;
  const number = parseInt(numStr, 10);
  if (number < 1) return null;
  const letter = m[2] || '';
  if (letter.length === 2 && letter[0] !== letter[1]) return null; // RFM uses aa, bb, cc ... after z
  return { number, letter, label: `${number}${letter}` };
}

/** Variant letter -> ordinal: a=1 ... z=26, aa=27, bb=28 ... ; '' -> 0. */
export function letterOrdinal(letter) {
  if (!letter) return 0;
  if (letter.length === 1) return letter.charCodeAt(0) - 96;
  return 26 + letter.charCodeAt(0) - 96;
}

export function ordinalLetter(k) {
  if (k <= 0) return '';
  if (k <= 26) return String.fromCharCode(96 + k);
  const c = String.fromCharCode(96 + k - 26);
  return c + c;
}

/** Sort key for a label: number * 100 + letter ordinal. */
export function labelKey(l) {
  return l.number * 100 + letterOrdinal(l.letter);
}

/** Recursively sort object keys (arrays keep order) for diffable output. */
export function sortKeysDeep(v) {
  if (Array.isArray(v)) return v.map(sortKeysDeep);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = sortKeysDeep(v[k]);
    return out;
  }
  return v;
}

/** Decode the handful of XML entities the djvu.xml uses. */
export function decodeXml(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&');
}

/**
 * Sung-text incipit from an OCR line: drop leading notation junk and a text-number prefix
 * ("89 b." / "(142.)"), rejoin hyphenated syllables ("Sân-tă Mă-ri-e" -> "Sântă Mărie").
 */
export function cleanIncipitText(text) {
  let t = clean(text);
  if (!t) return null;
  t = t.replace(/^\(?\s*\d{1,3}\s?[a-z]{1,2}?\s?[.,]\s?\)?\s*/, '');
  const words = t.split(' ');
  while (words.length > 1 && (!/\p{L}/u.test(words[0]) || /\d/.test(words[0]))) words.shift();
  t = words.join(' ').replace(/^[\W_]+/, '').replace(/[-_\s]+$/, '');
  t = t.replace(/([\p{L}&])\s*-\s*(\p{L})/gu, '$1$2').replace(/([\p{L}&])\s*-\s*(\p{L})/gu, '$1$2');
  t = t.replace(/_+/g, ' ').replace(/\s+/g, ' ').replace(/\s+([,!?.;:])/g, '$1').trim();
  return t.length >= 4 ? t : null;
}

/**
 * Keep the longest non-decreasing run of number tokens (by label order) across the ordered
 * entries; the others are OCR misreads (stanza numbers, text numbers) and are moved to
 * `numberTokenRejected`. Returns the number kept.
 */
export function keepMonotonicTokens(entries) {
  const idx = [];
  for (let i = 0; i < entries.length; i++) if (entries[i].numberToken) idx.push(i);
  const keys = idx.map((i) => labelKey(entries[i].numberToken));
  const n = keys.length;
  const len = new Array(n).fill(1);
  const prev = new Array(n).fill(-1);
  let bestEnd = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (keys[j] <= keys[i] && len[j] + 1 > len[i]) { len[i] = len[j] + 1; prev[i] = j; }
    }
    if (len[i] > len[bestEnd]) bestEnd = i;
  }
  const keep = new Set();
  for (let i = bestEnd; i >= 0; i = prev[i]) { keep.add(i); if (prev[i] < 0) break; }
  for (let k = 0; k < n; k++) {
    if (keep.has(k)) continue;
    const e = entries[idx[k]];
    e.numberTokenRejected = e.numberToken;
    e.numberToken = null;
  }
  return keep.size;
}
