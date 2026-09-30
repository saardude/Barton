// Route smoke tests over the 40-record fixture in jsdom (Leaflet is stubbed).
import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockCatalogFetch, renderApp, testManifest } from './appHarness'
import songsJson from './fixtures/songs.small.json'

vi.mock('../app/manifest', () => ({
  manifest: { songs: '/australia/data/songs.test.json', places: '/australia/data/places.test.json', facets: '/australia/data/facets.test.json', sources: '/australia/data/sources.test.json' },
}))
vi.mock('../components/map/MapView', () => ({
  AUSTRALIA_BOUNDS: [
    [-44, 112],
    [-10, 154.5],
  ],
  MapView: () => <div className="map-view" data-testid="map-stub" />,
  pointAriaLabel: (p: { placeId: string }) => p.placeId,
}))

describe('routes', () => {
  beforeEach(() => mockCatalogFetch())
  afterEach(() => vi.unstubAllGlobals())

  it('explorer lists the fixture and shows the count', async () => {
    renderApp('/')
    await waitFor(() => expect(screen.getAllByText(/40 of 40 songs/).length).toBeGreaterThan(0))
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0)
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Mark Gregory')
  })

  it('song page renders the record with its source link', async () => {
    const song = songsJson[0]
    renderApp(`/song/${song.id}`)
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(song.title))
    const link = screen.getAllByRole('link', { name: /Open the original page/ })[0]
    expect(link).toHaveAttribute('href', song.source.url)
    expect(link).toHaveAttribute('target', '_blank')
    expect(document.title).toContain(song.title)
  })

  it('unknown song id shows the not-found state', async () => {
    renderApp('/song/afs-nope')
    await waitFor(() => expect(screen.getByText(/No record with id afs-nope/)).toBeInTheDocument())
  })

  it('sources page lists newspapers and songbooks', async () => {
    renderApp('/sources')
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sources'))
    await waitFor(() => expect(screen.getAllByRole('table').length).toBeGreaterThanOrEqual(2))
  })

  it('a failed fetch shows the error state with retry', async () => {
    mockCatalogFetch({ [testManifest.songs]: undefined })
    renderApp('/')
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })
})
