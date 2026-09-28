# Journey sources: the curated itinerary layer

What `data/journeys-curated.json` is, where every statement in it comes from, what each
source contributed, which trips remain undocumented, and a table of evidence quality per
index entry. Companion to docs/JOURNEY-SPEC.md (the derived layer) and docs/GEO-SOURCES.md.

Produced 2026-09-28 by the research engineer of the journey mapper. Raw downloads live under
`geo/cache/research/` (git-ignored); the RFM OCR text under `print/raw/`.

## 1. What the file contains

- 63 curated trip entries, one per documented trip, 1904-1918. 55 match an entry of the
  bartok-gyujtesek.zti.hu trip index (`matchesCollection` = gyuj id); 35 further index entries
  are subsumed by the same trips (`alsoMatchesCollections`), so 90 of the 101 index entries
  are covered; 8 entries are trips absent from the index (`cur-YYYY-MM-nn`).
- 284 stops in itinerary order where the source gives an order, 125 of them resolved to a
  gazetteer `placeId` (the rest are outside present-day Romania or not yet in
  `data/gazetteer.json`; `placeIdNote` says which).
- Every entry carries `sources[]` with a page, footnote, music-example number, index label or
  database query as locator, and `evidenceQuality`: `documented itinerary` (day-level order of
  stops from a source), `dates only` (dates and villages known, order not), or, in the table
  below, `index only` (no curated entry).
- Inferences are marked: `stops[].confidence: "inferred"`, `departure.evidence` /
  `return.evidence: "inferred"`, always with a `note` saying why. Where sources disagree the
  entry keeps both readings and says so (see section 4).
- Merge rule for `geo/derive-journeys.mjs` is in `_meta.howToMerge`.

All Romanian-material trips 1908-1917 are covered (Bihar 1909, 1910, 1911-12, 1912, 1914,
1917; Mezoseg 1909; Nagyszentmiklos 1910; Kis-Szamos 1910; Mocvidek 1910-11; Ugocsa/Szatmar
1912; Temes 1912; Torontal 1912; Banat 1913; Maramaros 1913; Hunyad 1913-14; Maros-Torda 1914;
Marosvasarhely barracks 1916; Arad 1917), plus the Hungarian and Slovak trips of 1904-1918
where the chronology dates them.

## 2. Bibliography and what each source contributed

1. **ifj. Bartok Bela, Bartok Bela eletenek kronikaja**, ed. Vasarhelyi Gabor (Budapest:
   Magyarsagkutato Intezet, 2021; first edition *Apam eletenek kronikaja*, Zenemukiado,
   1981). Digital copy: Magyar Elektronikus Konyvtar 22043,
   https://mek.oszk.hu/22000/22043/22043.pdf (accessed 2026-09-28; cached as
   `geo/cache/research/mek-22043-bartok-kronika.pdf`, text extracted with pdfminer).
   Day-by-day chronology compiled by Bartok's son from letters, postcards, railway tickets
   and receipts. **The backbone of every entry**: departure and return dates, the order of
   villages, the base village, letter quotations. Locators are the printed page numbers of
   the 2021 edition (the PDF's own pagination). It also states (p. 85) that for 1906 the
   field notes usually carry only the month and the singer's home, so those trips are
   approximate.
2. **Kelemen Imre, "Bartok roman nepzenegyujto utjai"**, Az Egri Ho Si Minh Tanarkepzo
   Foiskola tudomanyos kozlemenyei, Uj sorozat 14 = Acta Academiae Paedagogicae Agriensis,
   Nova series 14 (1978), 399-415, ISSN 0138-9734,
   http://publikacio.uni-eszterhazy.hu/689/1/399-415_Kelemen.pdf (cached as
   `geo/cache/research/kelemen-399-415.pdf`). Narrative of the Romanian trips 1908-1917
   (pp. 399-405) built on Demeny's letter editions and RFM, and a **locality list by
   historical county with the collecting month of each village** (pp. 406-411, 139
   localities, 3416 melodies) with notes on name variants and mis-dated items (pp. 411-413,
   e.g. note 16 re-dating the Borz songs from April to February 1914 by cylinder numbers;
   note 23 on Corbesti/Pusztahollod). Contributed the per-village months, the first Romanian
   melodies (Szekelyhidas, November 1908), Busitia's role, the Havasdombro monograph plan,
   the Tango companionship of 1917, and the statement that no Romanian material of 1918 exists.
3. **Bela Bartok, Rumanian Folk Music, vol. V: Maramures County**, ed. Benjamin Suchoff
   (The Hague: Martinus Nijhoff, 1975), https://archive.org/details/rumanianfolkmusi0005blab
   (OCR text `print/raw/rumanianfolkmusi0005blab_djvu.txt`). Bartok's own Preface (dated
   Rakoskeresztur 1918; first page of the main text, page number not legible in the scan)
   names the dates 15-27 March 1913, the eleven villages and Ion Birlea; the Editor's
   Preface p. xv confirms the dates and (fn 5) dates the Torontal material to November and
   December 1912; Kodaly's appendix notes (fns 50-51) give 'an old woman in Sighet, January
   1912' and a Viseu de Jos singer.
4. **Rumanian Folk Music, vol. IV: Carols and Christmas Songs**, same edition,
   https://archive.org/details/rumanianfolkmusi0004blab (OCR `print/raw/...0004blab_djvu.txt`).
   Used for the source line printed under each music example (village, county, performer,
   month, year), cited by music-example number (e.g. mus. ex. 53a, 87i, 122e for
   Nagyszentmiklos, January 1910). Its Foreword (pp. vii-viii) confirms the collecting span
   1909-1917 but has no itinerary. Volumes I-III are on the Internet Archive as lending-only
   items (`rumanianfolkmusi0001bela`, `0002bela`); their OCR could not be downloaded
   (HTTP 500 / 403), so the Introduction to vol. I with its trip table was not used.
5. **Bela Bartok Writings database** (bartok-irasai.zti.hu), entry for "A hunyadi roman nep
   zenedialektusa", Ethnographia XXV/2 (March 1914), 108-115, with full text:
   https://bartok-irasai.zti.hu/en/irasok/a-hunyadi-roman-nep-zenedialektusa-2/. The essay
   describes dialect areas, not the trip; used as the publication resulting from the Hunyad
   trip and the 18 March 1914 lecture. The database (398 entries scanned in
   `geo/cache/irasai/`) holds no travel report by Bartok for any trip.
6. **Bartok Correspondence database**, Bartok Archives,
   https://db.zti.hu/bartok_correspondence/bmails_Search.asp (POST form; hits cached as
   `geo/cache/research/corr-hits-1913.html`). Lists author, recipient and date of every
   known letter but neither text nor place of writing, so it only corroborates letter dates
   quoted by the chronology (e.g. Bartok to Ion Busitia 1913.03.25, to Ion Birlea 1913.03.00).
7. **Trip index**, https://bartok-gyujtesek.zti.hu/en/browse, via `data/collections-gyuj.json`:
   labels quoted verbatim as the `GYUJ` source of each matched entry. The per-trip pages of
   the site carry no descriptive text (checked in `scraper/cache/`).

Consulted but not usable as citations: Bartok's letters themselves (Demeny 1976; *Bartok Bela
csaladi levelei* 1981) are not online; the chronology and Kelemen quote them with Demeny's
letter numbers, which are carried through in the `sources[].locator` where Kelemen gives them
(e.g. B.L. no. 251, pp. 184-185 for the 31 December 1911 postcard). Lampert's source
catalogue introduction (bartok-nepzene.zti.hu/en/introduction/, cached) describes field-books
and master sheets but has no trip chronology. folkradio.hu (Sebo) and bartok.ro are blocked by
the egress proxy. Wikipedia was not used.

## 3. Trips that remain undocumented (index only)

| gyuj id | label | why |
| --- | --- | --- |
| 12 | July - August, 1906. Hajdusamson (58) | Not in the chronology; probably singers from Hajdusamson recorded elsewhere (the chronology warns that 1906 places are singers' homes). |
| 16 | August, 1906. (?) / Mikosszeplak (4) | Not in the chronology. |
| 21, 22, 23 | September, 1906. Felsoireg (66), Dunapentele (13), Baracs (54) | The chronology has Bartok in Budapest/Pozsony in September 1906 apart from the Balaton trip (25-29 Sept); a Tolna/Fejer trip is not recorded. |
| 26 | December, 1906. Budapest (?) / Kibed (12) | Kibed songs from a singer in Budapest (cf. Lidi Dosa, 1904); no trip. |
| 95 | 03. 1907, Nyitra county | Not in the chronology (which has Felsoireg at Easter, 24 March - 3 April 1907). |
| 30 | May, 1907. Fot (11) | Not in the chronology. |
| 44 | End of August, 1907. Korosfo (11) | The chronology has the return from Gyergyo about 20 August and Szilad puszta by 6 September; a second Korosfo visit is not recorded. |
| 42 | November 1-2, 1907. Kanya (16) | The chronology (p. 98) has an order placed 'Kanyan' on 4 November 1907 and remarks that no village of that name existed (perhaps Kanyahegy); Bartok was in Nyitra county 28 Oct - 6 Nov. Left unmatched. |
| 54 | September, 1909. Akosfalva (15) | Neither the chronology nor Kelemen record a Maros-Torda visit in September 1909 (the Mezoseg trip ended about 4 September). |

Also undocumented within covered trips: the order of village visits inside the Bihar 1909,
Mocvidek 1910, Szombatsag 1911, Maramaros 1913 and Hunyad 1913 trips (only village lists with
a few dated letters), and the March-April 1910 part of index entry 57 (Nagymegyer).

## 4. Conflicts between sources (kept in the entries)

- **Mezoszabad (gyuj 74)**: index says 4 April 1912; the chronology has Bartok back from Bereg
  county on 4 April and teaching on the 5th; RFM IV gives IV.1912; Kelemen queries 1913. The
  only documented presence near Mezoszabad in April 1912 is the Marosvasarhely concert trip of
  19-22 April. Entry `cur-1912-04-02`, month precision, stop inferred.
- **Turc / Lenardfalva (gyuj 78)**: index 13-15 April 1912; chronology 27 April 1912. Entry
  `cur-1912-04-03` uses the chronology's day and quotes the index.
- **Torontal 1912 (gyuj 79)**: chronology dates Valkany/Sarafalva to 6-11 December; RFM IV
  and Kelemen date the same villages XI.1912 and Suchoff writes 'November and December'.
- **Kis-Szamos (gyuj 60)**: chronology 14-18 October 1910 (matches the index); Kelemen's
  list dates Gherla, Luna de Jos, Nicula 'XI. 1910'.
- **Mezoseg 1909 (gyuj 51)**: postcards 31 August; RFM melody data IX.1909.
- **Maramaros 1913 arrival**: Bartok and the chronology: 15 March; Birlea's recollection
  (quoted by Kelemen from Szego): 12 March.
- **Belenyes / Ponor 1918**: the chronology calls it a two-week collecting trip; Kelemen says
  it was a rest trip and no 1918 Romanian material exists.
- **Borz (Bihar)**: RFM 'IV. 1914' corrected by Kelemen to February 1914 (cylinder numbers).

## 5. Coverage table: trip -> evidence quality

Quality: `documented itinerary` = order of stops and day dates from a source; `dates only` =
dates and villages known, order unknown; `index only` = no curated entry. "part of X" means the
index entry is subsumed by curated entry X. Key sources: MEK = chronology; KELEMEN; RFM4/RFM5;
CORR = correspondence database; IRASAI-HUNYAD.

| gyuj id | index label | curated entry | evidence quality | key source |
| --- | --- | --- | --- | --- |
| 1 | July – November, 1904. Gerlicepuszta / Kibéd (8) | cur-1904-05-01 | documented itinerary | MEK |
| 4 | June – July, 1905. Vésztő (5) | cur-1905-06-01 | dates only | MEK |
| 2 | June, 1906. Jobaháza (38) | cur-1906-06-01 | dates only | MEK |
| 5 | June, 1906. Bogyoszló (4) | cur-1906-06-01 | dates only (part of cur-1906-06-01) | MEK |
| 3 | June 29 – August, 1906. Tura (155) | cur-1906-06-02 | documented itinerary | MEK |
| 9 | July – August, 1906. Gyula (112) | cur-1906-07-01 | documented itinerary | MEK |
| 10 | July, 1906. Csongrád (5) | cur-1906-08-03 | documented itinerary (part of cur-1906-08-03) | MEK |
| 11 | July, 1906. Doboz (43) | cur-1906-07-01 | documented itinerary (part of cur-1906-07-01) | MEK |
| 12 | July – August, 1906. Hajdúsámson (58) | - | index only | - |
| 6 | Beginning of July, 1906. Vácszentlászló (10) | cur-1906-06-02 | documented itinerary (part of cur-1906-06-02) | MEK |
| 13 | August, 1906. Tápiószele (31) | cur-1906-08-01 | dates only | MEK |
| 14 | August, 1906. Gyulavári (19) | cur-1906-07-01 | documented itinerary (part of cur-1906-07-01) | MEK |
| 16 | August, 1906. (?) / Mikosszéplak (4) | - | index only | - |
| 98 | August 1906, Gömör county | cur-1906-08-02 | dates only | MEK |
| 17 | End of August, 1906. Szentes (16) | cur-1906-08-03 | documented itinerary (part of cur-1906-08-03) | MEK |
| 18 | End of August, 1906. Horgos (39) | cur-1906-08-03 | documented itinerary (part of cur-1906-08-03) | MEK |
| 19 | End of August, 1906. Szeged (44) | cur-1906-08-03 | documented itinerary | MEK |
| 15 | September, 1906. Nagyszentmiklós (1) | cur-1906-08-03 | documented itinerary (part of cur-1906-08-03) | MEK |
| 21 | September, 1906. Felsőireg (66) | - | index only | - |
| 22 | September, 1906. Dunapentele (13) | - | index only | - |
| 23 | September, 1906. Baracs (54) | - | index only | - |
| 20 | September 1, 1906. Apátfalva | cur-1906-08-03 | documented itinerary (part of cur-1906-08-03) | MEK |
| 24 | End of September, 1906. Balatonberény (3) | cur-1906-09-01 | documented itinerary (part of cur-1906-09-01) | MEK |
| 25 | End of September, 1906. Keszthely (42) | cur-1906-09-01 | documented itinerary | MEK |
| 96 | October, 1906, Gömör | cur-1906-10-01 | dates only | MEK |
| 27 | November – December, 1906. Vésztő (19) | cur-1906-11-01 | documented itinerary (part of cur-1906-11-01) | MEK |
| 103 | November, 1906. Doboz (115) | cur-1906-11-01 | documented itinerary | MEK |
| 26 | December, 1906. Budapest (?) / Kibéd (12) | - | index only | - |
| 95 | 03. 1907, Nyitra county | - | index only | - |
| 28 | March 24 – April 3, 1907. Felsőireg (258) | cur-1907-03-01 | documented itinerary | MEK |
| 29 | Beginning of April, 1907. Felsőnyék (5) | cur-1907-03-01 | documented itinerary (part of cur-1907-03-01) | MEK |
| 30 | May, 1907. Fót (11) | - | index only | - |
| 31 | June 28 – July 1, 1907. Jászberény (21) | cur-1907-06-01 | documented itinerary | MEK |
| 32 | July, 1907. Csíkszentmihály (5) | cur-1907-07-02 | documented itinerary (part of cur-1907-07-02) | MEK |
| 33 | July – August, 1907. Csíkrákos (43) | cur-1907-07-02 | documented itinerary | MEK |
| 34 | July – August, 1907. Csíkjenőfalva (29) | cur-1907-07-02 | documented itinerary (part of cur-1907-07-02) | MEK |
| 35 | July – August, 1907. Csíkszenttamás (31) | cur-1907-07-02 | documented itinerary (part of cur-1907-07-02) | MEK |
| 36 | July, 1907. Csíkkarcfalva (6) | cur-1907-07-02 | documented itinerary (part of cur-1907-07-02) | MEK |
| 37 | July – August, 1907. Vacsárdi (72) | cur-1907-07-02 | documented itinerary (part of cur-1907-07-02) | MEK |
| 38 | July – August, 1907. Gyergyóújfalu (49) | cur-1907-07-02 | documented itinerary (part of cur-1907-07-02) | MEK |
| 39 | July – August, 1907. Gyergyókilyénfalva (5) | cur-1907-07-02 | documented itinerary (part of cur-1907-07-02) | MEK |
| 40 | July – August, 1907. Tekerőpatak (35) | cur-1907-07-02 | documented itinerary (part of cur-1907-07-02) | MEK |
| 41 | July – August, 1907. Gyergyócsomafalva (23) | cur-1907-07-02 | documented itinerary (part of cur-1907-07-02) | MEK |
| 43 | Beginning of July, 1907. Körösfő (8) | cur-1907-07-01 | documented itinerary | MEK |
| 44 | End of August, 1907. Körösfő (11) | - | index only | - |
| 102 | November 1907. Nyitra county (Zobordarázs) | cur-1907-10-01 | documented itinerary | MEK |
| 42 | November 1–2, 1907. Kánya (16) | - | index only | - |
| 45 | March, 1908. Körösfő (31) | cur-1908-03-01 | dates only | MEK |
| 47 | October, 1908. Bánffyhunyad (14) | cur-1908-10-03 | documented itinerary | MEK |
| 48 | October, 1908. Tőkésújfalu, Apátkolos | cur-1908-10-02 | dates only | MEK |
| 46 | Beginning of October, 1908. Torockó (7) | cur-1908-10-01 | documented itinerary | KELEMEN, MEK |
| 53 | Beginning of October, 1908. Torockó / Székelyhidas | cur-1908-10-01 | documented itinerary (part of cur-1908-10-01) | KELEMEN, MEK |
| 49 | February 3–4, 1909. Zobordarázs | cur-1909-02-01 | documented itinerary | MEK |
| 50 | July-August, 1909. Upper region of the river Fekete-Körös | cur-1909-07-01 | documented itinerary | KELEMEN, MEK |
| 52 | August, 1909. Vésztő (21) | cur-1909-07-01 | documented itinerary (part of cur-1909-07-01) | KELEMEN, MEK |
| 51 | End of August – Beginning of September. Mezőség (Câmpia Transilvaniei) | cur-1909-08-01 | documented itinerary | KELEMEN, MEK |
| 54 | September, 1909. Ákosfalva (15) | - | index only | - |
| 55 | January, 1910. Nagyszentmiklós | cur-1910-01-01 | dates only | KELEMEN, RFM4 |
| 56 | February, 1910. Upper region of the river Fekete-Körös: district of Belényes and Vaskoh | cur-1910-02-01 | documented itinerary | KELEMEN, MEK |
| 57 | End of March – Beginning of April, November 5–6, 1910. Nagymegyer (84) | cur-1910-11-01 | documented itinerary | MEK |
| 58 | End of March – April, 1910. Magyargyerőmonostor (23) | cur-1910-03-01 | documented itinerary | KELEMEN, MEK |
| 59 | April, 1910. Körösfő (6) | cur-1910-03-01 | documented itinerary (part of cur-1910-03-01) | KELEMEN, MEK |
| 60 | October 15–17, 1910. Region of the river Kis-Szamos | cur-1910-10-01 | documented itinerary | KELEMEN, MEK |
| 61 | November 13, 1910. Ipolyság. Shepherd’s horn and bagpipe competition (54) | cur-1910-11-01 | documented itinerary (part of cur-1910-11-01) | MEK |
| 64 | 27. 12. 1910 – Beginning of January, 1911. Land of | cur-1910-12-01 | documented itinerary | KELEMEN, MEK |
| 65 | Lásd: 1910. december 27. – 1911. január eleje. Mócvidék | cur-1910-12-01 | documented itinerary (part of cur-1910-12-01) | KELEMEN, MEK |
| 63 | November 1, 1911. Nagyszőlős | cur-1911-11-01 | dates only | MEK |
| 66 | 23. December 1911.–4. January 1912. Bihar | cur-1911-12-01 | documented itinerary | KELEMEN, MEK |
| 67 | Beginning of January, 1912. Köröstárkány (32) | cur-1911-12-01 | documented itinerary (part of cur-1911-12-01) | KELEMEN, MEK |
| 68 | Beginning of January, 1912. Gyanta (12) | cur-1911-12-01 | documented itinerary (part of cur-1911-12-01) | KELEMEN, MEK |
| 69 | January 20–22, 1912. Nagytarna, Ugocsakomlós, Kabalapatak | cur-1912-01-01 | documented itinerary | KELEMEN, MEK, RFM5 |
| 70 | January 28 – February 2, 1912. Csarnóháza, Tőtös, Élesdlok, Remetelórév | cur-1912-01-02 | documented itinerary | KELEMEN, MEK |
| 71 | Middle of March, 1912. Temes county | cur-1912-03-01 | documented itinerary | KELEMEN, MEK |
| 72 | End of March – Beginning of April, 1912. Rafajnaújfalu (24) | cur-1912-03-02 | documented itinerary | MEK |
| 73 | End of March – Beginning of April, 1912. Nagygút (3) | cur-1912-03-02 | documented itinerary (part of cur-1912-03-02) | MEK |
| 74 | April 4, 1912. Mezőszabad | cur-1912-04-02 | dates only | KELEMEN, MEK, RFM4 |
| 75 | After April 5, 1912. Fornos (22) | cur-1912-04-01 | dates only | MEK |
| 76 | After April 5, 1912. Dercen (30) | cur-1912-04-01 | dates only (part of cur-1912-04-01) | MEK |
| 77 | After April 5, 1912. Kincseshomok (1) | cur-1912-04-01 | dates only (part of cur-1912-04-01) | MEK |
| 78 | April 13–15, 1912. Turc, Lénárdfalva | cur-1912-04-03 | dates only | KELEMEN, MEK |
| 79 | November–December, 1912. Torontál county | cur-1912-11-01 | documented itinerary | KELEMEN, MEK, RFM4, RFM5 |
| 80 | January, 1913. Hont county | cur-1913-01-01 | dates only | MEK |
| 81 | February 16–18, 1913. Banat | cur-1913-02-01 | documented itinerary | KELEMEN, MEK |
| 82 | March 15–27, 1913. Máramaros county | cur-1913-03-01 | documented itinerary | CORR, KELEMEN, MEK, RFM5 |
| 83 | June, 1913. Algeria | cur-1913-06-01 | documented itinerary | MEK |
| 84 | December, 1913 – January, 1914. Hunyad county | cur-1913-12-01 | documented itinerary | IRASAI-HUNYAD, KELEMEN, MEK, RFM4 |
| 85 | January, 1914. Hont county | cur-1914-01-01 | documented itinerary | MEK |
| 86 | February, 1914. Bihar county | cur-1914-02-01 | documented itinerary | KELEMEN, MEK |
| 87 | 1914. április 3–10. Felső-Maros mente | cur-1914-04-01 | documented itinerary | KELEMEN, MEK, RFM4 |
| 88 | 1914. április 11–13. Nyárádremete (40) | cur-1914-04-01 | documented itinerary (part of cur-1914-04-01) | KELEMEN, MEK, RFM4 |
| 89 | 1914. április 14. Nyárádköszvényes (29) | cur-1914-04-01 | documented itinerary (part of cur-1914-04-01) | KELEMEN, MEK, RFM4 |
| 90 | 1914. április 15–20. Nyárád mente (103) | cur-1914-04-01 | documented itinerary (part of cur-1914-04-01) | KELEMEN, MEK, RFM4 |
| 91 | 1915. január–február. Rákoskeresztúr (11) | cur-1915-02-01 | dates only | MEK |
| 92 | 04. 1915, Zólyom county | cur-1915-04-01 | documented itinerary | MEK |
| 93 | 07-08. 1915. Zólyom county | cur-1915-07-01 | documented itinerary | MEK |
| 94 | 11. 1915 Zólyom county, Slovakian | cur-1915-11-01 | dates only | MEK |
| 97 | 27-29. 12. 1915, Zólyom county | cur-1915-12-01 | documented itinerary | MEK |
| 99 | 1-2. January 1916, Pónik (Gömör county) | cur-1915-12-01 | documented itinerary (part of cur-1915-12-01) | MEK |
| 101 | End of April 1916, Zólyom county | cur-1916-04-01 | documented itinerary | MEK |
| 104 | 07. 1918, Vésztő (31) | cur-1918-07-01 | documented itinerary | MEK |
| 100 | August 1918. Felsőszászberek (195) | cur-1918-08-01 | documented itinerary | MEK |

| curated id | title | dates | quality |
| --- | --- | --- | --- |
| cur-1913-11-01 | Hont county, November 21-25, 1913 (planned second visit to Egyhazmarot, Apatmarot, Lisso) | 1913-11-21 to 1913-11-25 | dates only (planned) |
| cur-1914-03-01 | Cserbel musicians in Budapest, March 18, 1914 (lecture 'A hunyadi roman nep zenedialektusa') | 1914-03-18 to 1914-03-18 | documented itinerary |
| cur-1916-08-01 | Marosvasarhely barracks, August 6-8, 1916: soldiers' songs (Romanian soldiers from various villages) | 1916-08-06 to 1916-08-08 | documented itinerary |
| cur-1916-08-02 | Zolyom county, August 16-23, 1916: Libetbanya and Zolyombrezo | 1916-08-16 to 1916-08-23 | dates only |
| cur-1917-07-01 | Arad county, July 7-16, 1917, with Egisto Tango: Soborsin and the Arad barracks | 1917-07-07 to 1917-07-16 | documented itinerary |
| cur-1917-07-02 | Bihar county, July 20-31, 1917: Belenyesorvenyes and Havasdombro (last Romanian collecting trip) | 1917-07-20 to 1917-07-31 | documented itinerary |
| cur-1917-12-01 | Veszto-Kertmeg puszta, Christmas 1917: a few songs | 1917-12-24 to 1917-12-31 | dates only |
| cur-1918-07-02 | Belenyes and the Ponor mountains (Bihar / Kolozs counties), July 19 - about August 7, 1918 | 1918-07-19 to 1918-08-07 | dates only (conflicting) |

## 6. Stops not yet in the gazetteer (placeId null, present-day Romania)

Bihor: Telek (Tielec), Lelesd (Lelesti), Kereszely (Cresuia), Belenyesszentmarton (Sanmartin
de Beius), Vaskohszeleste (Salistea de Vascau), Szombatsag (Sambata), Dragcseke (Dragesti),
Tasadfo (Tasad), Holloszeg (Corbesti), Belenyesorvenyes (Urvis de Beius), Biharkaba (Cabesti),
Solyom (Soimi), Pocsafalva (Pocioveliste), Pantasa (Pantasesti), Tenkeszeplak (Suplacu de
Tinca), Borz, Biharfured (Stana de Vale). Cluj/Alba: Mezokok (Cooc), Alsodetrehem (Tritenii
de Jos), Fuzesmikola (Nicula), Kerpenyes (Carpinis), Fenes, Ponor (Belis). Maramures:
Kabolapatak (Iapa), Kisbocsko (Bocicoel), Mikolapatak (Valeni). Timis/Arad: Vinga,
Hidasliget (Pischia), Temesszecseny (Seceani), Temeskenez (Satchinez), Valkany (Valcani),
Gilad (Ghilad), Denta, Tolvad (Livezile), Banlak (Banloc), Feny (Foeni), Mezozsadany
(Cornesti, Timis; the gazetteer's two Cornesti are elsewhere), Marospetres (Petris), Tok (Toc),
Torjas (Troas). Hunedoara: Lelesz (Lelese), Ohabasibisel, Paucsinesd (Paucinesti), Szocsed
(Socet). Mures/Bistrita: Kincses (Chincis), Kincsesfo (Comori), Bala, Nyaradto (Ungheni),
Maroskisfalud (Nazna), Mezomajos (Moisa), Mezokobolkut (Fantanita), Gyulatelke (Coasta),
Pusztakamaras (Camarasu), Erdoszakal, Erdoszengyel, Remetemezo (Pomi). These need gazetteer
entries (or the Wikidata step of `geo/enrich-wikidata.mjs`) before they can be drawn.
Stops outside Romania (Slovakia, Ukraine, Serbia, Hungary, Algeria) carry `country` and the
modern name but no placeId.

## 7. Verification notes

- MEK page numbers were read from the page markers in the extracted text and spot-checked;
  the 2021 edition's pagination differs from the 1981 edition.
- The RFM V Bartok preface page number is not legible in the scan; the passage is on the
  first page of the main text after p. xxxii.
- RFM IV locators are music-example numbers read from the OCR; the OCR misreads some
  diacritics (e.g. 'Sanmicldusul'), quoted as printed where legible.
- Nothing from Wikipedia or from the web summaries was used as a citation.
