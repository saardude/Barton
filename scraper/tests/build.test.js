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
    fmbc: [fmbc.parseRecord(await fx('fmbc-record.html'), 'https://bartok-nepzene.zti.hu/en/browse/record/BB068-L132-05/', {}), fmbc.parseRecord(await fx('fmbc-record-2sources.html'), 'https://bartok-nepzene.zti.hu/en/browse/record/BB047-L172-07/', {})],
    bsys: [bsys.parseRecord(await fx('bsys-record.html'), 'https://systems.zti.hu/br/en/browse/10/12559', { category: '10', categoryLabel: bsys.CATEGORIES['10'].join(' > '), brNumber: 'C 1025a' }), bsys.fromContext('https://systems.zti.hu/br/en/browse/20/3417', { brNumber: 'A 1101a', incipit: 'Hej', locality: 'Maroshévíz', county: 'Maros-Torda', year: '1914', collector: 'Bartók Béla' }), bsys.fromContext('https://systems.zti.hu/br/en/browse/10/12994', { category: '10', categoryLabel: bsys.CATEGORIES['10'].join(' > '), brNumber: 'C 1231a', incipit: 'Száraz ágtól messze virít a rózsa', locality: 'Gerlicepuszta', county: 'Gömör és Kis-Hont', year: '1904', collector: 'Bartók Béla' }), bsys.fromContext('https://systems.zti.hu/br/en/browse/15/77', { category: '15', categoryLabel: bsys.CATEGORIES['15'].join(' > '), brNumber: 'A 300b', incipit: 'x', locality: 'Ismeretlenfalva', county: 'Csík', year: '1907' })],
    gyuj: [gyuj.parseRecord(await fx('gyuj-record.html'), 'https://bartok-gyujtesek.zti.hu/en/browse/1/12994', { collectionId: '1', collectionLabel: 'July – November, 1904. Gerlicepuszta / Kibéd (8)', collectionDate: 'July – November, 1904', collectionPlace: 'Gerlicepuszta / Kibéd' })]
  };
  const { songs, places, facets, duplicates, merged } = assemble(raw, gaz);
  assert.equal(duplicates, 0);
  assert.equal(merged, 1, 'bsys-10-12994 (listing row) and gyuj-1-12994 (page) are the same backend record');
  assert.deepEqual(songs.map((s) => s.id), ['bsys-10-12559', 'bsys-10-12994', 'bsys-15-77', 'bsys-20-3417', 'fmbc-BB047-L172-07', 'fmbc-BB068-L132-05']);
  const v = await makeValidators();
  assert.deepEqual(validateSongs(v, songs).errors, []);
  assert.deepEqual(validatePlaces(v, places).errors, []);
  assert.deepEqual(validateFacets(v, facets).errors, []);

  // fmbc: site-provided modern name + coordinates win; region/country from the gazetteer county.
  const dances = songs.find((s) => s.id === 'fmbc-BB068-L132-05');
  assert.equal(dances.location.village, 'Beiuș');
  assert.equal(dances.location.villageHistorical, 'Belényes');
  assert.equal(dances.location.county, 'Bihor');
  assert.equal(dances.location.countyHistorical, 'Bihar');
  assert.equal(dances.location.country, 'RO');
  assert.equal(dances.location.region, 'Crișana');
  assert.equal(dances.location.lat, 46.6668);
  assert.equal(dances.location.resolution, 'site');
  assert.equal(dances.location.placeId, 'ro/crisana/bihor/beius');
  assert.equal(dances.performance, 'instrumental');
  assert.deepEqual(dances.instrument, ['violin']);
  assert.equal(dances.performer.name, null);
  assert.equal(dances.performer.sex, 'm');
  assert.deepEqual(dances.collected, { year: 1910, month: 2, day: null, raw: 'February 1910' });
  assert.equal(dances.genre, null);
  assert.equal(dances.composition[0].catalogue, 'BB 68');
  const valenii = songs.find((s) => s.id === 'fmbc-BB047-L172-07');
  assert.equal(valenii.location.village, 'Vălenii');
  assert.equal(valenii.location.country, 'RO');
  assert.equal(valenii.location.county, 'Mureș');
  assert.equal(valenii.location.placeId, 'ro/transylvania/mures/valenii');
  assert.equal(valenii.performer.sex, 'f');

  // merged bsys+gyuj record: gyuj page data fills the listing-only bsys row; both links kept.
  const g = songs.find((s) => s.id === 'bsys-10-12994');
  assert.deepEqual(g.source.alternates.map((a) => [a.site, a.siteId, a.url]), [['gyuj', 'BR_12388', 'https://bartok-gyujtesek.zti.hu/en/browse/1/12994']]);
  assert.equal(g.source.siteId, 'C 1231a');
  assert.equal(g.journey.collectionId, '1');
  assert.match(g.journey.label, /Gerlicepuszta/);
  assert.equal(g.style, 'mixed style');
  assert.equal(g.styleRaw, 'Class C: mixed, not unified style > III. 3-liners');
  assert.equal(g.rawFields._partial, undefined);
  assert.equal(g.location.village, null);
  assert.equal(g.location.villageHistorical, 'Gerlicepuszta');
  assert.equal(g.location.countyHistorical, 'Gömör és Kis-Hont');
  assert.equal(g.location.country, null, 'split county: country not derivable');
  assert.equal(g.location.resolution, 'unresolved');
  // county-only fallback: unknown village in an exclusively Romanian historical county
  const c = songs.find((s) => s.id === 'bsys-15-77');
  assert.equal(c.location.village, null);
  assert.equal(c.location.country, 'RO');
  assert.equal(c.location.county, 'Harghita');
  assert.equal(c.location.region, 'Transylvania');
  assert.equal(c.location.resolution, 'county');
  assert.equal(c.location.placeId, 'ro/transylvania/harghita/ismeretlenfalva');
  assert.equal(c.style, 'old style');
  const p = songs.find((s) => s.id === 'bsys-10-12559');
  assert.equal(p.location.country, 'HU', 'Pest-Pilis-Solt-Kiskun lies wholly in Hungary');
  assert.equal(p.location.resolution, 'county');
  assert.equal(g.location.origin.village, 'Chibed');
  assert.equal(g.location.origin.countyHistorical, 'Maros-Torda');
  assert.deepEqual(g.collected, { year: 1904, month: 11, day: null, raw: '1904.11.' });
  assert.equal(g.performer.name, 'Dósa Lidi');
  assert.equal(g.performer.age, 18);
  assert.equal(g.music.cadences, '(1) 1');
  assert.equal(g.music.systemPosition, 'C 1231a');

  // bsys listing-only record resolves via the gazetteer (Maroshévíz -> Toplița, Harghita).
  const b = songs.find((s) => s.id === 'bsys-20-3417');
  assert.equal(b.location.village, 'Toplița');
  assert.equal(b.location.county, 'Harghita');
  assert.equal(b.location.resolution, 'gazetteer');
  assert.equal(b.rawFields._partial, 'listing row only; record page not fetched');

  // places
  const ids = places.map((p) => p.id);
  assert.ok(ids.includes('ro/crisana/bihor/beius'));
  assert.ok(ids.includes('ro/transylvania/harghita/toplita'));
  assert.ok(ids.includes('xx/unresolved/gerlicepuszta'));
  assert.ok(ids.includes('ro/transylvania/harghita/ismeretlenfalva'));
  assert.ok(ids.includes('hu/unresolved/ujszasz'));
  const bihor = places.find((p) => p.id === 'ro/crisana/bihor');
  assert.equal(bihor.counts.total, 1);
  assert.equal(bihor.counts.byPerformance.instrumental, 1);
  const ro = places.find((p) => p.id === 'ro');
  assert.equal(ro.counts.total, 4);
  assert.equal(ro.coordSource, 'centroid-of-children');
  assert.equal(facets._meta.songCount, 6);
  assert.equal(facets._meta.sites.gyuj, 1);
  assert.equal(facets.country.RO, 4);
  assert.equal(facets.instrument.violin, 1);
  assert.equal(facets.year[1904], 1);
  assert.equal(facets.style['old style'], 2);
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
