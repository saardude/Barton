# geo: borders, villages and journeys

Historical-GIS side of the Barton viewer. Own `package.json` (mapshaper and shapefile as
local dev dependencies); nothing here touches `scraper/` or `data/songs.json`.

```
cd geo && npm i                     # once
node build.mjs                      # geo/raw -> data/geo/borders-{1910,1914,1920,now}.json
node enrich-wikidata.mjs            # data/gazetteer.json (+ data/places.json) -> data/villages.json
node parse-gyuj-collections.mjs     # bartok-gyujtesek.zti.hu trip index -> data/collections-gyuj.json
node fill-gazetteer.mjs             # curated stops / JOURNEY-SOURCES section 6 -> new data/gazetteer.json entries (Wikidata coordinates)
node derive-journeys.mjs            # collections + journeys-curated + songs + gazetteer -> data/journeys.json
node build.mjs --check              # verify the four layers exist, are < 500 KB and carry the required properties
```

Specs: `docs/JOURNEY-SPEC.md` (algorithm and file contracts), `docs/GEO-SOURCES.md`
(every dataset with URL, licence, size and the attribution text the app must show).

## Layout

```
geo/
  build.mjs             border layer pipeline (mapshaper + property mapping)
  enrich-wikidata.mjs   Wikidata SPARQL enrichment, 1 request/s, cached
  parse-gyuj-collections.mjs  trip index parser (labels verbatim, dates, places)
  fill-gazetteer.mjs    adds missing Romanian villages to the gazetteer from Wikidata (confidence high/medium/low, unresolved listed)
  derive-journeys.mjs   journeys: index entries with records attached + date-gap fallback
  raw/                  downloads, exactly as fetched (see below)
  cache/wikidata/       SPARQL responses keyed by query hash (git-ignored)
  cache/gyuj/, cache/irasai/  cached pages of the trip index and the Writings REST API (git-ignored)
  .build-tmp/           mapshaper intermediates (git-ignored)
data/geo/               web-ready GeoJSON (committed, < 500 KB each)
data/villages.json      village status and names (committed)
data/collections-gyuj.json  the 101 index entries, parsed (committed)
data/journeys.json      trips (committed; regenerate after every scrape)
data/context-events.json hand-curated context layer (committed)
```

## Raw downloads (all git-ignored)

The repository `.gitignore` excludes `geo/raw/` and `geo/cache/` entirely, so a clean
checkout has no raw data: run the re-download block below before `build.mjs`. The
web-ready outputs under `data/geo/` are committed, so the app never needs the raw files.

| Path | Size | Used by |
| --- | --- | --- |
| `raw/historical-basemaps/world_{1900,1914,1920,1930,1938,1945,1994,2000}.geojson` | 1.3-2.0 MB each | build.mjs (1914, 1920) |
| `raw/historical-basemaps-index.json` | small | reference (years available) |
| `raw/gistory/1_MO-HOR_Shp_EPSG3857/MO_Megye.*` (63 Hungarian counties 1910) | 3.7 MB | build.mjs |
| `raw/gistory/1_MO-HOR_Shp_EPSG3857/HR_Megye.*` (8 Croatian-Slavonian counties 1910) | 0.6 MB | build.mjs |
| `raw/gistory/1_MO-HOR_Shp_EPSG3857/MOTel_KP.*` (12,541 settlement centre points 1910) | 13.7 MB | name lookups only |
| `raw/gistory/3_OMM_Shp_EPSG3857/Region.*`, `District.*` (Austrian crown lands and districts) | 1.1 MB | not used yet |
| `raw/natural-earth/ne_10m_admin_0_countries.zip` (+ extracted) | 4.9 MB zip, 9.7 MB extracted | build.mjs |
| `raw/natural-earth/ne_10m_admin_1_states_provinces.zip` (+ extracted) | 14.9 MB zip, 36 MB extracted | build.mjs |

Re-download:

```
cd geo/raw
# Natural Earth 10m (public domain)
mkdir -p natural-earth && cd natural-earth
curl -L -o ne_10m_admin_0_countries.zip https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_0_countries.zip
curl -L -o ne_10m_admin_1_states_provinces.zip https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_1_states_provinces.zip
python3 -c "import zipfile;[zipfile.ZipFile(f).extractall(f[:-4]) for f in ('ne_10m_admin_0_countries.zip','ne_10m_admin_1_states_provinces.zip')]"
cd ..
# GISta Hungarorum 1910 (CC BY-NC): counties (needed by build.mjs) and settlement points (name lookups only)
mkdir -p gistory/1_MO-HOR_Shp_EPSG3857 gistory/3_OMM_Shp_EPSG3857
B=https://www.gistory.hu/docs/1_MO-HOR_Shp/1_MO-HOR_Shp_EPSG3857
for f in MO_Megye.shp MO_Megye.dbf MO_Megye.shx MO_Megye.cpg HR_Megye.shp HR_Megye.dbf HR_Megye.shx HR_Megye.cpg ShpEPSG3857.ini Export.log; do curl -L -o gistory/1_MO-HOR_Shp_EPSG3857/$f $B/$f; sleep 1; done
for f in MOTel_KP.shp MOTel_KP.dbf MOTel_KP.shx MOTel_KP.cpg; do curl -L -o gistory/1_MO-HOR_Shp_EPSG3857/$f $B/$f; sleep 1; done
B2=https://www.gistory.hu/docs/3_OMM_Shp/3_OMM_Shp_EPSG3857
for f in Region.shp Region.dbf Region.shx Region.cpg District.shp District.dbf District.shx District.cpg; do curl -L -o gistory/3_OMM_Shp_EPSG3857/$f $B2/$f; sleep 1; done
# historical-basemaps (GPL-3.0), one file per year, plus the index of available years
mkdir -p historical-basemaps
curl -L -o historical-basemaps-index.json https://raw.githubusercontent.com/aourednik/historical-basemaps/master/index.json
for y in 1900 1914 1920 1930 1938 1945 1994 2000; do curl -L -o historical-basemaps/world_$y.geojson https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_$y.geojson; done
```

The GISta shapefiles ship without `.prj`; the folder name and `ShpEPSG3857.ini` say
EPSG:3857 (WGS 84 Pseudo-Mercator), which `build.mjs` passes to mapshaper as
`-proj from=EPSG:3857 crs=wgs84`. A spot check after reprojection: the Bihar county
polygon covers Beius (22.35 E, 46.65 N).

## Network notes

- Wikidata SPARQL: `https://query.wikidata.org/sparql`, one request per second, custom
  `User-Agent`, responses cached under `cache/wikidata/<sha1 of query>.json`. Failed
  requests are not cached; re-run to retry. Node's built-in `fetch` ignores `HTTPS_PROXY`,
  so the script re-executes itself with `NODE_USE_ENV_PROXY=1` when a proxy is configured.
- gistory.hu serves plain directory listings; there is no archive to download, each
  shapefile component is fetched separately.
