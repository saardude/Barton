import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';
import bsys from '../src/sites/bsys.js';
import { PATHS } from '../src/util.js';

const fx = (n) => fs.readFile(path.join(PATHS.fixtures, n), 'utf8');

test('bsys discover: 74 category pages from the real browse page', async () => {
  const $ = load(await fx('bsys-browse.html'));
  const { records, listings } = bsys.discover($, 'https://systems.zti.hu/br/en/browse');
  assert.equal(records.length, 0);
  assert.equal(listings.length, 74);
  assert.ok(listings.includes('https://systems.zti.hu/br/en/browse/12/'));
  assert.ok(listings.includes('https://systems.zti.hu/br/en/browse/83/'));
});

test('bsys discover: pagination on a category page (synthetic)', async () => {
  const $ = load(await fx('bsys-category.html'));
  const { listings } = bsys.discover($, 'https://systems.zti.hu/br/en/browse/12/');
  assert.deepEqual(listings, ['https://systems.zti.hu/br/en/browse/12/?page=2']);
});

test('bsys normalizeSystemPosition', () => {
  assert.equal(bsys.normalizeSystemPosition('A 204/3'), 'A204-3');
  assert.equal(bsys.normalizeSystemPosition('A 204'), 'A204');
  assert.equal(bsys.normalizeSystemPosition('B 12a/2'), 'B12a-2');
  assert.equal(bsys.normalizeSystemPosition('C.1044.7'), 'C1044-7');
  assert.equal(bsys.normalizeSystemPosition('nothing'), null);
});

test('bsys parseListing: cards with A / B locality, roman-numeral dates, cadences (synthetic)', async () => {
  const recs = bsys.parseListing(await fx('bsys-category.html'), 'https://systems.zti.hu/br/en/browse/12/');
  assert.equal(recs.length, 2);
  const [a, b] = recs;
  assert.equal(a.siteRecordId, 'A204-3');
  assert.equal(a.siteId, 'A 204/3');
  assert.equal(a.systemPosition, 'A 204/3');
  assert.equal(a.url, 'https://systems.zti.hu/br/en/browse/12/');
  assert.equal(a.placeRaw, 'Kibéd (Maros-Torda) / Gyergyóújfalu (Csík)');
  assert.equal(a.dateRaw, '1904. XI.');
  assert.equal(a.performerRaw, 'Dósa Lidi (16)');
  assert.equal(a.incipit, 'Elindultam szép hazámbul');
  assert.equal(a.cadences, '5 (b3) 1');
  assert.equal(a.rhythm, 'parlando');
  assert.equal(a.syllables, '8');
  assert.deepEqual(a.audio.map((m) => m.url), ['https://systems.zti.hu/audio/A204-3.mp3']);
  assert.deepEqual(a.notation.map((m) => m.url), ['https://systems.zti.hu/img/A204-3.png']);
  assert.equal(a.fields._category, 'number of syllables: 5');
  assert.equal(b.siteRecordId, 'A204-4');
  assert.equal(b.placeRaw, 'Maroshévíz (Maros-Torda)');
  assert.equal(b.performanceRaw, 'violin');
  assert.deepEqual(b.audio, []);
});

test('bsys parseListing on a page without cards returns []', () => {
  assert.deepEqual(bsys.parseListing('<html><body><h2>empty</h2></body></html>', 'https://systems.zti.hu/br/en/browse/99/'), []);
});
