// Song record smoke test over the 40-record fixture (AC-19, AC-20, AC-36, AC-37).
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockCatalogFetch, renderApp, testManifest } from '../test/appHarness'
import { fixtureIndex } from '../test/fixture'
import { DEFAULT_QUERY } from '../state/query'
import { derive } from '../state/selectors'

vi.mock('../app/manifest', () => ({ manifest: { songs: '/data/songs.test.json', places: '/data/places.test.json', facets: '/data/facets.test.json', journeys: '/data/journeys.test.json' } }))
vi.mock('../components/map/MapView', () => ({
  MapView: () => <div data-testid="map-stub" />,
  ROMANIA_BOUNDS: [
    [43.6, 20.2],
    [48.3, 29.7],
  ],
  TILE_PROVIDERS: {},
  pointAriaLabel: (p: { placeId: string }) => p.placeId,
}))

void testManifest

const index = fixtureIndex()
const defaultSorted = derive({ query: DEFAULT_QUERY, index, searchIds: null }).sortedSongs

describe('Song record route', () => {
  beforeEach(() => mockCatalogFetch())
  afterEach(() => vi.unstubAllGlobals())

  it('renders the record with breadcrumb, header source link, rail, related rows and the footer', async () => {
    renderApp('/song/bsys-1')
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    await screen.findByRole('heading', { level: 1, name: 'Adio, dragă, adio' })
    expect(document.title).toBe('Adio, dragă, adio · Bartók in Romania')

    // breadcrumb: Romania > Crișana > Bihor (Bihar) > Beiuș (Belényes) > title
    const crumb = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(crumb).getByRole('link', { name: 'Romania' })).toHaveAttribute('href', '/')
    expect(within(crumb).getByRole('link', { name: /Bihor/ })).toHaveAttribute('href', '/?county=ro/crisana/bihor')
    expect(within(crumb).getByRole('link', { name: /Beiuș/ })).toHaveAttribute('href', '/?village=ro/crisana/bihor/beius')

    // header SourceLink (AC-36) to the record's source.url
    const links = screen.getAllByRole('link', { name: 'Open original record on The Bártok System'.replace('Bártok', 'Bartók') })
    expect(links.length).toBeGreaterThanOrEqual(2) // header + rail
    expect(links[0]).toHaveAttribute('href', 'https://systems.zti.hu/br/en/browse/10/1')
    expect(links[0]).toHaveAttribute('target', '_blank')
    expect(links[0]).toHaveTextContent('A 9')

    // rail rows
    const rail = screen.getByRole('complementary', { name: 'Record details' })
    expect(within(rail).getByText('Performer').nextSibling).toHaveTextContent('Ion Pop')
    expect(within(rail).getByText('Coordinates').nextSibling).toHaveTextContent('46.6600, 22.3500')
    expect(within(rail).getByText('Then / now').nextSibling).toHaveTextContent('Bihar (then) -> Bihor, Romania (now)')
    expect(within(rail).getByText('Record id').nextSibling).toHaveTextContent('bsys-1')

    // audio and no notation
    expect(screen.getByLabelText('Recording of Adio, dragă, adio')).toBeInTheDocument()
    expect(screen.getByText('No notation image for this record')).toBeInTheDocument()

    // related melodies carry source links
    const related = screen.getByRole('region', { name: 'Related melodies' })
    expect(within(related).getAllByRole('link', { name: /^Open original record on/ }).length).toBeGreaterThan(0)
  })

  it('prev / next follow the filtered and sorted set, keep the query, and disable at the ends', async () => {
    const first = defaultSorted[0]
    renderApp(`/song/${first.id}`)
    await screen.findByRole('heading', { level: 1 })
    expect(screen.getByText(`1 of ${defaultSorted.length} in this filter`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous melody' })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Next melody' })).toHaveAttribute('href', `/song/${defaultSorted[1].id}`)

    // ] moves to the next record; [ back
    fireEvent.keyDown(window, { key: ']' })
    await waitFor(() => expect(screen.getByText(`2 of ${defaultSorted.length} in this filter`)).toBeInTheDocument())
    fireEvent.keyDown(window, { key: '[' })
    await waitFor(() => expect(screen.getByText(`1 of ${defaultSorted.length} in this filter`)).toBeInTheDocument())
  })

  it('a query on the song URL narrows the set and is kept on the neighbour links', async () => {
    const colinda = derive({ query: { ...DEFAULT_QUERY, genre: ['colinda'], sort: 'year', dir: 'desc' }, index, searchIds: null }).sortedSongs
    const last = colinda[colinda.length - 1]
    renderApp(`/song/${last.id}?genre=colinda&sort=year&dir=desc`)
    await screen.findByRole('heading', { level: 1 })
    expect(screen.getByText(`${colinda.length} of ${colinda.length} in this filter`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next melody' })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Previous melody' })).toHaveAttribute('href', `/song/${colinda[colinda.length - 2].id}?genre=colinda&sort=year&dir=desc`)
    expect(screen.getByRole('link', { name: /Back to results/ })).toHaveAttribute('href', '/?genre=colinda&sort=year&dir=desc')
  })

  it('a record outside the current filter says so and offers "Show in explorer"', async () => {
    renderApp('/song/bsys-26') // Hungarian locality, outside the default country = ro set
    await screen.findByRole('heading', { level: 1, name: 'Hej, Dunáról' })
    expect(screen.getByText('This record is outside the current filter.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Show in explorer' })).toHaveAttribute('href', '/?county=hu/unresolved/ujszasz')
    expect(screen.queryByText(/in this filter$/)).toBeNull()
  })

  it('the Raw JSON tab shows the sorted-key record with a Copy button and is reflected in the URL', async () => {
    renderApp('/song/bsys-2?tab=raw')
    const tab = await screen.findByRole('tab', { name: 'Raw JSON' })
    expect(tab).toHaveAttribute('aria-selected', 'true')
    expect(document.title).toBe('Ardeleana \u00b7 Bartók in Romania')
    const pre = screen.getByLabelText('Raw JSON, bsys-2')
    const parsed = JSON.parse(pre.textContent ?? '')
    expect(parsed.id).toBe('bsys-2')
    expect(parsed.source.url).toBe('https://systems.zti.hu/br/en/browse/10/2')
    expect(Object.keys(parsed)).toEqual([...Object.keys(parsed)].sort())
    expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeInTheDocument()
    // switching back to Record renders the notation figure
    fireEvent.click(screen.getByRole('tab', { name: 'Record' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Ardeleana' })).toBeInTheDocument()
    expect(screen.getByAltText('Notation of Ardeleana, source A 10')).toHaveAttribute('loading', 'lazy')
    expect(screen.getByRole('button', { name: 'View full size' })).toBeInTheDocument()
  })

  it('an unknown id renders the not-found state with the footer', async () => {
    renderApp('/song/nope-1')
    await screen.findByText('No record with id nope-1')
    expect(document.title).toBe('Page not found')
    expect(screen.getByRole('link', { name: 'Back to explorer' })).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})
