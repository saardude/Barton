# Status: crawl and coverage

Crawl of 2026-09-29 (folkstream.com, 1 request per second, cached). Regenerate this
file's figures after a rebuild; the numbers below come from `data/*.json` and `scraper/raw/afs/crawl.json`.

## Records

| | Count |
| --- | --- |
| Pages listed on songs.html | 1023 |
| Fetched and parsed | 1021 |
| Listed but 404 | 2 (1061.html, 978.html) |
| Numbered pages that exist but are not listed (excluded) | 47 |
| With lyrics | 1019 |
| With notes | 1019 |

The home page counts 1,103 songs and poems; the contents page links 1023 distinct pages.
The unlisted numbers (76, 159, 183, 184, 190, 225, 234, 280, 294, 350, 368, 416, 424, 513, 522, 548, 582, 594, 602, 658, 662, 668, 693, 696, 718, 726, 730, 756, 764, 791, 799, 808, 819, 850, 863, 890, 895, 938, 941, 956, 980, 985, 994, 1054, 1055, 1082, 1096) are left out: the contents page is the collection's own index, and an unlisted page may have been withdrawn.

## Derived fields

| Field | Coverage | How |
| --- | --- | --- |
| Year | 971 (95.1%) | title 814, contents page 53, newspaper date 57, notes 47 |
| Newspaper cited | 898 (88.0%) | Trove link in the notes (883) or a "From the ... newspaper" sentence |
| Place of publication (town) | 898 (88.0%) | newspaper gazetteer (data/newspapers.json) |
| Place: state only | 0 (0.0%) | the state named in the notes when the paper is not resolved |
| Any place | 894 (87.6%) | |
| Songbook cited | 94 (9.2%) | title of a bibliography entry found in the notes |
| Singer named | 14 (1.4%) | "from the singing of", "collected from", "sung by" |
| Collector named | 25 (2.4%) | "collected by", "recorded by" |
| Author or signature | 298 (29.2%) | "written by", a "By X" line, or a one-line signature after the last stanza |
| Kind: song / poem / not stated | 543 / 43 / 435 | notation, MIDI, MP3 or a tune mentioned; "poem", "ode", "verses" in the title or notes |
| Notation scan | 316 | image role from probed dimensions (GIF scans, tall PNGs) |
| Newspaper masthead image | 702 | wide, short PNG on a Trove-sourced page |
| MIDI | 63 | |
| MP3 recording | 7 | |

## Newspaper gazetteer

314 distinct titles cited, all resolved to a place of publication:
curated 170, high 46, low 1, medium 97 (confidence: curated = data/newspapers-overrides.json;
high = Wikidata label match; medium = Wikidata prefix match or a town name in the title with the
notes' state agreeing; low = a town name in the title alone). Titles shared by papers in several
cities (The Worker, The Herald, Truth, The Australian, Sunday Times) carry variants; the state the
notes name picks the variant per record.

## Known limits

- Fields derived from prose are heuristics; the sentence each was read from is kept (`provenance.newspaper.context`).
- Some pages carry a `<title>` copied from another page; the contents page decides the title (a parser note is kept on the record).
- Two pages have no Notes heading and two have no lyrics; they are kept as is.
- Signatures such as "A. P., BRISBANE" are read as the author "A. P."; pen names are kept as signed.
- The gazetteer's curated entries come from general reference and should be checked against Trove's title records.
