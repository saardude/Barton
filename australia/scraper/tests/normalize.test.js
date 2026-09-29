// Normaliser tests: provenance, people, kind, image roles, place ids.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import site from '../src/site.js';
import { classifyImage, cleanNewspaperTitle, extractNewspaper, extractPeople, findDate, normalizeRecord, stateFromHint } from '../src/normalize.js';
import { assemble, loadGazetteer, statePlaceId } from '../src/build.js';
import { PATHS } from '../src/util.js';

const fx = (name) => readFileSync(path.join(PATHS.fixtures, name), 'utf8');
const raw999 = site.parseRecord(fx('afs-999.html'), 'https://folkstream.com/999.html', { pageId: '999' });
const raw001 = site.parseRecord(fx('afs-001.html'), 'https://folkstream.com/001.html', { pageId: '001', indexYear: 1894 });
const raw500 = site.parseRecord(fx('afs-500.html'), 'https://folkstream.com/500.html', { pageId: '500' });

test('findDate handles the site\'s date forms', () => {
  assert.deepEqual(findDate('9 Nov 1929 Page 5').raw, '9 Nov 1929');
  assert.equal(findDate('28th February 1891').day, 28);
  assert.equal(findDate('February 28, 1891').month, 2);
  assert.equal(findDate('in June 1894').day, null);
  assert.equal(findDate('nothing here'), null);
});

test('stateFromHint tolerates typos and city names', () => {
  assert.equal(stateFromHint('Queenland'), 'QLD');
  assert.equal(stateFromHint('South Astralian'), 'SA');
  assert.equal(stateFromHint('Sydney'), 'NSW');
  assert.equal(stateFromHint('Western Australian'), 'WA');
  assert.equal(stateFromHint('Hobart Town'), 'TAS');
  assert.equal(stateFromHint('nothing'), null);
});

test('cleanNewspaperTitle strips dates, pages, connectives, keeps Sunday papers', () => {
  assert.equal(cleanNewspaperTitle('The Warwick Examiner and Times 19 Dec 1894 p. 3'), 'The Warwick Examiner and Times');
  assert.equal(cleanNewspaperTitle('the Wellington Times in'), 'The Wellington Times');
  assert.equal(cleanNewspaperTitle('the Worker which published this poem on on Saturday'), 'The Worker');
  assert.equal(cleanNewspaperTitle('The Sunday Times'), 'The Sunday Times');
  assert.equal(cleanNewspaperTitle('The Worker Saturday'), 'The Worker');
});

test('extractNewspaper reads the Trove link, date, page and state hint', () => {
  const n = extractNewspaper(raw999);
  assert.equal(n.title, 'The Kiama Independent, and Shoalhaven Advertiser');
  assert.equal(n.key, 'kiama-independent-and-shoalhaven-advertiser');
  assert.equal(n.troveArticleId, '102102989');
  assert.deepEqual(n.date, { year: 1929, month: 11, day: 9, raw: '9 Nov 1929' });
  assert.equal(n.page, 5);
  assert.equal(n.stateHint, 'Sydney');
  assert.equal(n.state, 'NSW');
  assert.equal(extractNewspaper(raw001), null);
});

test('extractPeople: written-by author, collectors, singers, signature', () => {
  const p1 = extractPeople(raw001);
  assert.equal(p1.author, 'Charles Flower');
  const p500 = extractPeople(raw500);
  assert.ok(p500.collectors.includes('Edgar Waters'), 'recorded by Edgar Waters');
  const p999 = extractPeople(raw999);
  assert.equal(p999.signature, 'H.S.B., Dunmore');
  assert.equal(p999.author, 'H.S.B.'); // the name before the comma; the place is dropped
  const fake = { notesText: 'This version from the singing of A.L.Lloyd. Collected by John Meredith from Sally Sloane in 1954.', stanzas: [['By the rolling of her dark blue eye', 'x']] };
  const p = extractPeople(fake);
  assert.deepEqual(p.singers, ['A.L.Lloyd', 'Sally Sloane']);
  assert.deepEqual(p.collectors, ['John Meredith']);
  assert.equal(p.author, null); // "By the rolling..." is a lyric, not an attribution
  const by = extractPeople({ notesText: '', stanzas: [['(By the Man from Jugiong.)'], ['a', 'b']] });
  assert.equal(by.author, 'the Man from Jugiong');
});

test('classifyImage: probed sizes decide, else gif = notation and png on a Trove record = masthead', () => {
  assert.equal(classifyImage('https://folkstream.com/999.png', { width: 650, height: 119 }, {}).role, 'masthead');
  assert.equal(classifyImage('https://folkstream.com/001.gif', { width: 510, height: 283 }, null).role, 'notation');
  assert.equal(classifyImage('https://folkstream.com/001.gif', null, null).role, 'notation');
  assert.equal(classifyImage('https://folkstream.com/999.png', null, { title: 'x' }).role, 'masthead');
  assert.equal(classifyImage('https://folkstream.com/500.png', null, null).role, 'notation');
});

test('statePlaceId and the gazetteer with variants', () => {
  assert.equal(statePlaceId('NSW', 'Kiama'), 'au/nsw/kiama');
  assert.equal(statePlaceId('NZ', null), 'nz');
  const gaz = loadGazetteer([
    { key: 'kiama-independent-and-shoalhaven-advertiser', title: 'The Kiama Independent', town: 'Kiama', state: 'NSW', lat: -34.67, lng: 150.85 },
    { key: 'worker', title: 'The Worker', variants: [{ town: 'Brisbane', state: 'QLD', lat: -27.47, lng: 153.03, default: true }, { town: 'Sydney', state: 'NSW', lat: -33.87, lng: 151.21 }] }
  ]);
  const ctx = { songbooks: [], byTitle: new Map(), newspapers: gaz, images: {} };
  const s = normalizeRecord(raw999, ctx);
  assert.equal(s.location.placeId, 'au/nsw/kiama');
  assert.equal(s.location.basis, 'newspaper');
  assert.equal(s.year.value, 1929);
  assert.equal(s.year.from, 'title');
  const worker = { ...raw999, pageId: '2', notesText: 'From the NSW newspaper The Worker 5 May 1891 Page 2.', links: [{ text: 'The Worker', href: 'https://trove.nla.gov.au/newspaper/article/1' }] };
  assert.equal(normalizeRecord(worker, ctx).location.town, 'Sydney');
  const worker2 = { ...worker, notesText: 'From the Queensland newspaper The Worker 5 May 1891 Page 2.' };
  assert.equal(normalizeRecord(worker2, ctx).location.town, 'Brisbane');
  const worker3 = { ...worker, notesText: 'From the newspaper The Worker 5 May 1891 Page 2.' };
  assert.equal(normalizeRecord(worker3, ctx).location.town, 'Brisbane');
});

test('assemble is deterministic and builds places, facets and sources', () => {
  const a = assemble([raw001, raw500, raw999], { songbooksRaw: [{ year: 1905, yearRaw: '1905', title: 'Old Bush Songs', author: 'A.B. Paterson', url: 'https://folkstream.com/songbooks.html', link: null }] });
  const b = assemble([raw999, raw001, raw500], { songbooksRaw: [{ year: 1905, yearRaw: '1905', title: 'Old Bush Songs', author: 'A.B. Paterson', url: 'https://folkstream.com/songbooks.html', link: null }] });
  assert.deepEqual(a, b);
  assert.deepEqual(a.songs.map((s) => s.id), ['afs-001', 'afs-500', 'afs-999']);
  assert.ok(a.songs[0].provenance.songbooks.includes('book-001'), 'Old Bush Songs cited in the notes of 001');
  assert.equal(a.facets._meta.songCount, 3);
  assert.equal(a.sources.newspapers.length, 1);
  assert.equal(a.places.find((p) => p.id === 'au/nsw').counts.total, 1);
});
