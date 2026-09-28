// Reader for the Internet Archive's <id>_djvu.xml (per-word OCR with coordinates),
// <id>_scandata.xml (leaf list) and <id>_page_numbers.json (printed page numbers).
//
// A "page" here is one <OBJECT> of the djvu.xml. Its 0-based index is exactly the
// BookReader page index used in https://archive.org/details/<id>/page/n<index>
// (verified against BookReaderJSIA for rumanianfolkmusi0004blab: 656 objects, 656
// reader pages, reader index k <-> leafNum k+1 because leaf 0, the colour card, is not
// in the access formats).

import { promises as fs } from 'node:fs';
import { decodeXml } from './util.mjs';

const WORD_RE = /<WORD coords="(\d+),(\d+),(\d+),(\d+)"(?: x-confidence="(\d+)")?>([^<]*)<\/WORD>/g;

/**
 * Parse djvu.xml into pages. Each page: {index, width, height, lines}. Each line:
 * {y (top of first word), x (left of first word), h (line height), text, conf, words}.
 * Lines are sorted by y then x, so reading order is restored even when the OCR
 * emitted columns/regions out of order.
 */
export async function readDjvuXml(file) {
  const xml = await fs.readFile(file, 'utf8');
  const pages = [];
  let pos = 0;
  let index = 0;
  for (;;) {
    const start = xml.indexOf('<OBJECT ', pos);
    if (start < 0) break;
    const end = xml.indexOf('</OBJECT>', start);
    const chunk = xml.slice(start, end < 0 ? xml.length : end);
    pos = end < 0 ? xml.length : end + 9;
    const head = chunk.slice(0, chunk.indexOf('>'));
    const width = parseInt((head.match(/width="(\d+)"/) || [])[1] || '0', 10);
    const height = parseInt((head.match(/height="(\d+)"/) || [])[1] || '0', 10);
    const lines = [];
    // <LINE> may carry attributes (x-struct="caption" / "header" / "textfloat"); split on the tag start.
    const lineChunks = chunk.split(/<LINE(?:\s[^>]*)?>/).slice(1);
    for (const lc of lineChunks) {
      const words = [];
      WORD_RE.lastIndex = 0;
      let m;
      while ((m = WORD_RE.exec(lc))) {
        const text = decodeXml(m[6]).trim();
        if (!text) continue;
        const x1 = +m[1];
        const yBottom = +m[2];
        const x2 = +m[3];
        const yTop = +m[4];
        words.push({ x1, x2, top: Math.min(yTop, yBottom), bottom: Math.max(yTop, yBottom), conf: m[5] ? +m[5] : null, text });
      }
      if (!words.length) continue;
      const top = Math.min(...words.map((w) => w.top));
      const bottom = Math.max(...words.map((w) => w.bottom));
      const confs = words.map((w) => w.conf).filter((c) => c !== null);
      lines.push({
        y: top,
        x: Math.min(...words.map((w) => w.x1)),
        h: bottom - top,
        text: words.map((w) => w.text).join(' '),
        conf: confs.length ? Math.round(confs.reduce((a, b) => a + b, 0) / confs.length) : null,
        words
      });
    }
    lines.sort((a, b) => a.y - b.y || a.x - b.x);
    pages.push({ index, width, height, lines });
    index++;
  }
  return pages;
}

/** scandata.xml -> array of leafNum (in order) for leaves that are in the access formats. */
export async function readAccessLeaves(file) {
  const xml = await fs.readFile(file, 'utf8');
  const leaves = [];
  const re = /<page leafNum="(\d+)">([\s\S]*?)<\/page>/g;
  let m;
  while ((m = re.exec(xml))) {
    const body = m[2];
    const access = /<addToAccessFormats>\s*true\s*<\/addToAccessFormats>/i.test(body);
    if (access) leaves.push({ leafNum: +m[1], pageType: (body.match(/<pageType>([^<]*)<\/pageType>/) || [])[1] || null });
  }
  return leaves;
}

/** page_numbers.json -> Map leafNum -> printed page number (string), only confident ones. */
export async function readPageNumbers(file) {
  const doc = JSON.parse(await fs.readFile(file, 'utf8'));
  const map = new Map();
  for (const p of doc.pages || []) {
    if (p.pageNumber && String(p.pageNumber).trim()) map.set(p.leafNum, String(p.pageNumber).trim());
  }
  return map;
}

/**
 * Build the page -> {leafNum, printedPage, url} lookup for an item.
 * Falls back to leafNum = index + 1 when the scandata leaf count does not match.
 */
export function pageLocator(itemId, pageCount, accessLeaves, pageNumbers) {
  const usable = accessLeaves.length === pageCount;
  return (index) => {
    const leafNum = usable ? accessLeaves[index].leafNum : index + 1;
    return {
      leafNum,
      printedPage: pageNumbers.get(leafNum) || null,
      url: `https://archive.org/details/${itemId}/page/n${index}`
    };
  };
}
