import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { fixtureSongs } from '../test/fixture'
import { SourceLink, sourceLinkText } from './SourceLink'

const base = fixtureSongs[0]
const withSource = (source: Partial<typeof base.source>, music: Partial<typeof base.music> = {}) => ({
  ...base,
  source: { ...base.source, ...source },
  music: { ...base.music, ...music },
})

describe('SourceLink (AC-36, D8)', () => {
  it('text priority: referenceCode, then system position, then site + number, then id', () => {
    expect(sourceLinkText(withSource({ referenceCode: 'M.F. 1725 c)' }))).toBe('M.F. 1725 c)')
    expect(sourceLinkText(withSource({ referenceCode: null }, { systemPosition: 'A 204/3' }))).toBe('A 204/3')
    expect(sourceLinkText(withSource({ site: 'fmbc', referenceCode: null, number: '5398' }, { systemPosition: null }))).toBe('FMBC 5398')
    expect(sourceLinkText(withSource({ referenceCode: null, number: null, siteId: '' }, { systemPosition: null }))).toBe(base.id)
  })

  it('renders one link to source.url in a new tab with the "Open original record on {site}" label', () => {
    const song = withSource({ site: 'bsys', url: 'https://systems.zti.hu/br/en/browse/10/12557', referenceCode: 'C 1023' })
    render(<SourceLink song={song} />)
    const link = screen.getByRole('link', { name: 'Open original record on The Bartók System' })
    expect(link).toHaveAttribute('href', 'https://systems.zti.hu/br/en/browse/10/12557')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveTextContent('C 1023')
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders plain text when the url is missing', () => {
    render(<SourceLink song={withSource({ url: '', referenceCode: 'X 1' })} />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('X 1')).toBeInTheDocument()
  })
})
