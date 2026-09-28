import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';
import gyuj from '../src/sites/gyujtesek.js';
import { PATHS } from '../src/util.js';

const fx = (n) => fs.readFile(path.join(PATHS.fixtures, n), 'utf8');

test('gyuj parseCollectionLabel', () => {
  assert.deepEqual(gyuj.parseCollectionLabel('February, 1910. Upper region of the river Fekete-Körös: district of Belényes and Vaskoh'), { dateRaw: 'February, 1910', place: 'Upper region of the river Fekete-Körös: district of Belényes and Vaskoh', count: null, raw: 'February, 1910. Upper region of the river Fekete-Körös: district of Belényes and Vaskoh' });
  assert.deepEqual(gyuj.parseCollectionLabel('July – August, 1907. Gyergyóújfalu (49)'), { dateRaw: 'July – August, 1907', place: 'Gyergyóújfalu', count: 49, raw: 'July – August, 1907. Gyergyóújfalu (49)' });
  assert.deepEqual(gyuj.parseCollectionLabel('1914. április 3–10. Felső-Maros mente'), { dateRaw: '1914. április 3–10', place: 'Felső-Maros mente', count: null, raw: '1914. április 3–10. Felső-Maros mente' });
  assert.deepEqual(gyuj.parseCollectionLabel('03. 1907, Nyitra county'), { dateRaw: '03. 1907', place: 'Nyitra county', count: null, raw: '03. 1907, Nyitra county' });
  assert.equal(gyuj.parseCollectionLabel('').raw, null);
});

test('gyuj discover: collection listings from the real trimmed browse page', async () => {
  const $ = load(await fx('gyuj-browse.html'));
  const { records, listings } = gyuj.discover($, 'https://bartok-gyujtesek.zti.hu/en/browse');
  assert.equal(records.length, 0);
  assert.ok(listings.includes('https://bartok-gyujtesek.zti.hu/en/browse/56'));
  assert.ok(listings.length >= 15);
});

test('gyuj discover: record links with row context from a real collection table (Gyanta 1912)', async () => {
  const $ = load(await fx('gyuj-collection.html'));
  const { records, listings } = gyuj.discover($, 'https://bartok-gyujtesek.zti.hu/en/browse/68');
  assert.equal(listings.length, 0);
  assert.equal(records.length, 12);
  const r = records.find((x) => x.url.endsWith('/68/1046'));
  assert.equal(r.context.collectionId, '68');
  assert.equal(r.context.incipit, 'Gyantai iskolában');
  assert.equal(r.context.locality, 'Gyanta');
  assert.equal(r.context.county, 'Bihar');
  assert.equal(r.context.date, '1912.');
  assert.equal(r.context.informant, 'Boross Péter');
  assert.equal(r.context.sound, 'MH_1628a');
});

test('gyuj parseRecord (real trimmed page with Place of origin)', async () => {
  const url = 'https://bartok-gyujtesek.zti.hu/en/browse/1/12994';
  const rec = gyuj.parseRecord(await fx('gyuj-record.html'), url, { collectionId: '1' });
  assert.equal(rec.siteRecordId, '1-12994');
  assert.equal(rec.siteId, 'BR_12388');
  assert.equal(rec.number, '12994');
  assert.equal(rec.title, 'Száraz ágtól messze virít a rózsa');
  assert.equal(rec.placeRaw, 'Gerlicepuszta (Gömör és Kis-Hont)');
  assert.equal(rec.dateRaw, '1904.11.');
  assert.equal(rec.originRaw, 'Kibéd (Maros-Torda)');
  assert.equal(rec.performerRaw, 'Dósa Lidi (18)');
  assert.equal(rec.collectorRaw, 'Bartók Béla');
  assert.equal(rec.referenceCode, 'C 1231a');
  assert.equal(rec.systemPosition, 'C 1231a');
  assert.equal(rec.cadences, '(1) 1');
  assert.deepEqual(rec.notation.map((m) => m.url), ['https://bartok-gyujtesek.zti.hu/media/images/BR/BR_12388_01.jpg']);
  assert.deepEqual(rec.audio, []);
  assert.ok(rec.related.some((x) => x.relation === 'variant' && x.url === 'http://sys.zti.hu/br/en/search?sys=C+1231' && x.label === 'melodic variants (3)'));
  assert.ok(rec.related.some((x) => x.id === 'gyuj-1-12738'));
});

test('gyuj fromContext and empty-page fallback never throw', () => {
  const r = gyuj.fromContext('https://bartok-gyujtesek.zti.hu/en/browse/56/9', { collectionDate: 'February, 1910', collectionPlace: 'Vaskoh', incipit: 'x', locality: 'Vaskoh', county: 'Bihar', date: '1910.02.', informant: 'man' });
  assert.equal(r.siteRecordId, '56-9');
  assert.equal(r.dateRaw, '1910.02.');
  assert.equal(r.placeRaw, 'Vaskoh (Bihar)');
  assert.equal(r.title, 'x');
  const e = gyuj.parseRecord('<html><body></body></html>', 'https://bartok-gyujtesek.zti.hu/en/browse/56/9', { collectionDate: 'February, 1910', collectionPlace: 'Vaskoh' });
  assert.equal(e.dateRaw, 'February, 1910');
  assert.equal(e.placeRaw, 'Vaskoh');
});
