# Print sources: Bartók, *Rumanian Folk Music* (RFM) from the Internet Archive scans

Status: first pass complete (2026-09-28). Output: `data/rfm.json` (750 records), pipeline in
`print/`. Owner: print-source data engineer. Companion docs: CONTEXT.md, DATA-SCHEMA.md.

## What was used

Béla Bartók, *Rumanian Folk Music*, ed. Benjamin Suchoff, The Hague: Martinus Nijhoff,
1967-1975 (Bartók Archives Studies in Musicology). Five volumes; only two are open on the
Internet Archive with machine-generated OCR:

| Volume | Internet Archive item | Availability | Used |
| --- | --- | --- | --- |
| I, Instrumental Melodies (1967) | `rumanianfolkmusi0001bela` | access-restricted lending item (`inlibrary`) | **not available as open text**; nothing was downloaded, borrowed or extracted |
| II, Vocal Melodies (1967) | `rumanianfolkmusi0002bela` | access-restricted lending item (`inlibrary`) | **not available as open text**; nothing was downloaded, borrowed or extracted |
| III, Texts (1967) | none found (`advancedsearch` on title/creator and on the `rumanianfolkmusi*` identifier prefix) | no item | not used |
| IV, Carols and Christmas Songs (Colinde) (1975) | `rumanianfolkmusi0004blab` | open (no `access-restricted-item` flag), OCR present | yes |
| V, Maramureș County (1975) | `rumanianfolkmusi0005blab` | open, OCR present | yes |

Files fetched per open item (into `print/raw/`, git-ignored): `<id>_djvu.txt` (plain OCR),
`<id>_djvu.xml` (OCR with per-word coordinates and confidence), `<id>_scandata.xml` (leaf
list), `<id>_page_numbers.json` (printed page numbers per leaf), and the item metadata. The
PDF and page images were not downloaded. Fetching runs at 1 request/s with the project
User-Agent; the `/download/` endpoint answered 500 from the datanode for vol. IV on
2026-09-28, so `print/fetch.mjs` falls back to `https://archive.org/cors/<id>/<file>`. Behind
this container's proxy run it as `NODE_USE_ENV_PROXY=1 node print/fetch.mjs` (Node's built-in
fetch ignores `HTTPS_PROXY` otherwise).

Page links: `https://archive.org/details/<id>/page/n<k>` where `k` is the 0-based index of
the page in the item's BookReader sequence. It equals the index of the `<OBJECT>` in
`djvu.xml` and `leafNum - 1` (leaf 0, the colour card, is not in the access formats);
verified against the BookReader page list for vol. IV (656 pages both ways). The printed
page number, when the Archive detected it, is kept in `rawFields.printedPage`.

## Licence and copyright position

The volumes are in copyright (Bartók estate and the editor; Nijhoff/Springer 1975). The
Internet Archive serves them as open scans, which is not a licence to republish. This
pipeline therefore indexes **facts only** and links to the exact scanned page:

- indexed: melody number, class/genre, phonograph record number, village and county as
  printed, performer name/age/sex as printed, month and year, the first line of the sung
  text as an identifier (`title`/`incipit`/`text` all hold only that first line), and the
  page link;
- not reproduced: notation, full song texts, translations, notes, any page image. The
  `media.notation` entry is the page link on archive.org, not a mirrored image.

Attribution to print on the record page: "Bartók, Rumanian Folk Music, vol. IV/V (ed. Suchoff,
1975), scan on the Internet Archive", with the page link. See CONTEXT.md for the ZTI
attribution that applies to the other sites.

## Layout of the volumes (what the parser relies on)

Both volumes print the Music Examples as one melody after another, each with:

1. an optional centred **class heading** that opens a group ("A I.", "A II. a)" in vol. IV;
   "A 2.", "C II. 3.)" in vol. V);
2. the bold **melody number** left of the first staff: "1a.", "2.*", "12bb." (letters run
   a-z then aa, bb, ...; an asterisk means there is a note in the Notes to the Melodies);
3. the sung **incipit** under the staff, in vol. IV prefixed by the Part Two text number
   ("89 b." or "(142.)");
4. the **data line** below the notation:
   - vol. IV: `[F. 1174 c),] Șoimi (Bihor), Ion Moț (45), II. 1914.` = optional phonograph
     record (F. = Bartók's own recording, M.F. = Museum phonograph), village (county in
     Bartók's Romanian spelling: Bihor, Hunedoara, Mureș-Turda, Torontal, Timiș, Arad,
     Turda-Arieș, Sătmar, Alba de jos, Cluj, Solnoc-Dobâca), performer(s) with age, month
     in Roman numerals, year;
   - vol. V: `[F. 2133 b),] Dragomirești, Erina Vlad (26).` = record, village, performer(s)
     and age. No county (the whole volume is Maramureș) and no date: all melodies come from
     Bartók's trip of March 15-27, 1913 (Introduction to Part One), which is what
     `collected` holds, with `collected.raw` saying so.

Printed totals used as the yardstick:

- vol. IV: "including variants, 454 melodies are published here" (Preface, p. 1); numbers
  1-133 with letter variants; 11 counties, roughly 100 villages, 1909-1917.
- vol. V: Statistical Data Concerning the Output in Villages: 375 items in 12 villages;
  Systematic Index of Melodies: 209 numbers. Classes by number: A Colinde 1-19,
  B mourning songs 20-22, C I Hora lungă 23, C II Hore 24-135, D dance melodies 136-192
  (I free form 136-163, II strict form 164-192), E instrumental (alphorn, fluier, violin)
  193-209.

Independent evidence used for the melody numbers: in vol. IV every text in Part Two ends
with "(21b. Urviș)", the melody label and village; the Notes to the Melodies in both
volumes are headed by labels ("12b.c. *Change song."); in vol. V each text is headed by its
number and closed by "(Village)".

## Parsing approach (`print/parse-rfm.mjs`)

1. `lib/djvu.mjs` reads `djvu.xml` into pages of lines (words joined, lines sorted by y then
   x, so the reading order is recovered even where the OCR emitted regions out of order),
   plus the leaf and printed-page lookups.
2. `lib/rfm4.mjs` / `lib/rfm5.mjs` walk the Music Examples pages (from the "Music Examples"
   heading page to the "Notes to the Melodies" heading) and classify lines: page number,
   class heading (centred), melody-number token (left margin, tall glyphs), incipit
   candidate, data line. Data lines are anchored on what survives OCR best: the county
   parenthesis in vol. IV (fuzzy-matched, so "Hunedioara", "Mures - Turda", "@ihor)" all
   resolve) and the twelve village names or the "F. nnnn x)" record in vol. V. The village
   is the trailing run of digit-free words before the county; the record reference, the
   performer, the Roman month (OCR "Il", "XL", "XT", "VIL", "Xf" are mapped) and the year
   are taken from either side. A second pass rescues vol. IV lines whose county was lost,
   by the village names seen on other lines, and normalises OCR-damaged village spellings
   against them; in vol. V a line whose village dropped out gets it from the phonograph
   number (one cylinder = one village).
3. `lib/labels.mjs` builds the ordered list of printed labels per volume. Variant letters are
   contiguous, so the highest letter seen for a number fixes its variant count. Sources are
   ranked: Part Two references and Notes headings (vol. IV), page tokens and text headings
   (vol. V) are trusted; OCR-noisy sources may only add one or two letters above them, or up
   to two or three letters when nothing else is known. OCR "120." is read as "12o.", "621."
   as "62l.", "8la." as "81a.".
4. `lib/align.mjs` aligns the label list with the ordered data lines (global sequence
   alignment). Score: village on the data line vs village known for the label (+3/-3 in
   vol. IV, +1.5/-1 in vol. V where the text-heading villages are less reliable), melody
   number token caught on the page (+5 when it agrees, -3 when it disagrees; tokens are first
   filtered to their longest non-decreasing run, which removes stanza and text numbers read
   as melody numbers), and "phantom" continuation variants after each number's last known
   variant (small cost) so that a variant the references never mention is taken as N-(x+1)
   instead of pushing later labels out of step. A label without a data line means the OCR
   lost that data line; a data line without a label gets a provisional id `rfm-4-<prev>-x1`.
5. `lib/record.mjs` builds the schema record: id `rfm-<vol>-<label>`, `source.siteId`
   "RFM IV No. 12b", the page URL, `referenceCode` = phonograph number normalised to
   "F. 1174 c)" / "M.F. 1457 b)", genre (vol. IV: `colinda`, `genreRaw` "Colinda, class A II.
   a)"; vol. V: class by number range mapped to colinda / bocet / doina / cantec / joc /
   other, `genreRaw` the class name plus the printed heading), performance (vocal, or
   instrumental for vol. V classes D and E with the instrument from the line or the
   Systematic Index), performer (name as printed; first age; sex from Romanian first names
   and words like feciori / fete / muiere / om; ethnicity "Roma (printed: țigan)" when the
   line says so, else "Romanian"), location resolved through `data/gazetteer.json` (read-only,
   via `scraper/src/gazetteer.js`) plus `print/places-rfm.json`, a 60-place supplement for
   the RFM villages the seed gazetteer lacks (approximate coordinates, confidence flagged;
   county-only entries have null coordinates), `rawFields` with the exact OCR data line
   (`header`), the raw tokens and an `ocrConfidence` sentence.

Everything is deterministic: rerunning `node print/parse-rfm.mjs` on the same raw files
yields the same `data/rfm.json` except `_meta.generatedAt` and `source.fetchedAt`.

## Counts (printed vs parsed)

| | Vol. IV (Colinde) | Vol. V (Maramureș) |
| --- | --- | --- |
| Printed melodies (incl. variants) | 454 | 375 |
| Labels recovered from the volume's own references | 444 | 298 |
| Data lines found on the notation pages | 413 | 337 |
| Records written | 413 (91 %) | 337 (90 %) |
| Labels with no data line found (OCR lost the line) | 55 | 8 |
| Records with a provisional id (`-x1`) | 8 | 1 |
| Melody-number confidence high / medium / low / none | 100 / 233 / 408 / 9 over both volumes |
| Location resolved to a village with coordinates | 746 of 750 (2 county-only, 2 unresolved: "Bit Tritul de jos (Turda-Arieș)", "Lona (Solnoc-Dobâca)") |

The ~10 % gap is entirely OCR: on notation pages the engine drops whole text lines that sit
between staves (the data line of vol. IV no. 1a, Șoimi, is missing from the OCR although it
is perfectly legible on the scan). The labels without a data line are listed in
`_meta.missingLabels` so a human can add them from the page.

Vol. IV records per historical county: Maros-Torda 102, Bihar 96, Hunyad 78, Torontál 40,
Alsó-Fehér 24, Torda-Aranyos 20, Temes 17, Arad 15, Szatmár 12, Kolozs 5, Szolnok-Doboka 4;
years 1909-1917 (18 lines without a readable date). Vol. V records per village: Ieud 63,
Oncești 50, Dragomirești 38, Vișeu de Jos 31, Poienile Izei 28, Văleni 25, Bocicoiel 23,
Glod 20, Bogdan Vodă (Cuhea) 20, Petrova 18, Nănești 12, Breb 9; genres cântec 166, joc 90,
colinda 34, other (alphorn/fluier/violin) 21, bocet 18, doina (hora lungă) 8.

Gate run: `node qa/checks/data-gates.mjs --file data/rfm.json --journeys /nonexistent
--villages /nonexistent` gives `Summary: 8 pass, 5 warn/skip, 0 blocking fail (of 13 gates)`
and ajv reports 0 invalid records. Without the two overrides the `journeys-valid` and
`villages-valid` gates fail, because they check `data/journeys.json` stop ids against the
records in the file under test, and those ids belong to `data/songs.json`; the gates need a
"records file is not songs.json" rule before rfm.json can be gated in CI unmodified. Two
schema-level changes were needed and are the only edits outside `print/`, `data/rfm.json`
and this file: `data/schema/song.schema.json` accepts the `rfm` site and id prefix, and
`qa/checks/data-gates.mjs` accepts `archive.org` as a source host.

## Known OCR failure modes

- **Diacritics**: ă â î ș ț are read as a, a/á/4, i/î, s/$/g, t/f; "Șoimi" -> "Soimi",
  "Dragomirești" -> "Dragomiresti"/"Dragomire$ti", "Nănești" -> "NAanesti", "Măriuța" ->
  "Maricuté". Village strings are therefore matched diacritics-insensitively and kept as
  printed in `location.villageHistorical` / `rawFields.villagePrinted`; performer names are
  left as OCRed.
- **Ligatures and glyph confusion**: "ș" ligature-like forms become "$"; "I" and "l" and "1"
  swap ("Il. 1913" = II, "lon" = Ion, "la." = 1a., "Teud"/"leud"/"[eud" = Ieud); "O" and "0"
  swap; "F." becomes "FE", "EF", "F_", "E"; "M.F." becomes "ME", "MLE", "M_F", "M. ¥.".
- **Bold melody numbers** next to the staff are the worst-read element (about a quarter are
  caught, several as stanza or text numbers), hence the alignment against the volume's own
  references rather than trusting them.
- **Dropped lines**: text lines between staves are silently skipped by the OCR (the ~10 %
  missing data lines).
- **Merged lines**: a data line is often glued to the following tempo indication or to a
  text line of the next melody ("...I. 1911 Tempo giusto, d.220 ..."); the parser cuts at the
  year and keeps the rest in `rawFields.header` only.
- **Footnote and notation noise**: "1) 3) 4)" marks, "acc. 3. st.", metronome figures and
  garbage such as "SSS ee" precede or follow real text; incipits are cleaned of leading junk
  but remain imperfect (555 of 750 records have one).
- **Two-column pages** (Part Two texts) interleave columns when read by y; the parser only
  takes the closing "(label. Village)" references from them, which are robust.
- **Age lists** "(43,16)" or "(15-20)": only the first figure is kept as `performer.age`;
  the raw list is in `rawFields.performer`.

## What a human should spot-check

Open each link and compare the melody number, village, performer and date with the record
(`rawFields.header` is the OCR line, `rawFields.numberSource` says how the number was
obtained). Ten samples across confidence levels:

| id | page | data line as OCRed | number source |
| --- | --- | --- | --- |
| `rfm-4-58b` | https://archive.org/details/rumanianfolkmusi0004blab/page/n139 (p. 94) | M.F. 1482 a), Fenes (Alba dejos), feciori, I. 1911. | ocr+aligned (high) |
| `rfm-4-100d` | https://archive.org/details/rumanianfolkmusi0004blab/page/n200 (p. 155) | M. F. 1689 b), Seceani (Timis), o muiere tanara, II. 1912. | ocr+aligned (high) |
| `rfm-4-12h` | https://archive.org/details/rumanianfolkmusi0004blab/page/n102 (p. 57) | F 1233 c), Idicel (Mures-Turda), Susana si Rafila Oncea (43,16), IV. 1914. | ocr+aligned (high) |
| `rfm-4-45h` | https://archive.org/details/rumanianfolkmusi0004blab/page/n130 (p. 85) | M.E 1402 b), Albac (Turda- Aries), un om? XII. 1910. | aligned-sequence (low) |
| `rfm-4-12u` | https://archive.org/details/rumanianfolkmusi0004blab/page/n106 (p. 61) | F. 1064 c) Ghelar (Hunedioara), un om, XII. 1913. | aligned-sequence (low) |
| `rfm-4-100i` | https://archive.org/details/rumanianfolkmusi0004blab/page/n201 (p. 156) | Sarafola (Torontal), tigani, XI. 1912. | inferred-sequence (low) |
| `rfm-4-62f-x1` | https://archive.org/details/rumanianfolkmusi0004blab/page/n144 (p. 99) | Chincis (Mures-Turda), IV. 1914.* | unaligned, provisional id |
| `rfm-5-14` | https://archive.org/details/rumanianfolkmusi0005blab/page/n87 (p. 52) | F. 2101 a), Ieud, Ioana Kis (30). | ocr+aligned (high) |
| `rfm-5-131` | https://archive.org/details/rumanianfolkmusi0005blab/page/n146 (p. 111) | F. 2189 a), Oncesti, Marie si Doica Dragus (18 - ... (Cf. No.117] | ocr+aligned (high) |
| `rfm-5-152` | https://archive.org/details/rumanianfolkmusi0005blab/page/n169 (p. 134) | F. 2191 c), Oncesti, Patru Dragus (28). | aligned-sequence (low), class D (joc) |

Also worth a look: vol. IV no. 1a/1b on page n94 (p. 49), where the OCR lost the Șoimi line
and the parser assigned "1a" to the Dumbrăvița de codru line (really 1b), a typical
lost-line shift; and the `_meta.unresolvedVillages` and `_meta.missingLabels` lists.

## Reproducing

```
NODE_USE_ENV_PROXY=1 node print/fetch.mjs      # ~25 MB into print/raw/ (git-ignored)
node print/parse-rfm.mjs [--report] [--debug 4|5]   # writes data/rfm.json
node qa/checks/data-gates.mjs --file data/rfm.json --journeys /nonexistent --villages /nonexistent
cd print && npm test                            # node --test over print/tests/
```

`print/tests/fixtures/` holds saved OCR excerpts: one line per case for the regexes, and the
raw `djvu.xml` of two real pages per volume (pp. 49-50 of vol. IV, pp. 47-48 of vol. V) for
the page walker.

## Open items

1. Add the 63 melodies whose data lines the OCR lost, from the pages (`_meta.missingLabels`).
2. Verify the low-confidence coordinates and the "county only" entries in
   `print/places-rfm.json`, then fold them into `data/gazetteer.json` (scraper owner).
3. Merge `data/rfm.json` into the viewer's catalogue (the front end reads `data/songs.json`;
   either concatenate at build time or add a second file to `useCatalog()`).
4. Volumes I-II: ask the Bartók Archives / the publisher for a data export; the lending
   copies on the Internet Archive must not be used.
5. Have the QA gates skip `journeys-valid` / `villages-valid` for files other than
   `data/songs.json`.
