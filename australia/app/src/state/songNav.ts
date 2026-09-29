// Previous / next within the current filtered and sorted set .
// No wraparound: prev is null on the first record, next is null on the last; a record outside
// the set returns null so the page can say so and offer "Show in explorer".

export interface SongPosition {
  /** 0-based index in the set. */
  index: number
  total: number
  prevId: string | null
  nextId: string | null
}

export function prevNext(id: string, ids: readonly string[]): SongPosition | null {
  const index = ids.indexOf(id)
  if (index < 0) return null
  return {
    index,
    total: ids.length,
    prevId: index > 0 ? ids[index - 1] : null,
    nextId: index < ids.length - 1 ? ids[index + 1] : null,
  }
}
