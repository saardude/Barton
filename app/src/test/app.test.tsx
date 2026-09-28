// Smoke test of the Explorer shell over the 40-record fixture (AC-01, AC-05, AC-11, AC-22, AC-36, AC-37).
// The Leaflet map is replaced by a stub; the catalogue is served by a fetch mock.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import placesJson from './fixtures/places.small.json'
import songsJson from './fixtures/songs.small.json'

vi.mock('../app/manifest', () => ({
  manifest: { songs: '/data/songs.test.json', places: '/data/places.test.json', facets: '/data/facets.test.json', journeys: '/data/journeys.test.json' },
}))

vi.mock('../components/map/MapView', () => ({
  MapView: (props: { points: { placeId: string; count: number }[]; onSelect: (p: unknown) => void }) => (
    <div data-testid="map-stub">
      {props.points.map((p) => (
        <button key={p.placeId} type="button" data-place={p.placeId} onClick={() => props.onSelect(p)}>
          {p.placeId}: {p.count}
        </button>
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

const facets = { _meta: { songCount: 40, sites: {} }, genre: {}, style: {}, performance: {}, instrument: {}, year: {}, country: {}, region: {}, county: {}, village: {}, collector: {}, ethnicity: {}, site: {} }
const journeys = { _meta: {}, journeys: [{ id: 't-1', label: 'Trip 1' }, { id: 't-2', label: 'Trip 2' }] }

function mockFetch() {
  const bodies: Record<string, unknown> = {
    '/data/songs.test.json': songsJson,
    '/data/places.test.json': placesJson,
    '/data/facets.test.json': facets,
    '/data/journeys.test.json': journeys,
  }
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const body = bodies[url]
      if (!body) return new Response('not found', { status: 404 })
      return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
    }),
  )
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <App />
    </MemoryRouter>,
  )
}

const all = songsJson.length
const inRO = (songsJson as { location?: { placeId?: string; country?: string } }[]).filter((s) => (s.location?.placeId ? s.location.placeId.startsWith('ro') : s.location?.country === 'RO')).length

describe('Explorer shell', () => {
  beforeEach(() => mockFetch())
  afterEach(() => vi.unstubAllGlobals())

  it('renders the masthead, footer and skeleton before data, then counts and rows with source links', async () => {
    renderAt('/')
    expect(screen.getAllByText('Bartok / Romania').length).toBeGreaterThan(0)
    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByRole('link', { name: "Folk Music in Bartók's Compositions" })).toHaveAttribute('href', 'https://bartok-nepzene.zti.hu/en/')
    expect(within(footer).getByRole('link', { name: 'The Bartók System' })).toHaveAttribute('href', 'https://systems.zti.hu/br/en')
    expect(within(footer).getByRole('link', { name: 'Béla Bartók, the Ethnomusicologist' })).toHaveAttribute('href', 'https://bartok-gyujtesek.zti.hu/en')

    await waitFor(() => expect(screen.getByRole('list', { name: 'Results' })).toBeInTheDocument())
    // every country by default; once in the results header (live region) and once in the status bar
    expect(screen.getAllByText(new RegExp(`^${all} of ${all} melodies`)).length).toBe(2)

    const rows = within(screen.getByRole('list', { name: 'Results' })).getAllByRole('listitem')
    expect(rows.length).toBe(all)
    const first = rows[0]
    const sourceLink = within(first).getByRole('link', { name: /^Open original record on / })
    expect(sourceLink).toHaveAttribute('target', '_blank')
    expect(sourceLink).toHaveAttribute('rel', 'noopener noreferrer')
    expect(sourceLink.getAttribute('href')).toMatch(/^https?:\/\//)
    expect(sourceLink.textContent?.trim().length).toBeGreaterThan(0)
    // the title link and the source link are siblings, not nested
    expect(within(first).getAllByRole('link').length).toBe(2)
  })

  it('no country by default; the switch lists All countries first, then Romania; picking Romania narrows and adds a chip', async () => {
    renderAt('/')
    await screen.findByRole('list', { name: 'Results' })
    const select = screen.getByLabelText('Country') as HTMLSelectElement
    expect(select.value).toBe('all')
    expect(Array.from(select.options).slice(0, 2).map((o) => o.textContent)).toEqual(['All countries', 'Romania'])
    const tree = screen.getByRole('tree', { name: 'Places' })
    const items = within(tree).getAllByRole('treeitem')
    expect(items[0]).toHaveTextContent('Romania')
    expect(items[0]).toHaveAttribute('aria-expanded', 'true')
    expect(within(tree).getByText('Crișana')).toBeInTheDocument()
    expect(within(tree).getByText('Hungary')).toBeInTheDocument()
    fireEvent.change(select, { target: { value: 'ro' } })
    await waitFor(() => expect(screen.getAllByText(`${inRO} of ${inRO} melodies`).length).toBe(2))
    expect(screen.getByRole('status', { name: 'Query status' })).toHaveTextContent('?country=ro')
    expect(screen.getByRole('button', { name: 'Remove filter: Romania' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter: Romania' }))
    await waitFor(() => expect(screen.getAllByText(new RegExp(`^${all} of ${all} melodies`)).length).toBe(2))
  })

  it('a genre checkbox narrows the set, adds a chip, and Clear all restores the default', async () => {
    renderAt('/')
    await screen.findByRole('list', { name: 'Results' })
    const colinda = screen.getByRole('checkbox', { name: /colindă/ })
    fireEvent.click(colinda)
    await waitFor(() => expect(screen.getByRole('button', { name: /Remove filter: colindă/ })).toBeInTheDocument())
    const n = (songsJson as { genre?: string }[]).filter((s) => s.genre === 'colinda').length
    expect(screen.getAllByText(new RegExp(`^${n} of ${all} melodies`)).length).toBe(2)
    expect(screen.getByRole('status', { name: 'Query status' })).toHaveTextContent('?genre=colinda')
    fireEvent.click(screen.getAllByRole('button', { name: 'Clear all filters' })[0])
    await waitFor(() => expect(screen.getAllByText(new RegExp(`^${all} of ${all} melodies`)).length).toBe(2))
    expect(screen.getByRole('status', { name: 'Query status' })).toHaveTextContent('/')
  })

  it('a deep link restores county, sort and search from the URL', async () => {
    renderAt('/?county=ro/crisana/bihor&sort=year&dir=desc')
    await screen.findByRole('list', { name: 'Results' })
    expect((screen.getByLabelText('Sort by') as HTMLSelectElement).value).toBe('year')
    expect(screen.getByRole('button', { name: /Remove filter: Bihor/ })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Query status' })).toHaveTextContent('?county=ro/crisana/bihor&sort=year&dir=desc')
  })

  it('a click on a map point narrows the query to that place', async () => {
    renderAt('/')
    await screen.findByRole('list', { name: 'Results' })
    const bihor = await within(screen.getByTestId('map-stub')).findByText(/^ro\/crisana\/bihor:/)
    fireEvent.click(bihor)
    await waitFor(() => expect(screen.getByRole('status', { name: 'Query status' })).toHaveTextContent('?county=ro/crisana/bihor'))
  })

  it('stub routes render with the footer; unknown routes say not found', async () => {
    renderAt('/nowhere')
    expect(screen.getByText('Page not found')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})
