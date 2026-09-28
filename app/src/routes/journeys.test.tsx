// jsdom smoke test of /journeys over the 40-record fixture and a small journeys fixture
// (AC-39, AC-41, AC-42, AC-43, AC-44). The Leaflet map is replaced by a stub that exposes the
// stop buttons and the border mode; the data files are served by a fetch mock.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { fixtureBorders, fixtureEvents, fixtureJourneys, fixtureVillages } from '../state/journeys.fixture'
import placesJson from '../test/fixtures/places.small.json'
import songsJson from '../test/fixtures/songs.small.json'

vi.mock('../app/manifest', () => ({
  manifest: {
    songs: '/data/songs.test.json',
    places: '/data/places.test.json',
    facets: '/data/facets.test.json',
    journeys: '/data/journeys.test.json',
    villages: '/data/villages.test.json',
    'context-events': '/data/context-events.test.json',
    'geo/borders-1910': '/data/geo/borders-1910.test.json',
    'geo/borders-1920': '/data/geo/borders-1920.test.json',
    'geo/borders-now': '/data/geo/borders-now.test.json',
  },
}))

vi.mock('../components/map/MapView', () => ({
  MapView: () => <div data-testid="map-stub" />,
  ROMANIA_BOUNDS: [
    [43.6, 20.2],
    [48.3, 29.7],
  ],
  TILE_PROVIDERS: {},
  pointAriaLabel: (p: { placeId: string }) => p.placeId,
}))

vi.mock('../components/journey/JourneyMap', () => ({
  JourneyMap: (props: { view: { stops: { stop: { seq: number }; resolved: boolean }[] } | null; borders: string; era: string; onStop: (seq: number | undefined) => void; onBorders: (m: string) => void }) => (
    <div data-testid="journey-map-stub" data-borders={props.borders} data-era={props.era}>
      {props.view?.stops
        .filter((s) => s.resolved)
        .map((s) => (
          <button key={s.stop.seq} type="button" data-stop={s.stop.seq} onClick={() => props.onStop(s.stop.seq)}>
            stop {s.stop.seq}
          </button>
        ))}
      <button type="button" onClick={() => props.onBorders('now')}>
        borders now
      </button>
      <button type="button" onClick={() => props.onBorders('both')}>
        borders both
      </button>
    </div>
  ),
}))

const facets = { _meta: { songCount: 40, sites: {} }, genre: {}, style: {}, performance: {}, instrument: {}, year: {}, country: {}, region: {}, county: {}, village: {}, collector: {}, ethnicity: {}, site: {} }

function mockFetch() {
  const bodies: Record<string, unknown> = {
    '/data/songs.test.json': songsJson,
    '/data/places.test.json': placesJson,
    '/data/facets.test.json': facets,
    '/data/journeys.test.json': { _meta: {}, journeys: fixtureJourneys },
    '/data/villages.test.json': fixtureVillages,
    '/data/context-events.test.json': { _meta: {}, events: fixtureEvents },
    '/data/geo/borders-1910.test.json': fixtureBorders,
    '/data/geo/borders-1920.test.json': fixtureBorders,
    '/data/geo/borders-now.test.json': fixtureBorders,
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

const status = () => screen.getByRole('status', { name: 'Query status' })

describe('/journeys', () => {
  beforeEach(() => {
    mockFetch()
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
      unobserve() {}
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('renders the timeline listbox with one option per trip, the prompt and the footer', async () => {
    renderAt('/journeys')
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    const listbox = await screen.findByRole('listbox', { name: 'Trips by date' })
    expect(within(listbox).getAllByRole('option').length).toBe(fixtureJourneys.length)
    expect(screen.getByText('Pick a trip on the timeline or enter a date.')).toBeInTheDocument()
    expect(screen.getByLabelText('Go to date')).toBeInTheDocument()
    expect(screen.getByLabelText('Journey')).toBeInTheDocument()
    // the border toggle defaults to "now" while nothing is selected
    expect(screen.getByTestId('journey-map-stub')).toHaveAttribute('data-borders', 'now')
  })

  it('?trip= selects a route: header, numbered stops with then -> now names and badges, unmapped stop kept, context with citations, era 1910', async () => {
    renderAt('/journeys?trip=J-1913-03-01')
    await screen.findByRole('heading', { level: 1, name: '15 to 17 March 1913: Bihar' })
    expect(screen.getByText('15 to 17 March 1913')).toBeInTheDocument()
    expect(screen.getByText(/3 stops, 1 unmapped records/)).toBeInTheDocument()
    expect(screen.getByText(/4 melodies, 308 km/)).toBeInTheDocument()
    expect(screen.getAllByText('Departure: Budapest (assumed)').length).toBeGreaterThan(0)
    expect(screen.getByText('Kingdom of Hungary (Austria-Hungary)')).toBeInTheDocument()

    const stops = screen.getByRole('button', { name: /^Stop 1 of 3: Belényes \(1913\), now Beiuș; 2 melodies, 15 March 1913/ })
    expect(stops).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: /^Stop 3 of 3: Köröskisjenő \(1913\), now Ineu/ })).toBeInTheDocument()
    // the unresolved stop keeps its number and is listed under "Not mapped" with the reason
    const unresolved = screen.getByRole('button', { name: /^Stop 2 of 3: Tárkány/ })
    expect(unresolved).toBeDisabled()
    expect(screen.getByRole('heading', { name: 'Not mapped (1)' })).toBeInTheDocument()
    expect(screen.getAllByText('place not located').length).toBeGreaterThan(0)
    // status badges from villages.json
    expect(screen.getAllByText('existing').length).toBeGreaterThan(0)
    expect(screen.getAllByText('renamed').length).toBeGreaterThan(0)
    expect(screen.getAllByText('status unknown').length).toBeGreaterThan(0)
    // records with source links
    const links = screen.getAllByRole('link', { name: /^Open original record on / })
    expect(links.length).toBeGreaterThan(0)
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer')
    // context strip: 1913 events within +/- 2 years, uncited never shown, citation visible
    expect(screen.getByText('Chansons populaires roumaines du departement Bihar published')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Chansons populaires roumaines du departement Bihar \(Bucharest/ })).toHaveAttribute('href', 'https://example.org/bihar-1913')
    expect(screen.getByText('First World War: fieldwork curtailed')).toBeInTheDocument()
    expect(screen.queryByText('Uncited entry that must never render')).toBeNull()
    expect(screen.queryByText('Treaty of Trianon signed')).toBeNull()
    expect(screen.getByText('Context entries are quoted from the cited sources and are listed for chronology only.')).toBeInTheDocument()
    // era from the trip date (before 1918 -> 1910), URL carries the trip
    expect(screen.getByTestId('journey-map-stub')).toHaveAttribute('data-borders', '1910')
    expect(status()).toHaveTextContent('?trip=J-1913-03-01')
    // ordered-list fallback
    expect(screen.getByText('List route (3 stops)')).toBeInTheDocument()
  })

  it('selecting a stop writes stop=<n>, clicking again clears it; the border toggle writes borders=', async () => {
    renderAt('/journeys?trip=J-1913-03-01')
    const row = await screen.findByRole('button', { name: /^Stop 1 of 3/ })
    fireEvent.click(row)
    await waitFor(() => expect(status()).toHaveTextContent('?trip=J-1913-03-01&stop=1'))
    expect(screen.getByRole('button', { name: /^Stop 1 of 3/ })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: /^Stop 1 of 3/ }))
    await waitFor(() => expect(status()).toHaveTextContent('?trip=J-1913-03-01'))
    fireEvent.click(within(screen.getByTestId('journey-map-stub')).getByText('stop 3'))
    await waitFor(() => expect(status()).toHaveTextContent('?trip=J-1913-03-01&stop=3'))
    fireEvent.click(screen.getByText('borders now'))
    await waitFor(() => expect(status()).toHaveTextContent('borders=now'))
    expect(screen.getByTestId('journey-map-stub')).toHaveAttribute('data-borders', 'now')
  })

  it('a trip from 1918 defaults to the 1920 set; a trip without online records shows the label, places and the flag', async () => {
    renderAt('/journeys?trip=J-1918-05-01')
    await screen.findByRole('heading', { level: 1 })
    expect(screen.getByTestId('journey-map-stub')).toHaveAttribute('data-borders', '1920')
    expect(screen.getByText(/1 stops, 1 unmapped records/)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Journey'), { target: { value: 'gyuj-50' } })
    await screen.findByRole('heading', { level: 1, name: 'July-August, 1909. Upper region of the river Fekete-Koros' })
    expect(screen.getByText('No melodies online for this trip: the source databases list the entry without records.')).toBeInTheDocument()
    expect(screen.getByText('Upper region of the river Fekete-Koros')).toBeInTheDocument()
    expect(screen.getByText('Romanian material: documented (Rumanian Folk Music chronology)')).toBeInTheDocument()
    expect(screen.getByText('approximate dates')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open this entry on the trip index' })).toHaveAttribute('href', 'https://bartok-gyujtesek.zti.hu/en/browse/50')
    expect(status()).toHaveTextContent('?trip=gyuj-50')
  })

  it('date=YYYY-MM selects the covering trip; a month with no trip shows the nearest with a notice', async () => {
    renderAt('/journeys?date=1913-03')
    await screen.findByRole('heading', { level: 1, name: '15 to 17 March 1913: Bihar' })
    expect(screen.queryByText(/^No trip on/)).toBeNull()

    fireEvent.change(screen.getByLabelText('Go to date'), { target: { value: '1911-02' } })
    await waitFor(() => expect(status()).toHaveTextContent('?date=1911-02'))
    // the nearest trip is the 1910 year cluster (ends 31 December 1910)
    await screen.findByText(/^No trip on February 1911\. Nearest: 1910: Kolozs \(1910\)\./)
    expect(screen.getByRole('heading', { level: 1, name: '1910: Kolozs' })).toBeInTheDocument()
    expect(screen.getByText('1910, approximate')).toBeInTheDocument()
  })

  it('keyboard: arrow keys on the timeline listbox move and select trips (AC-44)', async () => {
    renderAt('/journeys?trip=gyuj-50')
    const listbox = await screen.findByRole('listbox', { name: 'Trips by date' })
    const options = within(listbox).getAllByRole('option')
    const selected = options.find((o) => o.getAttribute('aria-selected') === 'true')!
    expect(selected).toHaveAttribute('tabindex', '0')
    selected.focus()
    fireEvent.keyDown(selected, { key: 'ArrowRight' })
    await waitFor(() => expect(status()).toHaveTextContent('?trip=J-1910-00-01'))
    const now = within(listbox).getAllByRole('option').find((o) => o.getAttribute('aria-selected') === 'true')!
    fireEvent.keyDown(now, { key: 'Escape' })
    await waitFor(() => expect(status()).toHaveTextContent('/'))
    expect(screen.getByText('Pick a trip on the timeline or enter a date.')).toBeInTheDocument()
  })
})
