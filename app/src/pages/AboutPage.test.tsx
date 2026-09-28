// jsdom smoke test of /about: the approved markdown renders inside a main landmark with one h1,
// figures as <figure>/<img loading=lazy>/<figcaption>, headings with ids (the footer deep-links
// to the printed-edition section), external links in a new tab, and no Internet Archive wording.
import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockCatalogFetch, renderApp } from '../test/appHarness'
import { ABOUT_TITLE, slugify } from './AboutPage'

vi.mock('../app/manifest', () => ({ manifest: { songs: '/data/songs.test.json', places: '/data/places.test.json', facets: '/data/facets.test.json', journeys: '/data/journeys.test.json' } }))

describe('/about', () => {
  beforeEach(() => mockCatalogFetch())
  afterEach(() => vi.unstubAllGlobals())

  it('renders the approved text with landmarks, figures, heading ids and external links', async () => {
    renderApp('/about')
    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'main')
    expect(within(main).getByRole('heading', { level: 1, name: 'About and sources' })).toBeInTheDocument()
    expect(document.title).toBe(ABOUT_TITLE)
    expect(within(main).getByText(/^Built by Thomas Saar \(BMus\)/)).toBeInTheDocument()
    // figures: <figure> with a lazy image whose alt is the caption, and a figcaption
    const figures = within(main).getAllByRole('figure')
    expect(figures.length).toBe(7)
    const img = within(figures[0]).getByRole('img')
    expect(img).toHaveAttribute('src', '/about/figure-1.jpg')
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('alt', 'Figure 1. The Explorer with Bihor County selected: filter rail, map and results list.')
    expect(figures[0].querySelector('figcaption')).toHaveTextContent('Figure 1. The Explorer with Bihor County selected')
    expect(main.querySelector('p > figure')).toBeNull()
    // heading ids for deep links
    expect(within(main).getByRole('heading', { level: 3, name: 'The printed edition' })).toHaveAttribute('id', 'the-printed-edition')
    expect(within(main).getByRole('heading', { level: 2, name: 'References' })).toHaveAttribute('id', 'references')
    // References keep their links, opening in a new tab; in-text citations stay text
    const carto = within(main).getByRole('link', { name: 'https://carto.com/attributions' })
    expect(carto).toHaveAttribute('target', '_blank')
    expect(carto).toHaveAttribute('rel', 'noopener noreferrer')
    expect(within(main).queryByRole('link', { name: /Kelemen 1978/ })).toBeNull()
    // no raw HTML, no Internet Archive wording
    expect(main.textContent).not.toMatch(/Internet Archive/)
    expect(main.querySelector('script, iframe')).toBeNull()
    // footer: the printed edition line links to this page's section
    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByRole('link', { name: 'Rumanian Folk Music, vols. IV and V (Nijhoff, 1975)' })).toHaveAttribute('href', '/about#the-printed-edition')
    expect(footer.textContent).not.toMatch(/Internet Archive/)
  })

  it('slugifies heading text for ids', () => {
    expect(slugify('The printed edition')).toBe('the-printed-edition')
    expect(slugify('Béla Vikár')).toBe('bela-vikar')
    expect(slugify('How the data was built, and its limits')).toBe('how-the-data-was-built-and-its-limits')
  })
})
