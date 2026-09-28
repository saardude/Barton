// PlaceTree (FRONTEND-SPEC 7, AC-01 to AC-04): country switch + role="tree" with roving tabindex,
// keyboard navigation and type-ahead. Selecting a node emits the place level; clicking the
// selected node again clears that level.
import { useCallback, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { t } from '../../i18n/en'
import { normalize } from '../../state/normalize'
import { displayName } from '../../state/placeName'
import { ancestorIds, type PlaceLevel, type Query } from '../../state/query'
import type { PlaceNode } from '../../state/selectors'
import type { Place } from '../../types/place'
import { PlaceLabel } from '../PlaceLabel'

interface Props {
  tree: PlaceNode[]
  query: Query
  countryOptions: Place[]
  onSelect: (level: PlaceLevel, id: string | undefined) => void
  onCountry: (id: string) => void
}

interface FlatRow {
  node: PlaceNode
  depth: number
  parentId: string | null
  expanded: boolean
}

export function PlaceTree({ tree, query, countryOptions, onSelect, onCountry }: Props) {
  const country = query.country
  const deepest = query.village ?? query.county ?? query.region ?? country
  // Romania starts expanded as a convenience (it is the first country); it is not a filter.
  const [userExpanded, setExpanded] = useState<Set<string>>(() => new Set(['ro']))
  const [active, setActive] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const typeahead = useRef({ text: '', at: 0 })

  // The selected branch (and the selected country) is always expanded (AC-01, AC-03).
  const expanded = useMemo(() => {
    const next = new Set(userExpanded)
    if (country) next.add(country)
    if (deepest) for (const a of ancestorIds(deepest)) next.add(a)
    if (deepest && deepest.split('/').length < 4) next.add(deepest)
    return next
  }, [userExpanded, country, deepest])

  const rows = useMemo(() => {
    const out: FlatRow[] = []
    const walk = (nodes: PlaceNode[], depth: number, parentId: string | null) => {
      for (const n of nodes) {
        const isOpen = expanded.has(n.id) && n.children.length > 0
        out.push({ node: n, depth, parentId, expanded: isOpen })
        if (isOpen) walk(n.children, depth + 1, n.id)
      }
    }
    walk(tree, 1, null)
    return out
  }, [tree, expanded])

  const activeId = active && rows.some((r) => r.node.id === active) ? active : (deepest ?? rows[0]?.node.id ?? null)

  const focusRow = useCallback((id: string) => {
    setActive(id)
    window.requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`)?.focus()
    })
  }, [])

  const toggle = (id: string, open?: boolean) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      const want = open ?? !expanded.has(id)
      if (want) next.add(id)
      else next.delete(id)
      return next
    })

  const select = (n: PlaceNode) => {
    if (n.id === deepest) {
      onSelect(n.level, undefined)
      return
    }
    if (n.level === 'country') onCountry(n.id)
    else onSelect(n.level, n.id)
  }

  const onKey = (e: KeyboardEvent<HTMLLIElement>, row: FlatRow, i: number) => {
    const n = row.node
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (rows[i + 1]) focusRow(rows[i + 1].node.id)
        break
      case 'ArrowUp':
        e.preventDefault()
        if (rows[i - 1]) focusRow(rows[i - 1].node.id)
        break
      case 'ArrowRight':
        e.preventDefault()
        if (n.children.length && !row.expanded) toggle(n.id, true)
        else if (row.expanded && rows[i + 1]) focusRow(rows[i + 1].node.id)
        break
      case 'ArrowLeft':
        e.preventDefault()
        if (row.expanded) toggle(n.id, false)
        else if (row.parentId) focusRow(row.parentId)
        break
      case 'Home':
        e.preventDefault()
        if (rows[0]) focusRow(rows[0].node.id)
        break
      case 'End':
        e.preventDefault()
        focusRow(rows[rows.length - 1].node.id)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        select(n)
        break
      default: {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const now = e.timeStamp
          const ta = typeahead.current
          ta.text = now - ta.at < 600 ? ta.text + e.key : e.key
          ta.at = now
          const needle = normalize(ta.text)
          const start = ta.text.length === 1 ? i + 1 : i
          const order = [...rows.slice(start), ...rows.slice(0, start)]
          const hit = order.find((r) => normalize(r.node.label).startsWith(needle))
          if (hit) focusRow(hit.node.id)
        }
      }
    }
  }

  return (
    <div>
      <div className="tree-header">
        <label htmlFor="country-select">{t('facet.country')}</label>
        <select id="country-select" className="select" value={country ?? 'all'} onChange={(e) => onCountry(e.target.value)}>
          <option value="all">{t('facet.allCountries')}</option>
          {countryOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {displayName(c, c.id)}
            </option>
          ))}
        </select>
      </div>
      <ul className="tree" role="tree" aria-label={t('tree.label')} ref={listRef}>
        {rows.map((row, i) => {
          const n = row.node
          const isSelected = n.id === deepest
          const hasChildren = n.children.length > 0
          const zero = n.count === 0
          return (
            <li
              key={n.id}
              className="tree__item"
              role="treeitem"
              data-id={n.id}
              aria-level={row.depth}
              aria-expanded={hasChildren ? row.expanded : undefined}
              aria-selected={isSelected}
              tabIndex={n.id === activeId ? 0 : -1}
              style={{ paddingLeft: (row.depth - 1) * 16 }}
              onKeyDown={(e) => onKey(e, row, i)}
              onFocus={(e) => {
                if (e.target === e.currentTarget) setActive(n.id)
              }}
            >
              <div className={`tree__row${zero ? ' is-zero' : ''}`} onClick={() => select(n)}>
                <button
                  type="button"
                  className={`tree__toggle${hasChildren ? '' : ' tree__toggle--leaf'}`}
                  tabIndex={-1}
                  aria-hidden="true"
                  disabled={!hasChildren}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggle(n.id)
                  }}
                />
                <span className="tree__label" title={isSelected ? t('tree.deselect', { level: n.level }) : t('tree.select', { name: n.label })}>
                  {n.place ? <PlaceLabel place={n.place} showMarkers /> : n.label}
                </span>
                <span className="tree__count">{n.count.toLocaleString('en')}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
