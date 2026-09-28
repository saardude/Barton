# About and sources

Revised draft after the owner's proof-reading, 28 September 2026. Replaces the "About"
component in app/src/pages/StubPages.tsx once approved. Figure placeholders are on their own
lines; the capture list is in the report. Chicago Manual of Style, 18th edition,
notes-and-bibliography; bibliography at the end.

---

Built by Thomas Saar (BMus) in his honours year at the University of Melbourne. This viewer is an academic, non-commercial study aid. It indexes Béla Bartók's ethnographic field collection, with a focus on localities in present-day Romania, and links every record back to the database or printed page that holds it. It sells nothing, carries no advertising and collects no data about its readers. Contact: [contact].

The material is spread across three online databases and a five-volume printed edition, under Hungarian, Romanian and English place names. The viewer puts it on one map, with the borders of the day, so that a melody, its village and its trip can be read together.

![Figure 1. The Explorer with Bihor County selected: filter rail, map and results list.](/about/figure-1.jpg)

## What the viewer holds

### The databases

The record data comes from three databases of the HUN-REN BTK Institute for Musicology (Zenetudományi Intézet) in Budapest, home of the Bartók Archives. *Folk Music in Bartók's Compositions* documents the 261 folk melodies Bartók used in his own works, with place and date of collection, informant and, where one exists, the phonograph recording.[^1] *The Bartók System* is Bartók's classification of his Hungarian folk-song collection, 13,817 record pages online; the Romanian, Slovak and other collections are named in it but not published there.[^2] *Béla Bartók, the Ethnomusicologist* holds 2,332 records arranged by collecting trip, with an index of 101 trips from 1904 to 1918.[^3]

### The printed edition

The databases hold no records for Bartók's Romanian melodies as such. For those the viewer uses the printed edition, *Rumanian Folk Music*, edited by Benjamin Suchoff in five volumes, 1967 to 1975.[^4] Digitised copies of volumes IV (carols and Christmas songs) and V (Maramureș County) were consulted; only facts and incipits are indexed, and every entry links to the page consulted. Volumes I to III are not indexed. Volume V prints no dates under its melodies because all come from one trip, 15 to 27 March 1913.[^5]

### Counts

As of the crawl of 28 September 2026 the viewer indexes 14,910 melodies: 4,015 resolve to a locality in present-day Romania, 3,332 of them with coordinates, and 830 come from *Rumanian Folk Music* IV and V. 5,012 records have a recording on the source site and 12,906 a year. The journey layer holds 178 trips, 44 with a sourced or documented itinerary. Every record links to its original catalogue entry, by reference code where the source prints one, otherwise by its position in the Bartók System or by site and record number.

![Figure 2. A song record: notation, audio, the "Collected on" block and the link to the source entry.](/about/figure-2.jpg)

## How the data was built, and its limits

### Records

Every record was parsed from its full catalogue page, not from a listing row, so the fields shown are the fields the source prints. The sites were fetched once, at one request per second, and kept in a cache.

### Genre

None of the three databases prints a genre label. Genre is known only for the 830 printed-edition entries, where the volumes' own classes give it. For the other 14,080 records the genre facet is empty.

### OCR

The printed-edition entries were read by optical character recognition and aligned with the volumes' own indexes and cross-references. OCR loses diacritics and confuses similar glyphs, so a village, a performer's name or a month from that pass can be wrong. Each entry keeps the raw line it was read from and links to the page.

### Place names

The sources give the historical Hungarian name and county of 1910 ("Belényes, Bihar"); the modern reader needs the Romanian name and present county ("Beiuș, Bihor"). The viewer holds both, keyed on the historical form, and derives the present country from the modern county. Coordinates come from the sources where they print them, otherwise from a gazetteer checked against Wikidata, whose structured data is in the public domain.[^6] Of 1,165 villages checked there, 673 matched an existing settlement, 86 a renamed one, one an abandoned one; 405 are marked "unknown", never guessed. 183 place strings, covering 2,606 records, remain unresolved, nearly all in the Hungarian and Slovak parts of the Bartók System.

![Figure 3. A county page: villages with counts and genre bars, and the melodies table.](/about/figure-3.jpg)

### Journeys

The Institute's trip index is the primary source: each of its 101 entries becomes a trip with its records attached. Over that sits a curated layer of 63 trips, 1904 to 1918, built from the day-by-day chronology of Bartók's life compiled by his son, from Imre Kelemen's 1978 account of the Romanian trips, and from the source lines and prefaces of *Rumanian Folk Music*.[^7] Records outside the index are grouped by date, with a gap of more than ten days starting a new trip. Each trip is labelled "sourced itinerary", "documented itinerary", "dates only" or "index only". Departures default to Budapest and are labelled "assumed". Where the sources disagree on a date, the trip keeps both readings.

![Figure 4. The Journeys page: the trip list and a sourced itinerary drawn on the 1910 county map.](/about/figure-4.jpg)

### Context

The context strip beside the journey map lists dated events: border changes, Bartók's publications of Romanian material, his statements on folk music and nationalism, and their reception. Each entry summarises a cited source; where the Institute's *Béla Bartók Writings* database holds the text, its bibliographic data are taken from there.[^8] The 1937 essay on folk-song research and nationalism and the 1942 essay "Race Purity in Music" are cited by their first printings.[^9] The strip presents documents; it takes no position.

### Use of an AI model

Claude (Fable 5.1), a large language model, was used to build this project: to write the scraping and data-building code, to resolve place names, to assemble the journey itineraries from the cited sources, and to run the optical music recognition experiment. Its output was checked against the sources and the catalogue. It was useful for speed over a large catalogue, for consistent citations across many records, and for pipelines that can be re-run with the same result. It did not write the melodies' metadata; that is the Institute's and the printed edition's, and every record still links to its original entry.

## Sources

### Databases

*Folk Music in Bartók's Compositions*, edited by Márton Kerékfy and Viola Biró, with an introduction abridged from Vera Lampert's source catalogue;[^10] *The Bartók System*; *Béla Bartók, the Ethnomusicologist*, edited by István Pávai and Pál Richter; and *Béla Bartók Writings*, edited by Viola Biró. All four are publications of the HUN-REN BTK Institute for Musicology, Budapest. Records, notation images and recordings remain the Institute's; this viewer is an independent interface and is not affiliated with it.

### Printed edition and itinerary scholarship

Béla Bartók, *Rumanian Folk Music*, ed. Benjamin Suchoff, 5 vols. (The Hague: Martinus Nijhoff, 1967–75). For the itineraries: the chronology of Bartók's life by his son, 2021 edition; Kelemen's 1978 article; and the prefaces and source lines of *Rumanian Folk Music* IV and V. Lampert's study of Bartók's transcription methods informed how the record fields are read.[^11]

### Borders, villages, tiles

County boundaries of the Kingdom of Hungary in 1910 are from GISta Hungarorum (OTKA K 111766), CC BY-NC, accurate to 0.5 to 1 km at settlement level.[^12] State borders for 1914 and 1920 are from the historical-basemaps project of Andrés Ourednik and contributors, GPL-3.0, which calls itself work in progress; 1914 stands in for 1910 and 1920 for the post-war state.[^13] Present-day countries and Romanian counties are Natural Earth 1:10m, public domain.[^14] Trips to 1913 get the 1910 counties, 1914 to 1918 the 1914 outline, anything later the 1920 outline. Village names, coordinates, administrative units and status are from Wikidata, CC0. Map tiles: base map data © OpenStreetMap contributors, Open Database License; tiles in the Positron style © CARTO.[^15]

![Figure 5. The Explorer's borders control in compare mode: 1910 counties left of the divider, present-day counties right.](/about/figure-5.jpg)

## Use cases

### A melody, its village, its trip

A record's rail gives Where, Who and when, Music and Source. "Where" links to the village and the county, and the date to the trip, where one is known. The trip page draws the route on the border layer for that year, with a then-and-now toggle: a melody recorded in Bihar in January 1912 sits inside Bihar County of the Kingdom of Hungary; one click shows the same point in Bihor County, Romania.

### Neighbouring villages

The county page lists every village with its melody count and a genre bar, and its melodies table sorts by title, style, location, year or source number. For the Maramureș volume, where every melody is classed, the distribution of hore, dance melodies and colinde across the twelve villages is visible at once.

### Informants and collectors

Performer names are indexed as printed, and the county page has a "by performer" tab. A melody published in both the Bartók System and the Ethnomusicologist site is one merged record with both catalogue links.

### Checking a date

Kelemen re-dates the Borz songs from April to February 1914 on the evidence of cylinder numbers; the printed edition prints "IV. 1914".[^16] The trip entry keeps the conflict, and the year filter and the sort by source number show which records fall on either side.

![Figure 6. A stop in the Maramureș trip of March 1913, with the name then and now and the village status badge.](/about/figure-6.jpg)

### Shareable filters and export

Every filter, sort and place selection is written into the address bar, so a link to "colinde from Hunedoara, 1913 to 1914, sorted by source number" opens the same list for everyone. The results panel, the county page and each trip page have an "Export JSON" button that writes the current records, with their source links and raw fields, to a file.

![Figure 7. The results panel with active filter chips, the query string in the status bar and the Export JSON button.](/about/figure-7.jpg)

### Encoding the notation

The notation images are scans of Bartók's master sheets and of typeset pages. A project note (docs/MEI-OMR-RESEARCH.md) tests whether optical music recognition can turn them into Music Encoding Initiative files, the XML standard for scholarly music encoding.[^17] Typeset and digitally engraved score images could be read with high confidence; handwritten scores need additional model training before they are usable. None of it is in the site yet.

## Beyond Bartók

The model is small: a record, a place, a journey and a source, with a gazetteer of historical and modern names, cited itineraries and border layers by year. Other collections fit it.

### Béla Vikár

Vikár was the first European to use the phonograph in ethnographic fieldwork; his recordings from 1896 open the Museum of Ethnography's cylinder collection in Budapest, which Bartók, Kodály and their students grew to 4,500 cylinders.[^18] His localities are the villages and counties of 1910 that the gazetteer already holds.

### Zoltán Kodály

Kodály's manuscript melody collection, compiled between 1905 and 1958, is part of the Institute's Folk Music Collection, online through Hungaricana with copies of the Museum of Ethnography's phonograph and gramophone recordings.[^19]

### Percy Grainger

Grainger's Edison cylinders of English, Danish, Rarotongan and Māori singers, made from 1906, are held at the Grainger Museum of the University of Melbourne; the folk-song manuscripts are catalogued at the Vaughan Williams Memorial Library in London.[^20] Each recording carries a date and a place, which is all the model needs.

### Fieldwork today

The same model applies to an ethnomusicologist's own recordings: dated, geolocated files with consent and rights metadata on each record; the record, place, journey and source structure; and an itinerary published with its sources from the start rather than reconstructed a century later. Any collection needs a stable link and a dated locality per record, and a licence that allows the facts to be indexed. Place names are political, and rights in recordings belong to the archives and the communities recorded, so a viewer of this kind should index and link, not copy.

## Licensing and access

The site is for academic, non-commercial use and is publicly readable. Management functions (corrections to place resolution, annotations, flagging OCR errors) are planned for a later phase and will be gated to scholars. The CC BY-NC and GPL-3.0 border datasets are acceptable on that basis and their attribution is shown. The printed volumes remain in copyright, and the viewer reproduces neither notation nor song texts from them. The viewer's own code and derived JSON have no licence yet; until one is chosen, all rights are reserved.

## Report an error

Write to tsaar@student.unimelb.edu.au with the record's link and what the source says instead.

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

[^10]: Vera Lampert, *Folk Music in Bartók's Compositions: A Source Catalog; Arab, Hungarian, Romanian, Ruthenian, Serbian, and Slovak Melodies* (Budapest: Hungarian Heritage House, 2008).

[^11]: Vera Lampert, "Bartók and the Berlin School of Ethnomusicology," *Studia Musicologica* 49, no. 3–4 (2008): 383–405, https://doi.org/10.1556/smus.49.2008.3-4.9.

[^12]: "GISta Hungarorum (OTKA K 111766)," GIStory, accessed September 28, 2026, https://www.gistory.hu/g/en/gistory/otka.

[^13]: Andrés Ourednik and contributors, "Historical Boundaries of World Countries and Cultural Regions," GitHub repository aourednik/historical-basemaps, accessed September 28, 2026, https://github.com/aourednik/historical-basemaps.

[^14]: "Terms of Use," Natural Earth, accessed September 28, 2026, https://www.naturalearthdata.com/about/terms-of-use/.

[^15]: "Copyright and License," OpenStreetMap, accessed September 28, 2026, https://www.openstreetmap.org/copyright; "Attributions," CARTO, accessed September 28, 2026, https://carto.com/attributions.

[^16]: Kelemen, "Bartók román népzenegyűjtő útjai," 411–13, note 16; Bartók, *Rumanian Folk Music*, vol. 4, source lines of the Borz melodies.

[^17]: "About," Music Encoding Initiative, accessed September 28, 2026, https://music-encoding.org/about/.

[^18]: "Folk Music Collection (Audio Materials and Transcription of Melodies)," Museum of Ethnography, Budapest, accessed September 28, 2026, http://www.neprajz.hu/en/gyujtemenyek/ethnological-archives/audio-archive/audio_archive.html.

[^19]: "The Folk Music Collection of the HAS–RCH Institute for Musicology," Hungaricana, accessed September 28, 2026, https://www.hungaricana.hu/en/databases/zti/.

[^20]: Grainger Museum, University of Melbourne, accessed September 28, 2026, https://grainger.unimelb.edu.au/; "Percy Grainger Folk Song Collection," Vaughan Williams Memorial Library archives catalogue PG, accessed September 28, 2026, https://archives.vwml.org/records/PG.

## Bibliography

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

Kelemen, Imre. "Bartók román népzenegyűjtő útjai." *Acta Academiae Paedagogicae Agriensis*, n.s., 14 (1978): 399–415. http://publikacio.uni-eszterhazy.hu/689/.

Lampert, Vera. "Bartók and the Berlin School of Ethnomusicology." *Studia Musicologica* 49, no. 3–4 (2008): 383–405. https://doi.org/10.1556/smus.49.2008.3-4.9.

Lampert, Vera. *Folk Music in Bartók's Compositions: A Source Catalog; Arab, Hungarian, Romanian, Ruthenian, Serbian, and Slovak Melodies*. Budapest: Hungarian Heritage House, 2008.

Museum of Ethnography, Budapest. "Folk Music Collection (Audio Materials and Transcription of Melodies)." Accessed September 28, 2026. http://www.neprajz.hu/en/gyujtemenyek/ethnological-archives/audio-archive/audio_archive.html.

Music Encoding Initiative. "About." Accessed September 28, 2026. https://music-encoding.org/about/.

Natural Earth. "Terms of Use." Accessed September 28, 2026. https://www.naturalearthdata.com/about/terms-of-use/.

OpenStreetMap. "Copyright and License." Accessed September 28, 2026. https://www.openstreetmap.org/copyright.

Ourednik, Andrés, and contributors. "Historical Boundaries of World Countries and Cultural Regions." GitHub repository aourednik/historical-basemaps. Accessed September 28, 2026. https://github.com/aourednik/historical-basemaps.

Vaughan Williams Memorial Library, English Folk Dance and Song Society. "Percy Grainger Folk Song Collection." Archives catalogue PG. Accessed September 28, 2026. https://archives.vwml.org/records/PG.

Wikidata. "Wikidata:Licensing." Accessed September 28, 2026. https://www.wikidata.org/wiki/Wikidata:Licensing.
