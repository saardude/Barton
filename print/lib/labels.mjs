// Evidence about which melody labels (number + variant letter) exist in a volume.
// The variant letters of a number are contiguous (a, b, c ... z, aa, bb ...), so the
// highest letter seen for a number tells how many variants it has. Sources differ in
// reliability: the Part Two references and the Notes headings are clean print, the bold
// numbers on the notation pages are badly OCRed, so a policy combines them.

import { clean, fold, letterOrdinal, ordinalLetter, labelKey } from './util.mjs';

/** "120." (OCR of 12o.), "621." (62l.), "2ly." (21y.), "8la." (81a.) -> {number, letter} or null. */
export function fixLabel(numStr, letter, maxNumber) {
  const n = numStr.replace(/[lI|]/g, '1').replace(/O/g, '0');
  let l = (letter || '').toLowerCase();
  if (!/^\d{1,3}$/.test(n)) return null;
  let number = parseInt(n, 10);
  if (number > maxNumber && !l && n.length >= 2) {
    const last = n[n.length - 1];
    if (last === '0') { l = 'o'; number = parseInt(n.slice(0, -1), 10); }
    else if (last === '1') { l = 'l'; number = parseInt(n.slice(0, -1), 10); }
  }
  if (number < 1 || number > maxNumber) return null;
  if (l.length === 2 && l[0] !== l[1]) return null;
  if (l.length > 2) return null;
  return { number, letter: l, label: `${number}${l}` };
}

export class LabelEvidence {
  /**
   * @param maxNumber highest melody number of the volume
   * @param policy {strong: [sources trusted as printed], weak: [OCR-noisy sources], weakSlack: letters a weak
   *   source may add above the strong maximum, weakMaxAlone: highest letter accepted from weak sources alone}
   */
  constructor(maxNumber, policy = {}) {
    this.maxNumber = maxNumber;
    this.policy = { strong: ['text-ref', 'notes'], weak: ['page-token'], weakSlack: 1, weakMaxAlone: 3, ...policy };
    this.bySource = new Map(); // number -> Map(source -> max ordinal)
    this.sources = new Map(); // label -> Set(source)
    this.villages = new Map(); // label -> Map(folded village -> {count, name})
  }

  bump(number, letter, source) {
    if (number < 1 || number > this.maxNumber) return;
    const k = letterOrdinal(letter);
    if (!this.bySource.has(number)) this.bySource.set(number, new Map());
    const m = this.bySource.get(number);
    m.set(source, Math.max(m.get(source) || 0, k));
    const label = `${number}${letter}`;
    if (!this.sources.has(label)) this.sources.set(label, new Set());
    this.sources.get(label).add(source);
  }

  village(number, letter, village) {
    const v = clean(village);
    if (!v) return;
    const label = `${number}${letter}`;
    if (!this.villages.has(label)) this.villages.set(label, new Map());
    const m = this.villages.get(label);
    const key = fold(v);
    const cur = m.get(key) || { count: 0, name: v };
    cur.count++;
    m.set(key, cur);
  }

  /** "12b.c." / "12i.m.n." headings and inline "Nos. 12f.g.h.j.k." lists. */
  addHeadingList(text, source) {
    const re = /(?<![\dA-Za-z.])([\dlIO]{1,3})\s?((?:[a-z]{1,2}\.)+|[a-z]{1,2}(?=[.,\s)]))/g;
    let m;
    const t = String(text);
    while ((m = re.exec(t))) {
      const letters = m[2].split('.').map((x) => x.trim()).filter(Boolean);
      for (const l of letters) {
        const f = fixLabel(m[1], l, this.maxNumber);
        if (f) this.bump(f.number, f.letter, source);
      }
    }
  }

  /** Highest variant ordinal for a number under the policy (0 = no variants). */
  maxFor(number) {
    const m = this.bySource.get(number);
    if (!m) return 0;
    const { strong, weak, weakSlack, weakMaxAlone } = this.policy;
    let max = 0;
    let hasStrong = false;
    for (const s of strong) if (m.has(s)) { hasStrong = true; max = Math.max(max, m.get(s)); }
    let wk = 0;
    for (const s of weak) if (m.has(s)) wk = Math.max(wk, m.get(s));
    if (hasStrong) { if (wk > max && wk <= max + weakSlack) max = wk; }
    else if (wk && wk <= weakMaxAlone) max = wk;
    return max;
  }

  build() {
    const labels = [];
    for (let n = 1; n <= this.maxNumber; n++) {
      const max = this.maxFor(n);
      const ks = max ? Array.from({ length: max }, (_, i) => i + 1) : [0];
      for (const k of ks) {
        const letter = ordinalLetter(k);
        const label = `${n}${letter}`;
        let village = null;
        const vm = this.villages.get(label) || (k === 1 ? this.villages.get(String(n)) : null);
        if (vm) {
          let best = null;
          for (const [, v] of vm) if (!best || v.count > best.count) best = v;
          village = best ? best.name : null;
        }
        const src = this.sources.get(label);
        labels.push({ label, number: n, letter, village, evidence: src ? [...src].sort().join('+') : 'letter-gap' });
      }
    }
    labels.sort((a, b) => labelKey(a) - labelKey(b));
    return labels;
  }
}

/** Notes-to-the-Melodies pages: headings at the start of a column line ("12b.c. *Change song."). */
export function addNotesEvidence(ev, notesPages, source = 'notes') {
  const HEAD = /^([\dlIO]{1,3})\s?((?:[a-z]{1,2}\.)+|[a-z]{1,2}\.)?(?:\s|$)/;
  for (const p of notesPages) {
    const half = p.width / 2;
    for (const line of p.lines) {
      const t = line.text;
      const m = t.match(HEAD);
      const atColumnStart = line.x < 420 || (line.x > half && line.x < half + 420);
      if (m && atColumnStart && line.h < 80) {
        const letters = m[2] ? m[2].split('.').map((x) => x.trim()).filter(Boolean) : [''];
        for (const l of letters) {
          const f = fixLabel(m[1], l, ev.maxNumber);
          if (f) ev.bump(f.number, f.letter, source);
        }
      }
    }
  }
}
