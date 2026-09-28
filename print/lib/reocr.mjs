// Merge locally re-OCRed pages (print/reocr.py -> print/raw/reocr/<id>/<k>.json) into the
// djvu.xml page lines. The Archive's OCR drops whole lines between staves; the local pass
// (RapidOCR on the PDF page) is used only to fill those gaps: a re-OCR line is added when
// the Archive has no line of the same kind at that position, never to replace one.

import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function loadReocr(dir, pageIndexes) {
  const map = new Map();
  for (const k of pageIndexes) {
    try {
      const doc = JSON.parse(await fs.readFile(path.join(dir, `${k}.json`), 'utf8'));
      map.set(k, doc);
    } catch { /* page not re-OCRed */ }
  }
  return map;
}

function toLine(l, sx, sy, engine) {
  const text = l.text.replace(/\s+/g, ' ').trim();
  return {
    y: Math.round(l.y * sy), x: Math.round(l.x * sx), h: Math.round(l.h * sy),
    text, conf: Math.round((l.score || 0) * 100),
    words: text.split(' ').map((t) => ({ text: t })),
    source: 're-ocr', engine
  };
}

/**
 * @param pages   djvu pages (mutated: lines added and re-sorted)
 * @param reocr   Map(page index -> reocr document)
 * @param vol     volume module (parseDataLine, NUMBER_TOKEN, looksLikeIncipit)
 * @param tokenX  max x of a melody-number token for this volume
 * @returns {added: {data, token, incipit}, pages}
 */
export function mergeReocr(pages, reocr, vol, tokenX) {
  const added = { data: 0, token: 0, incipit: 0, pages: 0 };
  for (const page of pages) {
    const doc = reocr.get(page.index);
    if (!doc) continue;
    added.pages++;
    const sx = doc.djvuWidth ? page.width / doc.djvuWidth : 1;
    const sy = doc.djvuHeight ? page.height / doc.djvuHeight : 1;
    const isData = (l) => !!vol.parseDataLine(l.text);
    const isToken = (l) => { const m = l.text.match(vol.NUMBER_TOKEN); return !!m && l.x < tokenX && l.words[0].text.length <= 6 && l.h >= 30; };
    const djvuData = page.lines.filter(isData);
    const djvuTokens = page.lines.filter(isToken);
    const near = (list, y, dy) => list.some((l) => Math.abs(l.y - y) <= dy);
    const extra = [];
    for (const raw of doc.lines || []) {
      if ((raw.score || 0) < 0.5) continue;
      const line = toLine(raw, sx, sy, doc.engine);
      if (isData(line)) {
        if (!near(djvuData, line.y, 150)) { extra.push(line); added.data++; }
      } else if (isToken(line)) {
        if (!near(djvuTokens, line.y, 110)) { extra.push(line); added.token++; }
      } else if (vol.looksLikeIncipit(line)) {
        if (!near(page.lines, line.y, 60)) { extra.push(line); added.incipit++; }
      }
    }
    if (extra.length) {
      page.lines.push(...extra);
      page.lines.sort((a, b) => a.y - b.y || a.x - b.x);
    }
  }
  return added;
}
