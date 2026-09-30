// Marker sizes shared by MapView (drawing) and MapPanel (legend sample), state bubbles and town dots.
import type { MapPoint } from '../../state/selectors'

/** State bubbles 12 to 44 px, town dots 6 to 22 px; sqrt scale within the level. */
export function diameter(p: Pick<MapPoint, 'level' | 'count'>, nMax: number): number {
  const r = Math.sqrt(p.count / Math.max(1, nMax))
  return p.level === 'state' ? Math.min(44, Math.max(12, 12 + 32 * r)) : Math.min(22, Math.max(6, 6 + 16 * r))
}

/** The count fits inside a state bubble from this diameter on (mono 11 px, up to 4 digits). */
export const LABEL_MIN_D = 24
