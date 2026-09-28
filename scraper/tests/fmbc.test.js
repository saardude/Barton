import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';
import fmbc from '../src/sites/fmbc.js';
import { PATHS } from '../src/util.js';

const fx = (n) => fs.readFile(path.join(PATHS.fixtures, n), 'utf8');

test('fmbc discover: record links with work/movement context (real trimmed browse page)', async () => {
  const $ = load(await fx('fmbc-browse.html'));
  const { records, listings } = fmbc.discover($, 'https://bartok-nepzene.zti.hu/en/browse/');
  assert.equal(listings.length, 0);
  assert.ok(records.length >= 15, `expected the 4 kept works to yield >= 15 records, got ${records.length}`);
  const r = records.find((x) => x.url.endsWith('/BB057-L155-01/'));
  assert.equal(r.url, 'https://bartok-nepzene.zti.hu/en/browse/record/BB057-L155-01/');
  assert.equal(r.context.catalogue, 'BB 57');
  assert.equal(r.context.work, "Two Romanian Folk Songs for women's voices");
  assert.equal(r.context.movement, '1. Nu te supăra, mireasă');
  assert.equal(r.context.lampert, 'L 155');
  assert.equal(r.context.section, 'Vocal Works');
  assert.ok(!records.some((x) => /record\/\/$/.test(x.url)), 'placeholder link must be skipped');
});

test('fmbc parseCollecting: the three formats printed by the site', () => {
  assert.deepEqual(fmbc.parseCollecting('Belényes/Beiuș (Bihar/Bihor County), February 1910, Béla Bartók'), { villageHistorical: 'Belényes', village: 'Beiuș', countyHistorical: 'Bihar', county: 'Bihor', country: null, dateRaw: 'February 1910', collector: 'Béla Bartók', raw: 'Belényes/Beiuș (Bihar/Bihor County), February 1910, Béla Bartók' });
  assert.deepEqual(fmbc.parseCollecting('Székelyvaja (Maros-Torda County; now: Vălenii, Romania), April 1914, Béla Bartók'), { villageHistorical: 'Székelyvaja', village: 'Vălenii', countyHistorical: 'Maros-Torda', county: null, country: 'Romania', dateRaw: 'April 1914', collector: 'Béla Bartók', raw: 'Székelyvaja (Maros-Torda County; now: Vălenii, Romania), April 1914, Béla Bartók' });
  const c = fmbc.parseCollecting('Bisztró (Gömör County), 1906, Béla Bartók');
  assert.equal(c.villageHistorical, 'Bisztró');
  assert.equal(c.countyHistorical, 'Gömör');
  assert.equal(c.dateRaw, '1906');
  assert.equal(c.collector, 'Béla Bartók');
  const n1 = fmbc.parseCollecting('Várhely (Hunyad/Hunedoara County; now: Sarmisegetuza), 1914, Béla Bartók');
  assert.equal(n1.village, 'Sarmisegetuza');
  assert.equal(n1.county, 'Hunedoara');
  assert.equal(n1.country, null);
  const n2 = fmbc.parseCollecting('Egres (Torontál/Torontal County; now: Igriș, Romania), November 1912, Béla Bartók');
  assert.deepEqual([n2.village, n2.country, n2.countyHistorical], ['Igriș', 'Romania', 'Torontál']);
  const n3 = fmbc.parseCollecting('[Abádszalók (Jász-Nagykun-Szolnok County; ma: Abádszalók), 1918, Béla Bartók]');
  assert.deepEqual([n3.villageHistorical, n3.village, n3.dateRaw], ['Abádszalók', 'Abádszalók', '1918']);
  const n4 = fmbc.parseCollecting('Kiskomlós (Ugocsa County; now: Мала Копаня; Ukraine), 1912, Béla Bartók');
  assert.deepEqual([n4.village, n4.country], ['Мала Копаня', 'Ukraine']);
  assert.equal(fmbc.parseCollecting(null).raw, null);
});

test('fmbc parseRecord: Romanian Folk Dances no. 5 (real trimmed page)', async () => {
  const url = 'https://bartok-nepzene.zti.hu/en/browse/record/BB068-L132-05/';
  const rec = fmbc.parseRecord(await fx('fmbc-record.html'), url, {});
  assert.equal(rec.site, 'fmbc');
  assert.equal(rec.siteRecordId, 'BB068-L132-05');
  assert.equal(rec.siteId, 'L 132');
  assert.equal(rec.url, url);
  assert.equal(rec.title, '5. Romanian Polka');
  assert.equal(rec.referenceCode, 'L 132');
  assert.equal(rec.composition[0].work, 'Romanian Folk Dances');
  assert.equal(rec.composition[0].catalogue, 'BB 68');
  assert.equal(rec.placeRaw, 'Belényes/Beiuș (Bihar/Bihor County)');
  assert.deepEqual(rec.place, { villageHistorical: 'Belényes', village: 'Beiuș', countyHistorical: 'Bihar', county: 'Bihor', country: null, lat: 46.6668, lng: 22.3527 });
  assert.equal(rec.dateRaw, 'February 1910');
  assert.equal(rec.collectorRaw, 'Béla Bartók');
  assert.equal(rec.performerRaw, 'young man');
  assert.equal(rec.performanceRaw, 'violin');
  assert.equal(rec.ethnicityRaw, 'Romanian');
  assert.equal(rec.number, 'MH_0863b');
  assert.match(rec.remarks, /Bihor, no\. 310/);
  assert.ok(rec.notation.some((n) => n.url === 'https://bartok-nepzene.zti.hu/media/images/melody/132.jpg'), JSON.stringify(rec.notation));
  assert.ok(rec.notation.some((n) => /facsimile/.test(n.caption)));
  assert.ok(rec.audio.some((a) => a.url === 'https://bartok-nepzene.zti.hu/media/audio/source/132_MH_0863b.mp3'));
  assert.equal(rec.genreRaw, null);
  assert.equal(rec.text, null);
});

test('fmbc parseRecord: two sources (melody + words), translation kept in fields (real trimmed page)', async () => {
  const url = 'https://bartok-nepzene.zti.hu/en/browse/record/BB047-L172-07/';
  const rec = fmbc.parseRecord(await fx('fmbc-record-2sources.html'), url, {});
  assert.equal(rec.siteId, 'L 172');
  assert.equal(rec.title, '7. Eddig való dolgom a tavaszi szántás');
  assert.equal(rec.composition[0].work, 'Eight Hungarian Folk Songs for voice and piano');
  assert.equal(rec.composition[0].catalogue, 'BB 47');
  assert.equal(rec.place.villageHistorical, 'Székelyvaja');
  assert.equal(rec.place.village, 'Vălenii');
  assert.equal(rec.place.country, 'Romania');
  assert.equal(rec.place.lat, 46.4469);
  assert.equal(rec.dateRaw, 'April 1914');
  assert.equal(rec.performerRaw, 'woman');
  assert.match(rec.text, /^Eddig való dolgom a tavaszi szántás,\n/);
  assert.match(rec.fields['Words (translation)'], /^Until now my work/);
  assert.equal(rec.fields['Words: Collecting'], 'Csíkszenttamás (Csík County; now: Tomeşti, Romania), July 1907, Béla Bartók');
  assert.ok(rec.audio.some((a) => /composition recording/.test(a.caption)));
  assert.ok(rec.notation.some((n) => n.caption === 'score (composition)'));
});

test('fmbc parseRecord never throws on an empty page', () => {
  const rec = fmbc.parseRecord('<html><body><p>nothing</p></body></html>', 'https://bartok-nepzene.zti.hu/en/browse/record/X1/', {});
  assert.equal(rec.siteRecordId, 'X1');
  assert.equal(rec.placeRaw, null);
  assert.equal(rec.place, null);
  assert.deepEqual(rec.audio, []);
});
