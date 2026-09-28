// Tests for the print-source pipeline: entry regexes, locality parser, label evidence
// and the alignment, over saved OCR excerpts (print/tests/fixtures/).
// Run: cd print && npm test   (or: node --test print/tests/)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as v4 from '../lib/rfm4.mjs';
import * as v5 from '../lib/rfm5.mjs';
import { readDjvuXml } from '../lib/djvu.mjs';
import { align } from '../lib/align.mjs';
import { LabelEvidence, fixLabel } from '../lib/labels.mjs';
import { romanMonth, parseLabel, keepMonotonicTokens, cleanIncipitText, similar, fold } from '../lib/util.mjs';
import { parsePerformer, resolveLocation } from '../lib/record.mjs';
import { Gazetteer } from '../../scraper/src/gazetteer.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(HERE, 'fixtures');

async function fixtureLines(prefix) {
  const text = await fs.readFile(path.join(FIX, 'rfm-lines.txt'), 'utf8');
  return text.split('\n').filter((l) => l.startsWith(`${prefix} `)).map((l) => l.slice(3));
}

test('vol IV: every saved data line parses with village, county, and date', async () => {
  const lines = await fixtureLines('V4');
  assert.ok(lines.length >= 10);
  for (const line of lines) {
    const d = v4.parseDataLine(line);
    assert.ok(d, `should parse: ${line}`);
    assert.ok(d.village && d.countyHistorical, `village/county: ${line}`);
    assert.ok(d.year >= 1909 && d.year <= 1917, `year: ${line}`);
  }
});

test('vol IV: prose and tempo lines are not data lines', async () => {
  for (const line of await fixtureLines('N4')) assert.equal(v4.parseDataLine(line), null, line);
});

test('vol IV: specific fields', () => {
  const a = v4.parseDataLine('F. 1174 c), Soimi (Bihor), Ion Mot (45), II. 1914.');
  assert.equal(a.referenceCode, 'F. 1174 c)');
  assert.equal(a.village, 'Soimi');
  assert.equal(a.countyPrinted, 'Bihor');
  assert.equal(a.countyHistorical, 'Bihar');
  assert.equal(a.performerRaw, 'Ion Mot (45)');
  assert.equal(a.month, 2);
  assert.equal(a.year, 1914);

  const b = v4.parseDataLine('Tempo giusto, 2120 ® 8, M,F. 737 bj, Sebis (Bihor), un om, VIII. 1909.');
  assert.equal(b.village, 'Sebis', 'junk before the record number is dropped');
  assert.equal(b.referenceCode, 'M.F. 737');

  const c = v4.parseDataLine('M.F. 1955 b), Coticlet @ihor), oameni, XII. 1911.');
  assert.equal(c.countyHistorical, 'Bihar', 'OCR "@ihor)" resolves to Bihor');

  const d = v4.parseDataLine('Valcani (Torontal), Xf. 1912. ee');
  assert.equal(d.month, 11, 'OCR "Xf" is XI');
  assert.equal(d.performerRaw, null);

  const e = v4.parseDataLine('F. 1564. b), Trdias (Arad), Pavel Oprea (17), Gligor Halmagean (17), VIL 1917.');
  assert.equal(e.month, 7);
  assert.equal(e.village, 'Trdias');
});

test('vol IV: county matcher tolerates OCR damage', () => {
  assert.equal(v4.matchCounty('Hunedioara').historical, 'Hunyad');
  assert.equal(v4.matchCounty('Mures - Turda').historical, 'Maros-Torda');
  assert.equal(v4.matchCounty('Torontal,').historical, 'Torontál');
  assert.equal(v4.matchCounty('Alba dejos').historical, 'Alsó-Fehér');
  assert.equal(v4.matchCounty('Then'), null);
  assert.equal(v4.matchCounty('Holy'), null);
});

test('vol IV: class headings, number tokens and Part Two references', async () => {
  assert.equal(v4.parseClassHeading('A I.'), 'A I.');
  assert.equal(v4.parseClassHeading('A II. a)'), 'A II. a)');
  assert.equal(v4.parseClassHeading('B Il. d)'), 'B II. d)');
  assert.equal(v4.parseClassHeading('Parlando, 2=132'), null);
  for (const [tok, label] of [['la.', '1a'], ['2.', '2'], ['12bb.', '12bb'], ['2le.', '21e']]) {
    assert.equal(parseLabel(tok).label, label, tok);
  }
  assert.equal(parseLabel('12ab.'), null, 'mixed double letters are not RFM labels');
  const refs = (await fixtureLines('R4')).join('\n');
  const labels = v4.extractLabels({ text: refs, entries: [], notesPages: [] });
  const byLabel = new Map(labels.map((l) => [l.label, l]));
  assert.equal(byLabel.get('21b').village, 'Urvis');
  assert.equal(byLabel.get('62k').village, 'Rau de mori');
  assert.equal(byLabel.get('82a').village, 'Paucinesd', '"Var." prefix is skipped');
  assert.equal(byLabel.get('17').village, 'Valcani');
  assert.equal(byLabel.get('21o').village, 'Rogoz', 'OCR "210" is 21o');
  assert.equal(byLabel.get('73dd').village, 'Petrosan');
  assert.ok(byLabel.has('73cc') && !byLabel.get('73cc').village, 'letters below the highest one are filled in');
  assert.equal(labels.filter((l) => l.number === 21).length, 15, '21a..21o');
});

test('vol IV: incipit cleaning keeps only the first line and rejoins syllables', () => {
  assert.equal(cleanIncipitText('89 b.Cce San-té Ma - fi - e,__ Co - rin-de, co - rin- del'), 'Cce Santé Mafie, Corinde, corindel');
  assert.equal(cleanIncipitText('(142.) M&- te - cad-i, ma - he-cd-i Sfan-ta-'), 'M&tecadi, mahecdi Sfanta');
  assert.equal(v4.textNumberOf('89 b.Cce San-té Ma - fi - e'), '89b');
});

test('vol V: every saved data line parses to one of the twelve villages (or a phonograph number)', async () => {
  const lines = await fixtureLines('V5');
  for (const line of lines) {
    const d = v5.parseDataLine(line);
    assert.ok(d, `should parse: ${line}`);
    assert.ok(d.village || d.recNumber, `village or record: ${line}`);
  }
  const a = v5.parseDataLine('F. 2123 d), Visaul- de - jos, Marie Ardelean (ca. 25).');
  assert.equal(a.village, 'Vișeul de jos');
  assert.equal(a.villageModern, 'Vișeu de Jos');
  assert.equal(a.referenceCode, 'F. 2123 d)');
  assert.equal(a.performerRaw, 'Marie Ardelean (ca. 25)');
  const b = v5.parseDataLine('Ieud, o fata (15-16).');
  assert.equal(b.village, 'Ieud');
  assert.equal(b.referenceCode, null);
  const c = v5.parseDataLine('Presto o = 184 4) Guitare F, 2109 a), [eud, Vasile Barani (38).');
  assert.equal(c.village, 'Ieud', 'OCR "[eud"');
  const d = v5.parseDataLine('F 2096 c), Anuté Dunca (25-30).');
  assert.equal(d.village, null);
  assert.equal(d.recNumber, 2096);
});

test('vol V: non-data lines are rejected', async () => {
  for (const line of await fixtureLines('N5')) assert.equal(v5.parseDataLine(line), null, line);
});

test('vol V: village inferred from the phonograph cylinder, classes from the number', () => {
  const entries = [
    { recNumber: 2096, village: 'Ieud', villageModern: 'Ieud' },
    { recNumber: 2096, village: null },
    { recNumber: 2097, village: 'Ieud', villageModern: 'Ieud' }
  ];
  v5.inferVillages(entries);
  assert.equal(entries[1].village, 'Ieud');
  assert.match(entries[1].villageInferred, /2096/);
  assert.equal(v5.classFor(5).genre, 'colinda');
  assert.equal(v5.classFor(21).genre, 'bocet');
  assert.equal(v5.classFor(23).genre, 'doina');
  assert.equal(v5.classFor(100).genre, 'cantec');
  assert.equal(v5.classFor(150).genre, 'joc');
  assert.equal(v5.classFor(200).genre, 'other');
  assert.deepEqual(v5.instrumentsFor(200, null), ['alphorn (bucium)']);
  assert.deepEqual(v5.instrumentsFor(150, 'un tigan batran. Invartita batranilor Violino'), ['violin']);
});

test('performer parser: names, ages, sex, ethnicity', () => {
  const a = parsePerformer('Ion Mot (45)');
  assert.deepEqual([a.name, a.age, a.sex, a.ethnicity], ['Ion Mot', 45, 'm', 'Romanian']);
  const b = parsePerformer('doua tigance (30)');
  assert.deepEqual([b.age, b.sex, b.ethnicity], [30, 'f', 'Roma (printed: țigan)']);
  const c = parsePerformer('Susana si Rafila Oncea (43,16)');
  assert.deepEqual([c.age, c.sex], [43, 'f']);
  const d = parsePerformer('Marie Ardelean (ca. 25)');
  assert.deepEqual([d.age, d.sex], [25, 'f']);
  const e = parsePerformer('Pavel Oprea (17), Gligor Halmagean (17)');
  assert.deepEqual([e.age, e.sex, e.count], [17, 'm', 2]);
  const f = parsePerformer('Ileana si Nita Ardelean, etc. (15-20)');
  assert.deepEqual([f.age, f.sex], [15, 'f']);
  const g = parsePerformer('feciori');
  assert.deepEqual([g.age, g.sex], [null, 'm']);
  assert.equal(parsePerformer(null).name, null);
});

test('roman months as OCRed', () => {
  for (const [s, n] of [['II', 2], ['Il', 2], ['XL', 11], ['XT', 11], ['VIL', 7], ['VIT', 7], ['Xf', 11], ['XII', 12], ['IV', 4], ['1', 1], ['abc', null]]) assert.equal(romanMonth(s), n, s);
});

test('locality parser: gazetteer resolution with a county hint, fallback to the historical county', () => {
  const gaz = new Gazetteer({
    counties: [{ name: 'Bihor', country: 'RO', region: 'Crișana', historical: ['Bihar'] }, { name: 'Alba', country: 'RO', region: 'Transylvania', historical: ['Alsó-Fehér'] }],
    historicalCounties: { Bihar: { country: 'RO', county: null, exclusive: false, region: 'Crișana', countries: ['RO', 'HU'] }, 'Alsó-Fehér': { country: 'RO', county: 'Alba', exclusive: true, region: 'Transylvania' } },
    places: [
      { name: 'Șoimi', nameHistorical: 'Soimi', aliases: [], country: 'RO', region: 'Crișana', county: 'Bihor', countyHistorical: 'Bihar', lat: 46.69, lng: 22.13 },
      { name: 'Ieud', nameHistorical: 'Jód', aliases: [], country: 'RO', region: 'Maramureș', county: 'Maramureș', countyHistorical: 'Máramaros', lat: 47.66, lng: 24.24 }
    ]
  });
  const a = resolveLocation(gaz, { village: 'Soimi', countyHistorical: 'Bihar', raw: 'Soimi (Bihor)' });
  assert.equal(a.resolution, 'gazetteer');
  assert.equal(a.village, 'Șoimi');
  assert.equal(a.county, 'Bihor');
  assert.equal(a.country, 'RO');
  assert.equal(a.villageHistorical, 'Soimi');
  const b = resolveLocation(gaz, { village: 'Soimi', countyHistorical: 'Bihar' }); // diacritics-insensitive
  assert.equal(b.lat, 46.69);
  const c = resolveLocation(gaz, { village: 'Petrosan', countyHistorical: 'Alsó-Fehér', raw: 'Petrosan (Alba de jos)' });
  assert.equal(c.resolution, 'county');
  assert.equal(c.county, 'Alba');
  assert.equal(c.lat, null);
  const d = resolveLocation(gaz, { village: 'Nowhere', countyHistorical: 'Bihar' });
  assert.equal(d.resolution, 'unresolved');
  assert.equal(d.county, null);
  const e = resolveLocation(gaz, { village: 'Teud', villageModernHint: 'Ieud', countyHistorical: 'Máramaros' });
  assert.equal(e.village, 'Ieud', 'modern-name hint from the vol V village table');
});

test('label evidence policy: OCR-noisy sources cannot inflate the variant count', () => {
  const ev = new LabelEvidence(133, { strong: ['text-ref', 'notes'], weak: ['page-token'], weakSlack: 1, weakMaxAlone: 2 });
  ev.bump(12, 'dd', 'text-ref');
  ev.bump(12, 'ee', 'page-token'); // one above: accepted
  ev.bump(3, 'l', 'page-token'); // alone and high: rejected
  ev.bump(7, 'b', 'page-token'); // alone and low: accepted
  const labels = ev.build();
  assert.equal(labels.filter((l) => l.number === 12).length, 31);
  assert.equal(labels.filter((l) => l.number === 3).length, 1);
  assert.equal(labels.filter((l) => l.number === 7).length, 2);
  assert.deepEqual(fixLabel('120', '', 100), { number: 12, letter: 'o', label: '12o' }, 'above the volume maximum a trailing 0 is the letter o');
  assert.equal(fixLabel('120', '', 133).label, '120', 'within range it stays a number (vol IV has a melody 120)');
  assert.deepEqual(fixLabel('621', '', 133), { number: 62, letter: 'l', label: '62l' });
  assert.deepEqual(fixLabel('8l', 'a', 133), { number: 81, letter: 'a', label: '81a' });
});

test('monotonic token filter drops out-of-sequence OCR numbers', () => {
  const mk = (label) => ({ numberToken: label ? parseLabel(label) : null });
  const entries = [mk('1a.'), mk('91g.'), mk('2.'), mk('3a.'), mk('122.'), mk('5b.'), mk(null), mk('6.')];
  const kept = keepMonotonicTokens(entries);
  assert.equal(kept, 5);
  assert.equal(entries[1].numberToken, null);
  assert.equal(entries[1].numberTokenRejected.label, '91g');
  assert.equal(entries[4].numberToken, null);
  assert.equal(entries[7].numberToken.label, '6');
});

test('alignment: villages and tokens put data lines on the right labels across a lost line', () => {
  const labels = [
    { label: '1a', number: 1, letter: 'a', village: 'Soimi' },
    { label: '1b', number: 1, letter: 'b', village: 'Dumbravita de codru' },
    { label: '2', number: 2, letter: '', village: null },
    { label: '3a', number: 3, letter: 'a', village: 'Cherpenis' },
    { label: '3b', number: 3, letter: 'b', village: null }
  ];
  const entries = [ // the Soimi line (1a) was lost by the OCR
    { village: 'Dumbravita de codru', numberToken: null },
    { village: 'Petrosan', numberToken: parseLabel('2.') },
    { village: 'Cherpenis', numberToken: null },
    { village: 'Sarafola', numberToken: null }
  ];
  const score = (l, e) => (l.village && e.village ? (similar(l.village, e.village) ? 3 : -3) : 0.3) + (e.numberToken ? (e.numberToken.label === l.label ? 5 : -3) : 0);
  const { pairs } = align(labels, entries, score);
  const got = pairs.filter((p) => p.entry !== null).map((p) => (p.label === null ? null : labels[p.label].label));
  assert.deepEqual(got, ['1b', '2', '3a', '3b']);
  assert.ok(pairs.some((p) => p.entry === null && labels[p.label].label === '1a'), '1a is reported as a label without a data line');
});

test('djvu.xml reader: real two-page excerpts of both volumes give the printed data lines in reading order', async () => {
  const p4 = await readDjvuXml(path.join(FIX, 'rfm4-pages-94-95.djvu.xml'));
  assert.equal(p4.length, 2);
  assert.ok(p4[0].lines.some((l) => /x-struct/.test(l.text)) === false);
  const e4 = v4.extractEntries(p4);
  assert.deepEqual(e4.map((e) => e.village), ['Dumbravita de codru', 'Petrosan', 'Cherpenis', 'Sarafola', 'Urisiu de sus', 'Cianad']);
  assert.equal(e4[0].classHeading, 'A I.');
  assert.equal(e4[2].classHeading, 'A II. a)');
  assert.equal(e4[4].classHeading, 'A II. b)');
  assert.equal(e4[0].numberToken.label, '1a');
  assert.equal(e4[1].year, 1911);
  assert.ok(e4.every((e) => e.page === 0 || e.page === 1));

  const p5 = await readDjvuXml(path.join(FIX, 'rfm5-pages-82-83.djvu.xml'));
  const e5 = v5.extractEntries(p5);
  assert.deepEqual(e5.slice(0, 5).map((e) => e.village), ['Vișeul de jos', 'Dragomirești', 'Dragomirești', 'Ieud', 'Oncești']);
  assert.deepEqual(e5.slice(0, 5).map((e) => (e.numberToken ? e.numberToken.label : null)), ['1', '2', '3', null, '5']);
  assert.equal(e5[0].referenceCode, 'F. 2123 d)');
  assert.equal(fold(e5[0].incipit).length > 10, true);
});
