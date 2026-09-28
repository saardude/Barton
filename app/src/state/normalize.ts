// Text folding and collators shared by search, sort and the place tree (FRONTEND-SPEC 4, 5).

/**
 * NFD, strip combining marks (U+0300 to U+036F), lowercase, collapse whitespace.
 * Folds Romanian a-breve, a-circumflex, i-circumflex, s/t comma-below and cedilla, and Hungarian
 * accented vowels to their base letters, so "Borosjeno" finds "Borosjenő" and "sculati" finds "Sculați".
 */
export function normalize(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Base-letter, numeric-aware Romanian collator used for every user-facing order. */
export const roBase = new Intl.Collator('ro', { sensitivity: 'base', numeric: true, ignorePunctuation: true })

/** Full-sensitivity collator used only as a tie-break so "Sara" and "Șara" keep a fixed relative order. */
export const roFull = new Intl.Collator('ro', { sensitivity: 'variant', numeric: true })

/** Compare two pre-folded strings with the base collator (folding first keeps a / ă / â together). */
export function compareFolded(a: string, b: string): number {
  return roBase.compare(normalize(a), normalize(b))
}
