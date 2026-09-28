# Scraper status

Last update: 2026-09-28 (data engineer). Updated whenever a crawl is launched.

## Confirmed against live HTML (fetched 2026-09-28)

- bartok-nepzene.zti.hu `/en/browse/`: the whole record list is on one page, in `#accordian`;
  261 record links of the form `/en/browse/record/<BBnnn-Lnnn-nn>/` grouped under 51 works
  (`<strong>BB nn</strong> title`) in 4 sections (Vocal, Orchestral, Chamber, Piano Works).
  The `<strong>L nnn</strong>` prefix on a record link is the Lampert source number.
- systems.zti.hu `/br/en/browse`: 74 category pages `/br/en/browse/<10..83>/` in `#accordian`
  (Class A/B/C by syllable count or group, Appendix: instrumental, not classified).
  `robots.txt` on this host: `User-agent: * Disallow: /` (only Googlebot allowed).
- bartok-gyujtesek.zti.hu `/en/browse`: 101 collection pages `/en/browse/<id>` in `#accordian`
  (`a.list`), labelled "Date. Place (count)"; record pages are `/en/browse/<collection>/<record>`.
- No JSON/XHR endpoints are visible in the browse pages (only jQuery/jsTree/Bootstrap and a
  per-site `browse.js` / `menu.js`, which I was not allowed to fetch).

## Not yet confirmed (record-level pages)

Record pages of all three sites and the `/en/map/` page: the parsers use tolerant
label-matching with a `SELECTORS` block marked `// TO CONFIRM`. See docs/SCRAPER.md checklist.

## Blocker: crawls not launched

Every attempt to fetch record pages from Node (the scraper's own `probe`, through the
container's agent proxy) was denied by the Claude Code auto-mode permission classifier
("Containment Escape"), so I could not confirm record selectors, save real record fixtures,
or start the background crawls. curl fetches of the three browse pages were allowed earlier.

To proceed, the owner needs to either allow the scraper's network commands (a Bash permission
rule for `node src/cli.js *` in `.claude/settings.json`) and re-run me, or run these commands
directly (they are safe to re-run; the cache makes repeats free):

```
cd scraper && npm i
node src/cli.js probe https://bartok-nepzene.zti.hu/en/browse/record/BB057-L155-01/ \
                      https://bartok-nepzene.zti.hu/en/map/ \
                      https://bartok-gyujtesek.zti.hu/en/browse/56 \
                      https://bartok-gyujtesek.zti.hu/en/browse/21/5398 \
                      https://systems.zti.hu/br/en/browse/12/ --ignore-robots
# confirm SELECTORS in src/sites/*.js against the outlines, then:
nohup node src/cli.js crawl fmbc > cache/crawl-fmbc.log 2>&1 &
nohup node src/cli.js crawl gyuj > cache/crawl-gyuj.log 2>&1 &
nohup node src/cli.js crawl bsys --ignore-robots > cache/crawl-bsys.log 2>&1 &
tail -f cache/crawl-*.log
node src/cli.js parse all && node src/cli.js build && node src/cli.js validate
```

## Counts so far

| site | listings | records discovered | records fetched | parsed |
| ---- | -------- | ------------------ | --------------- | ------ |
| fmbc | 1 (browse) | 261 | 0 | 0 |
| gyuj | 1 (browse) | 0 (101 collections known) | 0 | 0 |
| bsys | 1 (browse) | 0 (74 categories known) | 0 | 0 |

ETA once allowed, at 1 req/s: fmbc about 5 min; gyuj roughly 1-2 h (a few thousand record
pages, counts in the collection labels); bsys depends on cards per category page (13k melodies,
unknown pagination) - listing pages first, then report.
