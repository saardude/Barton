import { t } from '../i18n/en'

export function Pagination({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (n: number) => void }) {
  if (pageCount <= 1) return null
  const commit = (input: HTMLInputElement) => {
    const n = parseInt(input.value, 10)
    if (Number.isFinite(n) && n >= 1 && n <= pageCount && n !== page) onPage(n)
    else input.value = String(page)
  }
  return (
    <nav className="pagination" aria-label={t('results.pages')}>
      <button type="button" className="btn btn--sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label={t('results.prev')}>
        &larr;
      </button>
      <label>
        <span className="visually-hidden">{t('results.goToPage')}</span>
        <input
          key={page}
          className="input"
          type="number"
          inputMode="numeric"
          min={1}
          max={pageCount}
          defaultValue={page}
          onBlur={(e) => commit(e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit(e.currentTarget)
          }}
        />
      </label>
      <span aria-live="polite">{t('results.pageOf', { page, pages: pageCount })}</span>
      <button type="button" className="btn btn--sm" disabled={page >= pageCount} onClick={() => onPage(page + 1)} aria-label={t('results.next')}>
        &rarr;
      </button>
    </nav>
  )
}
