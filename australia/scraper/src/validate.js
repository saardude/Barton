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

function fmt(validate, label) {
  return (validate.errors || []).map((e) => `${label}${e.instancePath || ''} ${e.message}${e.params && e.params.additionalProperty ? ` (${e.params.additionalProperty})` : ''}`);
}

export function validateSongs(v, songs) {
  const errors = [];
  if (!Array.isArray(songs)) return { ok: false, errors: ['songs.json must be an array'] };
  const ids = new Set();
  songs.forEach((s, i) => {
    if (!v.song(s)) errors.push(...fmt(v.song, `[${i}] ${s && s.id ? s.id : ''}`));
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
    if (!v.place(p)) errors.push(...fmt(v.place, `[${i}] ${p && p.id ? p.id : ''}`));
    if (p && p.parent && !ids.has(p.parent)) errors.push(`[${i}] ${p.id}: parent ${p.parent} missing`);
  });
  return { ok: errors.length === 0, errors };
}

export function validateFacets(v, facets) {
  const ok = v.facets(facets);
  return { ok, errors: ok ? [] : fmt(v.facets, 'facets') };
}

export async function validateAll(songsFile, log = () => {}) {
  const v = await makeValidators();
  const files = {
    songs: songsFile || path.join(PATHS.data, 'songs.json'),
    places: path.join(PATHS.data, 'places.json'),
    facets: path.join(PATHS.data, 'facets.json')
  };
  let ok = true;
  for (const [kind, file] of Object.entries(files)) {
    if (!(await exists(file))) {
      log(`${file}: not found`);
      ok = false;
      continue;
    }
    const data = await readJson(file);
    const r = kind === 'songs' ? validateSongs(v, data) : kind === 'places' ? validatePlaces(v, data) : validateFacets(v, data);
    log(`${path.relative(PATHS.repo, file)}: ${r.ok ? 'ok' : `${r.errors.length} errors`}${Array.isArray(data) ? ` (${data.length} items)` : ''}`);
    for (const e of r.errors.slice(0, 20)) log(`  ${e}`);
    ok = ok && r.ok;
  }
  return ok;
}
