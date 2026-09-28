import test from 'node:test';
import assert from 'node:assert/strict';
import { mapGenre, mapPerformance, extractInstruments, parseDate, parseLocality, parsePerformer, mapSex, normalizeRecord } from '../src/normalize.js';
import { Gazetteer } from '../src/gazetteer.js';

test('genre mapping to the controlled vocabulary', () => {
  assert.equal(mapGenre('Colindă'), 'colinda');
  assert.equal(mapGenre('colinde'), 'colinda');
  assert.equal(mapGenre('Christmas song (carol)'), 'colinda');
  assert.equal(mapGenre('Doină'), 'doina');
  assert.equal(mapGenre('hora lungă'), 'doina');
  assert.equal(mapGenre('bocet'), 'bocet');
  assert.equal(mapGenre('siratóének'), 'bocet');
  assert.equal(mapGenre('cântec propriu-zis'), 'cantec');
  assert.equal(mapGenre('népdal'), 'cantec');
  assert.equal(mapGenre('joc (dance)'), 'joc');
  assert.equal(mapGenre('Ardeleana'), 'joc');
  assert.equal(mapGenre('táncdallam'), 'joc');
  assert.equal(mapGenre('cântec de nuntă (wedding song)'), 'nunta');
  assert.equal(mapGenre('lakodalmas'), 'nunta');
  assert.equal(mapGenre('cântec de mireasă'), 'nunta');
  assert.equal(mapGenre('betlehemes'), 'other');
  assert.equal(mapGenre(''), null);
  assert.equal(mapGenre(null), null);
});

test('performance and instrument detection', () => {
  assert.equal(mapPerformance('vocal'), 'vocal');
  assert.equal(mapPerformance('énekelt'), 'vocal');
  assert.equal(mapPerformance('fluier'), 'instrumental');
  assert.equal(mapPerformance('sung with violin accompaniment'), 'mixed');
  assert.equal(mapPerformance(''), 'unknown');
  assert.equal(mapPerformance(null, ['violin']), 'instrumental');
  assert.deepEqual(extractInstruments('vioară și fluier'), ['violin', 'fluier']);
  assert.deepEqual(extractInstruments('hegedű'), ['violin']);
  assert.deepEqual(extractInstruments('cimpoi (bagpipe)'), ['bagpipe']);
  assert.deepEqual(extractInstruments('drâmbă'), ["jew's harp"]);
  assert.deepEqual(extractInstruments('vocal'), []);
});

test('date parsing: Hungarian, Romanian, English, roman and numeric forms', () => {
  assert.deepEqual(parseDate('1909. jún. 12.'), { year: 1909, month: 6, day: 12, raw: '1909. jún. 12.' });
  assert.deepEqual(parseDate('1909 június'), { year: 1909, month: 6, day: null, raw: '1909 június' });
  assert.deepEqual(parseDate('1914. április 3–10.'), { year: 1914, month: 4, day: 3, raw: '1914. április 3–10.' });
  assert.deepEqual(parseDate('1910. február'), { year: 1910, month: 2, day: null, raw: '1910. február' });
  assert.deepEqual(parseDate('March 15–27, 1913'), { year: 1913, month: 3, day: 15, raw: 'March 15–27, 1913' });
  assert.deepEqual(parseDate('12 June 1912'), { year: 1912, month: 6, day: 12, raw: '12 June 1912' });
  assert.deepEqual(parseDate('February, 1910'), { year: 1910, month: 2, day: null, raw: 'February, 1910' });
  assert.deepEqual(parseDate('1912. VI. 12'), { year: 1912, month: 6, day: 12, raw: '1912. VI. 12' });
  assert.deepEqual(parseDate('1904. XI.'), { year: 1904, month: 11, day: null, raw: '1904. XI.' });
  assert.deepEqual(parseDate('27. 12. 1910'), { year: 1910, month: 12, day: 27, raw: '27. 12. 1910' });
  assert.deepEqual(parseDate('1909-06-12'), { year: 1909, month: 6, day: 12, raw: '1909-06-12' });
  assert.deepEqual(parseDate('1909. 6. 12.'), { year: 1909, month: 6, day: 12, raw: '1909. 6. 12.' });
  assert.deepEqual(parseDate('03. 1907'), { year: 1907, month: 3, day: null, raw: '03. 1907' });
  assert.deepEqual(parseDate('decembrie 1913 – ianuarie 1914'), { year: 1913, month: 12, day: null, raw: 'decembrie 1913 – ianuarie 1914' });
  assert.deepEqual(parseDate('1909'), { year: 1909, month: null, day: null, raw: '1909' });
  assert.deepEqual(parseDate('1909-1910'), { year: 1909, month: null, day: null, raw: '1909-1910' });
  assert.deepEqual(parseDate('n.d.'), { year: null, month: null, day: null, raw: 'n.d.' });
  assert.deepEqual(parseDate(''), { year: null, month: null, day: null, raw: null });
});

test('locality splitting: A / B, parentheses, comma county', () => {
  const a = parseLocality('Belényes (Bihar) / Kerpenyét (Bihar)');
  assert.equal(a.main.name, 'Belényes');
  assert.equal(a.main.county, 'Bihar');
  assert.equal(a.origin.name, 'Kerpenyét');
  assert.equal(a.origin.county, 'Bihar');
  const b = parseLocality('Kibéd (Maros-Torda) / Gyergyóújfalu (Csík)');
  assert.equal(b.origin.county, 'Csík');
  const c = parseLocality('Vaskoh, Bihar vm.');
  assert.equal(c.main.name, 'Vaskoh');
  assert.equal(c.main.county, 'Bihar');
  assert.equal(c.origin, null);
  const d = parseLocality('Budapest (?) / Kibéd');
  assert.equal(d.main.name, 'Budapest');
  assert.equal(d.origin.name, 'Kibéd');
  const e = parseLocality('Jód [Máramaros]');
  assert.equal(e.main.county, 'Máramaros');
  const f = parseLocality('');
  assert.equal(f.main.name, null);
  assert.equal(f.raw, null);
});

test('performer name / age / sex', () => {
  assert.deepEqual(parsePerformer('Floare Muntean (18)'), { name: 'Floare Muntean', age: 18 });
  assert.deepEqual(parsePerformer('Dósa Lidi, 16 é.'), { name: 'Dósa Lidi', age: 16 });
  assert.deepEqual(parsePerformer('Ioan Pop, 45 years'), { name: 'Ioan Pop', age: 45 });
  assert.deepEqual(parsePerformer('Ana Coroiu'), { name: 'Ana Coroiu', age: null });
  assert.deepEqual(parsePerformer(null), { name: null, age: null });
  assert.equal(mapSex('female'), 'f');
  assert.equal(mapSex('nő'), 'f');
  assert.equal(mapSex('férfi'), 'm');
  assert.equal(mapSex('bărbat'), 'm');
  assert.equal(mapSex(''), null);
});

test('normalizeRecord produces a schema-shaped record with nulls for unknowns', async () => {
  const gaz = await Gazetteer.load();
  const rec = normalizeRecord({
    site: 'fmbc', siteRecordId: 'BB057-L155-01', url: 'https://bartok-nepzene.zti.hu/en/browse/record/BB057-L155-01/',
    title: 'Nu te supăra, mireasă', genreRaw: 'wedding song', performanceRaw: 'vocal', performerRaw: 'Floare Muntean (18)',
    ethnicityRaw: 'Romanian', collectorRaw: 'Bartók Béla', dateRaw: '1909. jún.', placeRaw: 'Kerpenyét (Bihar)', referenceCode: 'L 155',
    composition: [{ work: 'Two Romanian Folk Songs', movement: '1.', catalogue: 'BB 57', raw: 'BB 57 | 1.' }]
  }, gaz);
  assert.equal(rec.id, 'fmbc-BB057-L155-01');
  assert.equal(rec.source.siteId, 'L 155');
  assert.match(rec.source.siteName, /HUN-REN/);
  assert.equal(rec.genre, 'nunta');
  assert.equal(rec.performance, 'vocal');
  assert.equal(rec.performer.age, 18);
  assert.equal(rec.performer.sex, null);
  assert.deepEqual(rec.collected, { year: 1909, month: 6, day: null, raw: '1909. jún.' });
  assert.equal(rec.location.village, 'Cărpinet');
  assert.equal(rec.location.villageHistorical, 'Kerpenyét');
  assert.equal(rec.location.county, 'Bihor');
  assert.equal(rec.location.countyHistorical, 'Bihar');
  assert.equal(rec.location.country, 'RO');
  assert.equal(rec.location.region, 'Crișana');
  assert.equal(rec.location.placeId, 'ro/crisana/bihor/carpinet');
  assert.equal(typeof rec.location.lat, 'number');
  assert.equal(rec.music.cadences, null);
  assert.equal(rec.text, null);
  assert.deepEqual(rec.instrument, []);
  assert.equal(rec.composition.length, 1);
});

test('normalizeRecord leaves unresolved places unresolved (never invents)', async () => {
  const gaz = await Gazetteer.load();
  const rec = normalizeRecord({ site: 'gyuj', siteRecordId: '3-1', url: 'https://bartok-gyujtesek.zti.hu/en/browse/3/1', placeRaw: 'Tura (Pest)' }, gaz);
  assert.equal(rec.location.village, null);
  assert.equal(rec.location.villageHistorical, 'Tura');
  assert.equal(rec.location.countyHistorical, 'Pest');
  assert.equal(rec.location.country, null);
  assert.equal(rec.location.lat, null);
  assert.equal(rec.location.resolution, 'unresolved');
  assert.equal(rec.location.placeId, null);
  assert.equal(rec.performance, 'unknown');
  assert.equal(rec.genre, null);
});
