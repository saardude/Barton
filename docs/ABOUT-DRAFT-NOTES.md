# Notes for the owner on ABOUT-DRAFT.md

Written 28 September 2026 by the copywriter; updated the same day after the owner's
proof-reading notes were applied. Nothing has been edited in app/ and nothing is committed.

## 0. What changed in the revision

- "How to cite this site" removed; a one-line "Report an error" with
  tsaar@student.unimelb.edu.au replaces it. The Chicago citation-guide note is gone.
- Body cut from about 2,600 to about 1,880 words (excluding headings); subheadings
  throughout; seven figure placeholders `![Figure N. ...](/about/figure-N.png)`.
- All references to the owner's research, proposal or performance practice removed,
  including the "ethnographically informed performance" use case. Ota is no longer cited.
- The robots.txt sentence is gone (item 14 below is therefore moot; the recommendation to
  ask ZTI for an export still stands in section 4).
- "Beyond Bartók" now has three examples only (Vikár, Kodály, Grainger) plus a paragraph on
  present-day fieldwork. Brăiloiu, Sharp, Densmore, Lomax and Tracey are cut, so items 8
  (Densmore), 10 (Sharp), 11 (Brăiloiu), 12 (Lomax) and 13 (Chicago) below no longer apply
  to the page; they are kept for the record.
- The OMR paragraph now says: typeset and digitally engraved score images could be read
  with high confidence; handwritten scores need additional model training.
- New subsection "Use of an AI model" states that Claude (Fable 5.1) wrote the scraping and
  data-building code, resolved place names, assembled the itineraries from the cited sources
  and ran the OMR experiment, that its output was checked against the sources and the
  catalogue, why it was useful, and that it did not write the melodies' metadata. It does not
  say Claude built everything or wrote the page.
- Vercel analytics confirmed off by the owner; "collects no data about its readers" stays.
- Still no archive.org link on the page.

Remaining items to check before publishing: 1 is moot (Ota dropped); 2, 3, 4, 5, 6, 7 and
9 (Grainger) still apply.

## 1. Claims I could not verify, and what I found instead (original list), and what I found instead

1. **Ota 2006, JSTOR stable URL.** The article is real (Mineo Ota, "Why Is the 'Spirit' of
   Folk Music so Important?", IRASM 37, no. 1 (2006): 33-46; confirmed by ResearchGate and
   a University of Notre Dame course copy). JSTOR blocked every fetch from this container, so
   the draft cites it as print only, without a stable URL. Please add the JSTOR link from
   your library session (you will have it from your proposal).
2. **Lampert 2008 source catalogue, publisher.** HathiTrust and the National Library of
   Australia catalogue it as Budapest: Hungarian Heritage House, 2008 (distributed by Henle);
   the Institute's own page (zti.hu, "Folk Music Sources in Bartók's Compositions") says
   Helikon, Budapest, 2008. It was a co-publication. The draft follows the library
   catalogues; change to "Helikon and Hungarian Heritage House" if you prefer.
3. **Rumanian Folk Music, volume III.** Springer has no DOI page for it that I could find
   (vols. I, II, IV, V confirmed through Crossref: 10.1007/978-94-010-3499-9, -3502-6,
   -1683-4, -1686-5). The draft cites the set as print and gives DOIs only for IV and V.
   WorldCat rate-limited the container (HTTP 429), so no OCLC number is given; add one if
   you want a WorldCat link.
4. **ifj. Bartók Béla, 1981 edition.** Series and publisher (Nagy muzsikusok életének
   krónikája 16, Zeneműkiadó) come from booksellers' and library listings found by search,
   not from a national-library record. The 2021 edition (Magyarságkutató Intézet, ed.
   Vásárhelyi Gábor, ISBN 978-615-6117-25-0, 484 pp.) is confirmed by the publisher's page
   and MEK 22043. The page numbers used in data/journeys-curated.json are the 2021 edition's.
5. **Bartók's preface to RFM V.** The itinerary research read it in the digitised copy; the
   page number is not legible in the scan (see docs/JOURNEY-SOURCES.md, section 7). Note 5
   cites "5:xv (editor's preface) and Bartók's own preface at the head of the main text".
   Confirm against a library copy and add the page.
6. **Kelemen 1978, note 16 (Borz re-dating).** Taken from docs/JOURNEY-SOURCES.md, which
   locates it at pp. 411-13 of the article. The PDF is open at
   http://publikacio.uni-eszterhazy.hu/689/1/399-415_Kelemen.pdf; please confirm the note
   number and page before publishing.
7. **The Bartók System credits page.** systems.zti.hu returned 503 twice to the fetcher; a
   curl of /br/en/history succeeded and its content matches the draft. The credits page
   itself was not read, so no editor is named for the Bartók System in the draft.
8. **Grainger Museum.** grainger.unimelb.edu.au blocks automated fetches (Cloudflare). The
   description (Edison cylinders of English, Danish, Rarotongan and Maori singers; museum
   founded by Grainger in 1938; collection of over 100,000 items) comes from search-engine
   snippets of the museum's own pages and from the VWML catalogue record PG, which was
   fetched. You are on campus; a two-minute check of the museum's collection page will do.
9. **Frances Densmore papers.** The Library of Congress finding aid (hdl.loc.gov/
   loc.afc/eadafc.af022004, processed 2022) was blocked to the fetcher; its title, dates
   (1883-1957) and scope come from search snippets of the finding aid.
10. **Cecil Sharp.** The VWML "Cecil Sharp's Appalachian Diaries" page was fetched. The
    collection record CJS1 and the figure "1,500 songs and tunes in three expeditions
    between 1915 and 1918" come from search snippets of the VWML catalogue. Standard
    accounts date the Appalachian trips 1916-18 (Sharp went to America in 1915 and began
    collecting in 1916); the draft follows the VWML wording. Adjust if you prefer 1916-18.
11. **Brăiloiu.** The Geneva side is verified (Memobase record set meg-003: recordings
    1913-1953; AIMP founded 1944). The Bucharest institute's own archive presentation is a
    PDF the fetcher could not read; the draft cites the institute's home page only.
12. **Alan Lomax dates (1946-1991).** From the Association for Cultural Equity's description
    of the online archive (fetched), which gives those years for the tape recordings.
13. **Chicago 18 website form.** Taken from the University of Chicago Press's online
    citation guide (fetched). I did not consult the printed manual.
14. **The robots.txt sentence.** The draft says the Bartók System site "asks automated
    crawlers to stay away; I crawled it slowly and for this study only, and I intend to ask
    the Institute for a data export". That is true (docs/SCRAPER.md, D11 in PLAN.md) and I
    think it belongs on the page for integrity's sake, but it is your call. If you keep it,
    send the email to br@zti.hu before the page goes live so the sentence stays true.
15. **"Not affiliated" and "collects no data about its readers".** The second claim depends
    on Vercel's analytics being off. Check the project settings before publishing.

## 2. Links chosen and why

- Institute databases: the sites' own English home pages and credits pages (fetched;
  editors named as printed there). Trip index linked directly because the journeys depend
  on it.
- Rumanian Folk Music: Springer DOIs for vols. IV and V (the publisher's persistent links
  for the Nijhoff imprint), no hosting site named, per your instruction. The page says
  "digitised copies of volumes IV and V were consulted; only facts and incipits are indexed
  and every entry links to the page consulted".
- Lampert 2008 (Studia Musicologica): Akadémiai Kiadó DOI 10.1556/smus.49.2008.3-4.9
  (Crossref-confirmed), which is the publisher's link; JSTOR also holds it if you prefer.
- Kelemen: the Eszterházy Károly University repository record (open PDF).
- Chronicle: MEK 22043 (the National Széchényi Library's electronic copy of the 2021
  edition), which is what the itinerary research used.
- Bartók's essays: the Institute's Writings database entries, which give journal, issue,
  date and pages verbatim; that is where data/context-events.json takes them from.
- Borders: GISta Hungarorum's OTKA project page (licence and citation form are stated
  there), the historical-basemaps GitHub repository (licence file and "work in progress"
  caveat), Natural Earth's terms-of-use page (public domain statement).
- Villages: Wikidata:Licensing (CC0 statement).
- Tiles: openstreetmap.org/copyright and carto.com/attributions, the two pages the licences
  point to; the CARTO page requires the credit to be visible on the map, which the app's
  footer already does.
- Beyond Bartók: one institutional page per collection (Hungaricana for the ZTI Folk Music
  Collection, Museum of Ethnography for Vikár's cylinders, Memobase and the Romanian
  Academy for Brăiloiu, VWML for Sharp and for the Grainger copies, the Grainger Museum,
  the LoC finding aid, ACE, ILAM at Rhodes). All accessed 28 September 2026.
- MEI: music-encoding.org/about (fetched). docs/MEI-OMR-RESEARCH.md is named as a project
  document in the text, not cited as a source.

No archive.org link appears on the page. Note that the app's footer string
`footer.printLink` ("open volumes on the Internet Archive") and the RFM_VOLUMES list in
the current About component still name it; the front-end owner should change those when
the About page is replaced, or the page and footer will contradict each other.

## 3. Counts taken from data/BUILD.md and data/journeys.json (re-check on the live site)

| Figure on the page | Source | Note |
| --- | --- | --- |
| 14,910 melodies | BUILD.md "songs: 14910" | after merging 2,330 bsys/gyuj pairs |
| 261 / 13,817 / 2,332 records per site | BUILD.md | |
| 4,015 in present-day Romania, 3,332 with coordinates | BUILD.md | |
| 830 from RFM IV-V | BUILD.md, PRINT-SOURCES.md | 463 vol. IV + 367 vol. V |
| 5,012 with audio, 14,899 with notation image, 12,906 with year | BUILD.md | |
| 178 journeys, 44 sourced or documented | journeys.json _meta.counts.byQuality | 29 sourced + 15 documented; 123 dates only; 11 index only |
| 101 index entries, 63 curated trips | JOURNEY-SOURCES.md, journeys.json | |
| 10-day gap rule, Budapest departure "assumed" | JOURNEY-SPEC.md | owner's open decision 5 in PLAN.md |
| 1,165 villages: 673 existing, 86 renamed, 1 abandoned, 405 unknown | villages.json _meta.counts | merged = 0, so not mentioned |
| 183 unresolved place strings, 2,606 records | BUILD.md | mostly HU/SK localities |
| 14,080 records without genre | BUILD.md facets "genre: null=14080" | |
| 21 printed melodies without a data line | PRINT-SOURCES.md "18 + 3" | |
| 261 records from Folk Music in Bartók's Compositions | BUILD.md | the page calls them "the 261 folk melodies Bartók used in his own works"; the database itself says "over 265" melodies, so the site count may differ slightly from the crawl count |
| "twelve villages" of RFM V | PRINT-SOURCES.md | |

The crawl date is 28 September 2026 throughout. If the data is rebuilt, every number above
moves; the "Export JSON" and "by performer" features are named as they exist in
app/src/i18n/en.ts and app/src/pages today.

## 4. Provenance of the printed-edition text (not for the page)

The OCR used by print/ came from the Internet Archive's scans: items
`rumanianfolkmusi0004blab` (vol. IV, Carols and Christmas Songs, 1975) and
`rumanianfolkmusi0005blab` (vol. V, Maramureș County, 1975), both open items with
Archive-generated OCR (`_djvu.txt`, `_djvu.xml`), plus a local re-OCR of the Music Examples
pages rendered from the item PDFs (details in docs/PRINT-SOURCES.md). Items
`rumanianfolkmusi0001bela` and `0002bela` (vols. I and II) are access-restricted lending
copies and were not downloaded, borrowed or used; no item was found for vol. III.

Copyright position: the volumes are in copyright (Bartók estate, the editor, and
Nijhoff/Springer). The Archive's serving of open scans is not a licence to republish, so the
pipeline indexes facts only (melody number, class, phonograph number, village and county as
printed, performer name/age/sex, month and year, the first line of the sung text as an
identifier) and links to the page; no notation, full text, translation, note or page image is
reproduced. `data/rfm.json` `source.url` values and the record pages' notation links point
at archive.org pages. The About page, on your instruction, does not name the hosting site;
the record pages still link to it, which is consistent with "every entry links to the page
consulted" but means a reader will see archive.org URLs on record pages. Decide whether that
is acceptable or whether the record-page link text should also be neutral ("scanned page").

Recommended follow-ups (from PRINT-SOURCES.md and SCRAPER.md): ask the Bartók Archives or
Springer for a data export of vols. I-III; ask HUN-REN BTK ZTI (br@zti.hu) for an export or
permission for the Bartók System crawl and credit them; decide the code and data licence
(README says all rights reserved until then).

## 5. Style notes

- Voice: plain declarative sentences, cautious claims, footnoted evidence; no first-person
  research framing.
- Chicago 18 notes-and-bibliography: full note at first citation, short form after;
  "accessed September 28, 2026" on every web source because the pages carry no revision
  date. Diacritics are kept in names and titles; no em-dashes; en-dashes only in page and
  year ranges, as in your footnotes.
- Body text is about 1,880 words excluding headings (about 1,990 with them), 20 notes, 23 bibliography entries, 7 figures.
