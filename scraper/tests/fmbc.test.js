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
  assert.ok(r);
  assert.equal(r.url, 'https://bartok-nepzene.zti.hu/en/browse/record/BB057-L155-01/');
  assert.equal(r.context.catalogue, 'BB 57');
  assert.equal(r.context.work, "Two Romanian Folk Songs for women's voices");
  assert.equal(r.context.movement, '1. Nu te supăra, mireasă');
  assert.equal(r.context.lampert, 'L 155');
  assert.equal(r.context.section, 'Vocal Works');
  assert.ok(!records.some((x) => /record\/\/$/.test(x.url)), 'placeholder link must be skipped');
  const dances = records.filter((x) => x.context.catalogue === 'BB 68');
  assert.ok(dances.length >= 6, 'Romanian Folk Dances has at least 6 sources');
});

test('fmbc parseRecord: Folk Music Source tab (synthetic fixture)', async () => {
  const url = 'https://bartok-nepzene.zti.hu/en/browse/record/BB057-L155-01/';
  const rec = fmbc.parseRecord(await fx('fmbc-record.html'), url, { work: "Two Romanian Folk Songs for women's voices", catalogue: 'BB 57', movement: '1. Nu te supăra, mireasă', lampert: 'L 155' });
  assert.equal(rec.site, 'fmbc');
  assert.equal(rec.siteRecordId, 'BB057-L155-01');
  assert.equal(rec.siteId, 'L 155');
  assert.equal(rec.url, url);
  assert.equal(rec.title, 'Nu te supăra, mireasă');
  assert.equal(rec.referenceCode, 'L 155');
  assert.equal(rec.placeRaw, 'Kerpenyét (Bihar)');
  assert.equal(rec.dateRaw, '1909. jún.');
  assert.equal(rec.collectorRaw, 'Bartók Béla');
  assert.equal(rec.performerRaw, 'Floare Muntean (18)');
  assert.equal(rec.performanceRaw, 'vocal');
  assert.equal(rec.ethnicityRaw, 'Romanian');
  assert.equal(rec.genreRaw, 'cântec de nuntă (wedding song)');
  assert.equal(rec.volume, 'RFM II, no. 348');
  assert.equal(rec.remarks, 'Phonograph cylinder MH 1234b.');
  assert.deepEqual(rec.notation.map((m) => m.url), ['https://bartok-nepzene.zti.hu/images/kotta/BB057-L155-01.png']);
  assert.deepEqual(rec.audio.map((m) => m.url), ['https://bartok-nepzene.zti.hu/audio/MH1234b.mp3']);
  assert.equal(rec.text, 'Nu te supăra, mireasă,\nCă nu te-a lua-n casă.');
  assert.equal(rec.composition[0].catalogue, 'BB 57');
  assert.equal(rec.related[0].id, 'fmbc-BB057-L156-02');
});

test('fmbc parseRecord never throws on an empty or unrelated page', () => {
  const rec = fmbc.parseRecord('<html><body><p>nothing</p></body></html>', 'https://bartok-nepzene.zti.hu/en/browse/record/X1/', {});
  assert.equal(rec.siteRecordId, 'X1');
  assert.equal(rec.placeRaw, null);
  assert.equal(rec.dateRaw, null);
  assert.deepEqual(rec.audio, []);
  assert.deepEqual(rec.composition, []);
});
