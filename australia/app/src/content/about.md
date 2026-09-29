# About and sources

**Culegeri Australia** is an academic, non-commercial study aid. It indexes the *Australian Folk Songs* collection that Mark Gregory has compiled at [folkstream.com](https://folkstream.com/) since 1994, and puts its songs and poems on a map of where they were first printed, so that a text, its newspaper, its town and its decade can be read together. It is a companion to [Culegeri](/), the viewer of Bartók's field collection in Romania, and shares its code and its approach.

The viewer collects no data about its readers.

## What it holds

- **Records.** Every song or poem page listed on the collection's [contents page](https://folkstream.com/songs.html) was fetched once and parsed: title, year, lyrics, Mark Gregory's notes, the links in the notes, the notation or masthead image and the MIDI file where one exists. Every record links back to its page.
- **Provenance.** The notes are prose. The viewer reads from them, by explicit patterns only, the newspaper cited (usually with a link to the digitised article on the National Library of Australia's Trove), its date and page, the songbooks cited, and singers and collectors named in phrases such as "from the singing of" or "collected by". A phrase that does not match a pattern is left alone; the notes themselves are always shown.
- **Places.** The place of a record is the town where the cited newspaper was published, resolved through Wikidata. Records whose paper is not resolved are placed at the state the notes name, or left unplaced. This is a map of where the texts were printed, not of where they were sung.
- **Years.** From the title where it carries one, else from the contents page, the newspaper date, or the notes.
- **Sources.** The songbook bibliography and the articles index from the collection.

Counts and the state of the crawl are on the [Sources](/sources) page.

## Limits

- Fields derived from prose are heuristics. Each record keeps the sentence it was read from, and the raw JSON tab shows everything.
- A title shared by newspapers in several cities (*The Worker*, *The Herald*) is resolved per record from the state the notes mention; where the notes mention none, the most common place for that title is used.
- Song or poem is stated only when the page or the notes say so; the rest are marked "not stated".
- The 1994 core of the collection carries notation and MIDI; most later records reproduce the newspaper's masthead instead.

## Sources and attribution

- Mark Gregory, *Australian Folk Songs*, https://folkstream.com/ (1994 to date). Lyrics, notes, images and MIDI files remain his; this viewer indexes text and metadata and shows images and MIDI from his site.
- National Library of Australia, *Trove*, https://trove.nla.gov.au/, for the digitised newspaper articles the notes cite.
- Wikidata (CC0) for newspapers, their places of publication and coordinates.
- Map tiles: © OpenStreetMap contributors, © CARTO.

## Use of an AI model

Claude, a large language model, was used to write the crawler, the parser, the data build and this viewer, and to draft this page. Its output was checked against the source pages. It did not write the songs' metadata; every record links to its page.

## Licence and contact

Academic use only, as for the rest of Culegeri. Contact: tsaar@student.unimelb.edu.au. To report an error, write with the record's link and what the source says instead.
