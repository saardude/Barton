// Generic crawl/parse driver. A site module exports:
//   name, host, kind ('pages' = one record per page, 'cards' = records are cards on listing pages),
//   seeds[], discover($, url) -> {records:[{url, context}], listings:[url]},
//   parseRecord(html, url, context) -> raw record (kind=pages),
//   parseListing(html, url, context) -> raw record[] (kind=cards),
//   robotsNote (optional string).
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { load } from 'cheerio';
import { PATHS, readJson, writeJson } from './util.js';
import { Fetcher } from './fetch.js';

export function rawDir(site) {
  return path.join(PATHS.raw, site.name);
}

/**
 * Breadth-first discovery from the seeds, then fetch every record page (kind=pages).
 * Writes raw/<site>/listings.json and raw/<site>/urls.json.
 */
export async function crawlSite(site, fetcher, { max = Infinity, forceListings = false, log = () => {} } = {}) {
  const dir = rawDir(site);
  await fs.mkdir(dir, { recursive: true });
  const listings = new Map(); // url -> {status, records:n}
  const records = new Map(); // url -> context
  const queue = [...site.seeds];
  let failedListings = 0;
  while (queue.length) {
    const url = queue.shift();
    if (listings.has(url)) continue;
    listings.set(url, { status: 0, records: 0 });
    const res = await fetcher.fetchText(url, { force: forceListings });
    listings.get(url).status = res.status;
    if (!res.ok || !res.html) {
      failedListings += 1;
      log(`listing failed ${res.status} ${url} ${res.error || ''}`);
      continue;
    }
    let found;
    try {
      found = site.discover(load(res.html), res.finalUrl || url);
    } catch (e) {
      log(`discover threw on ${url}: ${e.message}`);
      continue;
    }
    for (const r of found.records || []) {
      if (!records.has(r.url)) records.set(r.url, r.context || null);
    }
    listings.get(url).records = (found.records || []).length;
    for (const l of found.listings || []) if (!listings.has(l) && !queue.includes(l)) queue.push(l);
    log(`listing ${url}: ${(found.records || []).length} records, ${(found.listings || []).length} more listings; total ${records.size} records, ${queue.length} queued`);
  }
  const urls = [...records.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([url, context]) => ({ url, context }));
  await writeJson(path.join(dir, 'listings.json'), [...listings.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([url, v]) => ({ url, ...v })));
  await writeJson(path.join(dir, 'urls.json'), urls);
  let fetched = 0;
  let failed = 0;
  if (site.kind === 'pages') {
    const todo = urls.slice(0, Number.isFinite(max) ? max : urls.length);
    for (let i = 0; i < todo.length; i++) {
      const res = await fetcher.fetchText(todo[i].url);
      if (res.ok) fetched += 1;
      else failed += 1;
      if ((i + 1) % 100 === 0 || i === todo.length - 1) log(`records ${i + 1}/${todo.length} (ok ${fetched}, failed ${failed}, cache hits ${fetcher.stats.cached})`);
    }
  }
  return { listings: listings.size, failedListings, records: urls.length, fetched, failed };
}

/** Parse everything in the cache for a site into raw/<site>/records.json (offline). */
export async function parseSite(site, { log = () => {} } = {}) {
  const dir = rawDir(site);
  const fetcher = new Fetcher({ offline: true });
  const out = [];
  let missing = 0;
  let errors = 0;
  if (site.kind === 'pages') {
    const urls = await readJson(path.join(dir, 'urls.json'), []);
    for (const { url, context } of urls) {
      const res = await fetcher.fetchText(url);
      if (!res.ok) {
        missing += 1;
        continue;
      }
      try {
        const rec = site.parseRecord(res.html, res.finalUrl || url, context || {});
        if (rec) {
          rec.fetchedAt = res.fetchedAt || null;
          out.push(rec);
        }
      } catch (e) {
        errors += 1;
        log(`parseRecord threw on ${url}: ${e.message}`);
      }
    }
  } else {
    const listings = await readJson(path.join(dir, 'listings.json'), []);
    for (const { url } of listings) {
      const res = await fetcher.fetchText(url);
      if (!res.ok) {
        missing += 1;
        continue;
      }
      try {
        for (const rec of site.parseListing(res.html, res.finalUrl || url, {})) {
          rec.fetchedAt = res.fetchedAt || null;
          out.push(rec);
        }
      } catch (e) {
        errors += 1;
        log(`parseListing threw on ${url}: ${e.message}`);
      }
    }
  }
  // dedupe by siteRecordId, keep first
  const seen = new Set();
  const records = out.filter((r) => {
    const k = r.siteRecordId;
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  }).sort((a, b) => String(a.siteRecordId).localeCompare(String(b.siteRecordId)));
  await writeJson(path.join(dir, 'records.json'), records);
  return { parsed: records.length, duplicates: out.length - records.length, missing, errors };
}
