// Text-only rendering of place names (MAP-SPEC section 7); the PlaceLabel component adds markup.
import { t } from '../i18n/en'
import type { Place } from '../types/place'
import { normalize } from './normalize'

export interface NamedPlace {
  name: string
  nameHistorical: string | null
  type?: Place['type']
}

/** "Beiuș (Belényes)", "Bihor (Bihar)", "Transylvania"; synthetic and unresolved nodes get their labels. */
export function placeText(p: NamedPlace | undefined, id?: string): string {
  if (!p) return id ?? ''
  const modern = displayName(p, id)
  if (p.type === 'region' || p.type === 'country') return modern
  const hist = p.nameHistorical
  if (hist && normalize(hist) !== normalize(modern)) return `${modern} (${hist})`
  return modern
}

/** The modern name alone, with the special nodes mapped to UI copy. */
export function displayName(p: NamedPlace, id?: string): string {
  if (p.name === 'unresolved') return t('facet.countyUnknown')
  if (p.type === 'country') {
    if (p.name === 'unknown' || id === 'xx') return t('tree.unknownCountry')
    return countryName(p.name)
  }
  return p.name || p.nameHistorical || id || ''
}

const COUNTRY_NAMES: Record<string, string> = {
  RO: 'Romania',
  HU: 'Hungary',
  SK: 'Slovakia',
  RS: 'Serbia',
  UA: 'Ukraine',
  HR: 'Croatia',
  MD: 'Moldova',
  BG: 'Bulgaria',
  AT: 'Austria',
  CZ: 'Czechia',
  SI: 'Slovenia',
  PL: 'Poland',
}

export function countryName(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] ?? code
}
