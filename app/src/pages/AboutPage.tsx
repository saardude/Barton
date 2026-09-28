// /about: the owner-approved "About and sources" text (src/content/about.md, copied from
// docs/ABOUT-DRAFT.md) rendered at runtime with react-markdown + remark-gfm. No raw HTML is
// rendered. Figures become <figure> + <img loading="lazy"> + <figcaption>; headings get ids so
// the footer can link to the printed-edition section; external links open in a new tab.
import { useEffect, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import { useLocation } from 'react-router'
import remarkGfm from 'remark-gfm'
import aboutMd from '../content/about.md?raw'

export const ABOUT_TITLE = 'About and sources · Culegeri'

/** Loose view of the hast node react-markdown hands to each component. */
interface HNode {
  type: string
  tagName?: string
  value?: string
  children?: HNode[]
}

function textOf(node: HNode | undefined): string {
  if (!node) return ''
  if (node.type === 'text') return node.value ?? ''
  return (node.children ?? []).map(textOf).join('')
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function heading(level: 1 | 2 | 3 | 4) {
  const Tag = `h${level}` as const
  return function Heading({ node, children }: { node?: unknown; children?: ReactNode }) {
    const id = slugify(textOf(node as HNode | undefined))
    return <Tag id={id || undefined}>{children}</Tag>
  }
}

const components: Components = {
  h1: heading(1),
  h2: heading(2),
  h3: heading(3),
  h4: heading(4),
  // A paragraph holding only an image is unwrapped so the <figure> is not nested in a <p>.
  p: ({ node, children }) => {
    const kids = ((node as HNode | undefined)?.children ?? []).filter((c) => !(c.type === 'text' && (c.value ?? '').trim() === ''))
    if (kids.length === 1 && kids[0].type === 'element' && kids[0].tagName === 'img') return <>{children}</>
    return <p>{children}</p>
  },
  img: ({ src, alt }) => (
    <figure className="about__figure">
      <img src={typeof src === 'string' ? src : undefined} alt={alt ?? ''} loading="lazy" />
      {alt && <figcaption>{alt}</figcaption>}
    </figure>
  ),
  a: ({ href, children }) => {
    const external = typeof href === 'string' && /^https?:\/\//.test(href)
    return external ? (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ) : (
      <a href={href}>{children}</a>
    )
  },
}

export function AboutPage() {
  const { hash } = useLocation()
  useEffect(() => {
    document.title = ABOUT_TITLE
  }, [])
  // Deep links such as /about#the-printed-edition: the content renders synchronously, so the
  // target exists on the first effect.
  useEffect(() => {
    if (!hash) return
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView?.()
  }, [hash])
  return (
    <main id="main" className="page about">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {aboutMd}
      </ReactMarkdown>
    </main>
  )
}
