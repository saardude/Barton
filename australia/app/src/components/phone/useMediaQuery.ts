// useMediaQuery: subscribes to a CSS media query (the phone explorer is the
// same route under 768 px). Returns false during SSR / in environments without matchMedia.
import { useSyncExternalStore } from 'react'

function subscribe(query: string, onChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const mql = window.matchMedia(query)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => subscribe(query, cb),
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false,
  )
}

export const PHONE_QUERY = '(max-width: 767px)'
export const COARSE_POINTER_QUERY = '(pointer: coarse)'
