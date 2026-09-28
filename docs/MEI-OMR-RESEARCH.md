# MEI from OMR for the Bartok collection: research note and experiment

Status: research with a small experiment (2026-09-28). Code and sample outputs in `omr/`
(`omr/README.md` reproduces everything). Nothing here is wired into the app or the data build.
Owner: music-encoding research engineer. Companion docs: CONTEXT.md, DATA-SCHEMA.md,
PRINT-SOURCES.md.

Question asked: can optical music recognition (OMR) plus text OCR turn the notation images we
have collated (14,899 records with `media.notation[]`, mostly scans of Bartok's handwritten master
sheets, plus typeset edition pages and the printed Rumanian Folk Music volumes) into MEI
(Music Encoding Initiative) structured data, with a confidence score, and what would that enable?

Short answer: yes for typeset and printed pages (about 0.9-0.97 confidence on the samples, with
line-ending cadences recovered exactly and lyrics attached), no for the handwritten master sheets
and phonograph slips with today's CPU-installable engines (the melodies come out wrong; the numbers
are in section 3). The pipeline `image -> homr -> MusicXML -> verovio -> MEI 5.1 (+ RapidOCR header
and lyrics in meiHead/verse)` runs at about 20 s per page on 4 CPU cores, validates against
`mei-all` 5.1 with `xmllint`, and the catalogue's own `music.cadences` / `music.syllables` / `incipit`
fields give a strong, cheap correctness signal that a normal OMR project does not have.
Measured: homr 15 s, Audiveris 35 s, oemer 310 s per page, OCR 2.5 s, conversion under 3 s.

## 1. MEI in brief (what matters for a monophonic folk-song corpus)

Sources read: music-encoding.org guidelines v5 (chapters `metadata`, `lyricsperfdir`, `shared`,
`integration`), the element page for `meiHead`, and the 5.1 schema files.

- MEI is an XML vocabulary in the TEI tradition, namespace `http://www.music-encoding.org/ns/mei`,
  maintained from an ODD source. Current release: **5.1** (schema generated 2025-01-22); the
  `dev` schema is 6.0-dev (verovio 6.3 writes `meiversion="6.0-dev"`). Schemas are RelaxNG (plus
  Schematron rules) at `https://music-encoding.org/schema/5.1/<customization>.rng`.
- **Customizations** published for 5.1 (all fetched, all 200): `mei-all` (everything, the one we
  validate against), `mei-all_anyStart` (any element as document root, for fragments), `mei-basic`
  (a strict interchange subset, `meiversion="5.1+basic"`, one way of encoding each thing, no
  `instrDef`, no editorial apparatus; verovio can write it but its output from MusicXML still
  needs cleaning), `mei-CMN` (common Western notation only), `mei-Mensural`, `mei-Neumes`. Names
  are case-sensitive (`mei-cmn.rng` is a 404).
- **`meiHead`** is the metadata model. Required: `fileDesc` with `titleStmt/title` and `pubStmt`.
  Recommended and used here: `titleStmt/respStmt` (`persName@role` collector, performer),
  `pubStmt/availability/useRestrict` (the "recognised, unverified" statement and the ZTI /
  Internet Archive source notice), `sourceDesc/source/bibl` with `identifier@type`
  (our record id and the site's record id), `ptr@target` (record URL and image URL), `geogName`,
  `date`; `encodingDesc/appInfo/application` (engine and version, verovio, OCR), `editorialDecl`
  (the raw OCR lines), `projectDesc` (the confidence score); `workList/work` with
  `incip/incipText/p` (the catalogue incipit) and `classification/termList/term@type` (Bartok
  System position, cadences, syllables, rhythm, form, genre, style). Order inside `encodingDesc`
  is fixed (appInfo, editorialDecl, projectDesc); `availability` takes `useRestrict`, not `p`.
- **A monophonic melody with lyrics**: `music/body/mdiv/score/scoreDef/staffGrp/staffDef`
  (`lines="5" clef.shape="G" clef.line="2" keysig="1s" meter.count="2" meter.unit="4"`), then
  `section/measure/staff/layer` with `note@pname @oct @dur @dots @accid @grace`, `rest`, `beam`,
  `slur@startid @endid`, `sb` for system breaks. Lyrics: `note/verse@n/syl` with `@con="d"`
  (hyphen follows) and `@wordpos` (i/m/t); several strophes are `verse n="1..k"`; the simple
  alternative `note@syl` is for throwaway cases. Bartok's parlando-rubato tunes without bar lines
  are encodable: `mei-all` allows `section/staff/layer` without `measure`, or `measure@right="invis"`;
  MusicXML has no real unmeasured music, so this is a place where MEI is the better target.
  Bartok's own apparatus maps well: circled line-ending cadence degrees -> `dir` or `annot` on
  the last note of the line; the bass-clef final-note prefix of the RFM editions -> a separate
  `section` or `annot`; variants under the staff -> `app/rdg` or a second `mdiv`; image regions ->
  `facsimile/surface/zone` and `@facs` on `note` (both homr and Audiveris know symbol positions,
  so a later version can link every recognised note to its pixels for the correction UI).
- **MusicXML vs MEI**: MusicXML is the notation-software interchange format (what all OMR
  engines emit); MEI adds the scholarly layer (header, sources, editorial markup, variants,
  facsimile links, unmeasured music, ids on everything). Conversion MusicXML -> MEI: verovio
  (C++, `pip install verovio`, also JS) does it in-process and renders SVG/MIDI; `music21`
  converts both ways; the reverse (MEI -> MusicXML) is not in verovio (use music21, or the
  `meitomusicxml` XSLT). Loss on the way in: page layout, some ornaments; verovio keeps unknown
  MusicXML parts as `expansion`, which we drop.
- **Tools**: verovio 6.3.0 (used: MusicXML -> MEI, MEI -> SVG and MIDI); mei-friend
  (https://mei-friend.mdw.ac.at, browser editor on top of verovio with GitHub round-trip, facsimile
  panel and annotations: the natural scholar-correction tool, section 5); the MEI Validator
  (community web service; locally `xmllint --relaxng mei-all.rng` or `lxml.RelaxNG` do the same
  and are what `omr/pipeline.py` uses). OMR that emits MEI directly: none of the installable CMN
  engines (homr, oemer, Audiveris all emit MusicXML); the MEI-native OMR projects are for early
  music (Aruspix for mensural prints, MuRET for interactive transcription) and do not fit
  handwritten 20th-century field sheets.

## 2. OMR tooling that runs in this container (Node 22, Python 3.11, Java 21 present, CPU only)

| candidate | install | version | status | time per page (4 cores) | notes |
| --- | --- | --- | --- | --- | --- |
| **homr** (vision transformer, ONNX) | `pip install homr==0.7.0` in its own venv (pins opencv<5) | 0.7.0 | works | first run 2 min (model download), then **11-21 s, mean 15 s** | best result on typeset pages; single part; grace notes and slurs; no lyrics; no confidence exposed |
| **Audiveris** (Java, rule-based + classifiers, Tesseract OCR) | `.deb` from GitHub releases extracted with `dpkg-deb -x` (bundles OpenJDK 25 and Tesseract 5.5.1, no root, no `install-jdk` needed) | 5.9.0 | works headless (`-batch -transcribe -export`) | **22-49 s, mean 35 s** at 2x upscale | needs >= 20 px interline (our 750-1200 px images must be upscaled 2x); needs legacy `tessdata`; exports `.mxl` with lyrics and header words; per-symbol grades in the `.omr` book (used as recogniser confidence); mis-read the first clef as G on line 3 on the typeset sample |
| **oemer** (U-net segmentation, ONNX) | `pip install oemer==0.1.8` + `onnxruntime==1.16.3`, `numpy<2` in its own venv | 0.1.8 | works after pinning | **~5 min (295-319 s)** (two 40-70 MB U-nets at full resolution) | fails with onnxruntime >= 1.17 (`ConvTranspose pads must not contain negative values`); no time signature written; no lyrics; too slow for 15k images on CPU |
| TrOMR | not on PyPI (`tromr` 404) | - | not tried | - | research code only |
| SMT / "Mozart"-style handwritten transformers | no pip package with CPU weights found | - | not tried | - | would need training on Bartok's hand anyway; see section 6 |
| Tesseract-style text OCR | `rapidocr-onnxruntime` 1.4.4 (PaddleOCR models, ONNX, CPU) | 1.4.4 | works | 1-4 s (model load ~10 s once) | header fields and lyrics on typeset pages read almost perfectly (diacritics dropped); handwritten: fragments only |

Primary pipeline chosen: **image -> homr -> MusicXML -> verovio -> MEI 5.1**, with RapidOCR text
merged into `meiHead` (`editorialDecl`, source `bibl`) and, when the OCR syllable count is within
10% of the recognised sung-note count, attached as `verse/syl`; Audiveris as the second engine
(it is the only one with lyrics and per-symbol grades); oemer kept as an optional third opinion.
Handwritten-capable candidate: none installable; Audiveris and homr were run on the handwritten
sheets to measure how bad it is (section 3).

Timing caveat: the numbers above were measured on one shared 4-core container while other
recognisers were sometimes running; the per-sample `result.json` files hold the wall time of
each run, and `run_samples.py` ran the report set sequentially.

## 3. Samples and results

Inputs, every intermediate (`input.png`, `ocr.json`, `<engine>.musicxml`, `<engine>.mei`,
`<engine>.svg`, `<engine>.mid`, `<engine>.log`) and `result.json` are under
`omr/samples/<id>[__suffix]/`. Every MEI was validated with `xmllint --relaxng` against
`mei-all` 5.1.

| sample dir | record(s) | what the image is |
| --- | --- | --- |
| `bsys-12-10__pr` | bsys-12-10 (A 9, Felsoboldogasszonyfalva, Udvarhely; cadences `III (III) VI 1`, 5 syllables, isometric four-liner) | typeset page 9 of the critical edition (Bartok, Magyar nepdalok, Egyetemes gyujtemeny): 4 systems, 2 notated strophes, lyrics, header with cadences boxed |
| `bsys-13-105__pr` | bsys-13-105 (A 31, Kaszonimper, Csik; `5 (1) VII 1`, 6 syllables) | typeset page 114 of the same edition |
| `bsys-12-10__hw` | bsys-12-10 | Bartok's master sheet BR_00010: pre-printed form (place, performer, collector), one handwritten staff, variant fragments on a second staff, handwritten lyrics, pencil and ink annotations |
| `bsys-13-105__hw` | bsys-13-105 | master sheet BR_00114, same type |
| `bsys-12-10__mh` | bsys-12-10 | phonograph transcription slip F. 470 c) in blue ink, staff lines hand-drawn, second slip pasted below |
| `rfm-4-p094` | rfm-4-1a, 1b, 2, 3a | Rumanian Folk Music IV p. 49 (Archive leaf n94): four colinde with bass-clef final-note prefix, circled cadence degrees, variant staves, data lines |
| `rfm-4-p199` | the records on that leaf | RFM IV p. 154 (leaf n199), class A colinde around no. 100a |
| `rfm-5-p082` | rfm-5-1 .. 5 | RFM V p. 37 (leaf n82), Maramures, first Music Examples page |

Results (from `omr/report_table.py`; `conf` is the overall confidence, `rec`/`struct`/`meta` its groups, the next four columns the catalogue tests, `notes/units` = recognised non-grace notes / sung units; `-` in a catalogue test column means the test could not run and entered as a 0.5 prior; every MEI file produced validated against mei-all 5.1):

| sample | kind | engine | s/page | MEI valid | conf | rec | struct | meta | cadence | syll | lines | incipit | cadences expected -> found (strict) | notes/units |
| --- | --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| [bsys-12-10__hw](../omr/samples/bsys-12-10__hw/) | handwritten | homr | 15.30 | True | 0.50 | - | 0.96 | 0.40 | 0.00 | 0.91 | 0.75 | 0.67 | III III VI 1 -> b3 b3 7 b3 (0/3) | 29/22 |
| [bsys-12-10__hw](../omr/samples/bsys-12-10__hw/) | handwritten | audiveris | 25.60 | True | 0.54 | 0.73 | 0.85 | 0.42 | 0.00 | 1.00 | 0.75 | 0.67 | III III VI 1 -> IV 1 V 1 (0/3) | 20/20 |
| [bsys-12-10__hw](../omr/samples/bsys-12-10__hw/) | handwritten | oemer | 318.80 | True | 0.53 | - | 1.00 | 0.43 | 0.17 | 0.69 | 0.75 | 0.67 | III III VI 1 -> VI 2 3 2 (0/3) | 29/29 |
| [bsys-12-10__mh](../omr/samples/bsys-12-10__mh/) | handwritten | homr | 10.90 | True | 0.52 | - | 0.92 | 0.44 | 0.17 | 0.75 | 1.00 | 0.46 | III III VI 1 -> VI b2 1 ? (0/3) | 15/15 |
| [bsys-12-10__mh](../omr/samples/bsys-12-10__mh/) | handwritten | audiveris | 2.80 | - | failed | | | | | | | | no .mxl exported; INFO  [page]                 SheetStub 1660 | Disposed sheet | | |
| [bsys-12-10__pr](../omr/samples/bsys-12-10__pr/) | typeset | homr | 12.40 | True | 0.97 | - | 0.96 | 0.97 | 1.00 | 0.87 | 1.00 | 1.00 | III III VI 1 -> III III VI 1 (3/3) | 49/46 |
| [bsys-12-10__pr](../omr/samples/bsys-12-10__pr/) | typeset | audiveris | 22.30 | True | 0.83 | 0.85 | 0.94 | 0.80 | 0.67 | 0.87 | 1.00 | 1.00 | III III VI 1 -> III V 2 V (1/3) | 50/46 |
| [bsys-12-10__pr](../omr/samples/bsys-12-10__pr/) | typeset | oemer | 315.20 | True | 0.81 | - | 1.00 | 0.78 | 0.67 | 0.90 | 0.67 | 1.00 | III III VI 1 -> III V #VII 2 (1/3) | 54/54 |
| [bsys-13-105__hw](../omr/samples/bsys-13-105__hw/) | handwritten | homr | 13.40 | True | 0.56 | - | 0.98 | 0.47 | 0.33 | 0.33 | 1.00 | 0.81 | 5 1 VII 1 -> 5 ? ? ? (1/3) | 32/8 |
| [bsys-13-105__hw](../omr/samples/bsys-13-105__hw/) | handwritten | audiveris | 2.20 | - | failed | | | | | | | | no .mxl exported; INFO  [page]                 SheetStub 1660 | Disposed sheet | | |
| [bsys-13-105__pr](../omr/samples/bsys-13-105__pr/) | typeset | homr | 11.00 | True | 0.90 | - | 1.00 | 0.88 | 1.00 | 0.71 | 0.75 | 0.88 | 5 1 VII 1 -> 5 1 VII 1 (3/3) | 35/34 |
| [bsys-13-105__pr](../omr/samples/bsys-13-105__pr/) | typeset | audiveris | 25.40 | True | 0.62 | 0.79 | 0.89 | 0.53 | 0.17 | 0.94 | 0.75 | 0.88 | 5 1 VII 1 -> IV V V 4 (0/3) | 54/51 |
| [bsys-13-105__pr](../omr/samples/bsys-13-105__pr/) | typeset | oemer | 294.50 | True | 0.78 | - | 1.00 | 0.73 | 0.67 | 0.75 | 0.75 | 0.88 | 5 1 VII 1 -> 5 1 #4 #VII (2/3) | 36/36 |
| [rfm-4-p094](../omr/samples/rfm-4-p094/) | printed-edition | homr | 19.00 | True | 0.62 | - | 0.87 | 0.56 | - | - | - | 0.91 | n/a | 87/42 |
| [rfm-4-p094](../omr/samples/rfm-4-p094/) | printed-edition | audiveris | 45.50 | True | 0.62 | 0.85 | 0.66 | 0.56 | - | - | - | 0.91 | n/a | 17/11 |
| [rfm-4-p199](../omr/samples/rfm-4-p199/) | printed-edition | homr | 20.80 | True | 0.60 | - | 0.85 | 0.55 | - | - | - | 0.83 | n/a | 93/74 |
| [rfm-4-p199](../omr/samples/rfm-4-p199/) | printed-edition | audiveris | 49.00 | True | 0.62 | - | 0.92 | 0.56 | - | - | - | 0.87 | n/a | 26/23 |
| [rfm-5-p082](../omr/samples/rfm-5-p082/) | printed-edition | homr | 18.40 | True | 0.62 | - | 1.00 | 0.54 | - | - | - | 0.76 | n/a | 107/86 |
| [rfm-5-p082](../omr/samples/rfm-5-p082/) | printed-edition | audiveris | 40.90 | True | 0.62 | - | 1.00 | 0.54 | - | - | - | 0.76 | n/a | 16/15 |

Per-page timings measured in the sequential batch (4 CPU cores, nothing else running): homr
11-21 s (mean 15.2 s), Audiveris 22-49 s (mean 34.8 s, on the 2x upscale), oemer 295-319 s
(mean 310 s), RapidOCR 1-4 s, verovio conversion and rendering plus xmllint well under 3 s.

Reading of each result (what was right, what was wrong):

- **`bsys-12-10__pr`, typeset, homr 0.97**: the whole tune is right. Pitches of strophe 1
  `d d e d b | d d e d b | d e f# g e | a g f# g g` match the print, key (1 sharp), metre (2/4),
  grace notes and the four systems are found, both notated strophes are read (46 sung units for
  2 x 20 syllables), the OCR incipit matches exactly and 45 OCR syllables were attached as
  `verse`. Cadence test: expected `III (III) VI 1`, found `III III VI 1` (3/3). The render
  (`homr.svg`) is a usable transcription; only the melisma alignment of "fé-jű-rő" is off by one
  note. Audiveris (0.83) read the first clef as G on the 3rd line, so staves 1 and 3 are an octave
  and a third out (`d3 d3 e3 d3 b2`), which the cadence test caught (1/3 strict, 3/3 tolerant
  because the intervals are right); its lyrics are there but noisy ("1'5 rik a fa"). oemer (0.81)
  has the pitches right but invents a repeated note in bar 5, so the syllable segmentation
  drifts (1/3 strict, 3/3 tolerant) and it writes no time signature.
- **`bsys-13-105__pr`, typeset, parlando, homr 0.90**: an unmeasured tune with phrase bars,
  two flats and a "Var" staff. homr gets the line ends `5 1 VII 1` exactly (3/3) with the
  typed lyrics from the OCR attached; it reads the variant staff as part of the tune (34 units
  for 4 x 6 = 24 syllables, hence syllables 0.71) and merges two systems. Audiveris (0.62)
  doubles the note count (54; it read stems of the variant staff as a second voice and put
  half the notes an octave down) and the cadence test fails 0/3. oemer (0.78) gets 2/3
  cadences but reads the key as 1 sharp.
- **`bsys-12-10__hw`, master sheet, best 0.54 (all three engines fail the catalogue test)**:
  homr actually reads 18 of the 20 notes of the first staff (`d d e d d | d d e d b | d e f g e
  | a g f g g`: the b of line 1 became a d, one note is inserted), which is far better than
  expected on Bartok's hand, but the second staff (variant fragments) comes out as noise, 14
  grace notes are hallucinated, and with one note out of place the syllable-count segmentation
  lands on the wrong notes: `III III VI 1` -> `b3 b3 7 b3`, 0/3 strict and 0/3 tolerant. Audiveris
  finds a staff but its 20 notes are unrelated to the tune (`e4 g4 d4 b3 f4 d5 ...`, 0/3);
  oemer 29 notes, 0/3 strict. The OCR reads the form's printed labels and "Vikár", "éves", but
  the handwritten lyrics only as fragments (incipit 0.67).
- **`bsys-13-105__hw`, master sheet (Kodaly MS, typed text), homr 0.56, Audiveris failed**:
  homr recognises 32 notes of which only 8 survive as sung units (it ties most of them together
  as slurs), so three of four lines are empty (`5 ? ? ?`, 1/3 by luck); the typed lyrics are
  read well (incipit 0.81). Audiveris' SCALE step finds no staff interline on the faint
  printed staff and flags the sheet invalid (no export).
- **`bsys-12-10__mh`, blue-ink phonograph slip, homr 0.52, Audiveris failed**: homr sees 15
  notes on hand-drawn staff lines, in the wrong key (3 flats), 0/3 strict; the OCR gets little
  (incipit 0.46). Audiveris: no interline found, sheet invalid.
- **`rfm-4-p094`, `rfm-4-p199`, `rfm-5-p082`, printed edition pages, 0.60-0.62 for both
  engines**: the OCR reads the data lines and incipits well (incipit match 0.76-0.91 over the 3-5
  records of each page; RapidOCR loses diacritics, and the Archive's own OCR that fed
  `data/rfm.json` is itself noisy, e.g. "Cce Santé Mafie"). The notation, however, is read as
  one long stream: homr concatenates the melodies and their variant staves (87 notes, 7 systems
  on p. 49), reads Bartok's bass-clef final-note prefix as a C clef, and drops the 3/4 time
  signature; Audiveris keeps the four staves apart but only exports 17 notes and 17 rests. Since
  the RFM records carry no cadence or syllable data, the cadence, syllable and line tests enter
  as 0.5 priors and the score says exactly that: unverified. To use these pages the pipeline
  needs a per-melody crop (the bold melody numbers are already in `ocr.json` with positions) and
  the circled cadence digits read as the expected cadences.

In numbers: typeset pages with homr reach 0.90-0.97 with all cadences correct; handwritten
pages score 0.50-0.56 with 0 of 3 cadences correct in every engine (the one master sheet where
homr's pitch string is 90% right still fails the automatic test); printed edition pages sit at
0.60-0.62 because they cannot be verified page-wise. A threshold of 0.85 separates the usable
outputs from the rest on this set.

## 4. Confidence score

`omr/confidence.py`, one score in [0, 1] per (image, engine), stored with all components in
`result.json` and written into `meiHead/encodingDesc/projectDesc`.

```
confidence = 0.15 * rec + 0.15 * struct + 0.70 * meta      (rec dropped and the weights
                                                            renormalised when no engine grade exists:
                                                            struct 0.18, meta 0.82)
rec    = mean intrinsic grade of note-head and rest inters from the Audiveris .omr book
         (homr and oemer expose nothing)
struct = 0.2 * [staves found] + 0.2 * [measures and notes found]
       + 0.2 * (rest share below 15%, linear to 0 at 50%)
       + 0.2 * (valid durations, and inner measures that fill the metre)
       + 0.2 * (share of non-empty measures)
meta   = 0.50 * cadence + 0.25 * syllables + 0.10 * lines + 0.15 * incipit
         (a test that cannot run enters as an uninformative 0.5 prior, listed in `priors`)
```

The catalogue tests, which are the strong signal for this collection:

- **cadence**: the recognised notes are reduced to sung units (no grace notes; slurred or tied
  notes count once, except slurs that start on a grace note); the units are cut into lines by
  `music.syllables` (`"5"` -> 5,5,5,5; `"8, 6"` -> 8,6,8,6); the last unit of each line is named
  as a Bartok degree relative to the final (g1 = 1, b-flat = b3, f = 7, below the final Roman
  numerals VII, VI, ...). Two candidates for the final are tried, the last sung note of everything
  recognised and the last note of strophe 1 by syllable count (master sheets carry variant
  fragments after the tune); the better-agreeing one is used and named in `final_source`.
  Compared with `music.cadences` (`"III (III) VI 1"`) on the
  first n-1 lines (the last is 1 by construction): score = half strict match + half match with a
  tolerance of one unit either side (OMR loses or invents single notes). When the number of
  systems equals the number of lines, a system-break segmentation is also tried.
- **syllables**: sung units vs the strophe's syllable total, allowing an integer number of
  notated strophes (the printed edition writes two).
- **lines**: systems found vs lines expected (1 or 2 text lines per system accepted).
- **incipit**: the catalogue `incipit` (or `title`) against the OCR lines and engine lyrics,
  diacritics and punctuation folded, best sliding-window `difflib` ratio.

Printed RFM pages carry several melodies and the RFM records have no cadence or syllable data,
so there only the incipit test runs (mean over the page's records) and the three notation tests
enter as 0.5 priors: the score settles near 0.6 whatever the notation looks like, which is the
honest reading (the notation itself is not checked against anything). Structure alone is
deliberately weak: a tidy but wrong transcription of a handwritten sheet scores 0.50-0.56. A per-melody segmentation of edition
pages (by the bold melody numbers the OCR already finds) is the obvious next step and would let
the circled cadence digits printed on the page be used the same way as `music.cadences`.

## 5. What MEI data would enable here (with a one-line data sketch each)

1. **Melodic incipit search** by contour or Parsons code: from `note/@pname @oct` of the first
   line -> `"*UDUDR"` / `[0,+2,-2,...]` stored next to `incipit`; query by humming or by typing
   a contour; `d4 d4 e4 d4 b3` gives Parsons `*RUDD`.
2. **Automatic cadence, ambitus and form extraction** to fill or check `music.*`: line-ending
   degrees (as in `confidence.py`) -> `music.cadences`; min/max pitch -> `music.ambitus`
   (`"VII-6"`); syllables per line from `verse/syl` -> `music.syllables`; 13,350 records
   (2,866 of the 4,015 resolving to Romania) already carry `cadences`, so the extracted values
   double as a check there and fill the 830 RFM and 261 fmbc records that have none.
3. **Variant and tune-family clustering across villages** (the same colinda in Beius and
   Vascau): transpose every MEI to final g1, take the line-ending degrees plus a 12-point pitch
   contour per line, cluster by edit distance -> `related[]` entries with a similarity score;
   this is exactly what Bartok did by hand in the System's classes.
4. **Rhythm-table regeneration** for the Bartok System classes: `note/@dur @dots` per line ->
   the rhythm formula (`"8 8 8 8 4 4"`) and the `giusto` / `parlando` decision (regularity of
   durations) -> `music.rhythm`, and the schematic rhythm tables of class A/B/C pages rendered
   with verovio instead of scans.
5. **Clean notation in the viewer**: render the MEI with verovio (JS toolkit, SVG) next to the
   scan with a "recognised, unverified, confidence 0.96" label; only records above a threshold
   (say 0.85) get the rendered staff; `<engine>.svg` in the sample folders is that output.
6. **Transposition and audio preview**: MEI -> MIDI with verovio (`<engine>.mid` here) for the
   5,012 records without audio and, with `--transpose`, playback at the informant's pitch or at g1.
7. **Linked-data export**: the `meiHead` already holds our record id, the site's id, the record
   URL and the image URL as `identifier` / `ptr`, and `workList/classification/term` carries the
   Bartok System position, so an MEI file per record is a self-describing export for RISM,
   Europeana or a researcher's corpus tool (mei-friend, Verovio Humdrum Viewer, music21).
8. **Scholar correction workflow**: put the MEI files in a GitHub repository, open them in
   mei-friend (verovio rendering, facsimile panel with `@facs` zones, annotations), the scholar
   fixes wrong notes and commits; `confidence.py` re-runs on the commit and the record's
   `confidence` moves to 1.0 with `verifiedBy` / `revisionDesc/change` in the header.

## 6. Full run estimate and recommendation

What the 14,899 records with notation actually hold (counted from `data/songs.json`): 28,995
image links in five classes.

| class | images | records | OMR prospects (this experiment) |
| --- | ---: | ---: | --- |
| master sheets `BR/BR_*.jpg` (incl. the 3,842 `bartok-gyujtesek` copies of the same files) | 18,168 | 13,803 | handwritten: not usable today (0/3 cadences in every engine) |
| phonograph slips `MH/*.jpg` | 5,344 | 3,733 | handwritten, blue ink, hand-drawn staves: worst case |
| typeset publication pages `publications/*.gif|jpg` | 2,850 | 2,515 | usable: 0.90-0.97 with homr |
| fmbc engraved `melody/*.png` (bartok-nepzene) | 1,803 | 261 | computer-engraved with lyrics, the easiest class (not run here; same as typeset) |
| RFM printed pages (links only; vols. IV and V renderable from the cached PDFs) | 830 | 830 | usable after per-melody segmentation (270 pages) |

Full-run estimate with the primary pipeline (homr 15 s + OCR 2.5 s + verovio/validation 3 s,
about 20 s per image on one 4-core container; images fetched at 1 request/s):

- **Typeset and engraved set** (4,653 images, 2,776 records, plus 270 RFM pages): download
  1.4 h; processing 26 h on one container, or an afternoon on 8; adding Audiveris as a second
  opinion +45 h. Compute cost is negligible (a few dollars of CPU time). Storage about 0.5 GB of
  inputs and 30 MB of MEI.
- **Everything** (28,995 images): download 8 h, processing 161 h (6.7 days) on one container;
  oemer is out of the question (5 min per image, 100 days). Running the 23,500 handwritten images
  would produce MEI files that fail the catalogue test almost everywhere; not worth the run.
- **Human verification** is the real cost. On the two typeset samples the automatic cadence test
  passed 2 of 2 with homr; if 70-80% of the typeset set passes at the 0.85 threshold, a scholar
  checks the rest (600-800 records) in mei-friend at 5-10 min each: 50-130 h, about one
  person-month including a spot check of the passes (2 min each). Verifying the handwritten set
  by hand would be 13,800 x 10 min = 2,300 h; that is a transcription project, not a check.

Recommendation:

1. Run the homr pipeline now on the typeset publication pages and the fmbc engravings (26 h
   of CPU), keep outputs with confidence >= 0.85, and show them in the viewer as rendered
   notation with a "recognised, unverified" label next to the scan. This covers 2,776 records,
   including 756 Romanian ones that have both the typeset page and the master sheet.
2. Extend the pipeline for the RFM volumes: crop each melody by the bold number the OCR already
   locates, read the circled cadence digits as the expected cadences, and then the same test
   applies; this would give MEI for the 830 RFM records, which have no `music.*` data at all.
3. Do not OMR the master sheets with these engines. The right route for them is a
   handwritten model trained on Bartok's hand, and the corpus supplies the training data for
   free: 2,515 records have both a verified typeset page and the master sheet of the same tune,
   i.e. image-to-MEI pairs. That is a separate project (weeks, a GPU), not a pip install.
4. Put the MEI files in a Git repository and use mei-friend for corrections; `confidence.py`
   re-runs on every commit and the viewer flips the label to "verified" from `revisionDesc`.

## 7. What did not work (exact errors)

- `oemer` 0.1.8 with the onnxruntime it installs (1.30, and `onnxruntime-gpu`):
  `onnxruntime.capi.onnxruntime_pybind11_state.Fail: [ONNXRuntimeError] : 1 : FAIL : Node
  (model/conv2d_transpose_1/conv2d_transpose) Op (ConvTranspose) [ShapeInferenceError] Attribute
  pads must not contain negative values` and `No registered plugin EP device found for
  'CUDAExecutionProvider'`. Fixed by pinning `onnxruntime==1.16.3` and `numpy<2` in a separate
  venv; after `pip uninstall onnxruntime-gpu` the shared package was broken
  (`AttributeError: module 'onnxruntime' has no attribute 'InferenceSession'`) until
  `pip install --force-reinstall --no-deps onnxruntime==1.16.3`.
- Audiveris on the original 1200 px image: `With a too low interline value of 10 pixels, either
  this sheet contains no multi-line staves, or the picture resolution is too low (try 300 DPI)`
  and the sheet is flagged invalid; solved by a 2x upscale (interline 20 px).
- Audiveris text OCR with `tessdata_fast`: `Tesseract (legacy) engine requested, but components
  are not present in .../tessdata/eng.traineddata`; solved with the `tessdata` (legacy) files.
- verovio's MEI straight from MusicXML does not validate as 5.1: `meiversion="6.0-dev"`, an empty
  `respStmt` (from homr's empty encoder field), `expansion` elements; all rewritten in
  `pipeline.py`. `mei-basic` additionally rejects `instrDef`, `label` and the header parts, so
  `mei-all` is the target.
- GitHub API and HTML pages return 403 through the container proxy (`gh` is not installed);
  release downloads and `raw.githubusercontent.com` work, as does anonymous `git ls-remote`.
- `tromr` is not on PyPI; no pip-installable handwritten-music transformer with CPU weights was
  found in the time box.
