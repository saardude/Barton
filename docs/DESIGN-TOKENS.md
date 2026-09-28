# Design tokens

Companion to `app-tokens/tokens.css` (the file the app will import). This document
explains each token group, records the contrast figures that were verified, and states the
rules for using them. Values here and in the CSS file must stay identical; if they drift,
the CSS file wins and this document is corrected.

Contrast ratios were computed with the WCAG 2.x relative-luminance formula (sRGB), see
`scratchpad/contrast.py` in the design session; the numbers below are copied from that run.
Targets: text >= 4.5:1 (AA), large text and UI components / graphical objects >= 3:1
(1.4.3, 1.4.11). Decorative hairlines are exempt and are marked as such.

## 1. Colour, light mode (default)

| Token          | Hex       | Role                                     | vs ground | vs surface |
|----------------|-----------|------------------------------------------|-----------|------------|
| `--ground`     | `#f4f2ec` | page background                           | 1.00      | 1.12       |
| `--surface`    | `#ffffff` | cards, rails, tables, popovers            | 1.12      | 1.00       |
| `--surface-2`  | `#faf9f5` | zebra rows, wells                         | -         | -          |
| `--ink`        | `#1c1b18` | primary text                              | 15.38     | 17.22      |
| `--ink-2`      | `#3a3833` | secondary text, mono dot fill             | 10.46     | 11.71      |
| `--muted`      | `#5c5952` | captions, counts, historical names        | 6.24      | 6.99       |
| `--ink-3`      | `#767268` | placeholder text (surface only)           | 4.29 (fail AA text) | 4.80 |
| `--line`       | `#d9d6cd` | decorative hairlines, zebra separators    | 1.30      | 1.45       |
| `--line-strong`| `#8a877e` | input and component boundaries            | 3.21      | 3.59       |
| `--accent`     | `#b5502e` | links, selected, primary action, focus    | 4.52      | 5.06       |
| `--accent-soft`| `#ecd9cf` | selected row and chip background          | 1.22      | 1.36       |
| `--accent-ink` | `#ffffff` | text on solid accent                      | 5.06 on accent | -     |
| `--ok`         | `#2f7a4a` | "has audio", success                      | 4.69      | 5.25       |
| `--warn`       | `#8a6a0e` | partial data, caution                     | 4.52      | 5.06       |
| `--err`        | `#a3322a` | errors                                    | 6.16      | 6.89       |

Rules:

- `--ink` on `--accent-soft` is 12.62:1, `--muted` on `--accent-soft` is 5.12:1, so both
  may be used inside selected rows and chips. `--accent` on `--accent-soft` is 3.71:1:
  allowed for icons and borders, not for text.
- `--ink-3` is below AA for body text on `--ground` (4.29) and only just above it on
  `--surface` (4.80). Use it only inside `--surface` inputs as placeholder text, and never
  for information that has no other representation.
- `--line` is decorative only (1.30). Anything that must be perceivable as a boundary
  (inputs, checkboxes, table header rule, chip outline) uses `--line-strong` (3.21).
- `--accent` is a text colour on `--ground` and `--surface` at exactly AA (4.52 / 5.06).
  Do not lighten it. Links are underlined so colour is not the only cue.

## 2. Colour, dark mode

Applied automatically under `prefers-color-scheme: dark` unless the document sets
`data-theme="light"`, and forced by `data-theme="dark"`. Same token names.

| Token          | Hex       | vs ground `#161513` | vs surface `#201f1c` |
|----------------|-----------|---------------------|----------------------|
| `--ground`     | `#161513` | 1.00                | 1.11                 |
| `--surface`    | `#201f1c` | 1.11                | 1.00                 |
| `--surface-2`  | `#262521` | -                   | -                    |
| `--ink`        | `#ecebe6` | 15.29               | 13.81                |
| `--ink-2`      | `#cfcdc6` | 11.47               | 10.36                |
| `--muted`      | `#a9a69d` | 7.50                | 6.77                 |
| `--ink-3`      | `#8f8c83` | 5.43                | 4.90                 |
| `--line`       | `#3a3833` | 1.56 (decorative)   | 1.41                 |
| `--line-strong`| `#6f6c64` | 3.48                | 3.14                 |
| `--accent`     | `#e0743f` | 5.86                | 5.29                 |
| `--accent-soft`| `#4a2a1c` | ink on it 10.73     | -                    |
| `--accent-ink` | `#161513` | 5.86 on accent      | -                    |
| `--ok`         | `#8bd19b` | 10.16               | -                    |
| `--warn`       | `#e6c25c` | 10.63               | -                    |
| `--err`        | `#f08a80` | 7.52                | -                    |

The dark accent is a lightened version of the brand rust; the light accent `#b5502e`
would be only 3.61:1 on the dark ground, which is why a separate value exists.

## 3. Genre palette (categorical)

Used for map dots in "colour by genre" mode, the stacked genre bars in the villages
table and county tabs, the genre swatch next to each result row, and the legend. The six
values were chosen so that they step in CIE lightness (about 6.5 L* apart) and differ in
hue, so the sequence stays legible for people with reduced colour vision and in greyscale
print. All were checked against the ground colour and against the surface colour.

Light mode (each value also lists white-on-swatch, used for count labels inside bars
of at least 24 px height; below that, labels go outside the bar in `--ink`):

| Genre    | Token             | Hex       | L*   | vs ground | vs surface | white on it |
|----------|-------------------|-----------|------|-----------|------------|-------------|
| bocet    | `--genre-bocet`   | `#3d3b37` | 24.9 | 9.98      | 11.18      | 11.18       |
| colinda  | `--genre-colinda` | `#1d4b75` | 30.8 | 8.10      | 9.07       | 9.07        |
| doina    | `--genre-doina`   | `#93401f` | 37.8 | 6.27      | 7.01       | 7.01        |
| joc      | `--genre-joc`     | `#2d7647` | 44.2 | 4.94      | 5.54       | 5.54        |
| nunta    | `--genre-nunta`   | `#9a68a6` | 51.3 | 3.82      | 4.28       | 4.28        |
| cantec   | `--genre-cantec`  | `#bf7a1e` | 57.2 | 3.12      | 3.49       | 3.49        |
| other    | `--genre-other`   | `#8a877e` | -    | 3.21      | 3.59       | hatched, no label |

Dark mode (order of lightness reversed so the darkest genre stays the "heaviest"):

| Genre    | Hex       | L*   | vs ground | vs surface | dark ink on it |
|----------|-----------|------|-----------|------------|----------------|
| colinda  | `#5a9fd8` | 63.3 | 6.42      | 5.80       | 6.42           |
| doina    | `#ef9573` | 70.2 | 8.01      | 7.23       | 8.01           |
| joc      | `#79c68a` | 73.7 | 8.91      | 8.05       | 8.91           |
| nunta    | `#d8c2ea` | 81.4 | 11.14     | 10.07      | 11.14          |
| cantec   | `#f6d08c` | 85.3 | 12.44     | 11.24      | 12.44          |
| bocet    | `#e4e1d8` | 89.5 | 13.96     | 12.60      | 13.96          |
| other    | `#6f6c64` | -    | 3.48      | 3.14       | -              |

Rules:

- The genre colour is never the only cue. Dots carry a hover card and an accessible
  list; bars carry a legend and a text count; result rows show the genre name.
- The palette is not used for text. Genre names in running text use `--ink`.
- Two-ring selection on the map: the accent ring alone fails against several genre
  fills (accent vs joc is 1.09:1), so the selected dot gets an inner halo
  `--map-halo` (white in light mode, minimum 3.49:1 against every light genre fill) and
  an outer `--map-select` ring (accent, 4.52:1 against ground). Dark mode mirrors this
  with a `#161513` halo (minimum 6.42:1 against every dark genre fill).

## 4. Typography

Fonts: IBM Plex Sans (400, 500, 600) and IBM Plex Mono (400, 500) from Google Fonts,
loaded with `display=swap`; the system stacks in `--font-sans` and `--font-mono` render
until the webfont arrives. Load only Latin + Latin Extended subsets (Romanian and
Hungarian diacritics live in Latin Extended; make sure the Google Fonts URL includes
`&subset=latin,latin-ext` or that the default `unicode-range` covers U+0100-024F and
U+0218-021B, the comma-below s and t).

Example link tag:

```
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

Scale (token, px, use):

| Token     | px | Line height   | Use                                                   |
|-----------|----|---------------|-------------------------------------------------------|
| `--fs-11` | 11 | `--lh-snug`   | mono annotations, axis ticks, status bar query string |
| `--fs-12` | 12 | `--lh-snug`   | captions, counts, chips, table meta, reference codes  |
| `--fs-13` | 13 | `--lh-normal` | table cells, rail labels, hover card body             |
| `--fs-14` | 14 | `--lh-normal` | body, result rows, inputs (desktop)                   |
| `--fs-16` | 16 | `--lh-normal` | lead text, inputs on touch (prevents iOS zoom), song text |
| `--fs-24` | 24 | `--lh-tight`  | county title, section headings                        |
| `--fs-36` | 36 | `--lh-tight`  | song title                                            |
| `--fs-40` | 40 | `--lh-tight`  | explorer masthead ("Bartok / Romania")                |

Uppercase mono labels ("WHERE", "SOURCE", facet group headings) use `--fs-11`,
`--fw-medium`, `letter-spacing: var(--tracking-caps)`, colour `--muted`.

Minimum text size anywhere is 11 px and 11 px text is always mono and >= 6.24:1.

## 5. Spacing

4-based scale: `--space-1` 4, `-2` 8, `-3` 12, `-4` 16, `-5` 20, `-6` 24, `-8` 32,
`-10` 40, `-12` 48, `-16` 64. Component padding uses 8/12/16; section gaps use 24/32;
page gutters use 16 on phone and 24 on desktop. Do not introduce 6, 10 or 14.

Layout constants: `--rail-w` 280, `--results-w` 360, `--topbar-h` 56, `--statusbar-h` 32,
`--bottomtabs-h` 56, `--content-max` 1440, `--target-min` 44.

## 6. Radii

`--radius` resolves to `--radius-0` (0) to match the wireframe. `--radius-1` (4 px) is a
one-line opt-in: set `--radius: var(--radius-1)` on `:root` and every card, input, chip
and button follows. `--radius-pill` is reserved for filter chips and map dots.

## 7. Borders

- `--border` (1 px `--line`): row separators, card edges on `--surface`.
- `--border-strong` (1 px `--line-strong`): inputs, checkboxes, table header rule,
  chip outline, anything that must read as a control.
- `--border-accent` (2 px `--accent`): left edge of the selected result row, active tab
  underline, active bottom tab.

## 8. Focus ring

`:focus-visible { outline: 2px solid var(--focus-color); outline-offset: 2px; }`.
`--focus-color` is the accent in both modes (4.52:1 on light ground, 5.86:1 on dark
ground, 5.06:1 on white surface). On elements that already have an accent border, add
`box-shadow: 0 0 0 4px var(--ground)` behind the outline so the ring stays separated.
Map dots and clusters show the same ring around the marker element; the Leaflet default
blue focus outline is disabled.

## 9. Z-index layers

`--z-base` 0, `--z-sticky` 10 (sticky headers), `--z-map-ctl` 20 (zoom, legend, layer
toggle), `--z-hover` 30 (map hover card), `--z-dropdown` 40 (sort select, menus),
`--z-sheet` 50 (phone filter sheet, lightbox, scrim), `--z-toast` 60, `--z-skip` 100
(skip link when focused). Leaflet's own panes stay below 1000 by default; the map
container gets `isolation: isolate` so its panes cannot escape above `--z-hover`.

## 10. Motion

`--dur-fast` 120 ms for hover and focus, `--dur-base` 200 ms for sheet and card entry,
one easing. Both durations collapse to 0 under `prefers-reduced-motion: reduce`; map
`flyTo` becomes `setView` under the same query.
