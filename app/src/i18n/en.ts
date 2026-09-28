// Every user-facing string, keyed as in docs/UI-COPY.md. English UI; Romanian and Hungarian secondary
// labels for facets, genres, performance, style and instruments (decision D10).

export const en: Record<string, string> = {
  'app.title': 'Bartok / Romania',
  'app.subtitle': "Bela Bartok's field collection, localities in present-day Romania",
  'app.skipToResults': 'Skip to results',
  'nav.explorer': 'Explorer',
  'nav.about': 'About and sources',
  'nav.journeys': 'Journeys',
  'nav.back': 'Back',
  'nav.backToResults': 'Back to results',
  'nav.breadcrumb': 'Breadcrumb',
  'nav.openCounty': 'Open county page',
  'nav.viewInExplorer': 'View in explorer',
  'theme.label': 'Theme',
  'theme.auto': 'Auto',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  colourByGenre: 'Colour by genre',
  copyLink: 'Copy link',
  linkCopied: 'Link copied',
  copyManual: 'Press Ctrl+C to copy',
  loadingCollection: 'Loading the collection...',
  offlineToast: 'You are offline; map tiles may not load.',

  'search.label': 'Search melodies',
  'search.placeholder': 'Search titles, places, performers, codes',
  'search.clear': 'Clear search',
  'search.hint': 'Search matches titles, incipits, performers, collectors, reference codes and place names.',

  'facet.filters': 'Filters',
  'facet.place': 'Place',
  'facet.country': 'Country',
  'facet.region': 'Region',
  'facet.county': 'County',
  'facet.countyHistorical': 'Historical county',
  'facet.village': 'Village',
  'facet.genre': 'Genre',
  'facet.style': 'Style',
  'facet.performance': 'Performance',
  'facet.instrument': 'Instrument',
  'facet.year': 'Year',
  'facet.yearFrom': 'From',
  'facet.yearTo': 'To',
  'facet.performer': 'Performer',
  'facet.collector': 'Collector',
  'facet.source': 'Source',
  'facet.melodies': 'Melodies',
  'facet.notation': 'Notation',
  'facet.audio': 'Recording',
  'facet.text': 'Text',
  'facet.notMapped': 'not mapped',
  'facet.unknown': 'unknown',
  'facet.noDate': 'n.d.',
  'facet.allCountries': 'All countries',
  'facet.villageUnknown': '(village unknown)',
  'facet.countyUnknown': '(county unknown)',
  'facet.sexM': 'male',
  'facet.sexF': 'female',
  'facet.clear': 'Clear',
  'facet.clearAll': 'Clear all filters',
  'facet.showAll': 'Show all ({n})',
  'facet.showFewer': 'Show fewer',
  'facet.activeCount': '{n} active',
  'facet.removeChip': 'Remove filter: {label}',
  'facet.zero': '(0)',
  'facet.noGenre': 'no genre',
  'facet.view': 'View',
  'view.map': 'Map',
  'view.list': 'List',
  'view.table': 'Table',

  'tree.label': 'Places',
  'tree.expand': 'Expand {name}',
  'tree.collapse': 'Collapse {name}',
  'tree.select': 'Filter to {name}',
  'tree.deselect': 'Clear {level} filter',
  'tree.historicalOnly': 'Historical name; modern name unknown',
  'tree.notMapped': 'not mapped',
  'tree.unknownCountry': 'Unknown country',

  'results.label': 'Results',
  'results.count': '{n} melodies',
  'results.countOf': '{n} of {m} melodies',
  'results.export': 'Export JSON',
  'results.exportConfirm': 'This export is about {size} MB. Download?',
  'results.exportDisabled': 'Nothing to export',
  'results.countOne': '1 melody',
  'results.countUnmapped': '{n} melodies, {m} not mapped',
  'results.hasAudio': 'has recording',
  'results.hasNotation': 'has notation',
  'results.noTitle': 'Untitled',
  'results.pages': 'Results pages',
  'results.pageOf': 'Page {page} of {pages}',
  'results.prev': 'Previous page',
  'results.next': 'Next page',
  'results.goToPage': 'Go to page',

  'sort.label': 'Sort by',
  'sort.title': 'Title',
  'sort.style': 'Style',
  'sort.location': 'Location',
  'sort.year': 'Year',
  'sort.source': 'Source number',
  'sort.asc': 'Ascending',
  'sort.desc': 'Descending',
  'sort.toggleDir': 'Toggle sort direction',
  'sort.column': 'Sort by {column}',
  'sort.unknownLast': 'Unknown values are listed last',

  'map.label': 'Map of melodies; use the list after the map for keyboard access',
  'map.zoomIn': 'Zoom in',
  'map.zoomOut': 'Zoom out',
  'map.fitRomania': 'Fit to Romania',
  'map.fitCounty': 'Fit to county',
  'map.layerBubbles': 'County bubbles',
  'map.layerChoropleth': 'County shading',
  'map.legend': 'Legend',
  'map.legendSize': 'Dot size: melodies',
  'map.pointList': 'List map points ({n})',
  'map.listCounties': 'List counties ({n})',
  'map.listVillages': 'List villages ({n})',
  'map.showMelodies': 'Show melodies',
  'map.locationUncertain': 'location uncertain',
  'map.pointLabel': '{name}, {county}: {n} melodies',
  'map.countyLabel': '{name}: {n} melodies in {v} villages',
  'map.clusterLabel': 'Cluster of {p} places, {n} melodies; press to zoom',
  'map.clickVillage': 'Click to filter to this village',
  'map.clickCounty': 'Click to zoom to this county',
  'map.clickClear': 'Click to clear this filter',
  'map.melodiesIn': '{n} melodies in {v} villages',
  'map.recordings': '{n} recordings',
  'map.notations': '{n} notations',
  'map.villagesNotMapped': '{n} villages not mapped',
  'map.notMapped': '{n} not mapped',
  'map.notMappedOne': '1 not mapped',
  'map.selectedNotMapped': 'Selected place is not mapped',
  'map.unmappedTitle': 'Showing {n} melodies without coordinates',
  'map.unmappedBody': 'These places could not be located; they are still listed in the place tree.',
  'map.backToMap': 'Back to map',
  'map.tilesUnavailable': 'Map tiles unavailable; showing county outlines',
  'map.retryTiles': 'Try tiles again',
  'map.attributionOsm': '(c) OpenStreetMap contributors',
  'map.attributionCarto': '(c) CARTO',
  'map.attributionBounds': 'County boundaries: Natural Earth',
  'map.yearSpan': '{from}-{to}',
  'map.yearMixed': '{from}-{to} and n.d.',
  'map.loading': 'Loading the collection...',

  'county.villages': 'Villages',
  'county.villagesIn': 'Villages in {name}, {n}',
  'county.stats.melodies': 'melodies',
  'county.stats.villages': 'villages',
  'county.stats.audio': 'with recording',
  'county.stats.notation': 'with notation',
  'county.stats.years': 'years',
  'county.tab.melodies': 'Melodies',
  'county.tab.genre': 'By genre',
  'county.tab.performer': 'By performer',
  'county.tab.timeline': 'Timeline',
  'county.tab.map': 'Local map',
  'county.col.village': 'Village',
  'county.col.melodies': 'Melodies',
  'county.col.genres': 'Genres',
  'county.col.years': 'Years',
  'county.col.title': 'Title',
  'county.col.genre': 'Genre',
  'county.col.performance': 'Performance',
  'county.col.year': 'Year',
  'county.col.source': 'Source',
  'county.col.performer': 'Performer',
  'county.col.age': 'Age',
  'county.col.ethnicity': 'Ethnicity',
  'county.unnamedPerformer': 'Unnamed performer ({n})',
  'county.timelineLabel': '{year}: {n} melodies',
  'county.timelineUnknown': '{n} melodies without a year',
  'county.filteredNote': 'Counts reflect the active filters',
  'county.genrePct': '{pct}% of {total}',

  'song.tab.record': 'Record',
  'song.tab.raw': 'Raw JSON',
  'song.prev': 'Previous melody',
  'song.next': 'Next melody',
  'song.position': '{i} of {n} in results',
  'song.notationAlt': 'Notation of {title}, source {ref}',
  'song.notationView': 'View full size',
  'song.notationNone': 'No notation image for this record',
  'song.notationError': 'The notation image could not be loaded',
  'song.audioLabel': 'Recording of {title}',
  'song.audioNone': 'No recording available',
  'song.audioError': 'The recording could not be loaded',
  'song.audioDownload': 'Download recording',
  'song.audioCredit': 'Recording: HUN-REN BTK Institute for Musicology',
  'song.text': 'Text',
  'song.textNone': 'No text recorded',
  'song.related': 'Related melodies',
  'song.relatedVillage': 'Also from {name}',
  'song.relatedPerformer': 'Also by {name}',
  'song.relatedSource': 'Neighbouring source numbers',
  'song.rail.where': 'Where',
  'song.rail.whoWhen': 'Who / when',
  'song.rail.music': 'Music',
  'song.rail.source': 'Source',
  'song.rail.works': "In Bartók's works",
  'song.row.village': 'Village',
  'song.row.county': 'County',
  'song.row.region': 'Region',
  'song.row.country': 'Country',
  'song.row.coordinates': 'Coordinates',
  'song.row.performer': 'Performer',
  'song.row.age': 'Age',
  'song.row.ethnicity': 'Ethnicity',
  'song.row.collector': 'Collector',
  'song.row.date': 'Date',
  'song.row.year': 'Year',
  'song.row.genre': 'Genre',
  'song.row.performance': 'Performance',
  'song.row.style': 'Style',
  'song.row.instruments': 'Instruments',
  'song.row.system': 'System position',
  'song.row.cadences': 'Cadences',
  'song.row.rhythm': 'Rhythm',
  'song.row.remarks': 'Remarks',
  'song.row.reference': 'Reference',
  'song.row.database': 'Database',
  'song.row.id': 'Record id',
  'song.openSource': 'Open record on {site}',
  'song.row.origin': "Informant's origin",
  'song.row.placeRaw': 'Place as printed',
  'song.row.sex': 'Sex',
  'song.row.mode': 'Mode',
  'song.row.ambitus': 'Ambitus',
  'song.row.syllables': 'Syllables',
  'song.row.form': 'Form',
  'song.row.volume': 'Volume',
  'song.row.number': 'Number',
  'song.related.variants': 'Variants',
  'song.related.sameSource': 'Same source',
  'song.related.crossSite': 'In another database',
  'song.remarks': 'Remarks',
  'song.notationPage': 'Notation for {title}, page {n}',
  'song.notationPdf': 'Open notation (PDF)',
  'song.audioOf': 'Recording {i} of {n}',
  'song.copyJson': 'Copy JSON',
  'song.showAllJson': 'Show all',
  'song.lightbox': 'Notation image, full size',
  'song.close': 'Close',

  'phone.tab.map': 'Map',
  'phone.tab.list': 'List',
  'phone.tab.filters': 'Filters',
  'phone.filtersCount': 'Filters ({n})',
  'phone.showResults': 'Show {n} melodies',
  'phone.showResultsOne': 'Show 1 melody',
  'phone.viewList': '{n} melodies, view list',
  'phone.filterToPlace': 'Filter to this place',
  'phone.closeSheet': 'Close filters',

  'state.loading': 'Loading...',
  'state.emptyTitle': 'No melodies match these filters.',
  'state.emptySearchTitle': 'No melodies match "{q}".',
  'state.emptyBody': 'Try removing a filter, or clear all filters to start again.',
  'state.removeLast': 'Remove last filter',
  'state.dataErrorTitle': 'The collection could not be loaded.',
  'state.dataErrorBody':
    'Check your connection and try again. If the problem persists, the data files may be missing from this deployment.',
  'state.retry': 'Retry',
  'state.songNotFound': 'No record with id {id}',
  'state.countyNotFound': 'No county with id {id}',
  'state.notFound': 'Page not found',
  'state.backToExplorer': 'Back to explorer',
  'state.clearSearch': 'Clear search',
  'state.placeholder': 'This screen is being built. The explorer is available now.',

  'footer.data':
    'Data: HUN-REN BTK Institute for Musicology, Budapest (Bartok Archives): "Folk Music in Bartok\'s Compositions", "The Bartok System" and "Bela Bartok, the Ethnomusicologist".',
  'footer.independent':
    'Records, notation images and recordings remain the property of the Institute; this viewer is an independent interface and is not affiliated with it.',
  'footer.print':
    'Printed edition: Bela Bartok, Rumanian Folk Music (ed. Benjamin Suchoff, Martinus Nijhoff, 1967-1975), open volumes on the Internet Archive; only facts and incipits are indexed.',
  'footer.map': 'Map: (c) OpenStreetMap contributors, (c) CARTO. County boundaries: Natural Earth.',
  'footer.institute.en': 'HUN-REN BTK Institute for Musicology, Budapest',
  'footer.institute.ro': 'Institutul de Muzicologie HUN-REN BTK, Budapesta',
  'footer.institute.hu': 'HUN-REN BTK Zenetudományi Intézet, Budapest',

  'source.open': 'Open original record on {site}',
  'source.site.fmbc': "Folk Music in Bartók's Compositions",
  'source.site.bsys': 'The Bartók System',
  'source.site.gyuj': 'Béla Bartók, the Ethnomusicologist',
  'source.site.rfm': 'Rumanian Folk Music (printed edition, Internet Archive scan)',
  'source.siteShort.fmbc': 'FMBC',
  'source.siteShort.bsys': 'BS',
  'source.siteShort.gyuj': 'BBE',
  'source.siteShort.rfm': 'RFM',
  'source.reference': 'Source reference',
  'source.noUrl': 'Source page not available',
  'source.url.fmbc': 'https://bartok-nepzene.zti.hu/en/',
  'source.url.bsys': 'https://systems.zti.hu/br/en',
  'source.url.gyuj': 'https://bartok-gyujtesek.zti.hu/en',
  'source.url.rfm': 'https://archive.org/details/rumanianfolkmusi0004blab',

  'journey.title': 'Journeys',
  'journey.prompt': 'Pick a trip on the timeline or enter a date.',
  'journey.noTrips': 'No trips could be reconstructed: no dated records.',
  'about.title': 'About and sources',
}

/** Secondary labels (ro / hu) for facet headings and place levels. */
export const facetHints: Record<string, { ro: string; hu: string }> = {
  filters: { ro: 'Filtre', hu: 'Szűrők' },
  place: { ro: 'Loc', hu: 'Hely' },
  country: { ro: 'Țară', hu: 'Ország' },
  region: { ro: 'Regiune', hu: 'Régió' },
  county: { ro: 'Județ', hu: 'Megye' },
  countyHistorical: { ro: 'Comitat (istoric)', hu: 'Vármegye (történelmi)' },
  village: { ro: 'Sat / localitate', hu: 'Falu / település' },
  genre: { ro: 'Gen', hu: 'Műfaj' },
  style: { ro: 'Stil', hu: 'Stílus' },
  performance: { ro: 'Interpretare', hu: 'Előadásmód' },
  instrument: { ro: 'Instrument', hu: 'Hangszer' },
  year: { ro: 'An', hu: 'Év' },
  yearFrom: { ro: 'De la', hu: 'Ettől' },
  yearTo: { ro: 'Până la', hu: 'Eddig' },
  performer: { ro: 'Interpret / informator', hu: 'Előadó / adatközlő' },
  collector: { ro: 'Culegător', hu: 'Gyűjtő' },
  source: { ro: 'Sursă', hu: 'Forrás' },
  melodies: { ro: 'Melodii', hu: 'Dallamok' },
  notMapped: { ro: 'fără coordonate', hu: 'térképen nem jelölt' },
  unknown: { ro: 'necunoscut', hu: 'ismeretlen' },
  noDate: { ro: 'f.a.', hu: 'é.n.' },
  allCountries: { ro: 'Toate țările', hu: 'Minden ország' },
  villageUnknown: { ro: '(sat necunoscut)', hu: '(falu ismeretlen)' },
  countyUnknown: { ro: '(județ necunoscut)', hu: '(megye ismeretlen)' },
}

/** Genre labels: ro is the primary name, en the gloss, hu goes in `title` (UI-COPY 3.1). */
export const genreLabels: Record<string, { ro: string; en: string; hu: string; note: string }> = {
  colinda: { ro: 'colindă', en: 'winter carol', hu: 'kolinda (téli köszöntő ének)', note: 'Bartok\'s "Colinde", sung at Christmas and New Year' },
  doina: { ro: 'doină', en: 'lyrical improvised song (hora lungă)', hu: 'doina (hora lungă)', note: 'free-rhythm, improvised; Bartok\'s "hora lungă" of Maramures' },
  bocet: { ro: 'bocet', en: 'lament', hu: 'sirató', note: 'funeral lament' },
  cantec: { ro: 'cântec (propriu-zis)', en: 'song proper', hu: 'tulajdonképpeni dal', note: 'Bartok\'s "cântec propriu-zis"' },
  joc: { ro: 'joc', en: 'dance tune', hu: 'táncdallam', note: 'instrumental or vocal dance melody' },
  nunta: { ro: 'cântec de nuntă', en: 'wedding song', hu: 'lakodalmi dal', note: 'wedding ritual songs' },
  other: { ro: 'altele', en: 'other / unclassified', hu: 'egyéb', note: 'anything the normaliser could not map' },
}

export const performanceLabels: Record<string, { en: string; ro: string; hu: string }> = {
  vocal: { en: 'vocal', ro: 'vocal', hu: 'énekes' },
  instrumental: { en: 'instrumental', ro: 'instrumental', hu: 'hangszeres' },
  mixed: { en: 'vocal and instrumental', ro: 'vocal și instrumental', hu: 'énekes és hangszeres' },
  unknown: { en: 'unknown', ro: 'necunoscut', hu: 'ismeretlen' },
}

/** Style strings are verbatim from the data; these are the expected values (UI-COPY 3.3 plus the data's own). */
export const styleLabels: Record<string, { en: string; ro: string; hu: string }> = {
  old: { en: 'old style', ro: 'stil vechi', hu: 'régi stílus' },
  'old style': { en: 'old style', ro: 'stil vechi', hu: 'régi stílus' },
  new: { en: 'new style', ro: 'stil nou', hu: 'új stílus' },
  'new style': { en: 'new style', ro: 'stil nou', hu: 'új stílus' },
  mixed: { en: 'mixed style', ro: 'stil mixt', hu: 'vegyes stílus' },
  'mixed style': { en: 'mixed style', ro: 'stil mixt', hu: 'vegyes stílus' },
  other: { en: 'other', ro: 'altele', hu: 'egyéb' },
  instrumental: { en: 'instrumental', ro: 'instrumental', hu: 'hangszeres' },
  'not classified': { en: 'not classified', ro: 'neclasificat', hu: 'nem osztályozott' },
}

export const instrumentLabels: Record<string, { en: string; ro: string; hu: string }> = {
  voice: { en: 'voice', ro: 'voce', hu: 'ének' },
  violin: { en: 'violin', ro: 'vioară', hu: 'hegedű' },
  fluier: { en: "shepherd's flute (fluier)", ro: 'fluier', hu: 'furulya (fluier)' },
  caval: { en: 'long flute (caval)', ro: 'caval', hu: 'kaval' },
  tilinca: { en: 'tilinca (rim-blown flute)', ro: 'tilincă', hu: 'tilinkó' },
  cimpoi: { en: 'bagpipe', ro: 'cimpoi', hu: 'duda' },
  bagpipe: { en: 'bagpipe', ro: 'cimpoi', hu: 'duda' },
  bucium: { en: 'alphorn (bucium)', ro: 'bucium', hu: 'havasi kürt (bucium)' },
  'alphorn (bucium)': { en: 'alphorn (bucium)', ro: 'bucium', hu: 'havasi kürt (bucium)' },
  drimba: { en: 'jaw harp', ro: 'drâmbă', hu: 'doromb' },
  taragot: { en: 'taragot', ro: 'taragot', hu: 'tárogató' },
  clarinet: { en: 'clarinet', ro: 'clarinet', hu: 'klarinét' },
  cobza: { en: 'cobza', ro: 'cobză', hu: 'koboz' },
  guitar: { en: 'guitar', ro: 'chitară', hu: 'gitár' },
  cimbalom: { en: 'cimbalom', ro: 'țambal', hu: 'cimbalom' },
  bass: { en: 'double bass', ro: 'contrabas', hu: 'nagybőgő' },
  ensemble: { en: 'ensemble', ro: 'taraf', hu: 'zenekar' },
  fujara: { en: 'fujara (Slovak overtone flute)', ro: 'fujara', hu: 'fujara' },
  unknown: { en: 'unknown', ro: 'necunoscut', hu: 'ismeretlen' },
}

const numberFormat = new Intl.NumberFormat('en')
const plural = new Intl.PluralRules('en')

/** Interpolate `{name}` placeholders. Numbers are formatted with a thousands separator. */
export function t(key: string, params?: Record<string, string | number | null | undefined>): string {
  const template = en[key] ?? key
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = params[k]
    if (v === null || v === undefined) return ''
    return typeof v === 'number' ? numberFormat.format(v) : String(v)
  })
}

export function formatNumber(n: number): string {
  return numberFormat.format(n)
}

/** "1 melody" / "{n} melodies" */
export function melodies(n: number): string {
  return plural.select(n) === 'one' ? t('results.countOne') : t('results.count', { n })
}

/** "N of M melodies" (the M side is never singular in practice, but keep the rule). */
export function melodiesOf(n: number, m: number): string {
  return t('results.countOf', { n, m })
}

export function siteName(site: string): string {
  return en[`source.site.${site}`] ?? site
}
export function siteShort(site: string): string {
  return en[`source.siteShort.${site}`] ?? site.toUpperCase()
}
export function siteUrl(site: string): string | undefined {
  return en[`source.url.${site}`]
}

/** "colindă / winter carol" for a genre id (null renders "no genre"). */
export function genreLabel(genre: string | null): string {
  if (!genre) return t('facet.noGenre')
  const g = genreLabels[genre]
  return g ? `${g.ro} / ${g.en}` : genre
}
export function genreTitle(genre: string | null): string | undefined {
  if (!genre) return undefined
  const g = genreLabels[genre]
  return g ? `hu: ${g.hu}` : undefined
}
export function performanceLabel(p: string): string {
  return performanceLabels[p]?.en ?? p
}
export function styleLabel(s: string): string {
  return styleLabels[s]?.en ?? s
}
export function instrumentLabel(i: string): string {
  return instrumentLabels[i]?.en ?? i
}
/** "ro / hu" hint under a facet heading, or for a value. */
export function roHu(x: { ro: string; hu: string } | undefined): string | undefined {
  return x ? `${x.ro} / ${x.hu}` : undefined
}
