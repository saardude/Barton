// Text folding and collators shared by search, sort and the place tree.

/** NFD, strip combining marks, lowercase, collapse whitespace. */
export function normalize(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Base-letter, numeric-aware English collator used for every user-facing order. */
export const enBase = new Intl.Collator('en', { sensitivity: 'base', numeric: true, ignorePunctuation: true })

/** Full-sensitivity collator used only as a tie-break. */
export const enFull = new Intl.Collator('en', { sensitivity: 'variant', numeric: true })

export function compareFolded(a: string, b: string): number {
  return enBase.compare(normalize(a), normalize(b))
}

/** Sort key for a title: a leading article ("The", "A", "An") is ignored. */
export function titleSortKey(title: string | null | undefined): string {
  return normalize(title).replace(/^(the|a|an)\s+/, '')
}
