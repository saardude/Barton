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

test('bsys parseRecord (real trimmed page browse/10/12559) merges page over row context', async () => {
  const url = 'https://systems.zti.hu/br/en/browse/10/12559';
  const r = bsys.parseRecord(await fx('bsys-record.html'), url, { category: '10', categoryLabel: bsys.CATEGORIES['10'].join(' > '), brNumber: 'C 1025a', incipit: 'Két krajcárom volt nékem', year: '1918', collector: 'Bartók Béla' });
  assert.equal(r.siteRecordId, '10-12559');
  assert.equal(r.siteId, 'C 1025a');
  assert.equal(r.title, 'Két krajcárom volt nékem');
  assert.equal(r.placeRaw, 'Újszász (Pest-Pilis-Solt-Kiskun)');
  assert.equal(r.dateRaw, '1918.08.');
  assert.equal(r.performerRaw, 'Pető Panna (19)');
  assert.equal(r.collectorRaw, 'Bartók Béla');
  assert.equal(r.number, 'BR_11984');
  assert.equal(r.cadences, '(5) 4');
  assert.equal(r.systemPosition, 'C 1025a');
  assert.equal(r.style, 'mixed style');
  assert.equal(r.styleRaw, 'Class C: mixed, not unified style > III. 3-liners');
  assert.equal(r.form, '3 lines');
  assert.deepEqual(r.notation.map((n) => n.url), ['https://systems.zti.hu/media/images/BR/BR_11984_01.jpg']);
  assert.ok(r.related.some((x) => x.relation === 'variant' && /search\?sys=C\+1025/.test(x.url) && x.label === 'melodic variants (2)'));
  assert.ok(r.related.some((x) => x.id === 'bsys-10-12560'));
  assert.equal(r.ethnicityRaw, null);
});

test('bsys style from the category tree and the BR number', () => {
  const a = bsys.fromContext('https://systems.zti.hu/br/en/browse/15/1', { category: '15', categoryLabel: bsys.CATEGORIES['15'].join(' > '), brNumber: 'A 204a' });
  assert.equal(a.style, 'old style');
  assert.equal(a.rhythm, 'parlando-rubato or fixed rhythm');
  assert.equal(a.syllables, '8');
  assert.equal(a.form, 'isometric four-liner');
  const b = bsys.fromContext('https://systems.zti.hu/br/en/browse/82/1', { category: '82', categoryLabel: bsys.CATEGORIES['82'].join(' > ') });
  assert.equal(b.style, 'instrumental');
  assert.equal(b.performanceRaw, 'instrumental');
  const c = bsys.parseRecord('<html><body><div id="record"><p>BR number: B 12c</p></div></body></html>', 'https://systems.zti.hu/br/en/browse/31/5', {});
  assert.equal(c.style, 'new style');
});

test('bsys parseRecord never throws on an empty page', () => {
  const r = bsys.parseRecord('<html><body></body></html>', 'https://systems.zti.hu/br/en/browse/12/9', {});
  assert.equal(r.siteRecordId, '12-9');
  assert.equal(r.title, null);
  assert.equal(r.placeRaw, null);
});
