// Global sequence alignment (Needleman-Wunsch) between the ordered list of printed
// melody labels and the ordered list of data lines found on the scanned pages.
//
// Both sequences are in the same (numeric) order; the OCR loses some data lines and
// misreads most melody numbers, so the alignment uses the village name printed on the
// data line, the village known for the label from an independent part of the volume,
// and the melody number token when the OCR did catch one.

/**
 * @param {Array} labels   [{label, number, letter, village|null}]
 * @param {Array} entries  [{village, numberToken|null}]
 * @param {Function} score (label, entry) -> number
 * @param {object} gaps    {label: penalty for a label without entry (number or function(label)), entry: penalty for an entry without label}
 * @returns {Array<{label: number|null, entry: number|null}>} pairs of indices in order
 */
export function align(labels, entries, score, gaps = { label: -1.2, entry: -4 }) {
  const n = labels.length;
  const m = entries.length;
  const gapLabel = typeof gaps.label === 'function' ? gaps.label : () => gaps.label;
  const H = new Array((n + 1) * (m + 1)).fill(0);
  const T = new Uint8Array((n + 1) * (m + 1)); // 1 diag, 2 up (label gap), 3 left (entry gap)
  const idx = (i, j) => i * (m + 1) + j;
  for (let i = 1; i <= n; i++) { H[idx(i, 0)] = H[idx(i - 1, 0)] + gapLabel(labels[i - 1]); T[idx(i, 0)] = 2; }
  for (let j = 1; j <= m; j++) { H[idx(0, j)] = j * gaps.entry; T[idx(0, j)] = 3; }
  for (let i = 1; i <= n; i++) {
    const gl = gapLabel(labels[i - 1]);
    for (let j = 1; j <= m; j++) {
      const diag = H[idx(i - 1, j - 1)] + score(labels[i - 1], entries[j - 1]);
      const up = H[idx(i - 1, j)] + gl;
      const left = H[idx(i, j - 1)] + gaps.entry;
      let best = diag;
      let t = 1;
      if (up > best) { best = up; t = 2; }
      if (left > best) { best = left; t = 3; }
      H[idx(i, j)] = best;
      T[idx(i, j)] = t;
    }
  }
  const pairs = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const t = T[idx(i, j)];
    if (t === 1) { pairs.push({ label: i - 1, entry: j - 1 }); i--; j--; }
    else if (t === 2) { pairs.push({ label: i - 1, entry: null }); i--; }
    else { pairs.push({ label: null, entry: j - 1 }); j--; }
  }
  pairs.reverse();
  return { pairs, score: H[idx(n, m)] };
}
