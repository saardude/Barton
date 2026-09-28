import test from 'node:test';
import assert from 'node:assert/strict';
import { Gazetteer, stripQualifiers } from '../src/gazetteer.js';
import { fold } from '../src/util.js';

test('fold is diacritics- and case-insensitive and unifies s/t cedilla and comma', () => {
  assert.equal(fold('Beiuș'), 'beius');
  assert.equal(fold('Beiuş'), 'beius');
  assert.equal(fold('BELÉNYES'), 'belenyes');
  assert.equal(fold('Târgu-Mureş'), 'targu mures');
  assert.equal(fold('Vişeu de Sus'), 'viseu de sus');
});

test('gazetteer lookup by modern, historical and alias names', async () => {
  const g = await Gazetteer.load();
  assert.equal(g.lookup('Beius').entry.name, 'Beiuș');
  assert.equal(g.lookup('Belényes').entry.nameHistorical, 'Belényes');
  assert.equal(g.lookup('belenyes').via, 'historical');
  assert.equal(g.lookup('Kerpenyét (Bihar)').entry.name, 'Cărpinet');
  assert.equal(g.lookup('Jód').entry.name, 'Ieud');
  assert.equal(g.lookup('Dragomérfalva').entry.name, 'Dragomirești');
  assert.equal(g.lookup('Felsővisó').entry.name, 'Vișeu de Sus');
  assert.equal(g.lookup('Cserbel').entry.name, 'Cerbăl');
  assert.equal(g.lookup('Felsőszálláspatak').entry.name, 'Sălașu de Sus');
  assert.equal(g.lookup('Boksánbánya').entry.name, 'Bocșa');
  assert.equal(g.lookup('Szelistye').entry.name, 'Săliște');
  assert.equal(g.lookup('Maroshévíz').entry.name, 'Toplița');
  assert.equal(g.lookup('Nagyszentmiklós').entry.name, 'Sânnicolau Mare');
  assert.equal(g.lookup('Kronstadt').via, 'alias');
  assert.equal(g.lookup('Nowhere'), null);
  assert.equal(g.lookup(''), null);
});

test('county hint disambiguates homonyms (Băița in Bihor vs Hunedoara; Toplița)', async () => {
  const g = await Gazetteer.load();
  const b1 = g.lookup('Băița', { county: 'Bihar' });
  assert.equal(b1.entry.county, 'Bihor');
  assert.equal(b1.ambiguous, false);
  const b2 = g.lookup('Baita', { county: 'Hunyad' });
  assert.equal(b2.entry.county, 'Hunedoara');
  const b3 = g.lookup('Băița');
  assert.equal(b3.ambiguous, true);
  assert.equal(g.lookup('Toplița', { county: 'Maros-Torda' }).entry.county, 'Harghita');
  assert.equal(g.lookup('Toplița', { county: 'Hunedoara' }).entry.county, 'Hunedoara');
  assert.equal(g.lookup('Ineu', { county: 'Csík' }).entry.county, 'Harghita');
});

test('county resolution accepts modern and historical spellings', async () => {
  const g = await Gazetteer.load();
  assert.equal(g.county('Bihar').name, 'Bihor');
  assert.equal(g.county('Bihar vm.').name, 'Bihor');
  assert.equal(g.county('Hunyad county').name, 'Hunedoara');
  assert.equal(g.county('Maramures').name, 'Maramureș');
  assert.equal(g.county('Krassó-Szörény').name, 'Caraș-Severin');
  assert.equal(g.countryOf('Temes'), 'RO');
  assert.equal(g.regionOf('Temes'), 'Banat');
  assert.equal(g.county('Pest'), null);
  assert.equal(stripQualifiers('Vaskoh, Bihar vm.'), 'Vaskoh');
});

test('gazetteer file sanity: every place has a known county and approximate coordinates', async () => {
  const g = await Gazetteer.load();
  assert.ok(g.data.places.length >= 40);
  for (const p of g.data.places) {
    assert.ok(g.county(p.county), `unknown county ${p.county} for ${p.name}`);
    assert.ok(p.lat > 43 && p.lat < 49 && p.lng > 20 && p.lng < 30, `coords out of Romania for ${p.name}`);
    assert.ok(['high', 'medium', 'low'].includes(p.confidence));
  }
  assert.match(g.data._meta.status, /approximate/i);
});
