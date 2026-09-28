// County drill-down smoke test over the 40-record fixture (FRONTEND-SPEC 8, AC-36, AC-37, E2E-05).
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockCatalogFetch, renderApp } from '../test/appHarness'
import { fixtureIndex, fixtureSongs } from '../test/fixture'

vi.mock('../app/manifest', () => ({ manifest: { songs: '/data/songs.test.json', places: '/data/places.test.json', facets: '/data/facets.test.json', journeys: '/data/journeys.test.json' } }))
vi.mock('../components/map/MapView', () => ({
  MapView: (props: { points: { placeId: string; count: number }[] }) => (
    <div data-testid="map-stub">
      {props.points.map((p) => (
        <span key={p.placeId}>
          {p.placeId}: {p.count}
        </span>
      ))}
    </div>
  ),
  ROMANIA_BOUNDS: [
    [43.6, 20.2],
    [48.3, 29.7],
  ],
  TILE_PROVIDERS: {},
  pointAriaLabel: (p: { placeId: string }) => p.placeId,
}))

const index = fixtureIndex()
const bihor = index.songsUnder('ro/crisana/bihor')

describe('County drill-down route', () => {
  beforeEach(() => mockCatalogFetch())
  afterEach(() => vi.unstubAllGlobals())

  it('renders header, stats, villages table, melodies with source links, and the footer', async () => {
    renderApp('/county/ro/crisana/bihor')
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    await screen.findByRole('heading', { level: 1, name: /Bihor/ })
    expect(document.title).toBe('Bihor (Bihar) · Bartók in Romania')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bihor (Bihar)')
    expect(screen.getByText('Bihar (then) -> Bihor, Romania (now)')).toBeInTheDocument()

    const crumb = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(crumb).getByRole('link', { name: 'Crișana' })).toHaveAttribute('href', '/?region=ro/crisana')

    // villages table: 3 villages + (village unknown) last
    const table = screen.getByRole('table', { name: /Villages in Bihor, 4/ })
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows.length).toBe(4)
    expect(rows[0]).toHaveTextContent('Beiuș')
    expect(rows[3]).toHaveTextContent('(village unknown)')
    const beiusCount = fixtureSongs.filter((s) => s.location.placeId === 'ro/crisana/bihor/beius').length
    expect(rows[0]).toHaveTextContent(String(beiusCount))

    // stats
    expect(screen.getByText('melodies').previousSibling).toHaveTextContent(String(bihor.length))
    expect(screen.getByText('villages').previousSibling).toHaveTextContent('3')

    // melodies tab: results list with source links; the county is added to the query
    const list = await screen.findByRole('list', { name: 'Results' })
    await waitFor(() => expect(within(list).getAllByRole('listitem').length).toBe(bihor.length))
    expect(within(list).getAllByRole('link', { name: /^Open original record on/ }).length).toBe(bihor.length)
    expect(screen.getByRole('status', { name: 'Query status' })).toHaveTextContent('?county=ro/crisana/bihor')
    expect(screen.getByRole('button', { name: /Export county JSON|Export \d+ melodies as JSON/ })).toBeEnabled()
  })

  it('sorting the villages table by melodies desc reorders rows', async () => {
    renderApp('/county/ro/crisana/bihor')
    const table = await screen.findByRole('table', { name: /Villages in Bihor/ })
    const header = within(table).getByRole('button', { name: 'Sort by Melodies' })
    fireEvent.click(header) // asc
    fireEvent.click(header) // desc
    expect(header.closest('th')).toHaveAttribute('aria-sort', 'descending')
    const rows = within(table).getAllByRole('row').slice(1)
    const counts = rows.slice(0, 3).map((r) => Number(within(r).getAllByRole('cell')[1].textContent))
    expect(counts).toEqual([...counts].sort((a, b) => b - a))
    expect(rows[3]).toHaveTextContent('(village unknown)')
  })

  it('tab switches keep the URL in sync and render each panel', async () => {
    renderApp('/county/ro/crisana/bihor?tab=genre')
    await screen.findByRole('heading', { level: 1, name: /Bihor/ })
    expect(screen.getByRole('tab', { name: 'By genre' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('table', { name: 'By genre' })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'By style' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'By performer' }))
    await screen.findByRole('table', { name: 'By performer' })
    expect(screen.getByText(/^Unnamed performer \(\d+\)$/)).toBeInTheDocument()
    expect(screen.getAllByText('Ion Pop').length).toBe(2)

    fireEvent.click(screen.getByRole('tab', { name: 'Timeline' }))
    const in1910 = bihor.filter((s) => s.collected.year === 1910).length
    await screen.findByRole('img', { name: `1910: ${in1910} melodies` })
    expect(screen.getByText(/melodies without a year/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Local map' }))
    const map = await screen.findByTestId('map-stub')
    expect(map).toHaveTextContent('ro/crisana/bihor/beius')
    expect(map).not.toHaveTextContent('ro/crisana/bihor/nomap')
  })

  it('a village row click narrows the query to that village and the melodies tab', async () => {
    renderApp('/county/ro/crisana/bihor')
    const table = await screen.findByRole('table', { name: /Villages in Bihor/ })
    fireEvent.click(within(table).getByRole('button', { name: /Filter to Ineu/ }))
    await waitFor(() => expect(screen.getByRole('status', { name: 'Query status' })).toHaveTextContent('?village=ro/crisana/bihor/ineu'))
    const ineu = fixtureSongs.filter((s) => s.location.placeId === 'ro/crisana/bihor/ineu').length
    const list = screen.getByRole('list', { name: 'Results' })
    expect(within(list).getAllByRole('listitem').length).toBe(ineu)
    expect(within(table).getByRole('button', { name: 'Clear village filter' })).toHaveAttribute('aria-pressed', 'true')
    // the villages table still lists the whole county
    expect(within(table).getAllByRole('row').slice(1).length).toBe(4)
  })

  it('an unknown county renders the not-found state with the footer', async () => {
    renderApp('/county/ro/nowhere/none')
    await screen.findByText('No county with id ro/nowhere/none')
    expect(document.title).toBe('Page not found')
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})
