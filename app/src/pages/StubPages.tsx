// About and NotFound (FRONTEND-SPEC 2). Each renders inside the shell with the footer.
// County and Song live in CountyPage.tsx and SongPage.tsx; Journeys in routes/journeys.tsx.
import { useEffect } from 'react'
import { Link } from 'react-router'
import { useQuery } from '../app/query'
import { genreLabels, siteName, siteUrl, t } from '../i18n/en'
import { EmptyState } from '../components/States'

function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | ${t('app.title')}`
  }, [title])
}

const RFM_VOLUMES = [
  { vol: 'IV', title: 'Rumanian Folk Music, vol. IV: Carols and Christmas Songs (Colinde)', url: 'https://archive.org/details/rumanianfolkmusi0004blab' },
  { vol: 'V', title: 'Rumanian Folk Music, vol. V: Maramureș County', url: 'https://archive.org/details/rumanianfolkmusi0005blab' },
]

const BORDER_SOURCES = [
  { title: 'Natural Earth 1:10m admin-0 and admin-1 (present-day countries and Romanian counties)', url: 'https://www.naturalearthdata.com/', licence: 'public domain' },
  { title: 'GISta Hungarorum, OTKA K 111766 (counties of the Kingdom of Hungary in 1910)', url: 'https://www.gistory.hu/', licence: 'CC BY-NC' },
  { title: 'historical-basemaps by Andre Ourednik and contributors (state borders 1914 and 1920; approximate, work in progress)', url: 'https://github.com/aourednik/historical-basemaps', licence: 'GPL-3.0' },
  { title: 'Wikidata (village names, status, administrative units)', url: 'https://www.wikidata.org/', licence: 'CC0 1.0' },
]

export function AboutPage() {
  useTitle(t('about.title'))
  return (
    <div className="page about">
      <h1>{t('about.title')}</h1>
      <p className="about__credit">
        Built by Thomas Saar (BMus) in his honours year at the University of Melbourne. This viewer is an academic, non-commercial study aid for reading Béla Bartók's Romanian field
        collection alongside the databases that hold it; it sells nothing and collects no data about its readers. Contact: [contact].
      </p>

      <h2>What this is</h2>
      <p>
        A static viewer over Béla Bartók's ethnographic field collection with a focus on localities in present-day Romania. Browse by country, region, county and village on a map,
        filter by genre, style, performance, instrument and year, follow his collecting trips as routes on the map with the borders of the time, and open every record on the
        database that holds it. Nothing is republished here: the viewer indexes facts (place, date, performer, reference code, incipit) and links each of them back to its
        catalogue page. Every record links back to its original catalogue entry.
      </p>

      <h2>Sources</h2>
      <p>
        The record data comes from three online databases of the {t('footer.institute.en')} (<span lang="ro">{t('footer.institute.ro')}</span> / <span lang="hu">{t('footer.institute.hu')}</span>),
        Bartók Archives. Records, notation images and recordings remain the property of the Institute; this viewer is an independent interface and is not affiliated with it.
      </p>
      <ul>
        {(['fmbc', 'bsys', 'gyuj'] as const).map((s) => (
          <li key={s}>
            <a href={siteUrl(s)} target="_blank" rel="noopener noreferrer">
              {siteName(s)}
            </a>{' '}
            <span className="mono muted">{siteUrl(s)}</span>
          </li>
        ))}
      </ul>
      <p>
        The printed edition <cite>Rumanian Folk Music</cite> (Béla Bartók, ed. Benjamin Suchoff, Martinus Nijhoff, The Hague, 1967-1975) is used for the Maramureș and colinde
        material through the scans on the Internet Archive. Only facts and incipits are indexed from the printed indexes; every entry links to the scanned page, and no page image,
        notation or text is copied into this site. The volumes remain under copyright; please consult them on the Archive or in a library.
      </p>
      <ul>
        {RFM_VOLUMES.map((v) => (
          <li key={v.vol}>
            <a href={v.url} target="_blank" rel="noopener noreferrer">
              {v.title}
            </a>
          </li>
        ))}
      </ul>
      <p>Borders and place data on the journey map and the explorer:</p>
      <ul>
        {BORDER_SOURCES.map((b) => (
          <li key={b.url}>
            <a href={b.url} target="_blank" rel="noopener noreferrer">
              {b.title}
            </a>
            , {b.licence}
          </li>
        ))}
        <li>
          Base map tiles: &copy;{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            OpenStreetMap
          </a>{' '}
          contributors (ODbL), &copy;{' '}
          <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">
            CARTO
          </a>{' '}
          (Positron style).
        </li>
      </ul>

      <h2>How the data was built</h2>
      <p>
        The three databases were crawled politely (one request per second, cached on disk) on 28 September 2026 and parsed into one deterministic JSON dataset: 14,910 records
        after merging the 2,330 record pairs that the Bartók System and the Ethnomusicologist site share, from 261 Folk Music in Bartók's Compositions pages, 13,817 Bartók
        System pages, 2,332 Ethnomusicologist pages and 830 entries of the printed Rumanian Folk Music indexes. 4,015 records resolve to a locality in present-day Romania,
        3,332 of them with coordinates; the place tree holds 909 nodes (869 villages). Bartók's 101 collecting trips listed on the Ethnomusicologist site's trip index, with
        records attached by date and county, and 104 further runs of record dates make up the journeys.
      </p>

      <h2>Data quality</h2>
      <p>
        Every record was parsed from its full catalogue page, not from a listing row, so the fields shown are the fields the source prints. The printed-edition entries were read
        by OCR from the Internet Archive scans and aligned to the index pages; village names and dates from that pass can carry OCR errors (a misread month, a dropped diacritic),
        and each such entry links to the scanned page so it can be checked. None of the sites prints a genre label, so genres are only known for the printed-edition entries
        (830 of 14,910 records); 2,606 records name a place that could not be located and are listed as "not mapped"; 2,004 records carry no year. Historical borders are
        drawn from world-scale datasets and are approximate; the 1910 county boundaries are the most precise layer. Trips derived from record dates alone are labelled as such.
      </p>

      <h2>Names of places</h2>
      <p>
        Places are shown by their modern name first, with the historical (usually Hungarian) name in parentheses in monospace, e.g. Beiuș (Belényes). The historical name is the
        key that links back to the source databases.
      </p>

      <h2>Genres</h2>
      <ul>
        {Object.entries(genreLabels).map(([id, g]) => (
          <li key={id}>
            <span lang="ro">{g.ro}</span> / {g.en} / <span lang="hu">{g.hu}</span>
          </li>
        ))}
      </ul>

      <h2>How to cite</h2>
      <p>Cite the original record on zti.hu or the printed volume; every result row, stop and song page links to it. Every record links back to its original catalogue entry.</p>

      <h2>Accessibility</h2>
      <p>
        Every map has a keyboard path: the dots and stops are buttons in Tab order, Escape clears the selection, and a "List counties / villages" or "List route" disclosure
        after each map repeats its content as a list. The site works in light and dark mode and at phone width.
      </p>

      <h2>Colophon</h2>
      <p>Fonts: IBM Plex (OFL). Map: Leaflet, CARTO Positron tiles, OpenStreetMap data. Built with Vite and React; hosted on Vercel.</p>
    </div>
  )
}

export function NotFoundPage() {
  useTitle(t('state.notFound'))
  const { search } = useQuery()
  return (
    <div className="page">
      <EmptyState
        title={t('state.notFound')}
        actions={
          <Link className="btn" to={{ pathname: '/', search }}>
            {t('state.backToExplorer')}
          </Link>
        }
      />
    </div>
  )
}
