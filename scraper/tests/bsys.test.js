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
});

test('bsys discover: record links + row context from a real category table', async () => {
  const $ = load(await fx('bsys-category.html'));
  const { records, listings } = bsys.discover($, 'https://systems.zti.hu/br/en/browse/12/');
  assert.equal(listings.length, 0, '?sort= links are not listings');
  assert.equal(records.length, 19);
  const r = records[0];
  assert.match(r.url, /^https:\/\/systems\.zti\.hu\/br\/en\/browse\/12\/\d+$/);
  assert.equal(r.context.category, '12');
  assert.match(r.context.brNumber, /^A \d+/);
  assert.ok(r.context.incipit);
  assert.ok(r.context.locality);
  assert.ok(r.context.county);
  assert.ok(records.every((x) => x.context.collector !== undefined));
  assert.ok(records.some((x) => x.context.collector));
});

test('bsys fromContext: listing-only record', () => {
  const r = bsys.fromContext('https://systems.zti.hu/br/en/browse/20/3417', { category: '20', brNumber: 'A 1101a', incipit: 'Hej, rozmaring', locality: 'Kibéd / Gyergyóújfalu', county: 'Maros-Torda', year: '1904', collector: 'Bartók Béla', sound: 'MH_1615b, BF_0441b' });
  assert.equal(r.siteRecordId, '20-3417');
  assert.equal(r.siteId, 'A 1101a');
  assert.equal(r.placeRaw, 'Kibéd / Gyergyóújfalu (Maros-Torda)');
  assert.equal(r.dateRaw, '1904');
  assert.equal(r.fields.Sound, 'MH_1615b, BF_0441b');
  assert.equal(r.fields._partial, 'listing row only; record page not fetched');
});

test('bsys parseRecord (modelled fixture, TO CONFIRM) merges page over row context', async () => {
  const url = 'https://systems.zti.hu/br/en/browse/12/1234';
  const r = bsys.parseRecord(await fx('bsys-record.html'), url, { brNumber: 'A 1a', incipit: 'Elindultam szép hazámbul', year: '1904' });
  assert.equal(r.siteRecordId, '12-1234');
  assert.equal(r.siteId, 'A 1a');
  assert.equal(r.title, 'Elindultam szép hazámbul');
  assert.equal(r.placeRaw, 'Gerlicepuszta (Gömör és Kis-Hont)');
  assert.equal(r.dateRaw, '1904.11.');
  assert.equal(r.originRaw, 'Kibéd (Maros-Torda)');
  assert.equal(r.performerRaw, 'Dósa Lidi (18)');
  assert.equal(r.collectorRaw, 'Bartók Béla');
  assert.equal(r.number, 'BR_00001');
  assert.equal(r.cadences, '5 (b3) 1');
  assert.deepEqual(r.audio.map((a) => a.url), ['https://systems.zti.hu/media/audio/MH_0001a.mp3']);
  assert.deepEqual(r.notation.map((n) => n.url), ['https://systems.zti.hu/media/images/BR/BR_00001_01.jpg']);
  assert.ok(r.related.some((x) => x.relation === 'variant' && /search\?sys=A\+1/.test(x.url)));
  assert.ok(r.related.some((x) => x.id === 'bsys-12-1235'));
});

test('bsys parseRecord never throws on an empty page', () => {
  const r = bsys.parseRecord('<html><body></body></html>', 'https://systems.zti.hu/br/en/browse/12/9', {});
  assert.equal(r.siteRecordId, '12-9');
  assert.equal(r.title, null);
  assert.equal(r.placeRaw, null);
});
