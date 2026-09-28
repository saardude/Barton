# Geodata sources: borders, counties, villages

What was found, downloaded and evaluated for the journey mapper on 2026-09-28, with exact
URLs, licences, sizes and the attribution text the app must show. Raw files live under
`geo/raw/` (git-ignored as a whole; `geo/README.md` has the re-download commands);
web-ready layers under `data/geo/` are committed and produced by `geo/build.mjs`.

## Summary

| Need | Dataset | Licence | Used for |
| --- | --- | --- | --- |
| State borders 1900-2010 | aourednik/historical-basemaps (GitHub) | GPL-3.0 (repository licence; no separate data licence stated) | `borders-1910.json` outline (from the 1914 file), `borders-1914.json`, `borders-1920.json` |
| Counties of the Kingdom of Hungary in 1910 | GISta Hungarorum (gistory.hu, OTKA K 111766) | CC BY-NC | `borders-1910.json` counties (63 Hungarian + 8 Croatian-Slavonian) |
| 1910 settlement points with Hungarian names and county/district | GISta Hungarorum, `MOTel_KP` | CC BY-NC | name checks for the gazetteer (not in any output layer yet) |
| Present-day countries and Romanian counties | Natural Earth 1:10m admin-0 and admin-1, version 5.1.1 | Public domain | `borders-now.json` |
| Village existence, names, admin units, population | Wikidata (SPARQL) | CC0 1.0 | `data/villages.json` |
| Base map tiles | OpenStreetMap (already in MAP-SPEC.md) | ODbL | tiles |
| Trip index (101 collecting trips with dates, places, record counts) | bartok-gyujtesek.zti.hu `/en/browse` (HUN-REN BTK ZTI) | Institute's terms, see README "Data attribution" | `data/collections-gyuj.json`, primary source of `data/journeys.json` |
| Bibliography and facsimiles of Bartok's writings | Bela Bartok Writings, bartok-irasai.zti.hu (HUN-REN BTK ZTI) | Institute's terms; texts quoted briefly with reference | citations in `data/context-events.json` |

Not used: Census Mosaic / MPIDR "Austro-Hungarian Empire 1910" court-district shapefile
(https://censusmosaic.demog.berkeley.edu/data/historical-gis-files, Rumpler and Seger)
because it requires registration and is limited to non-commercial scientific use with
registration; the GISta data covers the same area at county level without registration.
geoBoundaries (CC BY 4.0) was not needed because Natural Earth carries `name_hu` for the
Romanian counties and is public domain.

## 1. aourednik/historical-basemaps

- Repository: https://github.com/aourednik/historical-basemaps
- Files: `geojson/world_<year>.geojson`, raw URL pattern
  `https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_<year>.geojson`
- Years available between 1850 and today (from `index.json`, checked 2026-09-28): 1878,
  1880, 1900, 1914, 1920, 1930, 1938, 1945, 1960, 1994, 2000, 2010. **No 1910 and no 1918
  file** (both return 404). Downloaded: 1900 (1.30 MB), 1914 (1.29 MB), 1920 (1.69 MB), 1930
  (1.40 MB), 1938 (1.64 MB), 1945 (1.56 MB), 1994 (1.95 MB), 2000 (1.89 MB).
- Properties per feature: `NAME`, `ABBREVN`, `SUBJECTO` (ruling power), `PARTOF`,
  `BORDERPRECISION` (1 approximate, 2 moderate, 3 fixed by international law). All
  features in our window have `BORDERPRECISION` 3.
- Resolution: world scale. The clipped Carpathian window of the 1914 file is 55 KB before
  any simplification (11 polygons); further simplification at 10% collapses shapes, so
  `build.mjs` clips and quantises (0.001 deg) but does not simplify these files. Good for
  "which state was this in", not for locating a village relative to a border.
- Licence: the repository's `LICENSE` file is the GNU General Public License v3.0 and the
  README states no separate data licence. Treat the GeoJSON as GPL-3.0: redistribution with
  attribution and licence notice is fine for a viewer that ships the derived GeoJSON;
  the README asks users to verify the maps against other sources before academic use
  ("work in progress").
- Feature names in our window: 1900 "Austria Hungary", "Romania", "Serbia", "Russian
  Empire", "Bulgaria", "Ottoman Empire", "Bosnia-Herzegovina"; 1914 "Austro-Hungarian
  Empire", "Romania", "Serbia", "Russian Empire", "Bulgaria", "Ottoman Empire", "German
  Empire"; 1920 "Hungary", "Romania", "Czechoslovakia", "Yugoslavia", "Austria", "Poland",
  "Ukraine", "White Russia", "USSR", "Bulgaria" (three features in the 1920 file have no
  `NAME`; they are kept with `name: null`).
- Attribution text (app): `Historical state borders: historical-basemaps by Andre Ourednik
  and contributors (github.com/aourednik/historical-basemaps), GPL-3.0; work in progress,
  approximate`

## 2. GISta Hungarorum (gistory.hu), 1910 administrative boundaries

- Project page (English): https://www.gistory.hu/g/en/gistory/otka (Hungarian:
  https://www.gistory.hu/g/hu/gistory/otka). The page states "Creative Commons: CC BY-NC.
  In case of using these materials please refer to GISta Hungarorum (OTKA K 111766) in
  your publications." and that the maps were digitised in ArcGIS from a 1:400,000 map with
  a general 0.5-1 km inaccuracy at settlement level.
- Downloads are plain Apache directory listings of shapefile components (no zip):
  - Kingdom of Hungary and Croatia-Slavonia, EPSG:3857:
    https://www.gistory.hu/docs/1_MO-HOR_Shp/1_MO-HOR_Shp_EPSG3857/ (also a LAEA folder
    `1_MO-HOR_Shp_LAEA/` and a hydrography folder `1_MO-HOR_Vizrajz/`)
  - Austria-Hungary as a whole (Austrian crown lands, districts, railways):
    https://www.gistory.hu/docs/3_OMM_Shp/3_OMM_Shp_EPSG3857/
- Layers and what we took (sizes as served):
  - `MO_Megye` (63 counties of Hungary proper, fields `IDMegye`, `Megye_1910`, `Nagytaj`,
    `Stat_regio`): shp 3.64 MB, dbf 65 KB. **Used.**
  - `HR_Megye` (8 counties of Croatia-Slavonia, fields `Megye_ID`, `Megyenev_1`
    (Croatian), `Megyenev_H` (Hungarian)): shp 596 KB. **Used.**
  - `MOTel_KP` (12,541 settlement centre points, fields `IDTel1910`, `Megye_1910`,
    `Jaras_1910`, `telepulesn`): shp 803 KB, dbf 12.8 MB (git-ignored). Downloaded for
    name lookups; not yet in an output.
  - `Region` (28 Austrian crown lands, ids only, no names) and `District` (517 districts,
    field `Nev`): 240 KB and 794 KB. Downloaded, not used (no names on the regions; the
    empire outline comes from historical-basemaps instead).
  - Not downloaded: `MO_Telepules` (settlement polygons, 35 MB shp + 18 MB dbf),
    `MO_Jaras`, `MO_JarasVaros` (districts, 8-9 MB each). They are the next step if a
    1910 settlement-boundary layer is wanted.
- Projection: no `.prj` files; `ShpEPSG3857.ini` in the folder says "TEXT ENCODING
  UTF-8" and the folder name says EPSG:3857. `build.mjs` reprojects with mapshaper
  (`-proj from=EPSG:3857 crs=wgs84`); a spot check puts Beius inside the Bihar polygon
  and the layer's WGS84 extent is 15.98-26.51 E, 44.47-49.63 N, which is the Kingdom of
  Hungary.
- Conversion: mapshaper (npm, local dev dependency in `geo/package.json`), no global
  install; shapefile -> reprojection -> `-simplify 7% keep-shapes` -> GeoJSON with 0.001
  degree precision. 10% left the county layer at 505 KB, over the 500 KB budget once the
  state outline is added; 7% gives 407 KB total.
- Licence: **CC BY-NC**. Non-commercial use only; the viewer is an academic, non-commercial
  site, but the owner must keep it so (or replace this layer) if the project is ever
  monetised. Attribution is required.
- Attribution text (app): `Historical county boundaries (1910): GISta Hungarorum, OTKA K
  111766 (gistory.hu), CC BY-NC`

## 3. Natural Earth 1:10m cultural vectors

- Admin 0 countries: https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_0_countries.zip
  (4.93 MB; shp 8.8 MB extracted), version 5.1.1. Fields used: `ADM0_A3`, `ISO_A2`,
  `NAME_EN`, `NAME_HU`. There is no Romanian name field; `build.mjs` carries a table.
- Admin 1 states/provinces: https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_1_states_provinces.zip
  (14.9 MB; shp 21 MB + dbf 15 MB extracted). Romania: 42 features (41 judete plus
  Bucharest), fields `name` (ASCII), `name_en`, `name_hu` (present, e.g. Szatmar for Satu
  Mare), `iso_3166_2` (RO-SM), `type_en` (County). No `name_ro`; diacritics are restored
  from a table in `build.mjs`.
- Both files are public domain ("All versions of Natural Earth raster + vector map data
  found on this website are in the public domain", https://www.naturalearthdata.com/about/terms-of-use/).
- Attribution text (app, requested but not required): `Present-day borders: Made with
  Natural Earth (naturalearthdata.com), public domain`

## 4. Wikidata

- Endpoint: https://query.wikidata.org/sparql, JSON results, custom `User-Agent`
  (required by the Wikimedia User-Agent policy), 1 request per second, responses cached
  under `geo/cache/wikidata/`.
- Properties read: P625 coordinates, labels and aliases in ro/hu/en/de, P1705 native
  label, P1448 official name with P582 end time (historical names), P131 (chain to a county
  of Romania, Q1776764), P576 dissolved, P571 inception, P1366 replaced by, P1082
  population with P585 point in time, P31 with a P279* check against Q486972 (human
  settlement).
- Licence: Wikidata content is CC0 1.0 (https://www.wikidata.org/wiki/Wikidata:Licensing).
- Attribution text (app, courtesy): `Village names, coordinates, administrative units and
  status: Wikidata contributors (CC0)`

## 4a. Trip index: bartok-gyujtesek.zti.hu

- URL: https://bartok-gyujtesek.zti.hu/en/browse (Hungarian: `/hu/browse`). 101 entries in a
  year accordion, each an anchor `/en/browse/<id>` whose text is "<date expression>. <place>
  (<count>)"; entries without a count have no records online. Record pages are
  `/en/browse/<id>/<record>`.
- Fetched once by the scraper (cached under `scraper/cache/bartok-gyujtesek.zti.hu/`);
  `geo/parse-gyuj-collections.mjs` reads that copy or fetches the page itself (1 request,
  cached under `geo/cache/gyuj/`). Parsed output: `data/collections-gyuj.json` (labels
  verbatim, parsed dates with precision, resolved places, `romanianMaterial` flag).
  Localities outside Romania (not in the gazetteer) are resolved through Wikidata by their
  Hungarian label (section 4), 37 of 45 found, coordinates CC0.
- Attribution text (app): the Institute credit already used for the records: `Trip index and
  records: HUN-REN BTK Institute for Musicology, Budapest, "Bela Bartok, the
  Ethnomusicologist" (bartok-gyujtesek.zti.hu)`.

## 4b. Bela Bartok Writings: bartok-irasai.zti.hu

- URL: https://bartok-irasai.zti.hu/en/ (introduction at `/en/introduction/`, list at
  `/en/irasok/`, by year `?ev`, by genre `?mufaj`). WordPress site with a custom post type
  `irasok`; the REST endpoint `https://bartok-irasai.zti.hu/wp-json/wp/v2/irasok?per_page=100&page=N`
  returns all 398 entries (Hungarian and English pages, 4 pages) with title, link, HTML
  content and taxonomy ids (`ev` year, `mufaj` genre, `nyelv` language). Fetched with a
  custom User-Agent at 1 request/s and cached under `geo/cache/irasai/` (git-ignored).
- What it holds: for every writing a bibliographic record (first edition with journal,
  issue, date and pages; collected editions BOI = Bartok Bela osszegyujtott irasai, Essays =
  Suchoff 1976, BBI = Bartok Bela irasai, Studies = Suchoff 1997; further versions and
  translations) and a "Complete document" facsimile link (PDF, not fetched). Some entries
  also carry the transcribed text in the page body (e.g. 'Selbstbiographie', 'Hungary in
  the Throes of Reaction', 'Musikfolklore', 'The Relation of Folk-Song to the Development
  of the Art Music of Our Time'); most carry only the reference. Letters are not included
  (the 1931 letter to Octavian Beu is cited from Demeny's edition instead).
- Entries used as primary citations in `data/context-events.json`:
  - 'Race Purity in Music', Modern Music XIX/3 (March-April 1942) — `/en/irasok/race-purity-in-music-2/`
    (reprints: Tempo 8, September 1944, `.../race-purity-in-music-6/`; Horizon 60, December 1944, `.../race-purity-in-music-4/`)
  - 'Nepdalkutatas es nacionalizmus' [Folk Song Research and Nationalism], Tukor V/3 (March 1937) — `/en/irasok/nepdalkutatas-es-nacionalizmus-2/`
    (this is the 1937 essay on nationalism the brief referred to; 'Race Purity' is 1942)
  - 'Valasz Petranuek tamadasara' (Szep Szo, April-May 1937), 'Antwort auf einen rumaenischen Angriff' (Ungarische Jahrbuecher XVI/2-3, February 1936), 'Reponse a une attaque roumaine' (Archivum Europae Centro-Orientalis II/3-4, 1936) — `/en/irasok/valasz-petranuek-tamadasara-2/` and linked versions
  - 'Nepzenenk es a szomszed nepek nepzeneje' (1934) — `/en/irasok/nepzenenk-es-a-szomszed-nepek-nepzeneje-2/`
  - 'Miert es hogyan gyujtsunk nepzenet?' (1936) — `/en/irasok/miert-es-hogyan-gyujtsunk-nepzenet-2/`
  - 'A hunyadi roman nep zenedialektusa' (Ethnographia, March 1914) — `/en/irasok/a-hunyadi-roman-nep-zenedialektusa-2/`; 'Observari despre muzica poporala romaneasca' (Convorbiri literare, July-August 1914) — `/en/irasok/observari-despre-muzica-poporala-romaneasca-2/`
  - 'Hungary in the Throes of Reaction', Musical Courier LXXX/18 (29 April 1920) — `/en/irasok/hungary-in-the-throes-of-reaction-2/` (full text)
  - 'Selbstbiographie' — `/en/irasok/bela-bartok-selbstbiographie-2/` (full text)
  - Brailoiu's 1936 translations in Muzica si Poezie — `/en/irasok/muzica-populara-maghiara-si-cea-romaneasca-2/`, `.../dialectul-muzical-al-romanilor-din-hunedoara-2/`, `.../muzica-populara-romaneasca-6/`, `.../cercetarile-de-folklore-muzical-in-ungaria-2/`
  - 'Rumaenische Volksmusik' (1933) — `/en/irasok/rumanische-volksmusik-4/`; 'Roman nepzene' (1935) — `/en/irasok/roman-nepzene-4/`
- Not on the site: the 1913 Bihor volume and the 1923 Maramures volume themselves (the
  database lists articles, prefaces to some Kodaly-Bartok editions, but no entry was found
  for these two volumes by title or body search); the letters to Beu, Busitia, Brailoiu.
- Attribution text (app): `Bibliographic data on Bartok's writings: Bela Bartok Writings,
  HUN-REN BTK Institute for Musicology (bartok-irasai.zti.hu)`

## 5. Output layers (`data/geo/`)

| File | Features | Size | Content |
| --- | --- | --- | --- |
| `borders-1910.json` | 82 | 407 KB | 63 + 8 counties of the Kingdom of Hungary (GISta) + 11 state polygons (historical-basemaps 1914 as the 1910 outline) |
| `borders-1914.json` | 11 | 27 KB | state polygons, historical-basemaps 1914 |
| `borders-1920.json` | 20 | 30 KB | state polygons, historical-basemaps 1920 (post-Trianon) |
| `borders-now.json` | 57 | 54 KB | 15 countries (Natural Earth admin-0, clipped to 12-33 E, 40-53 N) + 42 Romanian counties (admin-1) |

Every feature has `properties.year`, `.level`, `.name`, `.nameHu`, `.nameRo`, `.source`;
each file has a top-level `meta` with `sources[]` (id, title, url, licence, attribution)
and `notes[]`. `node geo/build.mjs --check` verifies size and properties.

## 6. Attribution block for the app footer / about panel

```
Map data: (c) OpenStreetMap contributors (ODbL).
Present-day borders: Made with Natural Earth (public domain).
Historical county boundaries (1910): GISta Hungarorum, OTKA K 111766 (gistory.hu), CC BY-NC.
Historical state borders: historical-basemaps by Andre Ourednik and contributors, GPL-3.0 (approximate, work in progress).
Village names and status: Wikidata contributors (CC0).
Song records and trip index: HUN-REN BTK Institute for Musicology, Budapest (see Data attribution).
Bibliographic data on Bartok's writings: Bela Bartok Writings, HUN-REN BTK Institute for Musicology (bartok-irasai.zti.hu).
```

## 7. Things that could not be obtained

- historical-basemaps has no `world_1910.geojson` or `world_1918.geojson` (HTTP 404 on
  both). 1914 stands in for 1910 (no border change in the window between 1908 and 1914);
  1920 stands in for the post-war state.
- GISta Hungarorum's Austrian `Region` layer carries ids only (`ID_Region`), so no named
  crown-land layer was built; the empire outline is from historical-basemaps.
- The GitHub REST API for the repository listing was blocked for this session
  ("GitHub access to this repository is not enabled"); raw file downloads worked, so the
  year list was taken from the repository's `index.json` instead.
