// /about: src/content/about.md rendered at runtime with react-markdown + remark-gfm. No raw HTML.
import { useEffect, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import { useLocation } from 'react-router'
import remarkGfm from 'remark-gfm'
import aboutMd from '../content/about.md?raw'

export const ABOUT_TITLE = 'About and sources · Culegeri Australia'

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
