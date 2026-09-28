// VillageStatusBadge (FRONTEND-SPEC 14.4, AC-41): text-only badge (never colour-coded) with the
// villages.json evidence in a keyboard-reachable expander; `unknown` when no entry exists.
import { t } from '../../i18n/en'
import { statusBadgeText, type StopStatus } from '../../state/journeys'

export function VillageStatusBadge({ status, compact = false }: { status: StopStatus; compact?: boolean }) {
  const text = statusBadgeText(status)
  const evidence = status.evidence
  const title = evidence.length ? evidence.join('; ') : undefined
  if (compact || !evidence.length) {
    return (
      <span className="status-badge" title={title} data-status={status.status}>
        {text}
      </span>
    )
  }
  return (
    <details className="status-badge__details">
      <summary className="status-badge" title={title} data-status={status.status}>
        {text}
      </summary>
      <div className="status-badge__evidence">
        <div className="caps-label">{t('journey.statusEvidence')}</div>
        <ul>
          {evidence.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
        {status.entry?.wikidataUrl && (
          <a href={status.entry.wikidataUrl} target="_blank" rel="noopener noreferrer">
            {t('journey.statusWikidata')} {status.entry.qid}
          </a>
        )}
      </div>
    </details>
  )
}
