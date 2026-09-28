// Country lookup from coordinates using an optional GeoJSON file data/geo/borders-now.json
// (FeatureCollection of present-day country polygons with an ISO alpha-2 code in properties:
// iso_a2 | ISO_A2 | iso2 | code | id). Returns null when the file is missing or no polygon contains
// the point. Ray casting; no dependencies. Loaded lazily and synchronously (small file expected).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PATHS } from './util.js';

export const BORDERS_FILE = path.join(PATHS.data, 'geo', 'borders-now.json');
let features = undefined; // undefined = not loaded yet, null = missing

function codeOf(props = {}) {
  for (const k of ['iso_a2', 'ISO_A2', 'iso2', 'ISO2', 'code', 'id', 'ISO', 'iso']) {
    const v = props[k];
    if (typeof v === 'string' && /^[A-Za-z]{2}$/.test(v)) return v.toUpperCase();
  }
  return null;
}

export function loadBorders(file = BORDERS_FILE) {
  if (features !== undefined) return features;
  try {
    const gj = JSON.parse(readFileSync(file, 'utf8'));
    const list = gj.type === 'FeatureCollection' ? gj.features : Array.isArray(gj) ? gj : [];
    features = list.map((f) => ({ code: codeOf(f.properties || {}) || codeOf(f), geometry: f.geometry })).filter((f) => f.code && f.geometry);
  } catch {
    features = null;
  }
  return features;
}

/** For tests: inject features directly. */
export function setBorders(list) {
  features = list;
}

function inRing(ring, lat, lng) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function inPolygon(coords, lat, lng) {
  if (!coords.length || !inRing(coords[0], lat, lng)) return false;
  for (let h = 1; h < coords.length; h++) if (inRing(coords[h], lat, lng)) return false;
  return true;
}

export function pointInGeometry(geometry, lat, lng) {
  if (!geometry) return false;
  if (geometry.type === 'Polygon') return inPolygon(geometry.coordinates, lat, lng);
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.some((p) => inPolygon(p, lat, lng));
  if (geometry.type === 'GeometryCollection') return (geometry.geometries || []).some((g) => pointInGeometry(g, lat, lng));
  return false;
}

/** ISO alpha-2 of the present-day country containing (lat, lng), or null. */
export function countryFromPoint(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  const list = loadBorders();
  if (!list) return null;
  for (const f of list) if (pointInGeometry(f.geometry, lat, lng)) return f.code;
  return null;
}
