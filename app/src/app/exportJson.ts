// Export JSON of the filtered set (FRONTEND-SPEC 6, AC-21): { query, count, generatedAt, attribution,
// records } with records in display order and sorted keys.
import { siteName, siteUrl, t } from '../i18n/en'
import type { Query } from '../state/query'
import { encodeQuery } from '../state/urlCodec'
import type { Song } from '../types/song'

export function sortKeys<T>(value: T): T {
  if (Array.isArray(value)) return value.map(sortKeys) as unknown as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(value as Record<string, unknown>).sort()) out[k] = sortKeys((value as Record<string, unknown>)[k])
    return out as T
  }
  return value
}

export interface ExportFile {
  query: string
  count: number
  generatedAt: string
  attribution: { text: string; sources: { site: string; name: string; url: string }[] }
  records: Song[]
}

export function buildExport(songs: Song[], query: Query, now = new Date()): ExportFile {
  return {
    query: encodeQuery(query),
    count: songs.length,
    generatedAt: now.toISOString(),
    attribution: {
      text: `${t('footer.data')} ${t('footer.independent')}`,
      sources: ['fmbc', 'bsys', 'gyuj'].map((site) => ({ site, name: siteName(site), url: siteUrl(site) ?? '' })),
    },
    records: songs.map((s) => sortKeys(s)),
  }
}

export function exportFileName(count: number, now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `culegeri-${count}-${y}${m}${d}.json`
}

/** Serialises and triggers the download; returns false when the user declined a large export. */
export function downloadExport(songs: Song[], query: Query): boolean {
  const now = new Date()
  const text = JSON.stringify(buildExport(songs, query, now), null, 2)
  const bytes = new Blob([text]).size
  if (bytes > 10 * 1024 * 1024) {
    const mb = Math.round(bytes / 1048576)
    if (!window.confirm(t('results.exportConfirm', { size: mb }))) return false
  }
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = exportFileName(songs.length, now)
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}
