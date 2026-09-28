# UI copy

All user-facing strings, keyed so they can be lifted into `app/src/i18n/en.ts` in the
build phase. The interface language is English. Romanian (ro) and Hungarian (hu)
equivalents are given for facet labels, genre names and place-level words because they
appear next to the English in the UI (secondary labels, `lang`-tagged) and because they are
what users of the source databases know. Other strings are English only; a full locale
switch is out of scope (FRONTEND-SPEC decision 3).

Rendering rules for bilingual labels:

- Genre in facets, chips and tables: `ro / en` as one label, e.g. "colindă / winter carol"
  (the Romanian term is the primary name of the genre, the English is the gloss). The
  Hungarian is exposed in `title` and in the About page glossary, not inline.
- Facet group headings: English only in the heading; ro and hu appear in the group's
  `hint` (small mono line under the heading), e.g. "Gen / Műfaj".
- Interpolation uses `{n}`, `{name}` etc. Plurals: `{n} melodies` with `one` form
  `1 melody`; use `Intl.PluralRules('en')`.
- Numbers use `Intl.NumberFormat('en')` (thousands separator), years are plain.
- Plain ASCII punctuation in strings; the only non-ASCII characters are the letters of the
  Romanian and Hungarian words themselves.

## 1. Global and navigation

| Key                     | en                                                  |
|-------------------------|-----------------------------------------------------|
| app.title               | Bartok / Romania                                    |
| app.subtitle            | Bela Bartok's field collection, localities in present-day Romania |
| app.skipToResults       | Skip to results                                     |
| nav.explorer            | Explorer                                            |
| nav.about               | About and sources                                   |
| nav.journeys            | Journeys                                            |
| nav.back                | Back                                                |
| nav.backToResults       | Back to results                                     |
| nav.breadcrumb          | Breadcrumb                                          |
| nav.openCounty          | Open county page                                    |
| nav.viewInExplorer      | View in explorer                                    |
| theme.label             | Theme                                               |
| theme.auto              | Auto                                                |
| theme.light             | Light                                               |
| theme.dark              | Dark                                                |
| colourByGenre           | Colour by genre                                     |
| copyLink                | Copy link                                           |
| linkCopied              | Link copied                                         |
| copyManual              | Press Ctrl+C to copy                                |
| loadingCollection       | Loading the collection...                           |
| offlineToast            | You are offline; map tiles may not load.            |

## 2. Search

| Key                 | en                                                                                          |
|---------------------|---------------------------------------------------------------------------------------------|
| search.label        | Search melodies                                                                             |
| search.placeholder  | Search titles, places, performers, codes                                                    |
| search.clear        | Clear search                                                                                |
| search.hint         | Search matches titles, incipits, performers, collectors, reference codes and place names.  |

ro: Căutare / hu: Keresés (used in the About glossary only).

## 3. Facets and place levels

| Key                    | en           | ro                    | hu                    |
|------------------------|--------------|-----------------------|-----------------------|
| facet.filters          | Filters      | Filtre                | Szűrők                |
| facet.place            | Place        | Loc                   | Hely                  |
| facet.country          | Country      | Țară                  | Ország                |
| facet.region           | Region       | Regiune               | Régió                 |
| facet.county           | County       | Județ                 | Megye                 |
| facet.countyHistorical | Historical county | Comitat (istoric) | Vármegye (történelmi) |
| facet.village          | Village      | Sat / localitate      | Falu / település      |
| facet.genre            | Genre        | Gen                   | Műfaj                 |
| facet.style            | Style        | Stil                  | Stílus                |
| facet.performance      | Performance  | Interpretare          | Előadásmód            |
| facet.instrument       | Instrument   | Instrument            | Hangszer              |
| facet.year             | Year         | An                    | Év                    |
| facet.yearFrom         | From         | De la                 | Ettől                 |
| facet.yearTo           | To           | Până la               | Eddig                 |
| facet.performer        | Performer    | Interpret / informator| Előadó / adatközlő    |
| facet.collector        | Collector    | Culegător             | Gyűjtő                |
| facet.source           | Source       | Sursă                 | Forrás                |
| facet.melodies         | Melodies     | Melodii               | Dallamok              |
| facet.notation         | Notation     | Notație               | Kotta                 |
| facet.audio            | Recording    | Înregistrare          | Hangfelvétel          |
| facet.text             | Text         | Text                  | Szöveg                |
| facet.notMapped        | not mapped   | fără coordonate       | térképen nem jelölt   |
| facet.unknown          | unknown      | necunoscut            | ismeretlen            |
| facet.noDate           | n.d.         | f.a.                  | é.n.                  |
| facet.allCountries     | All countries| Toate țările          | Minden ország         |
| facet.villageUnknown   | (village unknown) | (sat necunoscut)  | (falu ismeretlen)     |
| facet.countyUnknown    | (county unknown)  | (județ necunoscut)| (megye ismeretlen)    |
| facet.sexM             | male         | bărbat                | férfi                 |
| facet.sexF             | female       | femeie                | nő                    |

Facet actions (en only): `facet.clear` "Clear", `facet.clearAll` "Clear all filters",
`facet.showAll` "Show all ({n})", `facet.showFewer` "Show fewer", `facet.activeCount`
"{n} active", `facet.removeChip` "Remove filter: {label}", `facet.zero` "(0)".

### 3.1 Genres

Key `genre.{id}`. The English gloss follows the project brief.

| id       | ro                     | en                                     | hu                             | Note                                       |
|----------|------------------------|----------------------------------------|--------------------------------|--------------------------------------------|
| colinda  | colindă                | winter carol                           | kolinda (téli köszöntő ének)   | Bartok's "Colinde", sung at Christmas and New Year |
| doina    | doină                  | lyrical improvised song (hora lungă)   | doina (hora lungă)             | free-rhythm, improvised; Bartok's "hora lungă" of Maramures |
| bocet    | bocet                  | lament                                 | sirató                         | funeral lament                             |
| cantec   | cântec (propriu-zis)   | song proper                            | tulajdonképpeni dal            | Bartok's "cântec propriu-zis"              |
| joc      | joc                    | dance tune                             | táncdallam                     | instrumental or vocal dance melody         |
| nunta    | cântec de nuntă        | wedding song                           | lakodalmi dal                  | wedding ritual songs                       |
| other    | altele                 | other / unclassified                   | egyéb                          | anything the normaliser could not map      |

Inline label form: `colindă / winter carol`; `title` attribute: `hu: kolinda`.

### 3.2 Performance

| id                | en                    | ro                        | hu                      |
|-------------------|-----------------------|---------------------------|-------------------------|
| vocal             | vocal                 | vocal                     | énekes                  |
| instrumental      | instrumental          | instrumental              | hangszeres              |
| mixed             | vocal and instrumental| vocal și instrumental     | énekes és hangszeres    |
| unknown           | unknown               | necunoscut                | ismeretlen              |

### 3.3 Style

Values come from `facets.json`; expected ids and labels:

| id     | en          | ro          | hu             |
|--------|-------------|-------------|----------------|
| old    | old style   | stil vechi  | régi stílus    |
| new    | new style   | stil nou    | új stílus      |
| mixed  | mixed style | stil mixt   | vegyes stílus  |
| other  | other       | altele      | egyéb          |

### 3.4 Instruments

Ids and labels come from `facets.json`; the front end ships these translations for the
common ones and falls back to the id for the rest:

| id        | en             | ro           | hu             |
|-----------|----------------|--------------|----------------|
| voice     | voice          | voce         | ének           |
| violin    | violin         | vioară       | hegedű         |
| fluier    | shepherd's flute (fluier) | fluier | furulya (fluier) |
| caval     | long flute (caval) | caval    | kaval          |
| tilinca   | tilinca (rim-blown flute) | tilincă | tilinkó   |
| cimpoi    | bagpipe        | cimpoi       | duda           |
| bucium    | alphorn (bucium)| bucium      | havasi kürt (bucium) |
| drimba    | jaw harp       | drâmbă       | doromb         |
| taragot   | taragot        | taragot      | tárogató       |
| clarinet  | clarinet       | clarinet     | klarinét       |
| cobza     | cobza          | cobză        | koboz          |
| guitar    | guitar         | chitară      | gitár          |
| cimbalom  | cimbalom       | țambal       | cimbalom       |
| bass      | double bass    | contrabas    | nagybőgő       |
| ensemble  | ensemble       | taraf        | zenekar        |
| unknown   | unknown        | necunoscut   | ismeretlen     |

## 4. Place tree

| Key                    | en                                          |
|------------------------|---------------------------------------------|
| tree.label             | Places                                      |
| tree.expand            | Expand {name}                               |
| tree.collapse          | Collapse {name}                             |
| tree.select            | Filter to {name}                            |
| tree.deselect          | Clear {level} filter                        |
| tree.historicalOnly    | Historical name; modern name unknown        |
| tree.notMapped         | not mapped                                  |

## 5. Results list

| Key                   | en                                   |
|-----------------------|--------------------------------------|
| results.label         | Results                              |
| results.count         | {n} melodies                         |
| results.countOf       | {n} of {m} melodies                  |
| results.export        | Export JSON                          |
| results.exportConfirm | This export is about {size} MB. Download? |
| results.exportDisabled| Nothing to export                    |
| results.countOne      | 1 melody                             |
| results.countUnmapped | {n} melodies, {m} not mapped         |
| results.hasAudio      | has recording                        |
| results.hasNotation   | has notation                         |
| results.noTitle       | Untitled                             |
| results.pages         | Results pages                        |
| results.pageOf        | Page {page} of {pages}               |
| results.prev          | Previous page                        |
| results.next          | Next page                            |
| results.goToPage      | Go to page                           |

## 6. Sort

| Key             | en                          |
|-----------------|-----------------------------|
| sort.label      | Sort by                     |
| sort.title      | Title                       |
| sort.style      | Style                       |
| sort.location   | Location                    |
| sort.year       | Year                        |
| sort.source     | Source number               |
| sort.asc        | Ascending                   |
| sort.desc       | Descending                  |
| sort.toggleDir  | Toggle sort direction       |
| sort.column     | Sort by {column}            |
| sort.unknownLast| Unknown values are listed last |

## 7. Map

| Key                    | en                                                                 |
|------------------------|--------------------------------------------------------------------|
| map.label              | Map of melodies; use the list after the map for keyboard access    |
| map.zoomIn             | Zoom in                                                            |
| map.zoomOut            | Zoom out                                                           |
| map.fitRomania         | Fit to Romania                                                     |
| map.fitCounty          | Fit to county                                                      |
| map.layerBubbles       | County bubbles                                                     |
| map.layerChoropleth    | County shading                                                     |
| map.legend             | Legend                                                             |
| map.legendSize         | Dot size: melodies                                                 |
| map.pointList          | List map points ({n})                                              |
| map.listCounties       | List counties ({n})                                                |
| map.listVillages       | List villages ({n})                                                |
| map.showMelodies       | Show melodies                                                      |
| map.locationUncertain  | location uncertain                                                 |
| map.pointLabel         | {name}, {county}: {n} melodies                                     |
| map.countyLabel        | {name}: {n} melodies in {v} villages                               |
| map.clusterLabel       | Cluster of {p} places, {n} melodies; press to zoom                 |
| map.clickVillage       | Click to filter to this village                                    |
| map.clickCounty        | Click to zoom to this county                                       |
| map.clickClear         | Click to clear this filter                                         |
| map.melodiesIn         | {n} melodies in {v} villages                                       |
| map.recordings         | {n} recordings                                                     |
| map.notations          | {n} notations                                                      |
| map.villagesNotMapped  | {n} villages not mapped                                            |
| map.notMapped          | {n} not mapped                                                     |
| map.notMappedOne       | 1 not mapped                                                       |
| map.selectedNotMapped  | Selected place is not mapped                                       |
| map.unmappedTitle      | Showing {n} melodies without coordinates                           |
| map.unmappedBody       | These places could not be located; they are still listed in the place tree. |
| map.backToMap          | Back to map                                                        |
| map.tilesUnavailable   | Map tiles unavailable; showing county outlines                     |
| map.retryTiles         | Try tiles again                                                    |
| map.attributionOsm     | (c) OpenStreetMap contributors                                     |
| map.attributionBounds  | County boundaries: Natural Earth                                   |
| map.yearSpan           | {from}-{to}                                                        |
| map.yearMixed          | {from}-{to} and n.d.                                               |

## 8. County page

| Key                    | en                                       |
|------------------------|------------------------------------------|
| county.villages        | Villages                                 |
| county.villagesIn      | Villages in {name}, {n}                  |
| county.stats.melodies  | melodies                                 |
| county.stats.villages  | villages                                 |
| county.stats.audio     | with recording                           |
| county.stats.notation  | with notation                            |
| county.stats.years     | years                                    |
| county.tab.melodies    | Melodies                                 |
| county.tab.genre       | By genre                                 |
| county.tab.performer   | By performer                             |
| county.tab.timeline    | Timeline                                 |
| county.tab.map         | Local map                                |
| county.col.village     | Village                                  |
| county.col.melodies    | Melodies                                 |
| county.col.genres      | Genres                                   |
| county.col.years       | Years                                    |
| county.col.title       | Title                                    |
| county.col.genre       | Genre                                    |
| county.col.performance | Performance                              |
| county.col.year        | Year                                     |
| county.col.source      | Source                                   |
| county.col.performer   | Performer                                |
| county.col.age         | Age                                      |
| county.col.ethnicity   | Ethnicity                                |
| county.unnamedPerformer| Unnamed performer ({n})                  |
| county.timelineLabel   | {year}: {n} melodies                     |
| county.timelineUnknown | {n} melodies without a year              |
| county.filteredNote    | Counts reflect the active filters        |
| county.genrePct        | {pct}% of {total}                        |

## 9. Song record

| Key                    | en                                              |
|------------------------|-------------------------------------------------|
| song.tab.record        | Record                                          |
| song.tab.raw           | Raw JSON                                        |
| song.prev              | Previous melody                                 |
| song.next              | Next melody                                     |
| song.position          | {i} of {n} in results                           |
| song.notationAlt       | Notation of {title}, source {ref}               |
| song.notationView      | View full size                                  |
| song.notationNone      | No notation image for this record               |
| song.notationError     | The notation image could not be loaded          |
| song.audioLabel        | Recording of {title}                            |
| song.audioNone         | No recording available                          |
| song.audioError        | The recording could not be loaded               |
| song.audioDownload     | Download recording                              |
| song.audioCredit       | Recording: HUN-REN BTK Institute for Musicology |
| song.text              | Text                                            |
| song.textNone          | No text recorded                                |
| song.related           | Related melodies                                |
| song.relatedVillage    | Also from {name}                                |
| song.relatedPerformer  | Also by {name}                                  |
| song.relatedSource     | Neighbouring source numbers                     |
| song.rail.where        | Where                                           |
| song.rail.whoWhen      | Who / when                                      |
| song.rail.music        | Music                                           |
| song.rail.source       | Source                                          |
| song.row.village       | Village                                         |
| song.row.county        | County                                          |
| song.row.region        | Region                                          |
| song.row.country       | Country                                         |
| song.row.coordinates   | Coordinates                                     |
| song.row.performer     | Performer                                       |
| song.row.age           | Age                                             |
| song.row.ethnicity     | Ethnicity                                       |
| song.row.collector     | Collector                                       |
| song.row.date          | Date                                            |
| song.row.year          | Year                                            |
| song.row.genre         | Genre                                           |
| song.row.performance   | Performance                                     |
| song.row.style         | Style                                           |
| song.row.instruments   | Instruments                                     |
| song.row.system        | System position                                 |
| song.row.cadences      | Cadences                                        |
| song.row.rhythm        | Rhythm                                          |
| song.row.remarks       | Remarks                                         |
| song.row.reference     | Reference                                       |
| song.row.database      | Database                                        |
| song.row.id            | Record id                                       |
| song.openSource        | Open record on {site}                           |
| song.row.origin        | Informant's origin                              |
| song.row.placeRaw      | Place as printed                                |
| song.row.sex           | Sex                                             |
| song.row.mode          | Mode                                            |
| song.row.ambitus       | Ambitus                                         |
| song.row.syllables     | Syllables                                       |
| song.row.form          | Form                                            |
| song.row.volume        | Volume                                          |
| song.row.number        | Number                                          |
| song.rail.works        | In Bartók's works                               |
| song.related.variants  | Variants                                        |
| song.related.sameSource| Same source                                     |
| song.related.crossSite | In another database                             |
| song.remarks           | Remarks                                         |
| song.notationPage      | Notation for {title}, page {n}                  |
| song.notationPdf       | Open notation (PDF)                             |
| song.audioOf           | Recording {i} of {n}                            |
| song.copyJson          | Copy JSON                                       |
| song.showAllJson       | Show all                                        |
| song.source.nepzene    | Folk Music in Bartok's Compositions             |
| song.source.system     | The Bartok System                               |
| song.source.gyujtesek  | Bela Bartok, the Ethnomusicologist              |
| song.lightbox          | Notation image, full size                       |
| song.close             | Close                                           |

Related-melodies rule labels use `{name}` = PlaceLabel or performer name.

## 10. Phone

| Key                 | en                        |
|---------------------|---------------------------|
| phone.tab.map       | Map                       |
| phone.tab.list      | List                      |
| phone.tab.filters   | Filters                   |
| phone.filtersCount  | Filters ({n})             |
| phone.showResults   | Show {n} melodies         |
| phone.showResultsOne| Show 1 melody             |
| phone.viewList      | {n} melodies, view list   |
| phone.filterToPlace | Filter to this place      |
| phone.closeSheet    | Close filters             |

## 11. States and errors

| Key                     | en                                                                   |
|-------------------------|----------------------------------------------------------------------|
| state.loading           | Loading...                                                           |
| state.emptyTitle        | No melodies match these filters.                                     |
| state.emptySearchTitle  | No melodies match "{q}".                                             |
| state.emptyBody         | Try removing a filter, or clear all filters to start again.          |
| state.removeLast        | Remove last filter                                                   |
| state.dataErrorTitle    | The collection could not be loaded.                                  |
| state.dataErrorBody     | Check your connection and try again. If the problem persists, the data files may be missing from this deployment. |
| state.retry             | Retry                                                                |
| state.songNotFound      | No record with id {id}                                               |
| state.countyNotFound    | No county with id {id}                                               |
| state.notFound          | Page not found                                                       |
| state.backToExplorer    | Back to explorer                                                     |
| state.clearSearch       | Clear search                                                         |

## 12. About page and footer

Footer (every page, `--fs-12 --muted`, links underlined):

```
Data: HUN-REN BTK Institute for Musicology, Budapest (Bartok Archives): "Folk Music in
Bartok's Compositions", "The Bartok System" and "Bela Bartok, the Ethnomusicologist".
Records, notation images and recordings remain the property of the Institute; this viewer
is an independent interface and is not affiliated with it.
Map: (c) OpenStreetMap contributors. County boundaries: Natural Earth.
```

Keys: `footer.data`, `footer.independent`, `footer.map`. Institute name in the three
languages, for the About page:

| en | HUN-REN BTK Institute for Musicology, Budapest |
| ro | Institutul de Muzicologie HUN-REN BTK, Budapesta |
| hu | HUN-REN BTK Zenetudományi Intézet, Budapest |

About page sections (en): "What this is" (one paragraph from CONTEXT.md's goal), "Sources"
(the three sites with links), "Names of places" (explains modern / historical display,
FRONTEND-SPEC section 7 of MAP-SPEC), "Genres" (the table in 3.1 with all three languages),
"How to cite" ("Cite the original record on zti.hu; every song page links to it"),
"Accessibility" (keyboard summary), "Colophon" (fonts: IBM Plex, licence OFL; map:
Leaflet, OpenStreetMap).

## 13. Journey mapper

Route `/journeys` (FRONTEND-SPEC section 14, MAP-SPEC section 11). Same bilingual rule
as the facets: English in the heading, ro / hu in the hint line and the About glossary.

### 13.1 Labels (en / ro / hu)

| Key                       | en                       | ro                            | hu                            |
|---------------------------|--------------------------|-------------------------------|-------------------------------|
| journey.title             | Journeys                 | Călătorii                     | Gyűjtőutak                    |
| journey.trip              | Trip                     | Călătorie                     | Gyűjtőút                      |
| journey.timeline          | Timeline                 | Cronologie                    | Idővonal                      |
| journey.goToDate          | Go to date               | Mergi la data                 | Ugrás dátumra                 |
| journey.pickTrip          | Journey                  | Alege călătoria               | Gyűjtőút kiválasztása         |
| journey.departure         | Departure                | Plecare                       | Indulás                       |
| journey.return            | Return                   | Întoarcere                    | Visszatérés                   |
| journey.stop              | Stop                     | Oprire                        | Állomás                       |
| journey.stops             | Stops                    | Opriri                        | Állomások                     |
| journey.assumed           | assumed                  | presupus                      | feltételezett                 |
| journey.approximate       | approximate dates        | date aproximative             | hozzávetőleges dátumok        |
| journey.distance          | Distance                 | Distanță                      | Távolság                      |
| journey.recordedHere      | Recorded here            | Înregistrate aici             | Itt gyűjtött                  |
| journey.genres            | Genres                   | Genuri                        | Műfajok                       |
| journey.ethnicities       | Ethnicity as stated by the source | Etnie, conform sursei | Etnikum a forrás szerint      |
| journey.instruments       | Instruments              | Instrumente                   | Hangszerek                    |
| journey.thenNow           | {then} ({year}) -> {now} (today) | {then} ({year}) -> {now} (azi) | {then} ({year}) -> {now} (ma) |
| journey.nameThen          | Name then                | Numele de atunci              | Korabeli név                  |
| journey.nameNow           | Name today               | Numele de azi                 | Mai név                       |
| journey.context           | Context                  | Context                       | Kontextus                     |
| journey.unmapped          | Unmapped                 | Nelocalizate                  | Térképen nem jelölt           |
| journey.bordersThen       | Borders then ({era})     | Granițe atunci ({era})        | Korabeli határok ({era})      |
| journey.bordersNow        | Borders now              | Granițe azi                   | Mai határok                   |
| journey.bordersBoth       | Compare                  | Comparație                    | Összehasonlítás               |
| journey.era               | Era                      | Epocă                         | Korszak                       |
| journey.swipe             | Swipe                    | Glisare                       | Csúsztatás                    |
| journey.fade              | Fade                     | Estompare                     | Áttűnés                       |

Village status badge (`status.*`), text only, never colour-coded:

| id        | en                    | ro                 | hu                          |
|-----------|-----------------------|--------------------|-----------------------------|
| existing  | existing              | există             | létező                      |
| renamed   | renamed               | redenumit          | átnevezett                  |
| merged    | merged into {name}    | comasat cu {name}  | egyesítve: {name}           |
| abandoned | abandoned             | dispărut           | elnéptelenedett             |
| unknown   | status unknown        | statut necunoscut  | ismeretlen állapot          |

Context event types (`event.*`):

| id          | en             | ro                    | hu                 |
|-------------|----------------|-----------------------|--------------------|
| border      | Border change  | Schimbare de graniță  | Határváltozás      |
| publication | Publication    | Publicație            | Kiadvány           |
| statement   | Statement      | Declarație            | Nyilatkozat        |
| press       | Press          | Presă                 | Sajtó              |
| other       | Event          | Eveniment             | Esemény            |

Era descriptions (`era.*`, en only, used as `title` and legend text):
`era.1910` "1910: counties of the Kingdom of Hungary and the Austria-Hungary frontier";
`era.1914` "1914: borders at the outbreak of the First World War";
`era.1920` "1920: borders after the Treaty of Trianon";
`era.now` "Now: modern states and Romanian județe".

### 13.2 Strings (en)

| Key                          | en                                                                                     |
|------------------------------|----------------------------------------------------------------------------------------|
| journey.prompt               | Pick a trip on the timeline or enter a date.                                           |
| journey.timelineLabel        | Trips by date                                                                          |
| journey.markerLabel          | {label}, {from} to {to}, {stops} stops, {n} melodies                                   |
| journey.headerStats          | {stops} stops, {unmapped} unmapped records                                             |
| journey.headerMelodies       | {n} melodies, {km} km                                                                  |
| journey.departureLine        | Departure: {name}                                                                      |
| journey.departureAssumed     | Departure: {name} (assumed)                                                            |
| journey.returnLine           | Return: {name}                                                                         |
| journey.stopLabel            | Stop {i} of {n}: {then} ({year}), now {now}; {m} melodies, {dates}                     |
| journey.stopNoCoords         | location unknown                                                                       |
| journey.stopDimmed           | 0 of {n} melodies match the filters                                                    |
| journey.records              | {n} records                                                                            |
| journey.showMelodies         | Show melodies                                                                          |
| journey.selectStop           | Select stop                                                                            |
| journey.listRoute            | List route ({n} stops)                                                                 |
| journey.fitRoute             | Fit to route                                                                           |
| journey.legendKnown          | route between dated stops                                                              |
| journey.legendAssumed        | assumed leg (departure or return not documented)                                       |
| journey.legendFuzzy          | approximate route (month or year known only)                                           |
| journey.legendReturn         | return leg                                                                             |
| journey.legendNoCoords       | {n} stops without coordinates                                                          |
| journey.compareLabel         | Comparison: then / now                                                                 |
| journey.bordersUnavailable   | Border layers unavailable                                                              |
| journey.underPointer         | {then} ({era}) / {now} (now)                                                           |
| journey.unmappedReasonDate   | no date                                                                                |
| journey.unmappedReasonPlace  | place not located                                                                      |
| journey.unmappedTitle        | Unmapped ({n})                                                                         |
| journey.unmappedBody         | These records have no usable date or their place could not be located. They are counted in the trip. |
| journey.duringTrip           | during this trip                                                                       |
| journey.contextEmpty         | No context entries for this period.                                                    |
| journey.contextNote          | Context entries are quoted from the cited sources and are listed for chronology only.  |
| journey.citation             | Source: {author}, {title} ({year}), {locator}                                          |
| journey.noTrips              | No trips could be reconstructed: no dated records.                                     |
| journey.noTripOnDate         | No trip on {date}. Nearest: {label} ({from}).                                          |
| journey.noRoute              | Route cannot be drawn: fewer than two located stops.                                   |
| journey.noMatch              | 0 of {n} melodies match the active filters.                                            |
| journey.tab.map              | Map                                                                                    |
| journey.tab.stops            | Stops                                                                                  |
| journey.tab.context          | Context                                                                                |
| journey.bordersButton        | Borders                                                                                |
| journey.dates.day            | {from} to {to}                                                                         |
| journey.dates.month          | {month} {year}                                                                         |
| journey.dates.year           | {year}, approximate                                                                    |

### 13.3 Copy rule for the context strip

The strip presents sources; it does not editorialise. Rendered text is limited to the
data fields `date`, `type` (via the labels above), `title`, `summary` and `citation`,
shown verbatim. The UI adds no adjectives, no framing sentences and no summaries of its
own; the only UI-authored strings on the strip are the type labels, "during this trip",
"Source:" and the note in `journey.contextNote`. Ethnicity is always labelled "as stated
by the source". Place names are given then and now with the year, without commentary.
Events without a citation are not rendered (AC-43).

## 14. Source identifiers and attribution (AC-36, AC-37)

| Key                          | en                                                                       |
|------------------------------|--------------------------------------------------------------------------|
| source.open                  | Open original record on {site}                                           |
| source.site.fmbc             | Folk Music in Bartók's Compositions                                      |
| source.site.bsys             | The Bartók System                                                        |
| source.site.gyuj             | Béla Bartók, the Ethnomusicologist                                       |
| source.siteShort.fmbc        | FMBC                                                                     |
| source.siteShort.bsys        | BS                                                                       |
| source.siteShort.gyuj        | BBE                                                                      |
| source.reference             | Source reference                                                         |
| source.noUrl                 | Source page not available                                                |

`source.open` is the `aria-label` of every `SourceLink`; its visible text is the
identifier itself (reference code, system position, or short site name plus number) and
the external-link icon is decorative. The footer text in section 12 is the attribution the
export JSON carries in its `attribution` field, together with the three database URLs:
`https://bartok-nepzene.zti.hu/en/`, `https://systems.zti.hu/br/en`,
`https://bartok-gyujtesek.zti.hu/en`.

Footer on `/journeys` adds: "Historical borders: {dataset}, {licence}" per loaded set (text
from the data files; see GEO-SOURCES.md) and "Village status: Wikidata, CC0".
