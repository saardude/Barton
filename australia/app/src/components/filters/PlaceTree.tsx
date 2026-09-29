// PlaceTree: country > state > town as a tree of buttons (aria-pressed on the selected node).
// Counts are "all filters except place". States with no songs in the current filter are shown
// dimmed; towns are listed under an expanded state.
import { useState } from 'react'
import { t } from '../../i18n/en'
import type { Query } from '../../state/query'
import type { PlaceNode } from '../../state/selectors'

function Node({ node, query, onSelect, depth }: { node: PlaceNode; query: Query; onSelect: (id: string | undefined) => void; depth: number }) {
  const selected = query.place === node.id
  const inPath = Boolean(query.place && (query.place === node.id || query.place.startsWith(node.id + '/')))
  const [open, setOpen] = useState(depth === 0)
  const expanded = open || inPath
  const hasChildren = node.children.length > 0
  return (
    <li className={`tree__node tree__node--${node.level}`}>
      <div className="tree__row">
        {hasChildren ? (
          <button type="button" className="tree__toggle" aria-expanded={expanded} aria-label={expanded ? t('tree.collapse', { name: node.label }) : t('tree.expand', { name: node.label })} onClick={() => setOpen(!expanded)}>
            <span aria-hidden="true">{expanded ? '▾' : '▸'}</span>
          </button>
        ) : (
          <span className="tree__toggle tree__toggle--leaf" aria-hidden="true" />
        )}
        <button
          type="button"
          className={`tree__label${node.count === 0 ? ' is-zero' : ''}${!node.mapped && node.level === 'town' ? ' is-unmapped' : ''}`}
          aria-pressed={selected}
          aria-label={selected ? t('tree.deselect', { level: node.level }) : t('tree.select', { name: node.label })}
          disabled={node.count === 0 && !selected}
          onClick={() => onSelect(selected ? undefined : node.id)}
        >
          <span>{node.label}</span>
          <span className="tree__count">{node.count.toLocaleString('en')}</span>
        </button>
      </div>
      {hasChildren && expanded && (
        <ul className="tree__children">
          {node.children.map((c) => (
            <Node key={c.id} node={c} query={query} onSelect={onSelect} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

export function PlaceTree({ tree, query, onSelect }: { tree: PlaceNode[]; query: Query; onSelect: (id: string | undefined) => void }) {
  return (
    <ul className="tree" aria-label={t('tree.label')}>
      {tree.map((n) => (
        <Node key={n.id} node={n} query={query} onSelect={onSelect} depth={0} />
      ))}
    </ul>
  )
}
