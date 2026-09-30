// /sources: the newspapers cited (with place of publication and counts), the songbook
// bibliography and the articles index, each row linking into the explorer.
import { Link } from 'react-router'
import { useCatalogReady } from '../app/catalog'
import { useQuery } from '../app/query'
import { stateName, t } from '../i18n/en'
import { Skeleton } from '../components/States'
import { applyPatch, DEFAULT_QUERY } from '../state/query'
import { toSearch } from '../state/urlCodec'
import { useTitle } from './StubPages'

export function SourcesPage() {
  useTitle(t('sources.title'))
  const catalog = useCatalogReady()
  const { search } = useQuery()
  void search
  if (!catalog) {
    return (
      <main id="main" className="page sources" aria-busy="true">
        <h1>{t('sources.title')}</h1>
        <Skeleton rows={8} />
      </main>
    )
  }
  const { newspapers, songbooks, articles } = catalog.sources
  const resolved = newspapers.filter((n) => n.resolved).length
  return (
    <main id="main" className="page sources">
      <h1>{t('sources.title')}</h1>
      <p>{t('sources.intro')}</p>

      <section aria-labelledby="src-papers">
        <h2 id="src-papers">{t('sources.newspapers')}</h2>
        <p className="muted">{t('sources.newspapersIntro', { n: newspapers.length, m: resolved })}</p>
        <table className="county-table">
          <thead>
            <tr>
              <th scope="col">{t('sources.col.title')}</th>
              <th scope="col">{t('sources.col.place')}</th>
              <th scope="col">{t('sources.col.years')}</th>
              <th scope="col" className="num">
                {t('sources.col.songs')}
              </th>
            </tr>
          </thead>
          <tbody>
            {newspapers.map((n) => (
              <tr key={n.key}>
                <th scope="row">
                  <Link to={{ pathname: '/', search: toSearch(applyPatch(DEFAULT_QUERY, { paper: [n.key] })) }} title={t('sources.showSongs', { n: n.count, title: n.title })}>
                    {n.title}
                  </Link>
                </th>
                <td>{n.resolved ? [n.town, n.state ? stateName(n.state) : null].filter(Boolean).join(', ') : <span className="muted">{t('sources.unresolved')}</span>}</td>
                <td className="mono">{n.years.min !== null ? (n.years.min === n.years.max ? String(n.years.min) : `${n.years.min}-${n.years.max}`) : ''}</td>
                <td className="num mono">{n.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="src-books">
        <h2 id="src-books">{t('sources.songbooks')}</h2>
        <table className="county-table">
          <thead>
            <tr>
              <th scope="col">{t('sources.col.year')}</th>
              <th scope="col">{t('sources.col.title')}</th>
              <th scope="col">{t('sources.col.author')}</th>
              <th scope="col" className="num">
                {t('sources.col.songs')}
              </th>
            </tr>
          </thead>
          <tbody>
            {songbooks.map((b) => (
              <tr key={b.id}>
                <td className="mono">{b.yearRaw}</td>
                <th scope="row">
                  {b.songCount > 0 ? <Link to={{ pathname: '/', search: toSearch(applyPatch(DEFAULT_QUERY, { book: [b.id] })) }}>{b.title}</Link> : b.title}
                  {b.url && !b.url.endsWith('songbooks.html') && (
                    <>
                      {' '}
                      <a href={b.url} target="_blank" rel="noopener noreferrer" className="mono">
                        &nearr;
                      </a>
                    </>
                  )}
                </th>
                <td>{b.author ?? ''}</td>
                <td className="num mono">{b.songCount || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="src-articles">
        <h2 id="src-articles">{t('sources.articles')}</h2>
        <ul className="sources__articles">
          {articles.map((a) => (
            <li key={a.id}>
              <a href={a.url} target="_blank" rel="noopener noreferrer">
                {a.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
