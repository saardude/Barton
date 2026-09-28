import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { assemble } from '../src/build.js';
import { Gazetteer } from '../src/gazetteer.js';
import { makeValidators, validateSongs, validatePlaces, validateFacets } from '../src/validate.js';
import fmbc from '../src/sites/fmbc.js';
import bsys from '../src/sites/bsys.js';
import gyuj from '../src/sites/gyujtesek.js';
import { PATHS, stableStringify } from '../src/util.js';

const fx = (n) => fs.readFile(path.join(PATHS.fixtures, n), 'utf8');

test('end to end: fixtures -> parse -> assemble -> validate against the schemas', async () => {
  const gaz = await Gazetteer.load();
  const raw = {
    fmbc: [fmbc.parseRecord(await fx('fmbc-record.html'), 'https://bartok-nepzene.zti.hu/en/browse/record/BB057-L155-01/', { work: 'Two Romanian Folk Songs', catalogue: 'BB 57', movement: '1.', lampert: 'L 155' })],
    bsys: bsys.parseListing(await fx('bsys-category.html'), 'https://systems.zti.hu/br/en/browse/12/'),
    gyuj: [gyuj.parseRecord(await fx('gyuj-record.html'), 'https://bartok-gyujtesek.zti.hu/en/browse/56/1234', {})]
  };
  const { songs, places, facets, duplicates } = assemble(raw, gaz);
  assert.equal(duplicates, 0);
  assert.deepEqual(songs.map((s) => s.id), ['bsys-A204-3', 'bsys-A204-4', 'fmbc-BB057-L155-01', 'gyuj-56-1234']);
  const v = await makeValidators();
  const sr = validateSongs(v, songs);
  assert.deepEqual(sr.errors, []);
  const pr = validatePlaces(v, places);
  assert.deepEqual(pr.errors, []);
  assert.deepEqual(validateFacets(v, facets).errors, []);
  // places: Cărpinet, Toplița, Vașcău resolved; Kibéd (Chibed, Mureș) resolved too
  const villages = places.filter((p) => p.type === 'village').map((p) => p.id);
  assert.ok(villages.includes('ro/crisana/bihor/carpinet'));
  assert.ok(villages.includes('ro/crisana/bihor/vascau'));
  assert.ok(villages.includes('ro/transylvania/harghita/toplita'));
  assert.ok(villages.includes('ro/transylvania/mures/chibed'));
  const bihor = places.find((p) => p.id === 'ro/crisana/bihor');
  assert.equal(bihor.counts.total, 2);
  assert.equal(bihor.counts.byGenre.nunta, 1);
  assert.equal(bihor.counts.byGenre.colinda, 1);
  assert.equal(bihor.years.min, 1909);
  assert.equal(bihor.years.max, 1910);
  const ro = places.find((p) => p.id === 'ro');
  assert.equal(ro.counts.total, 4);
  assert.equal(ro.coordSource, 'centroid-of-children');
  assert.equal(facets._meta.songCount, 4);
  assert.equal(facets.genre.nunta, 1);
  assert.equal(facets.performance.instrumental, 1);
  assert.equal(facets.instrument.violin, 1);
  assert.equal(facets.year[1904], 1);
  // origin (B part of "A / B") is kept
  const a = songs.find((s) => s.id === 'bsys-A204-3');
  assert.equal(a.location.village, 'Chibed');
  assert.equal(a.location.origin.village, 'Suseni');
  assert.equal(a.location.origin.countyHistorical, 'Csík');
  assert.equal(a.collected.month, 11);
  // deterministic output
  assert.equal(stableStringify(songs), stableStringify(JSON.parse(stableStringify(songs))));
});

test('assemble drops duplicate ids and keeps the first', async () => {
  const gaz = await Gazetteer.load();
  const r = { siteRecordId: 'X', url: 'https://bartok-gyujtesek.zti.hu/en/browse/1/1', title: 'first' };
  const { songs, duplicates } = assemble({ gyuj: [r, { ...r, title: 'second' }] }, gaz);
  assert.equal(songs.length, 1);
  assert.equal(duplicates, 1);
  assert.equal(songs[0].title, 'first');
});
