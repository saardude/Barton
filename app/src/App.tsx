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
import { AboutPage, CountyPage, JourneysPage, NotFoundPage, SongPage } from './pages/StubPages'

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
          <Route path="/county/*" element={<CountyPage />} />
          <Route path="/song/:songId" element={<SongPage />} />
          <Route path="/journeys" element={<JourneysPage />} />
          <Route path="/about" element={<AboutPage />} />
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
