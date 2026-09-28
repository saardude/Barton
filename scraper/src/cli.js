#!/usr/bin/env node
// CLI: probe <url> | crawl <site> | parse <site> | build | validate [file]
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Fetcher, cachePathFor } from './fetch.js';
import { outline } from './sites/common.js';
import { PATHS } from './util.js';

const SITES = ['fmbc', 'bsys', 'gyuj'];

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
  node src/cli.js probe <url> [--force]           fetch one page into the cache and print a DOM outline
  node src/cli.js crawl <site|all> [--max N] [--offline] [--force-listings] [--ignore-robots]
                                                  discover and fetch record pages (site: ${SITES.join('|')})
                                                  --ignore-robots: do not enforce robots.txt (needed for systems.zti.hu)
  node src/cli.js parse <site|all>                parse cached pages into raw/<site>/records.json
  node src/cli.js gazetteer                       merge site-printed places/coordinates (fmbc) into data/gazetteer.json
  node src/cli.js build                           normalise, merge, write data/songs.json, places.json, facets.json
  node src/cli.js validate [songs.json]           validate data files against data/schema/*.schema.json
`);
}

async function loadSite(name) {
  if (!SITES.includes(name)) throw new Error(`unknown site "${name}" (expected ${SITES.join('|')})`);
  const mod = await import(`./sites/${name === 'gyuj' ? 'gyujtesek' : name}.js`);
  return mod.default || mod;
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
  let code = 0;
  for (const url of urls) {
    const res = await fetcher.fetchText(url, { force: !!args.flags.force });
    if (!res.ok) {
      console.error(`probe failed: HTTP ${res.status} ${url} ${res.error || ''}`);
      code = 2;
      continue;
    }
    const p = cachePathFor(url, fetcher.cacheDir);
    console.log(`\n==== fetched ${res.fromCache ? '(cache)' : '(live)'} ${url} -> ${path.relative(PATHS.scraper, p.html)} (${res.html.length} bytes)`);
    console.log(outline(res.html, res.finalUrl || url));
  }
  return code;
}

async function cmdCrawl(args) {
  const which = args._[1] === 'all' || !args._[1] ? SITES : [args._[1]];
  const { crawlSite } = await import('./crawl.js');
  const log = makeLogger();
  const ignoreRobots = !!args.flags['ignore-robots'];
  if (ignoreRobots) log('WARNING: --ignore-robots set: robots.txt rules are NOT enforced (owner decision, see docs/SCRAPER.md). Rate limit stays at 1 req/s.');
  const fetcher = new Fetcher({ log, offline: !!args.flags.offline, respectRobots: !ignoreRobots });
  for (const name of which) {
    const site = await loadSite(name);
    const summary = await crawlSite(site, fetcher, { max: args.flags.max ? parseInt(args.flags.max, 10) : Infinity, forceListings: !!args.flags['force-listings'], log });
    console.log(JSON.stringify({ site: name, ...summary }));
  }
  console.log(JSON.stringify({ fetcher: fetcher.stats }));
  return 0;
}

async function cmdParse(args) {
  const which = args._[1] === 'all' || !args._[1] ? SITES : [args._[1]];
  const { parseSite } = await import('./crawl.js');
  const log = makeLogger();
  for (const name of which) {
    const site = await loadSite(name);
    const summary = await parseSite(site, { log });
    console.log(JSON.stringify({ site: name, ...summary }));
  }
  return 0;
}

async function cmdGazetteer() {
  const { extendGazetteer } = await import('./gazetteer-extend.js');
  console.log(JSON.stringify(await extendGazetteer({ log: makeLogger() })));
  return 0;
}

async function cmdBuild() {
  const { build } = await import('./build.js');
  const summary = await build({ log: makeLogger() });
  console.log(JSON.stringify(summary, null, 2));
  return 0;
}

async function cmdValidate(args) {
  const { validateFiles } = await import('./validate.js');
  const songsFile = args._[1] ? path.resolve(args._[1]) : path.join(PATHS.data, 'songs.json');
  const result = await validateFiles({ songsFile });
  for (const r of result.reports) {
    console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${path.relative(PATHS.repo, r.file)}: ${r.count} item(s), ${r.errors.length} error(s)`);
    for (const e of r.errors.slice(0, 20)) console.log(`     ${e}`);
    if (r.errors.length > 20) console.log(`     ... ${r.errors.length - 20} more`);
  }
  return result.ok ? 0 : 1;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  try {
    let code;
    switch (cmd) {
      case 'probe': code = await cmdProbe(args); break;
      case 'crawl': code = await cmdCrawl(args); break;
      case 'parse': code = await cmdParse(args); break;
      case 'gazetteer': code = await cmdGazetteer(args); break;
      case 'build': code = await cmdBuild(args); break;
      case 'validate': code = await cmdValidate(args); break;
      default: usage(); code = cmd ? 2 : 0;
    }
    process.exitCode = code;
  } catch (e) {
    console.error(`error: ${e && e.stack ? e.stack : e}`);
    process.exitCode = 1;
  }
}

await fs.mkdir(PATHS.cache, { recursive: true });
main();
