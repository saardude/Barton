// Every user-facing string of the Australia collection viewer.

export const en: Record<string, string> = {
  'app.title': 'Culegeri Australia',
  'app.short': 'Australia',
  'app.tagline': 'Australian folk songs and poems, by place, paper and year',
  'app.subtitle':
    'An index of Mark Gregory’s Australian Folk Songs collection (folkstream.com): songs and poems by place of publication, newspaper, songbook, singer and year',
  'app.titleSuffix': 'Culegeri Australia',
  'app.skipToResults': 'Skip to results',
  'nav.explorer': 'Explorer',
  'nav.sources': 'Sources',
  'nav.about': 'About and sources',
  'nav.bartok': 'Bartók in Romania',
  'nav.back': 'Back',
  'nav.backToResults': 'Back to results',
  'nav.breadcrumb': 'Breadcrumb',
  'nav.openState': 'Open state page',
  'theme.label': 'Theme',
  'theme.auto': 'Auto',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  copyLink: 'Copy link',
  linkCopied: 'Link copied',
  copyManual: 'Press Ctrl+C to copy',
  loadingCollection: 'Loading the collection...',

  'search.label': 'Search songs',
  'search.placeholder': 'Search titles, lyrics, notes, papers, people',
  'search.clear': 'Clear search',
  'search.hint': 'Search matches titles, first lines, lyrics, notes, newspapers, places, singers, collectors and authors.',

  'facet.filters': 'Filters',
  'facet.filtersOpen': 'Filters ({n})',
  'facet.place': 'Place',
  'facet.placeHint': 'where the paper was published',
  'facet.state': 'State',
  'facet.town': 'Town',
  'facet.kind': 'Kind',
  'facet.kind.song': 'song',
  'facet.kind.poem': 'poem',
  'facet.kind.unknown': 'not stated',
  'facet.tune': 'Tune',
  'facet.tune.notation': 'has notation',
  'facet.tune.midi': 'has MIDI',
  'facet.tune.audio': 'has recording',
  'facet.newspaper': 'Newspaper',
  'facet.songbook': 'Songbook',
  'facet.singer': 'Singer',
  'facet.collector': 'Collector',
  'facet.author': 'Author',
  'facet.year': 'Year',
  'facet.yearFrom': 'From',
  'facet.yearTo': 'To',
  'facet.notation': 'Notation',
  'facet.image': 'Image',
  'facet.midi': 'MIDI',
  'facet.audio': 'Recording',
  'results.hasAudio': 'has recording',
  'song.audioLabel': 'Recording of {title}',
  'song.audioDownload': 'Download MP3',
  'song.audioCredit': 'Recording hosted by folkstream.com.',
  'song.audioError': 'The recording could not be loaded.',
  'facet.text': 'Lyrics',
  'facet.notMapped': 'not mapped',
  'facet.noDate': 'n.d.',
  'facet.clear': 'Clear',
  'facet.clearAll': 'Clear all filters',
  'facet.showAll': 'Show all ({n})',
  'facet.showFewer': 'Show fewer',
  'facet.activeCount': '{n} active',
  'facet.removeChip': 'Remove filter: {label}',
  'facet.zero': '(0)',
  'facet.stateUnknown': '(town unknown)',

  'tree.label': 'Places',
  'tree.expand': 'Expand {name}',
  'tree.collapse': 'Collapse {name}',
  'tree.select': 'Filter to {name}',
  'tree.deselect': 'Clear {level} filter',
  'tree.notMapped': 'not mapped',
  'tree.noPlace': 'No place of publication',

  'results.label': 'Results',
  'results.count': '{n} songs',
  'results.countOne': '1 song',
  'results.countOf': '{n} of {m} songs',
  'results.export': 'Export JSON',
  'results.exportAria': 'Export {n} songs as JSON',
  'results.exportConfirm': 'This export is about {size} MB. Download?',
  'results.exportDisabled': 'Nothing to export',
  'results.hasNotation': 'has notation',
  'results.hasMidi': 'has MIDI',
  'results.noTitle': 'Untitled',
  'results.pages': 'Results pages',
  'results.pageOf': 'Page {page} of {pages}',
  'results.prev': 'Previous page',
  'results.next': 'Next page',
  'results.goToPage': 'Go to page',

  'sort.label': 'Sort by',
  'sort.title': 'Title',
  'sort.year': 'Year',
  'sort.location': 'Place',
  'sort.newspaper': 'Newspaper',
  'sort.number': 'Page number',
  'sort.asc': 'Ascending',
  'sort.desc': 'Descending',
  'sort.toggleDir': 'Toggle sort direction',
  'sort.column': 'Sort by {column}',

  'map.label': 'Map of places of publication; use the list after the map for keyboard access',
  'map.zoomIn': 'Zoom in',
  'map.zoomOut': 'Zoom out',
  'map.fitAll': 'Fit to Australia',
  'map.fitState': 'Fit to {name}',
  'map.resetView': 'Reset',
  'map.legend': 'Map legend',
  'map.legendState': 'songs per state; click to open',
  'map.legendTown': 'songs per town; click to filter',
  'map.legendSelected': 'selected',
  'map.loading': 'Loading map...',
  'map.stateLabel': '{name}: {n} songs in {v} towns',
  'map.pointLabel': '{name}, {state}: {n} songs',
  'map.songsIn': '{n} songs in {v} towns',
  'map.clickOpen': 'Click to filter',
  'map.clickClear': 'Click to clear',
  'map.showSongs': 'Show songs',
  'map.notMapped': '{n} not mapped',
  'map.unmappedTitle': '{n} songs without a place',
  'map.unmappedBody': 'These records name no newspaper, or one whose place of publication is not yet resolved.',
  'map.backToMap': 'Back to the map',
  'map.selectedNotMapped': 'The selected place has no coordinates.',
  'map.listStates': 'Places on the map ({n} states)',
  'map.listTowns': 'Places on the map ({n} towns)',
  'map.attributionBounds': 'Places are the towns where the newspapers were published',

  'phone.tab.map': 'Map',
  'phone.tab.songs': 'Songs',
  'phone.tab.places': 'Places',
  'phone.tab.sources': 'Sources',
  'phone.views': 'Views',
  'phone.viewList': 'View list ({n})',
  'phone.showResults': 'Show {n} songs',
  'phone.showResultsOne': 'Show 1 song',
  'phone.closeSheet': 'Close filters',
  'phone.clearPlace': 'Clear place',

  'state.loading': 'Loading...',
  'state.emptyTitle': 'No songs match these filters',
  'state.emptyBody': 'Try removing a filter, or clear them all.',
  'state.emptySearchTitle': 'Nothing found for “{q}”',
  'state.dataErrorTitle': 'The collection could not be loaded',
  'state.dataErrorBody': 'Check your connection and try again.',
  'state.retry': 'Retry',
  'state.songNotFound': 'No record with id {id}',
  'state.stateNotFound': 'No state with id {id}',
  'state.notFound': 'Page not found',
  'state.backToExplorer': 'Back to explorer',
  'state.clearSearch': 'Clear search',

  'song.tab.record': 'Record',
  'song.tab.raw': 'Raw JSON',
  'song.prev': 'Previous song',
  'song.next': 'Next song',
  'song.positionFilter': '{i} of {n} in this filter',
  'song.outsideFilter': 'This record is outside the current filter.',
  'song.showInExplorer': 'Show in explorer',
  'song.shortcuts': 'Keyboard: [ previous, ] next',
  'song.close': 'Close',
  'song.lyrics': 'Lyrics',
  'song.lyricsNone': 'No text on the source page.',
  'song.textShowAll': 'Show all',
  'song.textShowLess': 'Show less',
  'song.notes': 'Notes',
  'song.notesBy': 'Notes by Mark Gregory, from the source page.',
  'song.notesNone': 'No notes on the source page.',
  'song.links': 'Links on the source page',
  'song.notationAlt': 'Notation of {title} (page {ref} on folkstream.com)',
  'song.notationNone': 'No notation on the source page',
  'song.notationView': 'View full size',
  'song.notationClick': 'Click to enlarge',
  'song.notationError': 'The notation image could not be loaded.',
  'song.notationRetry': 'Retry',
  'song.notationCredit': 'Image hosted by folkstream.com.',
  'song.mastheadAlt': 'Masthead of the newspaper that printed {title} (page {ref} on folkstream.com)',
  'song.mastheadCaption': 'The newspaper\u2019s masthead, as cropped on folkstream.com.',
  'song.lightbox': 'Notation, full size',
  'song.lightboxPage': 'Image {i} of {n}',
  'song.lightboxPrev': 'Previous image',
  'song.lightboxNext': 'Next image',
  'song.midi': 'MIDI',
  'song.midiNone': 'No MIDI file on the source page.',
  'song.midiDownload': 'Download MIDI',
  'song.midiHint': 'Browsers do not play MIDI files; open the download in a music program or a MIDI player.',
  'song.related': 'Related songs',
  'song.related.variant': 'Variants',
  'song.related.see': 'See also',
  'song.related.linked': 'Linked from the notes',
  'song.related.samePaper': 'Same newspaper',
  'song.related.sameYear': 'Same year',
  'song.rail.where': 'Where',
  'song.rail.when': 'When and who',
  'song.rail.source': 'Source',
  'song.rail.provenance': 'Provenance',
  'song.row.town': 'Town',
  'song.row.state': 'State',
  'song.row.country': 'Country',
  'song.row.coordinates': 'Coordinates',
  'song.row.basis': 'Basis',
  'song.basis.newspaper': 'place of publication of the newspaper',
  'song.basis.newspaper-state': 'state named in the notes',
  'song.row.year': 'Year',
  'song.row.yearFrom': 'Year from',
  'song.yearFrom.title': 'the title',
  'song.yearFrom.index': 'the songs index',
  'song.yearFrom.newspaper': 'the newspaper date',
  'song.yearFrom.notes': 'the notes',
  'song.row.kind': 'Kind',
  'song.row.author': 'Author',
  'song.row.signature': 'Signed',
  'song.row.singers': 'Singers',
  'song.row.collectors': 'Collectors',
  'song.row.newspaper': 'Newspaper',
  'song.row.date': 'Date',
  'song.row.page': 'Page',
  'song.row.trove': 'Trove',
  'song.trove.open': 'Open article {id} on Trove',
  'song.row.songbooks': 'Songbooks',
  'song.row.reference': 'Page',
  'song.row.id': 'Record id',
  'song.row.site': 'Collection',
  'song.openSource': 'Open the page on folkstream.com',
  'song.alsoListedAs': 'Also listed as',
  'song.jsonCopied': 'JSON copied',
  'song.copyJson': 'Copy JSON',
  'song.showAllJson': 'Show all',
  'song.warnings': 'Parser notes',

  'source.open': 'Open the original page on {site}',
  'source.site.afs': 'Australian Folk Songs (folkstream.com)',
  'source.siteShort.afs': 'AFS',
  'source.url.afs': 'https://folkstream.com/',
  'source.noUrl': 'Source page not available',

  'statePage.title': '{name}',
  'statePage.songs': '{n} songs',
  'statePage.towns': 'Towns',
  'statePage.town': 'Town',
  'statePage.papers': 'Newspapers',
  'statePage.paper': 'Newspaper',
  'statePage.years': 'Years',
  'statePage.count': 'Songs',
  'statePage.tab.songs': 'Songs',
  'statePage.tab.towns': 'Towns',
  'statePage.tab.papers': 'Newspapers',
  'statePage.tab.timeline': 'Timeline',
  'statePage.tab.map': 'Local map',
  'statePage.viewInExplorer': 'View in explorer',
  'statePage.noPapers': 'No newspaper resolved to this state yet.',
  'statePage.timelineLabel': 'Songs per decade',

  'sources.title': 'Sources',
  'sources.intro':
    'Everything here is indexed from Mark Gregory’s Australian Folk Songs site. The newspapers are the papers his notes cite, mostly via the National Library of Australia’s Trove; the songbooks are his bibliography; the articles are his.',
  'sources.newspapers': 'Newspapers cited',
  'sources.newspapersIntro': '{n} newspaper titles, {m} resolved to a place of publication.',
  'sources.songbooks': 'Songbooks and other printed sources',
  'sources.articles': 'Articles and reviews on folkstream.com',
  'sources.col.title': 'Title',
  'sources.col.place': 'Place',
  'sources.col.years': 'Years cited',
  'sources.col.songs': 'Songs',
  'sources.col.year': 'Year',
  'sources.col.author': 'Author or editor',
  'sources.unresolved': 'not resolved',
  'sources.showSongs': 'Show the {n} songs from {title}',

  'footer.data': 'Data: Australian Folk Songs, a research collection compiled by Mark Gregory (folkstream.com, since 1994).',
  'footer.independent':
    'Lyrics are indexed for search; notes, notation images and MIDI files remain Mark Gregory’s and are shown from his site. This viewer is an independent study aid and is not affiliated with folkstream.com.',
  'footer.trove': 'Newspaper articles: National Library of Australia, Trove.',
  'footer.map': 'Map',
  'footer.bartok': 'Part of Culegeri, alongside the viewer of Bartók’s field collection in Romania.',

  about: 'About and sources',
}

const numberFormat = new Intl.NumberFormat('en')
const plural = new Intl.PluralRules('en')

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

export function songs(n: number): string {
  return plural.select(n) === 'one' ? t('results.countOne') : t('results.count', { n })
}

export function songsOf(n: number, m: number): string {
  return t('results.countOf', { n, m })
}

export function siteName(site: string): string {
  return en[`source.site.${site}`] ?? site
}
export function siteUrl(site: string): string | undefined {
  return en[`source.url.${site}`]
}
export function kindLabel(kind: string | null): string {
  return en[`facet.kind.${kind ?? 'unknown'}`] ?? String(kind)
}
export function tuneLabel(tune: string): string {
  return en[`facet.tune.${tune}`] ?? tune
}
export function basisLabel(basis: string | null): string | null {
  return basis ? (en[`song.basis.${basis}`] ?? basis) : null
}
export function yearFromLabel(from: string | null): string | null {
  return from ? (en[`song.yearFrom.${from}`] ?? from) : null
}

export const STATE_NAMES: Record<string, string> = {
  NSW: 'New South Wales',
  VIC: 'Victoria',
  QLD: 'Queensland',
  SA: 'South Australia',
  WA: 'Western Australia',
  TAS: 'Tasmania',
  NT: 'Northern Territory',
  ACT: 'Australian Capital Territory',
  NZ: 'New Zealand',
  UK: 'United Kingdom',
  US: 'United States',
}
export function stateName(code: string | null | undefined): string {
  if (!code) return ''
  return STATE_NAMES[code.toUpperCase()] ?? code
}
