# About and sources

Draft for the owner's proof-reading, 28 September 2026. Replaces the "About" component in
app/src/pages/StubPages.tsx once approved. Footnotes are Chicago Manual of Style, 18th
edition, notes-and-bibliography; the bibliography is at the end. Nothing here is published yet.

---

Built by Thomas Saar (BMus) in his honours year at the University of Melbourne. This viewer is an academic, non-commercial study aid. It indexes Béla Bartók's ethnographic field collection, with a focus on localities in present-day Romania, and links every record back to the database or the printed page that holds it. It sells nothing, carries no advertising and collects no data about its readers. Contact: [contact].

I built it for my own research. As an orchestral trumpeter working on Bartók's *Romanian Folk Dances*, I needed to move quickly between a melody, the village it was recorded in, the trip it was recorded on and the borders of the day. That information exists, but it is spread across three online databases and a five-volume printed edition. The viewer is a reading aid over those sources, not a new edition of anything.

## What the viewer holds

The record data comes from three databases of the HUN-REN BTK Institute for Musicology (Zenetudományi Intézet) in Budapest, home of the Bartók Archives. *Folk Music in Bartók's Compositions* documents the 261 folk melodies Bartók used in his own works, each with the place and date of collection, the informant and, where one exists, the phonograph recording.[^1] *The Bartók System* is Bartók's classification of his complete Hungarian folk-song collection, 13,817 record pages online; the Romanian, Slovak and other collections are named in it but not published there.[^2] *Béla Bartók, the Ethnomusicologist* holds 2,332 records arranged by collecting trip, with an index of 101 trips from 1904 to 1918.[^3]

The online databases hold no records for Bartók's Romanian melodies as such. For those I used the printed edition, *Rumanian Folk Music*, edited by Benjamin Suchoff in five volumes, 1967 to 1975.[^4] Digitised copies of volumes IV (carols and Christmas songs) and V (Maramureș County) were consulted; only facts and incipits are indexed, and every entry links to the page consulted. Volumes I to III were not available to me. Volume V prints no dates under its melodies because, as Bartók's preface says, all come from one trip, 15 to 27 March 1913.[^5]

As of the crawl of 28 September 2026 the viewer indexes 14,910 melodies: 4,015 resolve to a locality in present-day Romania, 3,332 of them with coordinates, and 830 come from *Rumanian Folk Music* IV and V. The 2,330 records that the Bartók System and the Ethnomusicologist site publish twice are merged into one record each. 5,012 records have a recording on the source site, 14,899 a notation image or scanned page, 12,906 a year. The journey layer holds 178 trips, 44 of them with a sourced or documented itinerary; the rest are dated clusters of records or index entries with no records online.

Every record links to its original catalogue entry, by reference code where the source prints one, otherwise by its position in the Bartók System or by site and record number. If the viewer and the source disagree, the source is right and I would like to hear about it.

## How the data was built, and its limits

Every record was parsed from its full catalogue page, not from a listing row, so the fields shown are the fields the source prints. The sites were fetched once, at one request per second, and kept in a cache. The Bartók System's site asks automated crawlers to stay away; I crawled it slowly and for this study only, and I intend to ask the Institute for a data export and for its view of this use.

None of the three databases prints a genre label. Genre is therefore known only for the 830 printed-edition entries, where the volume's own classes give it (colinda for volume IV; the class headings of volume V mapped to colinda, bocet, hora lungă, cântec, joc and instrumental). For the other 14,080 records the genre facet is empty, and the style labels (old style, new style, mixed) are the sites' own.

The printed-edition entries were read by optical character recognition from the digitised pages and aligned with the volumes' own indexes and cross-references. OCR loses diacritics and confuses similar glyphs, so a village name, a performer's name or a month from that pass can be wrong; each such entry keeps the raw line it was read from and links to the page. Twenty-one printed melodies have no entry because no OCR pass recovered their data line.

Places are the hardest part. The sources give the historical Hungarian name and county of 1910 ("Belényes, Bihar"); the modern reader needs the Romanian name and present county ("Beiuș, Bihor"). The viewer holds both, keyed on the historical form, and derives the present country from the modern county. Coordinates come from the sources where they print them, otherwise from a gazetteer built for this project and checked against Wikidata, whose structured data is in the public domain.[^6] Of 1,165 village entries checked there, 673 matched an existing settlement under the same name, 86 a renamed one, one an abandoned one, and 405 could not be matched with confidence; those are marked "unknown" with the evidence, never guessed. 183 place strings, covering 2,606 records, remain unresolved; nearly all are in the Hungarian and Slovak parts of the Bartók System and are listed as "not mapped".

Journeys are derived in two layers. The Institute's trip index is the primary source: each of its 101 entries becomes a trip with its records attached. Over that sits a curated layer of 63 trips, 1904 to 1918, built from the day-by-day chronology of Bartók's life compiled by his son, from Imre Kelemen's 1978 account of the Romanian trips with its list of localities and collecting months, and from the source lines and prefaces of *Rumanian Folk Music*.[^7] Records outside the index are grouped by date: a run of dated records with no gap longer than ten days is one trip. Each trip is labelled "sourced itinerary" (order of stops and dates from a cited source), "documented itinerary" (order but not every day), "dates only" (villages and dates known, order not) or "index only" (nothing beyond the Institute's label). Departures default to Budapest and are labelled "assumed"; where the sources disagree on a date, the trip keeps both readings and says so.

The context strip beside the journey map lists dated events: border changes, Bartók's publications of Romanian material, his own statements on folk music and nationalism, and the reception of his Romanian work. Each entry summarises a cited source in neutral wording; where the Institute's *Béla Bartók Writings* database holds the entry for a text, its bibliographic data are taken from there.[^8] The 1937 essay on folk-song research and nationalism and the 1942 essay "Race Purity in Music" are cited by their first printings.[^9] Bartók's remarks on the "spirit" of peasant music belong to the arguments of his own period, as Ota has shown, and the strip presents them as documents to be weighed, not as the viewer's position.[^10]

## Sources

Databases. *Folk Music in Bartók's Compositions*, edited by Márton Kerékfy and Viola Biró, with an introduction abridged from Vera Lampert's printed source catalogue;[^11] *The Bartók System*; *Béla Bartók, the Ethnomusicologist*, edited by István Pávai and Pál Richter; and *Béla Bartók Writings*, edited by Viola Biró. All four are publications of the HUN-REN BTK Institute for Musicology, Budapest. Records, notation images and recordings remain the Institute's; this viewer is an independent interface and is not affiliated with it.

Printed edition. Béla Bartók, *Rumanian Folk Music*, ed. Benjamin Suchoff, 5 vols. (The Hague: Martinus Nijhoff, 1967–75); volumes IV and V (1975) are indexed.

Scholarship used for the itineraries. The chronology of Bartók's life by his son, in its 2021 edition; Kelemen's 1978 article; and the prefaces and source lines of *Rumanian Folk Music* IV and V. Lampert's study of Bartók's transcription methods informed how the record fields are read.[^12]

Historical borders. County boundaries of the Kingdom of Hungary in 1910 are from GISta Hungarorum (OTKA K 111766), CC BY-NC; the project asks to be cited in that form and states that its maps were digitised from a 1:400,000 sheet with an inaccuracy of 0.5 to 1 km at settlement level.[^13] State borders for 1914 and 1920 are from the historical-basemaps project of Andrés Ourednik and contributors, GPL-3.0, which calls itself work in progress and asks users to verify the maps before academic use; there is no 1910 or 1918 file, so 1914 stands in for 1910 and 1920 for the post-war state.[^14] Present-day countries and Romanian counties are Natural Earth 1:10m, public domain.[^15] Trips to 1913 get the 1910 counties, 1914 to 1918 the 1914 outline, anything later the 1920 outline.

Village data. Names, coordinates, administrative units and status from Wikidata, CC0. Map tiles: base map data © OpenStreetMap contributors, Open Database License; tiles in the Positron style © CARTO.[^16]

## Use cases

Tracing one melody from village to trip to border. A record's rail gives Where, Who and when, Music and Source. "Where" links to the village, the village to the county, and the date to the trip, where one is known. The trip page draws the route on the border layer for that year, with a then-and-now toggle: a melody recorded in Bihar in January 1912 sits inside Bihar County of the Kingdom of Hungary, and one click shows the same point in Bihor County, Romania.

Comparing repertoire across neighbouring villages. The county page lists every village with its melody count and a genre bar, and its melodies table sorts by title, style, location, year or source number. For the Maramureș volume, where every melody is classed, the distribution of hore, dance melodies and colinde across the twelve villages is visible at once; for the database records the style and performance facets do the same work more coarsely.

Following an informant or a collector across trips. Performer names are indexed as printed, and the county page has a "by performer" tab. A melody published in both the Bartók System and the Ethnomusicologist site is one merged record with both catalogue links. The collector field does the same for Kodály's or Lajtha's material that shares a village with Bartók's.

Testing a claim in the literature against the dated record set. Kelemen re-dates the Borz songs from April to February 1914 on the evidence of cylinder numbers; the printed edition prints "IV. 1914".[^17] The viewer shows both, because the trip entry keeps the conflict, and the year filter and the sort by source number show which records fall on either side of the claim.

Preparing an ethnographically informed performance. My own question is how Bartók's field recordings and transcriptions can inform a concert performance of *Romanian Folk Dances* on the trumpet. The 261 records from *Folk Music in Bartók's Compositions* carry the source melody, the recording where one exists, the informant's name and age and the performance type, and the viewer puts them next to the other melodies from the same village and trip. That is the context a performer needs before deciding what to imitate and what to leave alone; it is a starting point, not a method.

Teaching with shareable filter URLs. Every filter, sort and place selection is written into the address bar. A tutor can send a link to "colinde from Hunedoara, 1913 to 1914, sorted by source number" and every student opens the same list.

Exporting a filtered set for a corpus study. The results panel, the county page and each trip page have an "Export JSON" button that writes the current records, with their source links and raw fields, to a file. A study of line-ending cadences or syllable counts across the Bartók System can start from that file.

Encoding the notation. The notation images are scans of Bartók's master sheets and of typeset pages. A project note (docs/MEI-OMR-RESEARCH.md) tests whether optical music recognition can turn them into Music Encoding Initiative files, the XML standard for scholarly music encoding.[^18] The answer is yes for typeset and printed pages, where the recovered line-ending cadences can be checked against the catalogue's own cadence fields, and not yet for the handwritten sheets. That path would give searchable melodies and a correction interface. None of it is in the site yet.

## Beyond Bartók

The model here is small: a record, a place, a journey and a source, with a gazetteer of historical and modern names, cited itineraries and border layers by year. Any field collection with dated localities and record-level catalogue pages could be held the same way. The collections below are the obvious candidates; each exists and is catalogued, and none, to my knowledge, has been mapped against the borders of its own day.

Zoltán Kodály and Béla Vikár, in the same Budapest archive. The Institute's Folk Music Collection, online through Hungaricana, includes Kodály's manuscript melody collection of 1905 to 1958 and copies of the Museum of Ethnography's phonograph recordings from 1896 onward, which begin with Vikár, the first European to take a phonograph into the field.[^19] Constantin Brăiloiu's Romanian recordings, split between the Archives internationales de musique populaire he founded in Geneva in 1944 and the institute that bears his name in Bucharest; the Geneva collection covers 1913 to 1953.[^20] Cecil Sharp's Appalachian collection, some 1,500 songs and tunes from three expeditions between 1915 and 1918, catalogued with his diaries at the Vaughan Williams Memorial Library in London.[^21] Percy Grainger's cylinder recordings of English, Danish, Rarotongan and Māori singers, held at the Grainger Museum of the University of Melbourne.[^22] Frances Densmore's fifty years of recording Native American music, whose papers and cylinders are at the Library of Congress.[^23] Alan Lomax's field recordings of 1946 to 1991, online through the Association for Cultural Equity.[^24] Hugh Tracey's recordings across sub-Saharan Africa, at the International Library of African Music he founded in 1954, now at Rhodes University.[^25]

What each would need is the same: a stable link per record, a dated locality per record, and a licence that allows the facts to be indexed. What each would risk is also the same. Place names are political, in Transylvania as in Appalachia or the Eastern Cape, and a gazetteer that shows the name of 1910 next to the name of today has to say which is which and why. Rights in recordings belong to the archives and often to the communities recorded, so a viewer of this kind should index and link, not copy. A global map of field collecting is possible on those terms and on no others.

## Licensing and access

The site is for academic, non-commercial use and is publicly readable. Management functions (corrections to place resolution, annotations, flagging OCR errors) are planned for a later phase and will be gated to scholars. Two of the border datasets set the terms: the GISta Hungarorum county boundaries are CC BY-NC and the historical-basemaps state borders are GPL-3.0, both acceptable for a non-commercial academic site that shows their attribution. Records, notation images and recordings remain the Institute for Musicology's; the printed volumes remain in copyright, and the viewer reproduces neither notation nor song texts from them. The viewer's own code and derived JSON have no licence yet; until one is chosen, all rights are reserved.

## How to cite this site, and how to report an error

Bibliography entry, Chicago 18: Saar, Thomas. *Bartók / Romania: A Field-Collection Viewer*. University of Melbourne, 2026. Accessed [date]. https://bartok-romania-viewer.vercel.app/.

Note form follows the same pattern.[^26]

For a melody, cite the original record on the Institute's site or the printed volume, not this viewer; the link is on every result row, stop and record page. To report an error, write to [contact] with the record's link and what the source says instead.

---

## Notes

[^1]: "Folk Music in Bartók's Compositions," ed. Márton Kerékfy and Viola Biró, HUN-REN RCH Institute for Musicology, 2020–25, accessed September 28, 2026, https://bartok-nepzene.zti.hu/en/; for the editors and programmer see "Credits," https://bartok-nepzene.zti.hu/en/credits/.

[^2]: "The Bartók System," HUN-REN BTK Institute for Musicology, accessed September 28, 2026, https://systems.zti.hu/br/en; on the collection's fate after 1940 see "The History of the Bartók System," https://systems.zti.hu/br/en/history.

[^3]: "Béla Bartók, the Ethnomusicologist," ed. István Pávai and Pál Richter, Institute for Musicology, Research Centre for the Humanities, 2021, accessed September 28, 2026, https://bartok-gyujtesek.zti.hu/en; trip index at https://bartok-gyujtesek.zti.hu/en/browse.

[^4]: Béla Bartók, *Rumanian Folk Music*, ed. Benjamin Suchoff, 5 vols., Bartók Archives Studies in Musicology (The Hague: Martinus Nijhoff, 1967–75); vol. 4, *Carols and Christmas Songs (Colinde)* (1975), https://doi.org/10.1007/978-94-010-1683-4; vol. 5, *Maramureș County* (1975), https://doi.org/10.1007/978-94-010-1686-5.

[^5]: Bartók, *Rumanian Folk Music*, 5:xv (editor's preface) and Bartók's own preface, dated Rákoskeresztúr 1918, at the head of the main text.

[^6]: "Wikidata:Licensing," Wikidata, accessed September 28, 2026, https://www.wikidata.org/wiki/Wikidata:Licensing.

[^7]: ifj. Bartók Béla, *Bartók Béla életének krónikája*, ed. Vásárhelyi Gábor (Budapest: Magyarságkutató Intézet, 2021), digital copy at Magyar Elektronikus Könyvtár, https://mek.oszk.hu/22000/22043/; first published as *Apám életének krónikája*, Nagy muzsikusok életének krónikája 16 (Budapest: Zeneműkiadó, 1981); Imre Kelemen, "Bartók román népzenegyűjtő útjai," *Acta Academiae Paedagogicae Agriensis*, n.s., 14 (1978): 399–415, http://publikacio.uni-eszterhazy.hu/689/.

[^8]: "Béla Bartók Writings," ed. Viola Biró, Budapest Bartók Archives, Institute for Musicology RCH, 2021, accessed September 28, 2026, https://bartok-irasai.zti.hu/en/.

[^9]: Béla Bartók, "Népdalkutatás és nacionalizmus," *Tükör* 5, no. 3 (March 1937): 166–68, entry at https://bartok-irasai.zti.hu/en/irasok/nepdalkutatas-es-nacionalizmus-2/; Béla Bartók, "Race Purity in Music," *Modern Music* 19, no. 3 (March–April 1942): 153–55, entry at https://bartok-irasai.zti.hu/en/irasok/race-purity-in-music-2/.

[^10]: Mineo Ota, "Why Is the 'Spirit' of Folk Music so Important? On the Historical Background of Béla Bartók's Views of Folk Music," *International Review of the Aesthetics and Sociology of Music* 37, no. 1 (2006): 33–46.

[^11]: Vera Lampert, *Folk Music in Bartók's Compositions: A Source Catalog; Arab, Hungarian, Romanian, Ruthenian, Serbian, and Slovak Melodies* (Budapest: Hungarian Heritage House, 2008).

[^12]: Vera Lampert, "Bartók and the Berlin School of Ethnomusicology," *Studia Musicologica* 49, no. 3–4 (2008): 383–405, https://doi.org/10.1556/smus.49.2008.3-4.9.

[^13]: "GISta Hungarorum (OTKA K 111766)," GIStory, accessed September 28, 2026, https://www.gistory.hu/g/en/gistory/otka.

[^14]: Andrés Ourednik and contributors, "Historical Boundaries of World Countries and Cultural Regions," GitHub repository aourednik/historical-basemaps, accessed September 28, 2026, https://github.com/aourednik/historical-basemaps.

[^15]: "Terms of Use," Natural Earth, accessed September 28, 2026, https://www.naturalearthdata.com/about/terms-of-use/.

[^16]: "Copyright and License," OpenStreetMap, accessed September 28, 2026, https://www.openstreetmap.org/copyright; "Attributions," CARTO, accessed September 28, 2026, https://carto.com/attributions.

[^17]: Kelemen, "Bartók román népzenegyűjtő útjai," 411–13, note 16; Bartók, *Rumanian Folk Music*, vol. 4, source lines of the Borz melodies.

[^18]: "About," Music Encoding Initiative, accessed September 28, 2026, https://music-encoding.org/about/.

[^19]: "The Folk Music Collection of the HAS–RCH Institute for Musicology," Hungaricana, accessed September 28, 2026, https://www.hungaricana.hu/en/databases/zti/; "Folk Music Collection (Audio Materials and Transcription of Melodies)," Museum of Ethnography, Budapest, accessed September 28, 2026, http://www.neprajz.hu/en/gyujtemenyek/ethnological-archives/audio-archive/audio_archive.html.

[^20]: "Collection sonore Constantin Brăiloiu, Archives internationales de musique populaire (AIMP)," Memobase, Memoriav, accessed September 28, 2026, https://memobase.ch/fr/recordSet/meg-003; Institutul de Etnografie și Folclor "Constantin Brăiloiu," Academia Română, accessed September 28, 2026, https://acad.ro/ief/.

[^21]: "Cecil Sharp's Appalachian Diaries," Vaughan Williams Memorial Library, English Folk Dance and Song Society, accessed September 28, 2026, https://www.vwml.org/topics/sharp-diaries; "Cecil James Sharp Collection," VWML archives catalogue CJS1, https://archives.vwml.org/records/CJS1.

[^22]: Grainger Museum, University of Melbourne, accessed September 28, 2026, https://grainger.unimelb.edu.au/; "Percy Grainger Folk Song Collection," VWML archives catalogue PG, https://archives.vwml.org/records/PG.

[^23]: "Frances Densmore Papers," finding aid, American Folklife Center, Library of Congress, 2022, accessed September 28, 2026, https://hdl.loc.gov/loc.afc/eadafc.af022004.

[^24]: "The Lomax Digital Archive," Association for Cultural Equity, accessed September 28, 2026, https://www.culturalequity.org/archive/online-archive.

[^25]: International Library of African Music, Rhodes University, accessed September 28, 2026, https://www.ru.ac.za/ilam/.

[^26]: Form after *The Chicago Manual of Style*, 18th ed. (Chicago: University of Chicago Press, 2024), website examples in the online citation guide, https://www.chicagomanualofstyle.org/tools_citationguide/citation-guide-1.html.

## Bibliography

Association for Cultural Equity. "The Lomax Digital Archive." Accessed September 28, 2026. https://www.culturalequity.org/archive/online-archive.

Bartók, Béla. "Népdalkutatás és nacionalizmus." *Tükör* 5, no. 3 (March 1937): 166–68. https://bartok-irasai.zti.hu/en/irasok/nepdalkutatas-es-nacionalizmus-2/.

Bartók, Béla. "Race Purity in Music." *Modern Music* 19, no. 3 (March–April 1942): 153–55. https://bartok-irasai.zti.hu/en/irasok/race-purity-in-music-2/.

Bartók, Béla. *Rumanian Folk Music*. Edited by Benjamin Suchoff. 5 vols. Bartók Archives Studies in Musicology. The Hague: Martinus Nijhoff, 1967–75. Vol. 4, *Carols and Christmas Songs (Colinde)*, 1975, https://doi.org/10.1007/978-94-010-1683-4; vol. 5, *Maramureș County*, 1975, https://doi.org/10.1007/978-94-010-1686-5.

Bartók, Béla, ifj. *Apám életének krónikája*. Nagy muzsikusok életének krónikája 16. Budapest: Zeneműkiadó, 1981.

Bartók, Béla, ifj. *Bartók Béla életének krónikája*. Edited by Vásárhelyi Gábor. Budapest: Magyarságkutató Intézet, 2021. https://mek.oszk.hu/22000/22043/.

CARTO. "Attributions." Accessed September 28, 2026. https://carto.com/attributions.

GIStory. "GISta Hungarorum (OTKA K 111766)." Accessed September 28, 2026. https://www.gistory.hu/g/en/gistory/otka.

Grainger Museum, University of Melbourne. Accessed September 28, 2026. https://grainger.unimelb.edu.au/.

Hungaricana. "The Folk Music Collection of the HAS–RCH Institute for Musicology." Accessed September 28, 2026. https://www.hungaricana.hu/en/databases/zti/.

HUN-REN BTK Institute for Musicology. "The Bartók System." Accessed September 28, 2026. https://systems.zti.hu/br/en.

HUN-REN BTK Institute for Musicology. "Béla Bartók, the Ethnomusicologist." Edited by István Pávai and Pál Richter. 2021. Accessed September 28, 2026. https://bartok-gyujtesek.zti.hu/en.

HUN-REN BTK Institute for Musicology. "Béla Bartók Writings." Edited by Viola Biró. 2021. Accessed September 28, 2026. https://bartok-irasai.zti.hu/en/.

HUN-REN BTK Institute for Musicology. "Folk Music in Bartók's Compositions." Edited by Márton Kerékfy and Viola Biró. 2020–25. Accessed September 28, 2026. https://bartok-nepzene.zti.hu/en/.

Institutul de Etnografie și Folclor "Constantin Brăiloiu," Academia Română. Accessed September 28, 2026. https://acad.ro/ief/.

International Library of African Music, Rhodes University. Accessed September 28, 2026. https://www.ru.ac.za/ilam/.

Kelemen, Imre. "Bartók román népzenegyűjtő útjai." *Acta Academiae Paedagogicae Agriensis*, n.s., 14 (1978): 399–415. http://publikacio.uni-eszterhazy.hu/689/.

Lampert, Vera. "Bartók and the Berlin School of Ethnomusicology." *Studia Musicologica* 49, no. 3–4 (2008): 383–405. https://doi.org/10.1556/smus.49.2008.3-4.9.

Lampert, Vera. *Folk Music in Bartók's Compositions: A Source Catalog; Arab, Hungarian, Romanian, Ruthenian, Serbian, and Slovak Melodies*. Budapest: Hungarian Heritage House, 2008.

Library of Congress, American Folklife Center. "Frances Densmore Papers." Finding aid, 2022. Accessed September 28, 2026. https://hdl.loc.gov/loc.afc/eadafc.af022004.

Memobase (Memoriav). "Collection sonore Constantin Brăiloiu, Archives internationales de musique populaire (AIMP)." Accessed September 28, 2026. https://memobase.ch/fr/recordSet/meg-003.

Museum of Ethnography, Budapest. "Folk Music Collection (Audio Materials and Transcription of Melodies)." Accessed September 28, 2026. http://www.neprajz.hu/en/gyujtemenyek/ethnological-archives/audio-archive/audio_archive.html.

Music Encoding Initiative. "About." Accessed September 28, 2026. https://music-encoding.org/about/.

Natural Earth. "Terms of Use." Accessed September 28, 2026. https://www.naturalearthdata.com/about/terms-of-use/.

OpenStreetMap. "Copyright and License." Accessed September 28, 2026. https://www.openstreetmap.org/copyright.

Ota, Mineo. "Why Is the 'Spirit' of Folk Music so Important? On the Historical Background of Béla Bartók's Views of Folk Music." *International Review of the Aesthetics and Sociology of Music* 37, no. 1 (2006): 33–46.

Ourednik, Andrés, and contributors. "Historical Boundaries of World Countries and Cultural Regions." GitHub repository aourednik/historical-basemaps. Accessed September 28, 2026. https://github.com/aourednik/historical-basemaps.

University of Chicago Press. *The Chicago Manual of Style*. 18th ed. Chicago: University of Chicago Press, 2024. Citation guide: https://www.chicagomanualofstyle.org/tools_citationguide/citation-guide-1.html.

Vaughan Williams Memorial Library, English Folk Dance and Song Society. "Cecil James Sharp Collection." Archives catalogue CJS1. Accessed September 28, 2026. https://archives.vwml.org/records/CJS1.

Vaughan Williams Memorial Library, English Folk Dance and Song Society. "Cecil Sharp's Appalachian Diaries." Accessed September 28, 2026. https://www.vwml.org/topics/sharp-diaries.

Vaughan Williams Memorial Library, English Folk Dance and Song Society. "Percy Grainger Folk Song Collection." Archives catalogue PG. Accessed September 28, 2026. https://archives.vwml.org/records/PG.

Wikidata. "Wikidata:Licensing." Accessed September 28, 2026. https://www.wikidata.org/wiki/Wikidata:Licensing.
