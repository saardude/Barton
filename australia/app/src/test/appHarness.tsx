// Shared harness for the jsdom route smoke tests: fetch mock over the 40-record fixture and a
// render helper. (vi.mock calls must live in each test file.)
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import App from '../App'
import facetsJson from './fixtures/facets.small.json'
import placesJson from './fixtures/places.small.json'
import songsJson from './fixtures/songs.small.json'
import sourcesJson from './fixtures/sources.small.json'

export const testManifest = { songs: '/australia/data/songs.test.json', places: '/australia/data/places.test.json', facets: '/australia/data/facets.test.json', sources: '/australia/data/sources.test.json' }

export function mockCatalogFetch(overrides: Record<string, unknown> = {}) {
  const bodies: Record<string, unknown> = {
    [testManifest.songs]: songsJson,
    [testManifest.places]: placesJson,
    [testManifest.facets]: facetsJson,
    [testManifest.sources]: sourcesJson,
    ...overrides,
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

export function renderApp(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <App />
    </MemoryRouter>,
  )
}
