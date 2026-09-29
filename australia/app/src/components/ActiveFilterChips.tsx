// ActiveFilterChips: one <button> per active value, "Clear all filters" last. Removing a chip
// moves focus to the next chip or to "Clear all".
import { useRef } from 'react'
import { useQuery } from '../app/query'
import { t } from '../i18n/en'
import type { Query } from '../state/query'
import type { Chip } from '../state/selectors'

function removalPatch(chip: Chip, query: Query): Partial<Query> {
  switch (chip.key) {
    case 'place':
      return { place: undefined }
    case 'kind':
      return { kind: query.kind.filter((k) => k !== chip.value) }
    case 'paper':
      return { paper: query.paper.filter((p) => p !== chip.value) }
    case 'book':
      return { book: query.book.filter((b) => b !== chip.value) }
    case 'singer':
      return { singer: query.singer.filter((x) => x !== chip.value) }
    case 'collector':
      return { collector: query.collector.filter((x) => x !== chip.value) }
    case 'author':
      return { author: query.author.filter((x) => x !== chip.value) }
    case 'tune':
      return { tune: undefined }
    case 'year':
      return { yearFrom: undefined, yearTo: undefined }
    case 'q':
      return { q: '' }
    case 'unmapped':
      return { unmapped: undefined }
    default:
      return {}
  }
}

export function ActiveFilterChips({ chips }: { chips: Chip[] }) {
  const { query, setQuery, reset } = useQuery()
  const ref = useRef<HTMLDivElement>(null)
  if (!chips.length) return null
  const remove = (chip: Chip, i: number) => {
    setQuery(removalPatch(chip, query))
    window.requestAnimationFrame(() => {
      const buttons = ref.current?.querySelectorAll<HTMLButtonElement>('button')
      if (!buttons?.length) return
      ;(buttons[Math.min(i, buttons.length - 1)] ?? buttons[buttons.length - 1]).focus()
    })
  }
  return (
    <div className="chips" ref={ref} aria-label="Active filters">
      {chips.map((chip, i) => (
        <button key={`${chip.key}:${chip.value}`} type="button" className="chip" aria-label={t('facet.removeChip', { label: chip.label })} onClick={() => remove(chip, i)}>
          <span>{chip.label}</span>
          <span className="chip__x" aria-hidden="true">
            &times;
          </span>
        </button>
      ))}
      <button type="button" className="btn btn--link" onClick={reset}>
        {t('facet.clearAll')}
      </button>
    </div>
  )
}
