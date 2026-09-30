// Parse every cached record page (from raw/afs/urls.json) plus the ancillary pages into
// raw/afs/records.json, songbooks.json and articles.json. Offline: reads the cache only.
import path from 'node:path';
import { Fetcher } from './fetch.js';
import { PATHS, readJson, writeJson } from './util.js';
import { rawDir } from './crawl.js';

export async function parseAll(site, log = () => {}) {
  const dir = rawDir(site);
  const urls = await readJson(path.join(dir, 'urls.json'), []);
  const fetcher = new Fetcher({ offline: true, log });
  const records = [];
  let missing = 0;
  let failed = 0;
  const warningCounts = {};
  for (const { url, context } of urls) {
    const res = await fetcher.readCache(url);
    if (!res) {
      missing += 1;
      continue;
    }
    if (res.status && res.status >= 400) {
      failed += 1;
      continue;
    }
    try {
      const rec = site.parseRecord(res.html, res.finalUrl || url, { ...(context || {}), fetchedAt: res.fetchedAt });
      for (const w of rec.warnings) {
        const key = w.replace(/:.*$/, '');
        warningCounts[key] = (warningCounts[key] || 0) + 1;
      }
      records.push(rec);
    } catch (e) {
      failed += 1;
      log(`parse threw on ${url}: ${e.message}`);
    }
  }
  records.sort((a, b) => a.url.localeCompare(b.url));
  await writeJson(path.join(dir, 'records.json'), records);

  const aux = {};
  const sb = await fetcher.readCache(site.auxPages.songbooks);
  if (sb) {
    aux.songbooks = site.parseSongbooks(sb.html, site.auxPages.songbooks);
    await writeJson(path.join(dir, 'songbooks.json'), aux.songbooks);
  }
  const ar = await fetcher.readCache(site.auxPages.articles);
  if (ar) {
    aux.articles = site.parseArticles(ar.html, site.auxPages.articles);
    await writeJson(path.join(dir, 'articles.json'), aux.articles);
  }
  const summary = { records: records.length, missing, failed, warnings: warningCounts, songbooks: aux.songbooks ? aux.songbooks.length : 0, articles: aux.articles ? aux.articles.length : 0 };
  log(`parsed ${records.length} records (${missing} not cached, ${failed} failed)`);
  return summary;
}

export { PATHS };
