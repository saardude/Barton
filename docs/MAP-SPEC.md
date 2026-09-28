# Map specification

How the map on the Explorer, the County page and the phone works. Component names refer
to `FRONTEND-SPEC.md`; colours and sizes to `DESIGN-TOKENS.md`.

## 1. Base map

Phase 1: **Leaflet 1.9** (via `react-leaflet` 5, React 19) with raster tiles. This spec
was briefed with OpenStreetMap standard tiles; ARCHITECTURE.md proposes CARTO Positron
(greyscale, closer to the wireframe) with OSM as the fallback, and DEPLOY.md's CSP already
allows both hosts. The `TileLayer` config is one object with `url`, `attribution` and
`maxZoom`, so either is a one-line choice (decision D2).

- Tile URL: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, `maxZoom` 19 (we cap the
  app at 14), `subdomains` none (the `a/b/c` hosts are deprecated).
- Attribution, always visible, bottom-right, `--fs-11`, both modes:
  `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`.
  The Leaflet prefix ("Leaflet") stays on. The footer repeats the OSM credit in text
  (UI-COPY section 12).
- OSM tile usage policy: this is a low-traffic academic viewer, which is within the
  policy, but the app must send a valid `Referer` (it does, from the Vercel domain), must
  not prefetch tiles beyond the viewport (Leaflet's `keepBuffer` default of 2 is fine),
  and must never bulk download. If traffic grows, switch to a hosted provider: CARTO
  "Positron" (light grey basemap that matches the wireframe, needs the CARTO attribution
  line) or MapTiler. The `TileLayer` props live in one config object so this is a one-line
  change.
- Tile appearance: to keep the greyscale wireframe look the tile pane gets
  `filter: grayscale(1) contrast(0.9) opacity(0.7)` in light mode and
  `filter: grayscale(1) invert(1) brightness(0.8) contrast(0.85)` in dark mode. Filters
  are applied to `.leaflet-tile-pane` only, not to markers.
- `zoomControl` custom (our own 44 px buttons top-left, so they can be styled with tokens
  and reach the focus ring), `attributionControl` on, `scrollWheelZoom` on for desktop,
  `tap` on for touch, `zoomSnap` 0.5.
- Renderer: ARCHITECTURE.md suggests `CircleMarker` on a canvas renderer for scale. This
  spec uses `divIcon` markers (real `<button>`s, section 3.2) because they are focusable
  and labelled; clustering keeps the visible marker count in the low hundreds, which the
  DOM handles. If profiling shows more than about 2,000 visible markers, switch the
  village layer to canvas `CircleMarker`s and rely on `MapAccessibleList` as the only
  keyboard path (it exists either way).

Upgrade path: **MapLibre GL JS** with a vector style (OpenFreeMap or MapTiler "dataviz
light/dark"), which gives true greyscale styling, label language control (Romanian and
Hungarian labels via `name:ro` / `name:hu`), smooth zoom, and county polygons as a proper
fill layer. The `MapView` component boundary is designed so that `MapPoint[]`, selection
and hover-card contents are provider-independent; only the `MapView` internals change.

## 2. Initial view, bounds and zoom levels

- Initial view: fit to Romania bounds `[[43.6, 20.2], [48.3, 29.7]]` with 24 px padding
  (zoom ~6 on a 900 px wide panel).
- `maxBounds`: `[[41.0, 15.0], [50.5, 33.0]]` with `maxBoundsViscosity` 0.8. Historical
  localities may lie in present-day Hungary, Serbia, Ukraine, Moldova or Bulgaria, so the
  bounds are wider than Romania.
- Min zoom 5, max zoom 14.
- Level switch: **county mode** at zoom <= 7 with no county selected; **village mode**
  otherwise. Selecting a county from the tree or the map fits to its `bbox` (or, when the
  county has no bbox, to the bounds of its village points) and therefore lands in village
  mode. Clearing the county returns to the country fit.
- On the County page the map is fixed to the county bbox (min zoom = fitted zoom - 1) and
  only village mode exists.
- Phone: same, but the initial fit uses the phone panel size and the level switch
  threshold is zoom <= 6.

## 3. Layers

Rendered order bottom to top: tiles, county fill (optional), county bubbles or village
dots (clustered), selected point, hover card (HTML, outside the map panes).

### 3.1 County layer

Two implementations behind one prop `countyLayer: 'bubbles' | 'choropleth'`:

- **Centroid bubbles (phase 1, default)**: one circle per county at the county place's
  `lat/lon` (the scraper writes county centroids into `places.json`). Diameter
  `d = 10 + 30 * sqrt(n / nMax)`, clamped to [10, 40] px, where `nMax` is the largest
  county count among the current `mapPoints`. Fill `--surface` at 85% opacity, stroke
  1.5 px `--ink-2`; in colour-by-genre mode the fill is the dominant genre colour at 85%
  and the count label switches to `--genre-label-ink`. Count label centred in mono
  `--fs-11` when `d >= 22`, otherwise beside the bubble.
- **Choropleth (phase 2)**: needs a county-boundary GeoJSON (section 9). Five-class
  quantile fill of `--ink` at 6 / 12 / 20 / 30 / 42% opacity (light) or `--ink` at
  8 / 16 / 26 / 38 / 50% (dark), stroke `--map-county-stroke` 1 px, hover fill
  `--map-county-fill-hover`. Counts are still labelled at the centroid. Legend shows the
  class breaks.

### 3.2 Village dots

One dot per village point in `mapPoints`. Diameter `d = 4 + 18 * sqrt(n / nMax)`, clamped
to [4, 22] px, `nMax` = largest village count among the current points (so a small
filtered set still uses the full range; noted as decision D1). Fill `--map-dot` (mono) or
the dominant genre colour (colour-by-genre), stroke 1 px `--map-dot-stroke`. Dots are
`L.marker` with a `divIcon` containing a `<button>` (for keyboard focus and `aria-label`)
rather than `L.circleMarker`, so they participate in the accessibility model in
FRONTEND-SPEC section 12. The button's hit area is padded to 24 px (fine pointer) or
44 px (coarse pointer) around the visible circle with a transparent box; dots therefore
sit in the marker pane and are ordered north to south for a sensible Tab order.

Dominant genre = the genre with the highest count at that point; ties resolved by fixed
genre order. Places with a mixed genre profile are not visually different from single
genre places; the hover card's genre bar carries that information.

### 3.3 Clustering

`leaflet.markercluster` on the village layer only:

- `maxClusterRadius`: 40 px desktop, 56 px phone (this is also what guarantees that
  two hit areas never fully overlap, see FRONTEND-SPEC decision 5).
- `disableClusteringAtZoom`: 10 (villages within a county rarely overlap at zoom 10+; if
  two villages share coordinates they get a 3 px deterministic offset by id hash instead
  of a cluster).
- `spiderfyOnMaxZoom` on, `showCoverageOnHover` off, `zoomToBoundsOnClick` on.
- Cluster icon: circle `--map-cluster-fill` with 1.5 px `--map-cluster-stroke`, count in
  mono `--fs-12` `--ink`; size 28 / 36 / 44 px for < 10 / < 100 / >= 100 melodies. The
  count is the sum of melodies, not the number of places (`iconCreateFunction` sums
  `count`). Cluster `aria-label`: "Cluster of 7 places, 156 melodies; press to zoom".
- No clustering on the County page local map.

### 3.4 Selected state

The selected point (the `Query.village`, or the `Query.county` bubble in county mode)
gets the two-ring treatment: inner halo 2 px `--map-halo` and outer ring 2 px
`--map-select`, both drawn as `box-shadow` on the button so the visible circle keeps its
size: `box-shadow: 0 0 0 2px var(--map-halo), 0 0 0 4px var(--map-select)`. The selected
marker is raised (`zIndexOffset` 1000) and is never clustered (it is added to a separate
non-cluster layer while selected). A hovered or focused, unselected dot gets
`box-shadow: 0 0 0 2px var(--map-halo), 0 0 0 3px var(--ink-2)`.

Hovering a result row (FRONTEND-SPEC section 7) applies the hover style to that row's
village dot via `highlightPlaceId`, and pans only if the dot is off-screen (no zoom).

### 3.5 Legend and controls

`MapLegend` (bottom-left, `--z-map-ctl`): in mono mode a size key of three dots labelled
with counts (1, mid, `nMax`); in colour-by-genre mode the six genre swatches with names
(clicking a swatch toggles that genre in the Query, `aria-pressed`). Controls top-left:
zoom in, zoom out, "Fit to Romania" (or "Fit to county"), county layer toggle when the
choropleth exists. Top-right: "Colour by genre" (mirrors the TopBar toggle on desktop; on
phone this is the only place it lives). All controls are 44 px squares with tokens.

## 4. Hover card

`MapHoverCard` is an HTML element positioned above the point (flipping below near the top
edge; clamped inside the panel), `--surface`, `--border-strong`, `--shadow-pop`,
`--z-hover`, 260 px wide, `role="tooltip"`. Shown on `mouseenter` after 80 ms, on focus
immediately, hidden on `mouseleave` / blur / Esc. On touch there is no hover: a tap on a
point opens the phone `MapPointSheet` with the same content plus the actions "Show
melodies" (applies the place filter and switches to the list tab, AC-25) and "Open county
page".

Village card:

```
Beius (Belenyes)                     <- PlaceLabel, --fs-14 medium; historical in muted mono
Bihor (Bihar) / Crisana / Romania     <- --fs-12 muted
24 melodies                           <- --fs-16 mono
[####genre bar 8px####]  colinda 12, joc 7, cantec 5   <- top 3 genres as text
1909-1917                             <- year span, "n.d." when none; "1912 and n.d." when mixed
8 recordings, 24 notations            <- audio/notation counts, omit a zero
Click to filter to this village       <- hint line, --fs-11 muted
```

County card (county mode): county `PlaceLabel`, region / country, "312 melodies in 34
villages", genre bar with top 3, year span, "18 villages not mapped" if any, hint "Click to
zoom to this county". Cluster: no card (the cluster icon carries the count).

The card is also what the `MapAccessibleList` items expand to when focused (same
component, rendered inline under the list item rather than positioned). That list is the
"List counties" (county mode) or "List villages" (village mode) control of AC-27.

## 5. Click behaviour

| Target                      | Effect on Query                                                            | View                              |
|-----------------------------|----------------------------------------------------------------------------|-----------------------------------|
| county bubble               | `setQuery({ county: id })` (ancestors filled, village cleared)             | fit to county bbox -> village mode |
| county bubble when selected | `setQuery({ county: undefined })`                                          | fit to Romania                    |
| village dot                 | `setQuery({ village: id })` (ancestors filled)                             | no zoom; pan only if off-screen   |
| village dot when selected   | `setQuery({ village: undefined })` (county stays)                          | none                              |
| cluster                     | none                                                                       | zoom to cluster bounds            |
| empty map                   | none (does not clear selection; the chip does)                              | none                              |
| "Open county page" in card  | navigate `/county/:id?<query>`                                             |                                   |

Double-click on a point is a normal double-click zoom (Leaflet default) and does not
toggle twice: the click handler ignores the second click within 300 ms when a zoom
occurred.

## 6. Map points from the Query

```ts
interface MapPoint {
  placeId: string; level: 'county' | 'village';
  lat: number; lon: number;
  count: number;
  genreCounts: Partial<Record<GenreId, number>>;
  dominantGenre: GenreId;
  yearMin?: number; yearMax?: number; unknownYear: number;
  audioCount: number; notationCount: number;
  villageCount?: number; unmappedVillages?: number;   // county level only
  selected: boolean; highlighted: boolean;
}
```

Built from `filteredSongs`: group by `placeId` (village mode) or by county ancestor
(county mode), skip groups whose place has no coordinates and add them to
`unmappedCount`. Points are recomputed when `filteredSongs` or the level changes, not on
pan. In county mode with a `village` selected (possible via URL) the map switches to
village mode.

## 7. Historical and modern names together

Every place has `name.modern` and/or `name.historical`. Display rules, implemented once in
`PlaceLabel` and reused in the tree, hover card, chips, tables and the song rail:

1. Both present and different (after `normalize`): `Modern (Historical)`, e.g.
   "Beius (Belenyes)" rendered as `Beiuș (Belényes)`; the parenthesised part is
   `--muted`, `--font-mono` at one size step smaller, and wrapped in `<span lang="hu">`
   (or the language the data gives).
2. Both present and equal: modern only.
3. Only modern: modern only.
4. Only historical: `Historical` followed by a small "historical name" marker
   (`title="Historical name; modern name unknown"`, visually the mono text plus an
   asterisk), so the user knows the modern name is missing.
5. Counties: same rule, e.g. "Bihor (Bihar)", "Mures (Maros-Torda)". Regions and countries
   are shown by modern name only; the historical county alone carries the old
   administrative context.
6. Search matches both names; sorting uses the modern name and falls back to the
   historical one.
7. In map labels (county count labels, cluster tooltips) only the modern name is used, to
   keep labels short; the hover card shows both.

The order is always modern first because the app's frame is present-day Romania; the
historical Hungarian name is the key that links back to the source databases, which is
why it is in mono (it reads as a code, like the reference number).

## 8. Records with no coordinates

Songs whose place has no `lat` / `lng` (`location.lat` null; in `places.json` these live
under `<cc or xx>/unresolved/<slug>`), or whose place is only known to county level and the
county has no centroid, are never on the map. Places with `confidence: 'low'` or
`coordSource: 'gazetteer-approx'` are mapped but carry the "location uncertain" text
marker in the hover card and the tree (`PlaceLabel`).

- `unmappedCount` is shown in three places: the `NotMappedNotice` inside the map panel
  (bottom-right above attribution, `--surface` pill: "312 not mapped"), the StatusBar
  ("1,204 melodies, 312 not mapped"), and the county hover card ("18 villages not mapped").
- The notice is a link to the same Explorer with `unmapped=1`. In that mode the map panel
  is replaced by an `EmptyState` ("Showing 312 melodies without coordinates. These places
  could not be located; they are still listed in the place tree.") with "Back to map"
  (clears `unmapped`), and the results list shows only those songs. All other filters
  still apply, and the `unmapped` chip appears in the chip row.
- In the place tree and the villages table such places carry a text marker "not mapped";
  selecting them works as usual (the map simply shows nothing selected and the
  `NotMappedNotice` reads "Selected place is not mapped").
- Song rail "Where" shows "Coordinates: not mapped" and omits the mini map.

## 9. Offline / no-tiles fallback: SVG county map

The tile server may be unreachable (offline demo, corporate proxy, or the container
policy seen during development). The county-level view must still work.

Assets (built once, committed under `data/geo/`):

- `ro-counties.geo.json`: simplified admin-1 polygons for Romania's 41 counties plus
  Bucharest, with `id` matching the county place ids and `name.modern`. Source: Natural
  Earth 10m admin-1 (public domain) or geoBoundaries ADM1 (CC BY 4.0, then credited in the
  footer); simplified with mapshaper to about 100-150 KB. Because historical localities may
  fall outside Romania, also include the neighbouring countries' outlines at admin-0
  (`neighbours.geo.json`, ~40 KB) so points there are not floating in blank space.
- County centroids come from `places.json` (`lat` / `lng` of county nodes, `coordSource`
  `centroid-of-children` or from this file); the county bbox is computed at load from the
  polygon when present, else from the village points.

`SvgMap` component (`{ points: MapPoint[]; selected; onSelect; bounds; mode: 'country' | 'county' }`):

- Inline `<svg viewBox>` with a Mercator projection implemented in ~20 lines (no d3
  dependency required, though `d3-geo` is acceptable if the choropleth needs
  `geoPath`); `preserveAspectRatio="xMidYMid meet"`, fills `--map-land` / stroke
  `--map-county-stroke`, water `--map-water` as the background.
- Country mode: county polygons with the choropleth fill (section 3.1) and centroid
  bubbles drawn as `<circle>` inside `<g role="button" tabindex=0>` with `aria-label`;
  same hover card and click behaviour; hovering a polygon highlights it.
- County mode: the viewBox is the county bbox with 10% padding; village dots as
  `<circle>` with the same size formula and selected state (two `<circle>` rings);
  neighbouring counties drawn greyed for context. No free pan or zoom; "Fit to Romania"
  returns to country mode. This is enough for the County page's local map and for the
  Explorer's core interactions.
- Clustering is replaced by a simple grid merge: dots closer than 12 px in the current
  viewBox merge into one dot with the summed count (deterministic, by id order).
- Attribution line changes to the boundary data credit.

Switching logic in `MapPanel`:

1. `?map=svg` in the URL forces the SVG map (also useful for tests and screenshots).
2. `navigator.onLine === false` at mount selects the SVG map.
3. The Leaflet `TileLayer` counts `tileerror` events; if the first 4 tiles requested all
   fail within 5 s of mount, or no `load` event arrives within 8 s, `MapPanel` swaps in
   `SvgMap` and shows a one-line notice "Map tiles unavailable; showing county outlines"
   with a "Try tiles again" button. The swap keeps the selection and hover state because
   both components take the same `MapPoint[]` and `Query`.
4. The static mini map on the Song page always uses `SvgMap` (no tiles, no network).

The same GeoJSON is what phase 2 uses for the Leaflet choropleth, so there is no
duplicate asset.

## 10. Decisions to confirm

- D1: `nMax` for dot sizing is the maximum within the current filtered set, not the global
  maximum. Dots are therefore comparable within a view, not across filters.
- D2: OSM public tiles for phase 1; CARTO Positron or MapTiler if traffic or the greyscale
  look justify it; MapLibre only after phase 1 ships.
- D3: County boundaries from Natural Earth (public domain) unless the scraper team finds a
  better match for the county ids; geoBoundaries is the alternative and requires a credit.
- D4: Map click on a county narrows the Explorer; the County page is reached through the
  explicit "Open county page" action, not by a map click.
- D5: Journey border layers use `clip-path` on Leaflet panes for the swipe, a custom
  arrow layer, and lazily loaded GeoJSON; no extra Leaflet plugins beyond markercluster.
- D6: Border sets are keyed by year (`1910`, `1920`, optional `1914`) as AC-40 expects, and
  the era cutoff is 1918-01-01 (AC-40), not the Trianon date; the data agent confirms.

## 11. Journey mapper layers

Used by `JourneyMap` on `/journeys` (FRONTEND-SPEC section 14) and by its phone variant.
The base map, controls, focus model and SVG fallback are the same as above; this section
adds the route, stop and border layers. Acceptance: AC-39 to AC-44.

### 11.1 Layer order

Bottom to top: tiles (filtered greyscale as in section 1), border fills "now", border
fills "then", border lines "now", border lines "then", compare divider, route casing, route
line, direction arrows, dimmed explorer dots (optional, off by default), stop markers,
selected stop, hover card. Each is its own Leaflet pane so z-order never depends on
insertion order: `pane-borders-now` 410, `pane-borders-then` 415, `pane-route` 430,
`pane-stops` 440 (Leaflet's marker pane is 600 and is not used here).

### 11.2 Route

- Geometry: one polyline per leg between consecutive resolved points, in order: departure
  -> stop 1 -> ... -> stop n -> return. Great-circle interpolation is unnecessary at this
  scale; straight segments in Web Mercator. Legs whose either end is unresolved are not
  drawn; the gap is shown by a small "n stops without coordinates" note in the legend and
  by the numbering jump on the markers.
- Style, light mode: casing 5 px `--surface` at 90% opacity under a 2.5 px `--accent`
  line, `lineJoin: round`, `lineCap: round`. Dark mode: casing `--ground`, line `--accent`
  (dark accent). Contrast of the accent line against the filtered tiles is at least 3:1
  in both modes because the tile pane is desaturated and lightened (light) or darkened
  (dark); the casing guarantees separation over any tile.
- Leg kinds: `known` solid; `assumed` (departure or return flagged `assumed: true`)
  dashed `8 6`; the whole route of a `fuzzy` trip dotted `2 6`; the return leg at 60%
  opacity. The legend names all three patterns.
- Direction arrows: an arrowhead every 96 px of screen length (recomputed on `zoomend`),
  drawn as `divIcon` markers (12 px SVG chevron in `--accent` with a 1 px `--surface`
  outline) rotated to the leg bearing; `interactive: false`, `aria-hidden`. Not drawn on
  legs shorter than 48 px on screen. (Implementation: a small custom layer; do not add
  `leaflet-polylinedecorator` unless the custom one proves harder than 60 lines.)
- Distance label: none on the map; the km figure lives in the header and the stop list.

### 11.3 Stop markers

- Marker: `divIcon` with a `<button>`; a 26 px circle, fill `--surface`, 1.5 px stroke
  `--ink`, the stop number centred in mono `--fs-12` `--fw-medium` `--ink` (12.6:1).
  Departure and return: 18 px squares with "D" / "R" in `--fs-11`. Tab order = stop order.
  Hover: stroke 2.5 px; selected (`query.stop`): the two-ring halo of section 3.4 and
  `zIndexOffset` 1000. Stops with no melodies matching the active filters render at 45%
  opacity with the number still legible; the `aria-label` adds "0 of n melodies match the
  filters".
- Two stops at the same coordinates (a place visited twice) are offset by 8 px along the
  route bearing so both numbers show; the hover card lists both visits.
- Hover / focus card: number, "Belényes (1909) -> Beiuș (today)" with `lang` spans,
  `VillageStatusBadge`, modern county, dates, "12 melodies", top three genres, stated
  ethnicities, instruments, "Show melodies" and "Select stop" actions (touch: bottom
  sheet). Village status comes from `villages.json`; missing entries show "status unknown"
  (AC-41).
- No clustering on this map. If a trip has more than 60 stops, numbers are hidden below
  zoom 8 and shown again above it.

### 11.4 Border layers

Data: `data/geo/borders-<era>.json` (1910, 1920, optionally 1914) and `borders-now.json`,
GeoJSON `FeatureCollection`s with `properties.kind` = `state` | `county` and
`properties.name` (plus `nameHistorical` where relevant). Simplified for the web (target
< 250 KB each); loaded lazily on first visit to `/journeys` and cached for the session.

| Set   | Fill                                      | Line, counties                                   | Line, state frontier                              |
|-------|-------------------------------------------|--------------------------------------------------|---------------------------------------------------|
| then  | `--ink` at 6% (light) / `--ink` at 8% (dark) | 1.5 px `--ink-2`, dash `6 4`                    | 2.5 px `--ink`, dash `10 4 2 4` (long-short)      |
| now   | `--accent` at 5% (light) / 7% (dark)       | 1 px `--line-strong`, solid                      | 2 px `--line-strong`, solid                       |

Line styles differ by dash pattern, weight and colour, so the two sets are separable in
greyscale and with reduced colour vision; the legend shows the actual line samples. Fills
stay under 10% so tiles and the route remain readable; polygons are non-interactive
(`interactive: false`) except for a `title`-less hover that shows the county name in the
legend's "under pointer" line (then-name and now-name side by side, "Bihar (1910) /
Bihor (now)").

Modes (`borders` in the URL, AC-40): `1910` or `1920` shows only that "then" set; `now`
only the modern set; `both` shows both with the compare control:

- Compare, swipe: a vertical divider (2 px `--ink`, handle 44 x 44 px at mid-height with a
  double-chevron icon) clips the "then" panes to its left and the "now" panes to its right
  using `clip-path` on the pane elements (updated on move, zoom and resize). The handle is
  the visual twin of the `<input type="range">` in `BorderToggle`; dragging it writes the
  range value, and arrow keys on the range move the divider 2% per step (10% with Shift).
- Compare, fade: the same range sets the opacity of the "then" panes from 0 to 1 over the
  "now" panes; no clipping.
- The default era is picked from the trip date (before 1918: 1910; from 1918: 1920). The
  legend title reads "Borders 1910 (Kingdom of Hungary counties)", "Borders 1920 (after
  Trianon)", "Borders now (states and județe)" or "Comparing 1910 and now".

### 11.5 Legend and controls

`JourneyLegend` (bottom-left) lists: route line (solid known, dashed assumed, dotted
approximate, lighter return), arrow meaning, stop marker sample, departure / return
square, the active border set(s) with their line samples, and, when relevant, "n stops
without coordinates". Controls: zoom in / out, "Fit to route", `BorderToggle` (top-right),
"List route (n stops)" disclosure after the map (the ordered-list fallback, AC-44).

### 11.6 Attribution

The map's attribution control shows, in addition to the tile and county credits: "Historical
borders: <dataset name>, <licence>" for each loaded era file, with the text taken from each
file's `properties.attribution` at the collection level so the credit always matches the
data actually shipped. Expected sources per PLAN.md: historical-basemaps (aourednik,
CC BY-SA 4.0), GISta Hungarorum (1910 counties), Natural Earth (public domain); the
definitive list and licence wording is `GEO-SOURCES.md`. The footer repeats the credits on
`/journeys` (FRONTEND-SPEC section 15).

### 11.7 Fallback and empty states

- SVG fallback (section 9) draws the route, arrows, numbered stops and border polygons
  with the same styles; the swipe divider becomes a fade (opacity) control only.
- No trip selected: Romania fit, modern borders, no route; the prompt is in the panel.
- Fewer than two resolved points: no route, markers for the resolved points only, legend
  note "Route cannot be drawn: fewer than two located stops".
- Border file failed to load: border layers off, `BorderToggle` disabled with "Border
  layers unavailable", route still drawn.
