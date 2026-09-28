// BorderToggle (FRONTEND-SPEC 14.4, MAP-SPEC 11.4, AC-40): then / now / compare as a radiogroup,
// an era select when more than one historical set ships, and in compare mode the swipe / fade
// range that is the keyboard twin of the on-map divider.
import { t } from '../../i18n/en'
import { eraDescription, type Era } from '../../state/journeys'
import type { BordersMode } from '../../state/query'

export type CompareMode = 'swipe' | 'fade'

export interface BorderToggleProps {
  value: BordersMode
  era: Era
  eras: Era[]
  disabled?: boolean
  loading?: boolean
  compare: number
  compareMode: CompareMode
  onChange: (mode: BordersMode) => void
  onEra: (era: Era) => void
  onCompare: (value: number) => void
  onCompareMode: (mode: CompareMode) => void
}

export function BorderToggle({ value, era, eras, disabled, loading, compare, compareMode, onChange, onEra, onCompare, onCompareMode }: BorderToggleProps) {
  const thenActive = value !== 'now' && value !== 'both'
  const options: { key: 'then' | 'now' | 'both'; mode: BordersMode; label: string; title: string }[] = [
    { key: 'then', mode: era, label: t('journey.bordersThen', { era }), title: eraDescription(era) },
    { key: 'now', mode: 'now', label: t('journey.bordersNow'), title: eraDescription('now') },
    { key: 'both', mode: 'both', label: t('journey.bordersBoth'), title: t('journey.legendTitle.both', { era }) },
  ]
  const checked = (key: 'then' | 'now' | 'both') => (key === 'then' ? thenActive : key === 'now' ? value === 'now' : value === 'both')
  return (
    <div className="border-toggle" data-disabled={disabled ? 'true' : undefined}>
      <div role="radiogroup" aria-label={t('journey.bordersLabel')} className="border-toggle__group">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={checked(o.key)}
            className="border-toggle__btn"
            title={disabled ? t('journey.bordersUnavailable') : o.title}
            disabled={disabled}
            onClick={() => onChange(o.mode)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {disabled && <div className="border-toggle__note">{t('journey.bordersUnavailable')}</div>}
      {!disabled && loading && <div className="border-toggle__note">{t('journey.bordersLoading')}</div>}
      {eras.length > 1 && (
        <label className="border-toggle__era">
          <span className="caps-label">{t('journey.era')}</span>
          <select className="select" value={era} disabled={disabled || value === 'now'} onChange={(e) => onEra(e.target.value as Era)} aria-label={t('journey.era')} title={eraDescription(era)}>
            {eras.map((e) => (
              <option key={e} value={e} title={eraDescription(e)}>
                {e}
              </option>
            ))}
          </select>
        </label>
      )}
      {value === 'both' && !disabled && (
        <div className="border-toggle__compare">
          <label className="border-toggle__range">
            <span className="caps-label">{t('journey.compareLabel')}</span>
            <input type="range" min={0} max={100} step={1} value={compare} onChange={(e) => onCompare(Number(e.target.value))} aria-label={t('journey.compareLabel')} aria-valuetext={`${compare}%`} />
          </label>
          <div role="radiogroup" aria-label={t('journey.compareMode')} className="border-toggle__modes">
            {(['swipe', 'fade'] as CompareMode[]).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={compareMode === m} className="border-toggle__btn border-toggle__btn--sm" onClick={() => onCompareMode(m)}>
                {t(`journey.${m}`)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
