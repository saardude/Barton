// NotFound, rendered inside the shell with the footer.
import { useEffect } from 'react'
import { Link } from 'react-router'
import { useQuery } from '../app/query'
import { t } from '../i18n/en'
import { EmptyState } from '../components/States'

export function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · ${t('app.titleSuffix')}`
  }, [title])
}

export function NotFoundPage() {
  useTitle(t('state.notFound'))
  const { search } = useQuery()
  return (
    <div className="page">
      <EmptyState
        title={t('state.notFound')}
        actions={
          <Link className="btn" to={{ pathname: '/', search }}>
            {t('state.backToExplorer')}
          </Link>
        }
      />
    </div>
  )
}
