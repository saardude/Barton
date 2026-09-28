# geo: borders, villages and journeys

Historical-GIS side of the Barton viewer. Own `package.json` (mapshaper and shapefile as
local dev dependencies); nothing here touches `scraper/` or `data/songs.json`.

```
cd geo && npm i                     # once
node build.mjs                      # geo/raw -> data/geo/borders-{1910,1914,1920,now}.json
node enrich-wikidata.mjs            # data/gazetteer.json (+ data/places.json) -> data/villages.json
node derive-journeys.mjs            # data/songs.json -> data/journeys.json
node build.mjs --check              # verify the four layers exist, are < 500 KB and carry the required properties
```

Specs: `docs/JOURNEY-SPEC.md` (algorithm and file contracts), `docs/GEO-SOURCES.md`
(every dataset with URL, licence, size and the attribution text the app must show).

## Layout

```
geo/
  build.mjs             border layer pipeline (mapshaper + property mapping)
  enrich-wikidata.mjs   Wikidata SPARQL enrichment, 1 request/s, cached
  derive-journeys.mjs   trip derivation (pure function + CLI)
  raw/                  downloads, exactly as fetched (see below)
  cache/wikidata/       SPARQL responses keyed by query hash (git-ignored)
  .build-tmp/           mapshaper intermediates (git-ignored)
data/geo/               web-ready GeoJSON (committed, < 500 KB each)
data/villages.json      village status and names (committed)
data/journeys.json      trips (committed once songs.json exists)
data/context-events.json hand-curated context layer (committed)
```

## Raw downloads and what is git-ignored

Files over 5 MB are git-ignored (rule in the repository `.gitignore`); everything else in
`geo/raw/` is committed so `build.mjs` runs from a clean checkout for the 1910/1914/1920
layers. Re-download the ignored files with the commands below before running
`build.mjs` for `borders-now.json`.

| Path | Size | In git |
| --- | --- | --- |
| `raw/historical-basemaps/world_{1900,1914,1920,1930,1938,1945,1994,2000}.geojson` | 1.3-2.0 MB each | yes |
| `raw/historical-basemaps-index.json` | small | yes |
| `raw/gistory/1_MO-HOR_Shp_EPSG3857/MO_Megye.*` (63 Hungarian counties 1910) | 3.7 MB | yes |
| `raw/gistory/1_MO-HOR_Shp_EPSG3857/HR_Megye.*` (8 Croatian-Slavonian counties 1910) | 0.6 MB | yes |
| `raw/gistory/1_MO-HOR_Shp_EPSG3857/MOTel_KP.*` (12,541 settlement centre points 1910) | 13.7 MB | no (dbf > 5 MB) |
| `raw/gistory/3_OMM_Shp_EPSG3857/Region.*`, `District.*` (Austrian crown lands and districts) | 1.1 MB | yes |
| `raw/natural-earth/ne_10m_admin_0_countries.zip` (+ extracted) | 4.9 MB zip, 9.7 MB extracted | no |
| `raw/natural-earth/ne_10m_admin_1_states_provinces.zip` (+ extracted) | 14.9 MB zip, 36 MB extracted | no |

Re-download:

```
cd geo/raw
# Natural Earth 10m (public domain)
mkdir -p natural-earth && cd natural-earth
curl -L -o ne_10m_admin_0_countries.zip https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_0_countries.zip
curl -L -o ne_10m_admin_1_states_provinces.zip https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_1_states_provinces.zip
python3 -c "import zipfile;[zipfile.ZipFile(f).extractall(f[:-4]) for f in ('ne_10m_admin_0_countries.zip','ne_10m_admin_1_states_provinces.zip')]"
cd ..
# GISta Hungarorum 1910 settlement points (CC BY-NC), only needed for name lookups, not by build.mjs
B=https://www.gistory.hu/docs/1_MO-HOR_Shp/1_MO-HOR_Shp_EPSG3857
for f in MOTel_KP.shp MOTel_KP.dbf MOTel_KP.shx MOTel_KP.cpg; do curl -L -o gistory/1_MO-HOR_Shp_EPSG3857/$f $B/$f; done
# historical-basemaps (GPL-3.0), one file per year
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
