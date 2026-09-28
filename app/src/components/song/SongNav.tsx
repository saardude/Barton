// SongNav (FRONTEND-SPEC 9, AC-19): Previous / Next within the current filtered and sorted set,
// "i of n in this filter", Back to results. No wraparound. When the record is outside the
// current filter the nav says so and offers "Show in explorer".
import { Link } from 'react-router'
import { t } from '../../i18n/en'
import type { SongPosition } from '../../state/songNav'

export interface SongNavProps {
  position: SongPosition | null
  /** Link target for a neighbour id (keeps the Query and the tab). */
  hrefFor: (id: string) => { pathname: string; search: string }
  backTo: { pathname: string; search: string }
  backLabel: string
  showInExplorerTo: { pathname: string; search: string }
}

export function SongNav({ position, hrefFor, backTo, backLabel, showInExplorerTo }: SongNavProps) {
  return (
    <nav className="song-nav" aria-label={t('song.related') === '' ? 'Song navigation' : 'Song navigation'}>
      <Link className="btn btn--sm" to={backTo}>
        &larr; {backLabel}
      </Link>
      {position ? (
        <>
          <div className="song-nav__group">
            {position.prevId ? (
              <Link className="btn btn--sm" to={hrefFor(position.prevId)} rel="prev" aria-label={t('song.prev')} title={t('song.prev')}>
                &larr; {t('song.prev')}
              </Link>
            ) : (
              <button type="button" className="btn btn--sm" disabled aria-label={t('song.prev')}>
                &larr; {t('song.prev')}
              </button>
            )}
            <span className="song-nav__position mono" aria-live="polite">
              {t('song.positionFilter', { i: position.index + 1, n: position.total })}
            </span>
            {position.nextId ? (
              <Link className="btn btn--sm" to={hrefFor(position.nextId)} rel="next" aria-label={t('song.next')} title={t('song.next')}>
                {t('song.next')} &rarr;
              </Link>
            ) : (
              <button type="button" className="btn btn--sm" disabled aria-label={t('song.next')}>
                {t('song.next')} &rarr;
              </button>
            )}
          </div>
          <span className="song-nav__hint muted mono" aria-hidden="true">
            {t('song.shortcuts')}
          </span>
        </>
      ) : (
        <div className="song-nav__group song-nav__outside">
          <span>{t('song.outsideFilter')}</span>
          <Link className="btn btn--sm" to={showInExplorerTo}>
            {t('song.showInExplorer')}
          </Link>
        </div>
      )}
    </nav>
  )
}
