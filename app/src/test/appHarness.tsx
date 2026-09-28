// Shared harness for the jsdom route smoke tests: fetch mock over the 40-record fixture and a
// render helper. (vi.mock calls must live in each test file; see app.test.tsx.)
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import App from '../App'
import placesJson from './fixtures/places.small.json'
import songsJson from './fixtures/songs.small.json'

export const facetsFixture = { _meta: { songCount: 40, sites: {} }, genre: {}, style: {}, performance: {}, instrument: {}, year: {}, country: {}, region: {}, county: {}, village: {}, collector: {}, ethnicity: {}, site: {} }
export const journeysFixture = { _meta: {}, journeys: [] }

export const testManifest = { songs: '/data/songs.test.json', places: '/data/places.test.json', facets: '/data/facets.test.json', journeys: '/data/journeys.test.json' }

export function mockCatalogFetch(overrides: Record<string, unknown> = {}) {
  const bodies: Record<string, unknown> = {
    '/data/songs.test.json': songsJson,
    '/data/places.test.json': placesJson,
    '/data/facets.test.json': facetsFixture,
    '/data/journeys.test.json': journeysFixture,
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
