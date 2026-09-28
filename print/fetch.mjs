#!/usr/bin/env node
// print/fetch.mjs - download the Internet Archive OCR files for the open
// "Rumanian Folk Music" volumes into print/raw/ (git-ignored).
//
// Only items that are NOT access-restricted are listed here. Volumes 1 and 2
// (rumanianfolkmusi0001bela, rumanianfolkmusi0002bela) are lending-library
// items and are deliberately absent: they are "not available as open text".
//
// Usage: node print/fetch.mjs [--force] [--pdf]   (--pdf also downloads the item PDF, ~30 MB / 13 MB, for print/reocr.py)
// Behind an HTTPS_PROXY (e.g. this cloud container) run it as
//   NODE_USE_ENV_PROXY=1 node print/fetch.mjs
// because Node's built-in fetch ignores the proxy variables by default.
// Politeness: at most one request per second, project User-Agent, skips files
// that are already on disk unless --force is given.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const RAW_DIR = path.join(HERE, 'raw');

export const USER_AGENT =
  'BartokRomaniaViewer/0.1 (+https://github.com/maltandbrew/Barton; research index of Bartok RFM scans on archive.org; 1 req/s; contact tsaar@maltandbrew.com)';

/** Open (non-restricted) Internet Archive items, one per printed volume. */
export const ITEMS = [
  { id: 'rumanianfolkmusi0004blab', volume: 4, roman: 'IV', title: 'Carols and Christmas Songs (Colinde)', year: 1975 },
  { id: 'rumanianfolkmusi0005blab', volume: 5, roman: 'V', title: 'Maramures County', year: 1975 },
];

/** Per-item files we need. The PDF and page images are not downloaded. */
const SUFFIXES = ['_djvu.txt', '_djvu.xml', '_scandata.xml', '_page_numbers.json'];

const MIN_INTERVAL_MS = 1000;
let lastRequest = 0;

async function politeFetch(url) {
  const wait = lastRequest + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequest = Date.now();
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT }, redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res;
}

async function checkOpen(item) {
  const res = await politeFetch(`https://archive.org/metadata/${item.id}`);
  const meta = await res.json();
  const restricted = meta?.metadata?.['access-restricted-item'];
  if (restricted && String(restricted) !== 'false') {
    throw new Error(`${item.id} is access-restricted; refusing to download`);
  }
  const names = new Set((meta.files || []).map((f) => f.name));
  return { names, metadata: meta.metadata };
}

async function main() {
  const force = process.argv.includes('--force');
  const wantPdf = process.argv.includes('--pdf');
  await fs.mkdir(RAW_DIR, { recursive: true });
  for (const item of ITEMS) {
    const { names, metadata } = await checkOpen(item);
    await fs.writeFile(path.join(RAW_DIR, `${item.id}_meta.json`), JSON.stringify(metadata, null, 2) + '\n');
    for (const suffix of wantPdf ? [...SUFFIXES, '.pdf'] : SUFFIXES) {
      const name = `${item.id}${suffix}`;
      const dest = path.join(RAW_DIR, name);
      if (!names.has(name)) { console.log(`skip ${name}: not in item`); continue; }
      if (!force) {
        try { const st = await fs.stat(dest); if (st.size > 0) { console.log(`have ${name} (${st.size} bytes)`); continue; } } catch { /* download */ }
      }
      // /download/ redirects to a datanode; when that node answers 5xx (seen for
      // rumanianfolkmusi0004blab on 2026-09-28) the /cors/ endpoint serves the same file.
      const urls = [`https://archive.org/download/${item.id}/${name}`, `https://archive.org/cors/${item.id}/${name}`];
      let buf = null;
      for (const url of urls) {
        console.log(`GET  ${url}`);
        try {
          const res = await politeFetch(url);
          buf = Buffer.from(await res.arrayBuffer());
          break;
        } catch (e) {
          console.log(`     ${e.message}`);
        }
      }
      if (!buf) throw new Error(`could not download ${name}`);
      await fs.writeFile(dest, buf);
      console.log(`     ${buf.length} bytes -> ${path.relative(process.cwd(), dest)}`);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
