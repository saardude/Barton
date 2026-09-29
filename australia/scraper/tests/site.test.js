// Parser tests over the committed fixtures (no network).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';
import site, { htmlToText, toStanzas } from '../src/site.js';
import { PATHS } from '../src/util.js';

const fx = (name) => readFileSync(path.join(PATHS.fixtures, name), 'utf8');

test('discover: every numbered page on songs.html, with the index title and year', () => {
  const { records } = site.discover(load(fx('afs-songs.html')), 'https://folkstream.com/songs.html');
  assert.ok(records.length > 1000, `found ${records.length}`);
  const r500 = records.find((r) => r.url === 'https://folkstream.com/500.html');
  assert.equal(r500.context.pageId, '500');
  assert.equal(r500.context.indexTitle, "James Raeburn's Farewell to Scotland");
  assert.equal(r500.context.indexYear, 1880);
  // a page listed under two titles keeps both
  const r619 = records.find((r) => r.url === 'https://folkstream.com/619.html');
  assert.ok(r619.context.indexTitleAlt.length >= 1);
  // the lettered page is a record too
  assert.ok(records.some((r) => r.context.pageId === '052a'));
});

test('parseRecord: 1994-style page with GIF notation and MIDI', () => {
  const r = site.parseRecord(fx('afs-001.html'), 'https://folkstream.com/001.html', { pageId: '001', indexYear: 1894 });
  assert.equal(r.title, 'A Thousand Mile Away');
  assert.equal(r.year, null);
  assert.equal(r.stanzas.length, 5);
  assert.equal(r.stanzas[0][0], 'Hurrah for the old stock saddle, hurrah for the stockwhip too');
  assert.deepEqual(r.media, { notation: ['https://folkstream.com/001.gif'], midi: ['https://folkstream.com/001.mid'], audio: [] });
  assert.match(r.notesText, /^First published in the Queenslander in 1894/);
  assert.deepEqual(r.warnings, []);
});

test('parseRecord: Trove-era page with a PNG masthead, year in the title and a link', () => {
  const r = site.parseRecord(fx('afs-999.html'), 'https://folkstream.com/999.html', { pageId: '999' });
  assert.equal(r.title, 'A Song of The Surf Club');
  assert.equal(r.year, 1929);
  assert.equal(r.stanzas.length, 8);
  assert.equal(r.media.notation[0], 'https://folkstream.com/999.png');
  assert.equal(r.links[0].href, 'https://trove.nla.gov.au/newspaper/article/102102989');
  assert.equal(r.links[0].text, 'The Kiama Independent, and Shoalhaven Advertiser');
  assert.match(r.notesText, /9 Nov 1929 Page 5/);
});

test('parseRecord: notes split from lyrics at the Notes heading; no HTML in text', () => {
  const r = site.parseRecord(fx('afs-500.html'), 'https://folkstream.com/500.html', { pageId: '500' });
  assert.equal(r.stanzas.length, 6);
  assert.doesNotMatch(r.lyricsText, /<|>/);
  assert.doesNotMatch(r.notesText, /<|>/);
  assert.match(r.notesText, /Russel Ward collected the second and third verses/);
});

test('htmlToText and toStanzas: br = line, p = paragraph, wraps collapse', () => {
  const t = htmlToText('<p>line one\n  wrapped<br>line two</p><p>second</p>');
  assert.equal(t, 'line one wrapped\nline two\n\nsecond');
  assert.deepEqual(toStanzas(t), [['line one wrapped', 'line two'], ['second']]);
});

test('parseSongbooks and parseArticles', () => {
  const books = site.parseSongbooks(fx('afs-songbooks.html'), 'https://folkstream.com/songbooks.html');
  assert.ok(books.length > 150);
  assert.deepEqual(books[0], { year: 1857, yearRaw: '1857', title: "Thatcher's Colonial Songster", author: 'Charles Thatcher', url: 'https://folkstream.com/songbooks.html', link: null });
  const articles = site.parseArticles(fx('afs-reviews.html'), 'https://folkstream.com/reviews/');
  assert.ok(articles.length > 80);
  assert.ok(articles.every((a) => a.title && /^https?:\/\//.test(a.url)));
});
