// jsdom smoke test of the explorer map panel's controls (owner feedback a, b): the borders
// toggle (then | now | compare) writes `borders=` to the URL with the era from the year filter,
// the reset control and the two-line legend are present, and colour-by-genre is gone from
// the map. MapView (Leaflet) is a stub; data files come from a fetch mock.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../App'
import { fixtureBorders } from '../../state/journeys.fixture'
import placesJson from '../../test/fixtures/places.small.json'
import songsJson from '../../test/fixtures/songs.small.json'

vi.mock('../../app/manifest', () => ({
  manifest: {
    songs: '/data/songs.test.json',
    places: '/data/places.test.json',
    facets: '/data/facets.test.json',
    journeys: '/data/journeys.test.json',
    'geo/borders-1910': '/data/geo/borders-1910.test.json',
    'geo/borders-1914': '/data/geo/borders-1914.test.json',
    'geo/borders-1920': '/data/geo/borders-1920.test.json',
    'geo/borders-now': '/data/geo/borders-now.test.json',
  },
}))

vi.mock('./MapView', () => ({
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

function mockFetch() {
  const bodies: Record<string, unknown> = {
    '/data/songs.test.json': songsJson,
    '/data/places.test.json': placesJson,
    '/data/facets.test.json': facets,
    '/data/journeys.test.json': { _meta: {}, journeys: [] },
    '/data/geo/borders-1910.test.json': fixtureBorders,
    '/data/geo/borders-1914.test.json': fixtureBorders,
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

describe('explorer map panel', () => {
  beforeEach(() => mockFetch())
  afterEach(() => vi.unstubAllGlobals())

  it('offers borders then | now | compare on the explorer map and writes borders= to the URL', async () => {
    renderAt('/')
    await screen.findByRole('list', { name: 'Results' })
    const group = screen.getByRole('radiogroup', { name: 'Borders' })
    const then = within(group).getByRole('radio', { name: 'Borders then (1910)' })
    const now = within(group).getByRole('radio', { name: 'Borders now' })
    const both = within(group).getByRole('radio', { name: 'Compare' })
    expect(then).toHaveTextContent('1910')
    expect(now).toHaveAttribute('aria-checked', 'true')
    expect(status()).not.toHaveTextContent('borders=')
    fireEvent.click(then)
    await waitFor(() => expect(status()).toHaveTextContent('borders=1910'))
    expect(then).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(both)
    await waitFor(() => expect(status()).toHaveTextContent('borders=both'))
    // compare mode shows the swipe divider, a keyboard-operable slider
    expect(screen.getByRole('slider', { name: 'Comparison: then / now' })).toBeInTheDocument()
    fireEvent.click(now)
    await waitFor(() => expect(status()).not.toHaveTextContent('borders='))
  })

  it('takes the historical era from the year filter (1914 for the war years, 1920 from 1918)', async () => {
    renderAt('/?from=1915&to=1916')
    await screen.findByRole('list', { name: 'Results' })
    expect(screen.getByRole('radio', { name: 'Borders then (1914)' })).toBeInTheDocument()
  })

  it('keeps the controls to zoom, reset and a two-line legend; no colour-by-genre on the map', async () => {
    renderAt('/')
    await screen.findByRole('list', { name: 'Results' })
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset view' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Colour by genre' })).toBeNull()
    const legend = screen.getByLabelText('Legend')
    expect(legend).toHaveTextContent('Circle: county; number = melodies')
    expect(legend).toHaveTextContent('Click a county to see its villages')
    expect(legend.querySelectorAll('.map-legend__row').length).toBe(2)
  })

  it('a county click selects it and Reset view clears the place again', async () => {
    renderAt('/')
    await screen.findByRole('list', { name: 'Results' })
    fireEvent.click(await within(screen.getByTestId('map-stub')).findByText(/^ro\/crisana\/bihor:/))
    await waitFor(() => expect(status()).toHaveTextContent('?county=ro/crisana/bihor'))
    // in the drill-down the selected county is not drawn as a bubble (its villages stand for it)
    expect(within(screen.getByTestId('map-stub')).queryByText(/^ro\/crisana\/bihor:/)).toBeNull()
    expect(screen.getByLabelText('Legend')).toHaveTextContent('Dot: village; size = melodies')
    fireEvent.click(screen.getByRole('button', { name: 'Reset view' }))
    await waitFor(() => expect(status()).not.toHaveTextContent('county='))
  })
})
