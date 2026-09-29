#!/usr/bin/env node
// CLI: probe <url> | crawl | parse | build | validate [file]
import path from 'node:path';
import { Fetcher, cachePathFor } from './fetch.js';
import { PATHS } from './util.js';
import site from './site.js';

function parseArgs(argv) {
  const args = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) args.flags[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) args.flags[k] = argv[++i];
      else args.flags[k] = true;
    } else args._.push(a);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node src/cli.js probe <url> [--force]      fetch one page into the cache and print its parsed record
  node src/cli.js crawl [--max N] [--offline] [--force-listings] [--probe-gaps]
                                             discover record pages from songs.html and fetch them (1 req/s, cached)
  node src/cli.js parse                      parse cached pages into raw/afs/records.json (+ songbooks, articles)
  node src/cli.js build                      normalise and write ../data/songs.json, places.json, facets.json, sources.json
  node src/cli.js validate [file]            validate data files against ../data/schema/*.schema.json
`);
}

function makeLogger() {
  return (msg) => console.error(`[${new Date().toISOString()}] ${msg}`);
}

async function cmdProbe(args) {
  const urls = args._.slice(1);
  if (!urls.length) {
    usage();
    return 2;
  }
  const fetcher = new Fetcher({ log: makeLogger() });
  for (const url of urls) {
    const res = await fetcher.fetchText(url, { force: !!args.flags.force });
    if (!res.ok) {
      console.error(`probe failed: HTTP ${res.status} ${url} ${res.error || ''}`);
      return 2;
    }
    const p = cachePathFor(url, fetcher.cacheDir);
    console.error(`fetched ${res.fromCache ? '(cache)' : '(live)'} ${url} -> ${path.relative(PATHS.scraper, p.html)} (${res.html.length} bytes)`);
    console.log(JSON.stringify(site.parseRecord(res.html, res.finalUrl || url, { fetchedAt: res.fetchedAt }), null, 2));
  }
  return 0;
}

async function cmdCrawl(args) {
  const { crawlSite } = await import('./crawl.js');
  const log = makeLogger();
  const fetcher = new Fetcher({ log, offline: !!args.flags.offline });
  const summary = await crawlSite(site, fetcher, {
    max: args.flags.max ? parseInt(args.flags.max, 10) : Infinity,
    forceListings: !!args.flags['force-listings'],
    probeGaps: !!args.flags['probe-gaps'],
    log
  });
  console.log(JSON.stringify({ site: site.name, records: summary.records, fetched: summary.fetched, failed: summary.failed, gapsExisting: summary.gaps.filter((g) => g.exists).length, aux: summary.aux }));
  return summary.failed ? 1 : 0;
}

async function cmdParse() {
  const { parseAll } = await import('./parse.js');
  const summary = await parseAll(site, makeLogger());
  console.log(JSON.stringify(summary));
  return 0;
}

async function cmdBuild() {
  const { build } = await import('./build.js');
  const summary = await build(makeLogger());
  console.log(JSON.stringify(summary));
  return 0;
}

async function cmdValidate(args) {
  const { validateAll } = await import('./validate.js');
  const ok = await validateAll(args._[1] || null, makeLogger());
  return ok ? 0 : 1;
}

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0];
const handlers = { probe: cmdProbe, crawl: cmdCrawl, parse: cmdParse, build: cmdBuild, validate: cmdValidate };
if (!cmd || !handlers[cmd]) {
  usage();
  process.exit(cmd ? 2 : 0);
}
handlers[cmd](args).then(
  (code) => process.exit(code || 0),
  (e) => {
    console.error(e && e.stack ? e.stack : String(e));
    process.exit(1);
  }
);
