#!/usr/bin/env node
/**
 * data-gates.mjs - data quality gates for the Australian Folk Songs index (australia/data).
 *
 * Reads songs.json, places.json, facets.json and sources.json, prints a pass/warn/fail report
 * per gate and exits non-zero when a blocking gate fails.
 *
 *   node australia/qa/checks/data-gates.mjs [--dir australia/data] [--strict] [--report out.json]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const strict = args.includes('--strict');
const dir = resolve(flag('--dir') ?? resolve(__dirname, '..', '..', 'data'));
const reportPath = flag('--report');

const AU_BBOX = { latMin: -44.5, latMax: -9.5, lngMin: 112, lngMax: 154.5 };
const MAX_LISTED = 10;

const read = (name) => JSON.parse(readFileSync(resolve(dir, name), 'utf8'));
const songs = read('songs.json');
const places = read('places.json');
const facets = read('facets.json');
const sources = read('sources.json');

const gates = [];
const gate = (id, level, ok, message, offenders = []) => gates.push({ id, level, ok, message, offenders });

// G1 ids unique and well-formed
{
  const seen = new Set();
  const bad = [];
  for (const s of songs) {
    if (!/^afs-\d{1,4}[a-z]?$/.test(s.id) || seen.has(s.id)) bad.push(s.id);
    seen.add(s.id);
  }
  gate('ids', 'fail', bad.length === 0, `${songs.length} records, ids unique and well-formed`, bad);
}
// G2 every record links to folkstream.com
{
  const bad = songs.filter((s) => !/^https:\/\/folkstream\.com\/\d{1,4}[a-z]?\.html$/.test(s.source.url)).map((s) => s.id);
  gate('source-url', 'fail', bad.length === 0, 'every record links to its folkstream.com page', bad);
}
// G3 no HTML in text fields
{
  const bad = [];
  const scan = (v, id) => {
    if (typeof v === 'string' && /<\/?[a-z][^>]*>/i.test(v)) bad.push(id);
    else if (Array.isArray(v)) v.forEach((x) => scan(x, id));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!/url|href/i.test(k)) scan(x, id);
  };
  for (const s of songs) scan({ title: s.title, text: s.text, notes: { text: s.notes.text } }, s.id);
  gate('no-html', 'fail', bad.length === 0, 'no HTML tags in titles, lyrics or notes', [...new Set(bad)]);
}
// G4 lyrics present on almost every record
{
  const bad = songs.filter((s) => s.text.stanzas.length === 0).map((s) => s.id);
  gate('lyrics', 'warn', bad.length <= 5, `${songs.length - bad.length} records with lyrics (${bad.length} without)`, bad);
}
// G5 years plausible
{
  const bad = songs.filter((s) => s.year.value !== null && (s.year.value < 1780 || s.year.value > 2030)).map((s) => s.id);
  const covered = songs.filter((s) => s.year.value !== null).length;
  gate('years', 'fail', bad.length === 0, `years within 1780..2030; ${covered}/${songs.length} dated`, bad);
  gate('years-coverage', 'warn', covered / songs.length >= 0.9, `at least 90% of records dated (${((covered / songs.length) * 100).toFixed(1)}%)`);
}
// G6 coordinates inside Australia (foreign places excepted) and place ids exist
{
  const ids = new Set(places.map((p) => p.id));
  const badBox = [];
  const badId = [];
  for (const s of songs) {
    const l = s.location;
    if (l.placeId && !ids.has(l.placeId)) badId.push(s.id);
    if (l.lat !== null && l.lng !== null && l.placeId && l.placeId.startsWith('au/')) {
      if (l.lat < AU_BBOX.latMin || l.lat > AU_BBOX.latMax || l.lng < AU_BBOX.lngMin || l.lng > AU_BBOX.lngMax) badBox.push(`${s.id} ${l.lat},${l.lng}`);
    }
  }
  gate('place-ids', 'fail', badId.length === 0, 'every placeId exists in places.json', badId);
  gate('bbox', 'fail', badBox.length === 0, 'Australian coordinates inside the Australian bounding box', badBox);
}
// G7 place tree consistent
{
  const byId = new Map(places.map((p) => [p.id, p]));
  const bad = places.filter((p) => p.parent && !byId.has(p.parent)).map((p) => p.id);
  const sum = places.filter((p) => p.type === 'country').reduce((n, p) => n + p.counts.total, 0);
  const located = songs.filter((s) => s.location.placeId).length;
  gate('tree-parents', 'fail', bad.length === 0, 'every place parent exists', bad);
  gate('tree-counts', 'fail', sum === located, `country totals (${sum}) equal located records (${located})`);
}
// G8 newspaper provenance: keys resolve to sources.newspapers; resolved share
{
  const keys = new Set(sources.newspapers.map((n) => n.key));
  const bad = songs.filter((s) => s.provenance.newspaper && !keys.has(s.provenance.newspaper.key)).map((s) => s.id);
  gate('newspaper-keys', 'fail', bad.length === 0, 'every newspaper key is listed in sources.json', bad);
  const withPaper = songs.filter((s) => s.provenance.newspaper).length;
  const withTown = songs.filter((s) => s.location.basis === 'newspaper').length;
  gate('newspaper-resolution', 'warn', withPaper === 0 || withTown / withPaper >= 0.6, `${withTown}/${withPaper} newspaper-sourced records resolved to a town (${withPaper ? ((withTown / withPaper) * 100).toFixed(1) : 0}%)`);
}
// G9 songbook ids exist
{
  const ids = new Set(sources.songbooks.map((b) => b.id));
  const bad = songs.filter((s) => s.provenance.songbooks.some((b) => !ids.has(b))).map((s) => s.id);
  gate('songbook-ids', 'fail', bad.length === 0, 'every songbook id exists in sources.json', bad);
}
// G10 related ids resolve
{
  const ids = new Set(songs.map((s) => s.id));
  const bad = songs.filter((s) => s.related.some((r) => !ids.has(r.id))).map((s) => s.id);
  gate('related-ids', 'fail', bad.length === 0, 'every related id resolves', bad);
}
// G11 media hot-linked from folkstream.com only
{
  const bad = songs.filter((s) => [...s.media.images.map((i) => i.url), ...s.media.midi.map((m) => m.url), ...s.media.audio.map((m) => m.url)].some((u) => !/^https:\/\/folkstream\.com\//.test(u))).map((s) => s.id);
  gate('media-hosts', 'fail', bad.length === 0, 'images, MIDI and MP3 files are on folkstream.com', bad);
}
// G12 facets consistent with records
{
  const ok = facets._meta.songCount === songs.length && Object.values(facets.kind).reduce((a, b) => a + b, 0) === songs.length;
  gate('facets', 'fail', ok, `facets.json counts ${songs.length} records`);
}
// G13 determinism: records sorted by id (numeric)
{
  const ids = songs.map((s) => s.id);
  const sorted = [...ids].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  gate('sorted', 'fail', JSON.stringify(ids) === JSON.stringify(sorted), 'songs.json sorted by id');
}

let failed = false;
for (const g of gates) {
  const status = g.ok ? 'PASS' : g.level === 'fail' || strict ? 'FAIL' : 'WARN';
  if (status === 'FAIL') failed = true;
  console.log(`${status.padEnd(4)}  ${g.id.padEnd(22)} ${g.message}`);
  if (!g.ok && g.offenders.length) console.log(`      ${g.offenders.slice(0, MAX_LISTED).join(', ')}${g.offenders.length > MAX_LISTED ? ` (+${g.offenders.length - MAX_LISTED} more)` : ''}`);
}
if (reportPath) {
  mkdirSync(dirname(resolve(reportPath)), { recursive: true });
  writeFileSync(resolve(reportPath), JSON.stringify({ generatedAt: new Date().toISOString(), gates }, null, 2));
}
if (!existsSync(dir)) failed = true;
process.exit(failed ? 1 : 0);
