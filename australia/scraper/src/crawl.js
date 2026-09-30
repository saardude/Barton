// Crawl driver: fetch songs.html, discover every record page, fetch each one (1 req/s,
// cached), then the ancillary pages. Writes raw/afs/urls.json and raw/afs/crawl.json.
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { load } from 'cheerio';
import { PATHS, writeJson } from './util.js';

export function rawDir(site) {
  return path.join(PATHS.raw, site.name);
}

export async function crawlSite(site, fetcher, { max = Infinity, forceListings = false, probeGaps = false, log = () => {} } = {}) {
  const dir = rawDir(site);
  await fs.mkdir(dir, { recursive: true });
  const records = new Map();
  for (const seed of site.seeds) {
    const res = await fetcher.fetchText(seed, { force: forceListings });
    if (!res.ok || !res.html) {
      log(`listing failed ${res.status} ${seed} ${res.error || ''}`);
      continue;
    }
    const found = site.discover(load(res.html), res.finalUrl || seed);
    for (const r of found.records) if (!records.has(r.url)) records.set(r.url, r.context);
    log(`listing ${seed}: ${found.records.length} records`);
  }
  const urls = [...records.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([url, context]) => ({ url, context }));
  await writeJson(path.join(dir, 'urls.json'), urls);

  let fetched = 0;
  let failed = 0;
  const failures = [];
  const todo = urls.slice(0, Number.isFinite(max) ? max : urls.length);
  for (let i = 0; i < todo.length; i++) {
    const res = await fetcher.fetchText(todo[i].url);
    if (res.ok) fetched += 1;
    else {
      failed += 1;
      failures.push({ url: todo[i].url, status: res.status, error: res.error || null });
    }
    if ((i + 1) % 50 === 0 || i + 1 === todo.length) log(`records ${i + 1}/${todo.length} (live ${fetcher.stats.live}, cached ${fetcher.stats.cached}, failed ${fetcher.stats.failed})`);
  }

  // Unlisted page numbers: the home page counts more songs than songs.html links. Probe
  // the gaps so the status report can say which numbers exist but are not listed.
  const gaps = [];
  if (probeGaps) {
    const listed = new Set(urls.map((u) => (u.url.match(/\/(\d+)[a-z]?\.html$/) || [])[1]).filter(Boolean).map(Number));
    const maxN = Math.max(...listed);
    for (let n = 1; n <= maxN; n++) {
      if (listed.has(n)) continue;
      const url = `${site.host}/${String(n).padStart(3, '0')}.html`;
      const res = await fetcher.fetchText(url);
      gaps.push({ n, url, status: res.status, exists: !!res.ok });
    }
    log(`probed ${gaps.length} unlisted numbers; ${gaps.filter((g) => g.exists).length} exist`);
  }

  const aux = {};
  for (const [key, url] of Object.entries(site.auxPages || {})) {
    const res = await fetcher.fetchText(url, { force: forceListings });
    aux[key] = { url, status: res.status, ok: !!res.ok };
  }
  const summary = { records: urls.length, fetched, failed, failures, gaps, aux, stats: fetcher.stats, finishedAt: new Date().toISOString() };
  await writeJson(path.join(dir, 'crawl.json'), summary);
  return summary;
}
