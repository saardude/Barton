import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { CatalogProvider, useCatalog } from './app/catalog'
import { PrefsProvider } from './app/prefs'
import { QueryProvider } from './app/query'
import { ToastProvider } from './app/toast'
import { Footer } from './components/Footer'
import { ErrorState } from './components/States'
import { StatusBar } from './components/StatusBar'
import { SkipLink, TopBar } from './components/TopBar'
import { ExplorerPage } from './pages/ExplorerPage'
import { SongPage } from './pages/SongPage'
import { SourcesPage } from './pages/SourcesPage'
import { StatePage } from './pages/StatePage'
import { NotFoundPage } from './pages/StubPages'

const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })))

function Shell() {
  const { state, retry } = useCatalog()
  return (
    <>
      <SkipLink />
      <TopBar />
      {state.status === 'error' ? (
        <main>
          <ErrorState error={state.error} onRetry={retry} />
        </main>
      ) : (
        <Routes>
          <Route path="/" element={<ExplorerPage />} />
          <Route path="/state/:stateSlug" element={<StatePage />} />
          <Route path="/song/:songId" element={<SongPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route
            path="/about"
            element={
              <Suspense fallback={<main id="main" className="page about" aria-busy="true" />}>
                <AboutPage />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      )}
      <StatusBar />
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <PrefsProvider>
      <ToastProvider>
        <CatalogProvider>
          <QueryProvider>
            <Shell />
          </QueryProvider>
        </CatalogProvider>
      </ToastProvider>
    </PrefsProvider>
  )
}
