#!/usr/bin/env node
// print/parse-rfm.mjs - parse the Internet Archive OCR of "Rumanian Folk Music" vols IV
// and V (print/raw/, see fetch.mjs) into data/rfm.json records of song.schema.json.
//
// Usage: node print/parse-rfm.mjs [--out data/rfm.json] [--report] [--debug 4|5]
//
// Only facts are indexed (melody number, village, county, performer, date, class/genre,
// phonograph number, first line of the sung text) with a link to the exact scanned page;
// no notation and no full text is reproduced.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDjvuXml, readAccessLeaves, readPageNumbers, pageLocator } from './lib/djvu.mjs';
import { align } from './lib/align.mjs';
import { similar, clean, sortKeysDeep, labelKey, letterOrdinal, ordinalLetter, keepMonotonicTokens } from './lib/util.mjs';
import * as v4 from './lib/rfm4.mjs';
import * as v5 from './lib/rfm5.mjs';
import { buildRecord, resolveLocation } from './lib/record.mjs';
import { ITEMS, RAW_DIR } from './fetch.mjs';
import { Gazetteer } from '../scraper/src/gazetteer.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const OCR_CAVEAT = 'Records were parsed from the Internet Archive\'s automatic OCR of the 1975 scans. Diacritics (ă â î ș ț), ligatures and the bold melody numbers are frequently misread; village, performer and date are taken verbatim from the OCRed data line (rawFields.header) and the melody number was recovered by aligning the data lines with the volume\'s own text references (see rawFields.numberSource). Check against the linked page before citing.';

function parseArgs(argv) {
  const a = { out: path.join(REPO, 'data', 'rfm.json'), debug: null, report: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') a.out = path.resolve(argv[++i]);
    else if (argv[i] === '--debug') a.debug = parseInt(argv[++i], 10);
    else if (argv[i] === '--report') a.report = true;
  }
  return a;
}

async function loadGazetteer() {
  const base = JSON.parse(await fs.readFile(path.join(REPO, 'data', 'gazetteer.json'), 'utf8'));
  let extra = { places: [] };
  try { extra = JSON.parse(await fs.readFile(path.join(HERE, 'places-rfm.json'), 'utf8')); } catch { /* optional */ }
  const places = [...(base.places || []), ...(extra.places || []).map((p) => ({ ...p, placeSource: 'print/places-rfm.json' }))];
  return { gaz: new Gazetteer({ ...base, places }), extraCount: (extra.places || []).length };
}

async function loadItem(item) {
  const id = item.id;
  const pages = await readDjvuXml(path.join(RAW_DIR, `${id}_djvu.xml`));
  const leaves = await readAccessLeaves(path.join(RAW_DIR, `${id}_scandata.xml`));
  const pageNumbers = await readPageNumbers(path.join(RAW_DIR, `${id}_page_numbers.json`));
  const text = await fs.readFile(path.join(RAW_DIR, `${id}_djvu.txt`), 'utf8');
  let fetchedAt = null;
  try { fetchedAt = (await fs.stat(path.join(RAW_DIR, `${id}_djvu.xml`))).mtime.toISOString().replace(/\.\d{3}Z$/, 'Z'); } catch { /* ignore */ }
  return { item, pages, text, locate: pageLocator(id, pages.length, leaves, pageNumbers), fetchedAt };
}

/**
 * Score used by the alignment of labels (from the volume's own references) with OCR data
 * lines. weights: {villageMatch, villageMismatch, phantom}.
 */
function makeScore(w) {
  return (label, entry) => {
    let s = 0;
    if (label.village && entry.village) s += similar(label.village, entry.village) ? w.villageMatch : w.villageMismatch;
    else s += 0.3;
    if (entry.numberToken) {
      if (entry.numberToken.label === label.label) s += 5;
      else if (entry.numberToken.number === label.number) s += 0.5;
      else s -= 3;
    }
    if (label.phantom) s += w.phantom;
    return s;
  };
}

/**
 * Add "phantom" variant labels after the last known variant of every number, so that a
 * data line the references never mention (a variant without a text of its own) can be
 * taken as N-(x+1) at a small cost instead of pushing every later label out of step.
 */
function withPhantoms(labels, count) {
  const out = [];
  for (let i = 0; i < labels.length; i++) {
    const l = labels[i];
    out.push(l);
    const next = labels[i + 1];
    if (!next || next.number !== l.number) {
      let k = letterOrdinal(l.letter);
      const base = l.letter ? k : 1; // "12" followed by phantoms means 12 was really 12a
      for (let p = 0; p < count; p++) {
        const ord = (l.letter ? k : base) + p + 1;
        out.push({ label: `${l.number}${ordinalLetter(ord)}`, number: l.number, letter: ordinalLetter(ord), village: null, evidence: 'phantom', phantom: true, bareParent: !l.letter });
      }
    }
  }
  return out;
}

function assignLabels(labels, entries, stats, opts) {
  const w = { villageMatch: 3, villageMismatch: -3, phantom: -1.6, phantoms: 3, ...opts };
  const all = withPhantoms(labels, w.phantoms);
  const { pairs } = align(all, entries, makeScore(w), { label: (l) => (l.phantom ? 0 : -1.2), entry: -4 });
  const out = [];
  let missing = 0;
  let unaligned = 0;
  const usedPhantomParent = new Set();
  for (const p of pairs) {
    if (p.label !== null && p.entry !== null) {
      const L = all[p.label];
      const E = entries[p.entry];
      const tokenAgrees = E.numberToken && E.numberToken.label === L.label;
      const villageAgrees = L.village && E.village ? similar(L.village, E.village) : null;
      let source = 'aligned';
      let confidence = 'medium';
      if (L.phantom) { source = 'inferred-sequence'; confidence = tokenAgrees ? 'medium' : 'low'; if (L.bareParent) usedPhantomParent.add(L.number); }
      else if (tokenAgrees && villageAgrees !== false) { source = 'ocr+aligned'; confidence = 'high'; }
      else if (tokenAgrees) { source = 'ocr'; confidence = 'medium'; }
      else if (villageAgrees === true) { source = 'aligned-village'; confidence = 'medium'; }
      else if (villageAgrees === false) { source = 'aligned-conflict'; confidence = 'low'; }
      else { source = 'aligned-sequence'; confidence = 'low'; }
      out.push({ ...E, label: L.label, labelNumber: L.number, labelVillage: L.village, numberSource: source, numberConfidence: confidence });
    } else if (p.label !== null) {
      if (!all[p.label].phantom) { missing++; stats.missingLabels.push(all[p.label].label); }
    } else {
      unaligned++;
      const E = entries[p.entry];
      out.push({ ...E, label: null, numberSource: 'unaligned', numberConfidence: 'none' });
    }
  }
  // a bare "12" whose phantoms 12b, 12c were used was really 12a
  for (const e of out) {
    if (e.label && /^\d+$/.test(e.label) && usedPhantomParent.has(parseInt(e.label, 10))) {
      e.label = `${e.label}a`;
      e.numberSource += '; relabelled to a) because further variants follow';
    }
  }
  // phantoms are re-lettered contiguously after the last real variant of their number
  const lastReal = new Map();
  for (const e of out) if (e.label && e.numberSource !== 'inferred-sequence') lastReal.set(e.labelNumber, Math.max(lastReal.get(e.labelNumber) || 0, letterOrdinal(parseSort(e.label).letter)));
  const nextOrd = new Map();
  for (const e of out) {
    if (!e.label || e.numberSource !== 'inferred-sequence') continue;
    const k = (nextOrd.get(e.labelNumber) ?? lastReal.get(e.labelNumber) ?? 0) + 1;
    nextOrd.set(e.labelNumber, k);
    e.label = `${e.labelNumber}${ordinalLetter(k)}`;
  }
  stats.missing = missing;
  stats.unaligned = unaligned;
  return out;
}

/**
 * Entries the alignment could not label. A run of such entries that sits after label N-x
 * and before the next number most likely continues N's variant sequence (the volume's own
 * references only name the variants that carry a text), so they get N-(x+1), N-(x+2) ...
 * with low confidence; anything else gets a provisional "<prev>-x<k>" id.
 */
function fillUnaligned(entries) {
  const used = new Set(entries.filter((e) => e.label).map((e) => e.label));
  let i = 0;
  while (i < entries.length) {
    if (entries[i].label) { i++; continue; }
    let j = i;
    while (j < entries.length && !entries[j].label) j++;
    const run = entries.slice(i, j);
    const prev = i > 0 ? entries[i - 1] : null;
    const next = j < entries.length ? entries[j] : null;
    const pl = prev ? parseSort(prev.label) : null;
    const nl = next ? parseSort(next.label) : null;
    let done = false;
    if (pl && pl.number > 0 && (!nl || nl.number > pl.number)) {
      // continue prev's variant letters; a bare number becomes "Na" first
      const proposed = [];
      let k = letterOrdinal(pl.letter);
      if (!pl.letter) { proposed.push({ e: prev, label: `${pl.number}a` }); k = 1; }
      for (const e of run) proposed.push({ e, label: `${pl.number}${ordinalLetter(++k)}` });
      if (proposed.every((x) => !used.has(x.label) || x.e === prev)) {
        for (const x of proposed) {
          if (x.e === prev) { used.delete(prev.label); }
          x.e.label = x.label;
          x.e.labelNumber = pl.number;
          x.e.numberSource = x.e === prev ? `${x.e.numberSource}; relabelled ${pl.number} -> ${x.label} because further variants follow` : 'inferred-sequence';
          if (x.e !== prev) x.e.numberConfidence = 'low';
          used.add(x.label);
        }
        done = true;
      }
    } else if (pl && nl && nl.number === pl.number) {
      const gap = letterOrdinal(nl.letter) - letterOrdinal(pl.letter) - 1;
      if (gap === run.length) {
        run.forEach((e, idx) => { e.label = `${pl.number}${ordinalLetter(letterOrdinal(pl.letter) + idx + 1)}`; e.labelNumber = pl.number; e.numberSource = 'inferred-sequence'; e.numberConfidence = 'low'; used.add(e.label); });
        done = true;
      }
    }
    if (!done) {
      for (const e of run) {
        const base = prev ? prev.label : (next ? next.label : '0');
        let k = 1;
        let label = `${base}-x${k}`;
        while (used.has(label)) label = `${base}-x${++k}`;
        e.label = label;
        e.labelNumber = prev ? prev.labelNumber : (next ? next.labelNumber : 0);
        e.provisional = true;
        e.numberSource = 'unaligned';
        e.numberConfidence = 'none';
        used.add(label);
      }
    }
    i = j;
  }
}

function summariseConfidence(e, volumeNote) {
  const bits = [];
  bits.push(`melody number ${e.numberSource} (${e.numberConfidence})`);
  if (e.numberToken) bits.push(`number token as OCRed: "${e.numberToken.raw}"`);
  if (e.numberTokenRejected) bits.push(`a number-like token "${e.numberTokenRejected.raw}" above this melody was rejected as out of sequence or too far up the page`);
  if (e.villageOcr) bits.push(`village as OCRed: "${e.villageOcr}"`);
  if (e.labelVillage) bits.push(`village for this number in the volume's own references: ${e.labelVillage}`);
  if (typeof e.lineConf === 'number') bits.push(`OCR word confidence of the data line: ${e.lineConf}`);
  if (e.dated === false) bits.push('date not readable on the OCRed data line');
  if (!e.incipit) bits.push('incipit not recovered');
  if (volumeNote) bits.push(volumeNote);
  return bits.join('; ');
}

async function parseVolume4(loaded, gaz, stats) {
  const { item, pages, text, locate, fetchedAt } = loaded;
  const range = v4.ranges(pages);
  if (range.music === null || range.notes === null) throw new Error(`vol 4: ranges not found (${JSON.stringify(range)})`);
  const musicPages = pages.slice(range.music, range.notes);
  const notesPages = pages.slice(range.notes, range.partTwo || range.notes + 12);
  const entries = v4.extractEntries(musicPages);
  keepMonotonicTokens(entries);
  const partTwoStart = text.indexOf('Texts and Translations');
  const labels = v4.extractLabels({ text: text.slice(partTwoStart > 0 ? partTwoStart : 0), entries, notesPages });
  stats.vol4 = { labels: labels.length, labelsWithVillage: labels.filter((l) => l.village).length, entries: entries.length, musicPages: [range.music, range.notes - 1], missingLabels: [] };
  const assigned = assignLabels(labels, entries, stats.vol4, { phantoms: 2 });
  fillUnaligned(assigned);
  const records = [];
  for (const e of assigned) {
    const page = { index: e.page, ...locate(e.page) };
    const location = resolveLocation(gaz, { village: e.village, countyHistorical: e.countyHistorical, countyPrinted: e.countyPrinted, raw: `${e.village} (${e.countyPrinted})` });
    const g = v4.genreFor();
    const remarks = [];
    if (e.rest && /Cf\.|cf\.|Var|var\./.test(e.rest)) remarks.push(clean(e.rest));
    if (e.numberToken?.star) remarks.push('Asterisk after the melody number: see Notes to the Melodies.');
    const rec = buildRecord({
      volume: 4, roman: 'IV', itemId: item.id, fetchedAt, label: e.label, page,
      referenceCode: e.referenceCode, incipit: e.incipit, performerRaw: e.performerRaw,
      genre: g.genre, genreRaw: e.classHeading ? `Colinda, class ${e.classHeading}` : 'Colinda', performance: g.performance, instrument: g.instrument,
      collected: { year: e.year, month: e.month, raw: e.dated ? `${e.monthRaw ? `${e.monthRaw}. ` : ''}${e.year}` : null },
      location, systemPosition: e.classHeading, styleRaw: e.classHeading ? `${e.classHeading} (${v4.CLASS_NOTE})` : null,
      remarks: remarks.length ? remarks.join(' ') : null,
      rawFields: {
        header: e.raw,
        recordRef: e.referenceRaw,
        villagePrinted: e.village,
        countyPrinted: e.countyPrinted,
        countyOcr: e.countyRaw,
        performer: e.performerRaw,
        date: e.dated ? `${e.monthRaw || ''} ${e.year}`.trim() : null,
        classHeading: e.classHeading,
        numberToken: e.numberToken ? e.numberToken.raw : null,
        numberTokenRejected: e.numberTokenRejected ? e.numberTokenRejected.raw : null,
        numberSource: e.numberSource,
        textNumber: e.textNumber || null,
        villageOcr: e.villageOcr || null,
        incipitOcr: e.incipitRaw,
        printedPage: page.printedPage || e.printedPageOcr || null,
        leaf: String(page.leafNum),
        ocrConfidence: summariseConfidence(e, e.rescued ? 'county not readable on this line; village recognised from other data lines of the volume' : null),
        _provisional: e.provisional ? 'melody number could not be aligned; provisional id' : null
      }
    });
    records.push(rec);
  }
  return { records, entries: assigned, labels };
}

async function parseVolume5(loaded, gaz, stats) {
  const { item, pages, locate, fetchedAt } = loaded;
  const r = v5.ranges(pages);
  if (r.music === null || r.notes === null || r.texts === null) throw new Error(`vol 5: ranges not found (${JSON.stringify(r)})`);
  const musicPages = pages.slice(r.music, r.notes);
  const notesPages = pages.slice(r.notes, r.texts);
  const textPages = pages.slice(r.texts, r.end || pages.length);
  const entries = v5.extractEntries(musicPages);
  keepMonotonicTokens(entries);
  const labels = v5.extractLabels({ entries, notesPages, textPages });
  stats.vol5 = { labels: labels.length, labelsWithVillage: labels.filter((l) => l.village).length, entries: entries.length, musicPages: [r.music, r.notes - 1], missingLabels: [] };
  const assigned = assignLabels(labels, entries, stats.vol5, { phantoms: 4, villageMatch: 1.5, villageMismatch: -1 });
  fillUnaligned(assigned);
  const records = [];
  for (const e of assigned) {
    const page = { index: e.page, ...locate(e.page) };
    const cls = v5.classFor(e.labelNumber || 0);
    const location = resolveLocation(gaz, { village: e.village, villageModernHint: e.villageModern, countyHistorical: v5.VOLUME.countyHistorical, countyPrinted: v5.VOLUME.countyPrinted, raw: `${e.villageRaw || (e.village ? `[${e.village}]` : '[village not readable]')} (Maramureș)` });
    const remarks = [];
    if (e.rest && /Cf\.|cf\.|Var|var\./.test(e.rest)) remarks.push(clean(e.rest));
    if (e.numberToken?.star) remarks.push('Asterisk after the melody number: see Notes to the Melodies.');
    const instrument = cls && cls.performance === 'instrumental' ? v5.instrumentsFor(e.labelNumber, e.performerRaw) : [];
    const rec = buildRecord({
      volume: 5, roman: 'V', itemId: item.id, fetchedAt, label: e.label, page,
      referenceCode: e.referenceCode, incipit: e.incipit, performerRaw: e.performerRaw,
      genre: cls ? cls.genre : null, genreRaw: cls ? `${cls.name}${e.classHeading ? `; printed heading ${e.classHeading}` : ''}` : (e.classHeading || null),
      performance: cls ? cls.performance : 'unknown', instrument,
      collected: v5.VOLUME.collected,
      location, systemPosition: cls ? cls.code : null, styleRaw: e.classHeading || (cls ? cls.name : null),
      remarks: remarks.length ? remarks.join(' ') : null,
      rawFields: {
        header: e.raw,
        recordRef: e.referenceRaw,
        villagePrinted: e.villageRaw,
        countyPrinted: 'Maramureș (volume title; not printed on the melody)',
        performer: e.performerRaw,
        date: null,
        classHeading: e.classHeading,
        classFromIndex: cls ? cls.name : null,
        numberToken: e.numberToken ? e.numberToken.raw : null,
        numberTokenRejected: e.numberTokenRejected ? e.numberTokenRejected.raw : null,
        numberSource: e.numberSource,
        incipitOcr: e.incipitRaw,
        printedPage: page.printedPage || e.printedPageOcr || null,
        leaf: String(page.leafNum),
        ocrConfidence: summariseConfidence(e, `date taken from the volume introduction (March 15-27, 1913), not from the melody${e.villageInferred ? `; village ${e.villageInferred}` : ''}`),
        _provisional: e.provisional ? 'melody number could not be aligned; provisional id' : null
      }
    });
    records.push(rec);
  }
  return { records, entries: assigned, labels };
}

function dedupeIds(records) {
  const seen = new Map();
  for (const r of records) {
    if (!seen.has(r.id)) { seen.set(r.id, 1); continue; }
    const n = seen.get(r.id) + 1;
    seen.set(r.id, n);
    r.id = `${r.id}-dup${n}`;
    r.source.siteId = `${r.source.siteId} (duplicate ${n})`;
    r.source.number = `${r.source.number}-dup${n}`;
    r.rawFields._duplicate = 'same melody number assigned twice by the alignment; check the page';
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { gaz, extraCount } = await loadGazetteer();
  const stats = {};
  const all = [];
  const perVolume = {};
  for (const item of ITEMS) {
    const loaded = await loadItem(item);
    const res = item.volume === 4 ? await parseVolume4(loaded, gaz, stats) : await parseVolume5(loaded, gaz, stats);
    perVolume[item.volume] = res;
    all.push(...res.records);
    if (args.debug === item.volume) {
      for (const e of res.entries) console.log(`${e.label}\t${e.numberSource}\t${e.numberToken ? e.numberToken.raw : '-'}\t${e.village}\t${e.labelVillage || '-'}\tp${e.page}\t${e.raw}`);
    }
  }
  all.sort((a, b) => {
    const va = a.source.volume === 'IV' ? 4 : 5;
    const vb = b.source.volume === 'IV' ? 4 : 5;
    if (va !== vb) return va - vb;
    const ka = labelKey(parseSort(a.source.number));
    const kb = labelKey(parseSort(b.source.number));
    return ka - kb || a.id.localeCompare(b.id);
  });
  dedupeIds(all);
  const unresolved = all.filter((r) => !r.location.county);
  const unresolvedVillages = new Map();
  for (const r of all) if (r.location.resolution !== 'gazetteer') {
    const k = `${r.location.villageHistorical} (${r.location.countyHistorical})`;
    unresolvedVillages.set(k, (unresolvedVillages.get(k) || 0) + 1);
  }
  const meta = {
    title: 'Bartók, Rumanian Folk Music (ed. Benjamin Suchoff, Martinus Nijhoff, The Hague, 1967-1975): melody index of the open Internet Archive scans',
    generatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    generator: 'print/parse-rfm.mjs',
    items: {
      'rumanianfolkmusi0004blab': 'Volume IV, Carols and Christmas Songs (Colinde), 1975; open item with OCR',
      'rumanianfolkmusi0005blab': 'Volume V, Maramureș County, 1975; open item with OCR'
    },
    notAvailable: 'Volumes I (Instrumental Melodies, rumanianfolkmusi0001bela) and II (Vocal Melodies, rumanianfolkmusi0002bela) are access-restricted lending items on the Internet Archive and are not available as open text; nothing was downloaded from them. Volume III (Texts) has no Internet Archive item at all.',
    copyright: 'The volumes are in copyright (Bartók estate / the editor; Martinus Nijhoff 1975). Only catalogue facts are indexed here (melody number, village, county, performer, date, class, phonograph number and the first line of the text as an identifier); each record links to the exact scanned page. No notation and no song text is reproduced.',
    ocrCaveat: OCR_CAVEAT,
    counts: {
      total: all.length,
      vol4: { printed: v4.VOLUME.printedTotal, printedNote: v4.VOLUME.printedTotalNote, labelsFound: stats.vol4.labels, dataLinesFound: stats.vol4.entries, parsed: perVolume[4].records.length, labelsWithoutDataLine: stats.vol4.missing, dataLinesWithoutLabel: stats.vol4.unaligned },
      vol5: { printed: v5.VOLUME.printedTotal, printedNote: v5.VOLUME.printedTotalNote, labelsFound: stats.vol5.labels, dataLinesFound: stats.vol5.entries, parsed: perVolume[5].records.length, labelsWithoutDataLine: stats.vol5.missing, dataLinesWithoutLabel: stats.vol5.unaligned },
      numberConfidence: countBy(all, (r) => (r.rawFields.ocrConfidence.match(/\((high|medium|low|none)\)/) || [])[1] || 'unknown'),
      locationResolution: countBy(all, (r) => r.location.resolution),
      unresolvedCounty: unresolved.length,
      gazetteerSupplementPlaces: extraCount
    },
    missingLabels: { vol4: stats.vol4.missingLabels, vol5: stats.vol5.missingLabels },
    unresolvedVillages: Object.fromEntries([...unresolvedVillages].sort((a, b) => b[1] - a[1]))
  };
  const doc = { _meta: meta, records: all };
  await fs.mkdir(path.dirname(args.out), { recursive: true });
  await fs.writeFile(args.out, JSON.stringify(sortKeysDeep(doc), null, 2) + '\n', 'utf8');
  console.log(`wrote ${path.relative(process.cwd(), args.out)}: ${all.length} records`);
  console.log(`vol 4: printed ${v4.VOLUME.printedTotal}, labels ${stats.vol4.labels} (${stats.vol4.labelsWithVillage} with village), data lines ${stats.vol4.entries}, parsed ${perVolume[4].records.length}, labels without data line ${stats.vol4.missing}, data lines without label ${stats.vol4.unaligned}`);
  console.log(`vol 5: printed ${v5.VOLUME.printedTotal}, labels ${stats.vol5.labels} (${stats.vol5.labelsWithVillage} with village), data lines ${stats.vol5.entries}, parsed ${perVolume[5].records.length}, labels without data line ${stats.vol5.missing}, data lines without label ${stats.vol5.unaligned}`);
  console.log(`number confidence: ${JSON.stringify(meta.counts.numberConfidence)}`);
  console.log(`location resolution: ${JSON.stringify(meta.counts.locationResolution)}; records without modern county: ${unresolved.length}`);
  if (args.report) {
    console.log('unresolved villages:');
    for (const [k, n] of Object.entries(meta.unresolvedVillages)) console.log(`  ${n}\t${k}`);
  }
}

function countBy(arr, fn) {
  const m = {};
  for (const x of arr) { const k = fn(x); m[k] = (m[k] || 0) + 1; }
  return m;
}

function parseSort(number) {
  const m = String(number).match(/^(\d+)([a-z]{0,2})/);
  return m ? { number: parseInt(m[1], 10), letter: m[2] } : { number: 0, letter: '' };
}

main().catch((e) => { console.error(e); process.exit(1); });
