import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import 'leaflet/dist/leaflet.css'
import './generated/tokens.css'
import './styles/base.css'
import './styles/explorer.css'
import './styles/map.css'
import './styles/song.css'
import './styles/county.css'
import './styles/australia.css'
import './styles/responsive.css'
import App from './App.tsx'

// The app is served under /australia/ on culegeri.vercel.app (vite.config.ts BASE_PATH).
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
