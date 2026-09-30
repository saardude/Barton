// Collector names (owner request 2026-09-30). The data engineer is adding a normalised
// `collectors: string[]` per record (Hungarian name order, multi-collector strings split,
// Western-order variants folded); until it lands the same shape is derived here from the
// verbatim `collector` string. `UNKNOWN_COLLECTOR` is the URL value for records with none.
import { normalize } from '../state/normalize'

export const UNKNOWN_COLLECTOR = 'none'

/** Western-order spellings seen in the sources, folded to the Hungarian order the sites use. */
const WESTERN_TO_HU: Record<string, string> = {
  'bela bartok': 'Bartók Béla',
  'bela vikar': 'Vikár Béla',
  'zoltan kodaly': 'Kodály Zoltán',
  'laszlo lajtha': 'Lajtha László',
  'vilmos seemayer': 'Seemayer Vilmos',
}

/** Split a printed collector string into normalised names; empty when unknown. */
export function collectorsFromString(raw: string | null | undefined): string[] {
  if (!raw) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const part of raw.split(/\s*[,;]\s*|\s+(?:and|és)\s+/u)) {
    const name = part.replace(/\s+/g, ' ').trim()
    if (!name) continue
    const folded = WESTERN_TO_HU[normalize(name)] ?? name
    const key = normalize(folded)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(folded)
  }
  return out
}

/** Prefer the data's `collectors` field; fall back to the derived split of `collector`. */
export function collectorsOf(collectors: unknown, collector: string | null): string[] {
  if (Array.isArray(collectors)) {
    const names = collectors.filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
    if (names.length) return [...new Set(names.map((n) => n.trim()))]
  }
  return collectorsFromString(collector)
}
