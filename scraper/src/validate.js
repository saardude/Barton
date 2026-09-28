// Validate data files against data/schema/*.schema.json with Ajv (JSON Schema 2020-12).
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { PATHS, readJson, exists } from './util.js';

export async function makeValidators() {
  const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
  addFormats(ajv);
  const song = ajv.compile(await readJson(path.join(PATHS.schema, 'song.schema.json')));
  const place = ajv.compile(await readJson(path.join(PATHS.schema, 'place.schema.json')));
  const facets = ajv.compile(await readJson(path.join(PATHS.schema, 'facets.schema.json')));
  return { ajv, song, place, facets };
}

function fmt(ajv, validate, label) {
  return (validate.errors || []).map((e) => `${label}${e.instancePath || ''} ${e.message}${e.params && e.params.additionalProperty ? ` (${e.params.additionalProperty})` : ''}`);
}

/** Validate an array of songs; returns {ok, errors[]}. Also checks id uniqueness. */
export function validateSongs(v, songs) {
  const errors = [];
  if (!Array.isArray(songs)) return { ok: false, errors: ['songs.json must be an array'] };
  const ids = new Set();
  songs.forEach((s, i) => {
    if (!v.song(s)) errors.push(...fmt(v.ajv, v.song, `[${i}] ${s && s.id ? s.id : ''}`));
    if (s && s.id) {
      if (ids.has(s.id)) errors.push(`[${i}] duplicate id ${s.id}`);
      ids.add(s.id);
    }
  });
  return { ok: errors.length === 0, errors };
}

export function validatePlaces(v, places) {
  const errors = [];
  if (!Array.isArray(places)) return { ok: false, errors: ['places.json must be an array'] };
  const ids = new Set(places.map((p) => p && p.id));
  places.forEach((p, i) => {
    if (!v.place(p)) errors.push(...fmt(v.ajv, v.place, `[${i}] ${p && p.id ? p.id : ''}`));
    if (p && p.parent && !ids.has(p.parent)) errors.push(`[${i}] ${p.id}: parent ${p.parent} missing`);
  });
  return { ok: errors.length === 0, errors };
}

export function validateFacets(v, facets) {
  const ok = v.facets(facets);
  return { ok, errors: ok ? [] : fmt(v.ajv, v.facets, 'facets') };
}

export async function validateFiles({ songsFile = path.join(PATHS.data, 'songs.json'), placesFile = path.join(PATHS.data, 'places.json'), facetsFile = path.join(PATHS.data, 'facets.json') } = {}) {
  const v = await makeValidators();
  const reports = [];
  if (await exists(songsFile)) {
    const songs = await readJson(songsFile);
    const r = validateSongs(v, songs);
    reports.push({ file: songsFile, count: Array.isArray(songs) ? songs.length : 0, ...r });
  } else reports.push({ file: songsFile, count: 0, ok: false, errors: ['file not found'] });
  if (await exists(placesFile)) {
    const places = await readJson(placesFile);
    const r = validatePlaces(v, places);
    reports.push({ file: placesFile, count: Array.isArray(places) ? places.length : 0, ...r });
  }
  if (await exists(facetsFile)) {
    const facets = await readJson(facetsFile);
    const r = validateFacets(v, facets);
    reports.push({ file: facetsFile, count: 1, ...r });
  }
  return { ok: reports.every((r) => r.ok), reports };
}
