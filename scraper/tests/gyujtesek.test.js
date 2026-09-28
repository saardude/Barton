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
  assert.deepEqual(gyuj.parseCollectionLabel('March 15–27, 1913. Máramaros county'), { dateRaw: 'March 15–27, 1913', place: 'Máramaros county', count: null, raw: 'March 15–27, 1913. Máramaros county' });
  assert.deepEqual(gyuj.parseCollectionLabel('1914. április 3–10. Felső-Maros mente'), { dateRaw: '1914. április 3–10', place: 'Felső-Maros mente', count: null, raw: '1914. április 3–10. Felső-Maros mente' });
  assert.deepEqual(gyuj.parseCollectionLabel('03. 1907, Nyitra county'), { dateRaw: '03. 1907', place: 'Nyitra county', count: null, raw: '03. 1907, Nyitra county' });
  assert.equal(gyuj.parseCollectionLabel('').raw, null);
});

test('gyuj discover: collection listings from the real trimmed browse page', async () => {
  const $ = load(await fx('gyuj-browse.html'));
  const { records, listings } = gyuj.discover($, 'https://bartok-gyujtesek.zti.hu/en/browse');
  assert.equal(records.length, 0);
  assert.ok(listings.includes('https://bartok-gyujtesek.zti.hu/en/browse/56'));
  assert.ok(listings.includes('https://bartok-gyujtesek.zti.hu/en/browse/82'));
  assert.ok(listings.length >= 15);
});

test('gyuj discover: record links + pagination + collection context (synthetic collection page)', async () => {
  const $ = load(await fx('gyuj-collection.html'));
  const { records, listings } = gyuj.discover($, 'https://bartok-gyujtesek.zti.hu/en/browse/56');
  assert.deepEqual(records.map((r) => r.url), ['https://bartok-gyujtesek.zti.hu/en/browse/56/1234', 'https://bartok-gyujtesek.zti.hu/en/browse/56/1235']);
  assert.equal(records[0].context.collectionId, '56');
  assert.equal(records[0].context.collectionDate, 'February, 1910');
  assert.match(records[0].context.collectionPlace, /Belényes and Vaskoh/);
  assert.equal(records[0].context.listLabel, 'Colo-n jos la Vaskoh');
  assert.deepEqual(listings, ['https://bartok-gyujtesek.zti.hu/en/browse/56?page=2']);
});

test('gyuj parseRecord (synthetic record page)', async () => {
  const url = 'https://bartok-gyujtesek.zti.hu/en/browse/56/1234';
  const rec = gyuj.parseRecord(await fx('gyuj-record.html'), url, { collectionId: '56', collectionDate: 'February, 1910', collectionPlace: 'x' });
  assert.equal(rec.siteRecordId, '56-1234');
  assert.equal(rec.siteId, 'BR 1234');
  assert.equal(rec.number, '1234');
  assert.equal(rec.title, 'Colo-n jos la Vaskoh');
  assert.equal(rec.placeRaw, 'Vaskoh (Bihar)');
  assert.equal(rec.dateRaw, '1910. február');
  assert.equal(rec.performerRaw, 'Ana Coroiu');
  assert.equal(rec.ageRaw, '23');
  assert.equal(rec.sexRaw, 'female');
  assert.equal(rec.genreRaw, 'Colindă');
  assert.equal(rec.ethnicityRaw, 'Romanian');
  assert.equal(rec.text, 'Colo-n jos la Vaskoh,\nEste-o casă cu pridvor.');
  assert.deepEqual(rec.audio.map((m) => m.url), ['https://bartok-gyujtesek.zti.hu/audio/56/1234.mp3']);
  assert.deepEqual(rec.notation.map((m) => m.url), ['https://bartok-gyujtesek.zti.hu/kotta/56/1234.png']);
  assert.deepEqual(rec.related, [{ id: 'gyuj-56-1235', url: 'https://bartok-gyujtesek.zti.hu/en/browse/56/1235', label: null, relation: 'link' }]);
});

test('gyuj parseRecord falls back to collection context and never throws', () => {
  const rec = gyuj.parseRecord('<html><body></body></html>', 'https://bartok-gyujtesek.zti.hu/en/browse/56/9', { collectionDate: 'February, 1910', collectionPlace: 'Vaskoh', listLabel: 'x' });
  assert.equal(rec.siteRecordId, '56-9');
  assert.equal(rec.siteId, '9');
  assert.equal(rec.dateRaw, 'February, 1910');
  assert.equal(rec.placeRaw, 'Vaskoh');
  assert.equal(rec.title, 'x');
});
