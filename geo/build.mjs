#!/usr/bin/env node
// Regenerates the web-ready border layers under data/geo/ from the raw downloads under
// geo/raw/ (see docs/GEO-SOURCES.md for where each raw file comes from and geo/README.md
// for how to re-download them).
//
//   node geo/build.mjs            # build all four layers
//   node geo/build.mjs --check    # only verify that the outputs exist and are < 500 KB
//
// Pipeline per layer: mapshaper (reproject, filter, clip, simplify 10% keep-shapes,
// precision 0.001 deg ~ 100 m) -> JSON post-processing here (property mapping, merge of
// layers, deterministic feature order) -> data/geo/<name>.json. Every output is a GeoJSON
// FeatureCollection with a foreign member "meta" (sources, licences, attribution) and per
// feature properties.year, .level, .name, .nameHu, .nameRo (null when not derivable).

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const RAW = join(HERE, 'raw');
const OUT_DIR = join(ROOT, 'data', 'geo');
const TMP = join(HERE, '.build-tmp');
const SIZE_LIMIT = 500 * 1024;
const BBOX = '12,40,33,53'; // lon/lat window: Carpathian basin and neighbours
// 10% keeps the 71 county polygons at ~450 KB before the state outline is added, which
// breaks the 500 KB budget; 7% lands at ~360 KB total and still reads well at zoom 5-9.
const COUNTY_SIMPLIFY = '7%';
const require = createRequire(import.meta.url);
const MAPSHAPER_BIN = require.resolve('mapshaper/bin/mapshaper');

const SOURCES = {
  gista: {
    id: 'gista-hungarorum-1910',
    title: 'GISta Hungarorum (OTKA K 111766): administrative boundaries of the Kingdom of Hungary in 1910',
    url: 'https://www.gistory.hu/g/en/gistory/otka',
    licence: 'CC BY-NC',
    attribution: 'Historical county boundaries (1910): GISta Hungarorum, OTKA K 111766 (gistory.hu), CC BY-NC'
  },
  aourednik: {
    id: 'historical-basemaps',
    title: 'aourednik/historical-basemaps: historical boundaries of world countries',
    url: 'https://github.com/aourednik/historical-basemaps',
    licence: 'GPL-3.0',
    attribution: 'Historical state borders: historical-basemaps by Andre Ourednik and contributors (github.com/aourednik/historical-basemaps), GPL-3.0; work in progress, approximate'
  },
  naturalEarth: {
    id: 'natural-earth-10m',
    title: 'Natural Earth 1:10m Cultural Vectors, Admin 0 Countries and Admin 1 States/Provinces',
    url: 'https://www.naturalearthdata.com/downloads/10m-cultural-vectors/',
    licence: 'Public domain',
    attribution: 'Present-day borders: Made with Natural Earth (naturalearthdata.com), public domain'
  }
};

// Hungarian 1910 county -> Romanian interwar county name, for counties whose territory is
// wholly or partly in present-day Romania. Others get nameRo null.
const COUNTY_RO = {
  'Alsó-Fehér': 'Alba de Jos', Arad: 'Arad', 'Beszterce-Naszód': 'Bistrița-Năsăud', Bihar: 'Bihor',
  Brassó: 'Brașov', Csanád: 'Cenad', Csík: 'Ciuc', Fogaras: 'Făgăraș', Háromszék: 'Trei Scaune',
  Hunyad: 'Hunedoara', 'Kis-Küküllő': 'Târnava Mică', Kolozs: 'Cojocna', 'Krassó-Szörény': 'Caraș-Severin',
  'Maros-Torda': 'Mureș-Turda', Máramaros: 'Maramureș', 'Nagy-Küküllő': 'Târnava Mare', Szatmár: 'Sătmar',
  Szeben: 'Sibiu', Szilágy: 'Sălaj', 'Szolnok-Doboka': 'Solnoc-Dăbâca', Temes: 'Timiș', 'Torda-Aranyos': 'Turda-Arieș',
  Torontál: 'Torontal', Udvarhely: 'Odorhei', Ugocsa: 'Ugocea', Békés: null, Csongrád: null, Bereg: null, Szabolcs: null
};
const COUNTY_IN_ROMANIA_NOW = new Set([
  'Alsó-Fehér', 'Arad', 'Beszterce-Naszód', 'Bihar', 'Brassó', 'Csanád', 'Csík', 'Fogaras', 'Háromszék', 'Hunyad',
  'Kis-Küküllő', 'Kolozs', 'Krassó-Szörény', 'Maros-Torda', 'Máramaros', 'Nagy-Küküllő', 'Szatmár', 'Szeben', 'Szilágy',
  'Szolnok-Doboka', 'Temes', 'Torda-Aranyos', 'Torontál', 'Udvarhely', 'Ugocsa'
]);

// English label -> [nameHu, nameRo] for the historical-basemaps state names in our window.
const STATE_NAMES = {
  'Austria Hungary': ['Osztrák-Magyar Monarchia', 'Austro-Ungaria'],
  'Austro-Hungarian Empire': ['Osztrák-Magyar Monarchia', 'Austro-Ungaria'],
  Romania: ['Románia', 'România'],
  Serbia: ['Szerbia', 'Serbia'],
  Montenegro: ['Montenegró', 'Muntenegru'],
  Albania: ['Albánia', 'Albania'],
  Bulgaria: ['Bulgária', 'Bulgaria'],
  Greece: ['Görögország', 'Grecia'],
  'Ottoman Empire': ['Oszmán Birodalom', 'Imperiul Otoman'],
  'Ottoman Sultanate': ['Oszmán Birodalom', 'Imperiul Otoman'],
  'Russian Empire': ['Orosz Birodalom', 'Imperiul Rus'],
  'German Empire': ['Német Birodalom', 'Imperiul German'],
  Germany: ['Németország', 'Germania'],
  'Kingdom of Italy': ['Olasz Királyság', 'Regatul Italiei'],
  Italy: ['Olaszország', 'Italia'],
  'Bosnia-Herzegovina': ['Bosznia-Hercegovina', 'Bosnia și Herțegovina'],
  Austria: ['Ausztria', 'Austria'],
  Hungary: ['Magyarország', 'Ungaria'],
  Yugoslavia: ['Jugoszlávia', 'Iugoslavia'],
  Czechoslovakia: ['Csehszlovákia', 'Cehoslovacia'],
  Poland: ['Lengyelország', 'Polonia'],
  Ukraine: ['Ukrajna', 'Ucraina'],
  USSR: ['Szovjetunió', 'URSS'],
  'White Russia': ['Fehér-Oroszország', 'Rusia Albă'],
  'South Russia': ['Dél-Oroszország', 'Rusia de Sud'],
  Turkey: ['Törökország', 'Turcia'],
  'United Kingdom of Great Britain and Ireland': ['Egyesült Királyság', 'Regatul Unit']
};
// ISO-3 -> [nameHu, nameRo] for Natural Earth admin-0 (NAME_HU exists in the data, nameRo does not).
const COUNTRY_NOW = {
  ROU: ['Románia', 'România'], HUN: ['Magyarország', 'Ungaria'], SRB: ['Szerbia', 'Serbia'], UKR: ['Ukrajna', 'Ucraina'],
  SVK: ['Szlovákia', 'Slovacia'], MDA: ['Moldova', 'Republica Moldova'], BGR: ['Bulgária', 'Bulgaria'], AUT: ['Ausztria', 'Austria'],
  HRV: ['Horvátország', 'Croația'], POL: ['Lengyelország', 'Polonia'], CZE: ['Csehország', 'Cehia'], SVN: ['Szlovénia', 'Slovenia'],
  BIH: ['Bosznia-Hercegovina', 'Bosnia și Herțegovina'], MNE: ['Montenegró', 'Muntenegru'], MKD: ['Észak-Macedónia', 'Macedonia de Nord']
};
const NE_COUNTRIES = Object.keys(COUNTRY_NOW);
// Romanian county names with diacritics (Natural Earth 'name' is ASCII-folded in places).
const JUDET_RO = {
  Arges: 'Argeș', Bacau: 'Bacău', 'Bistrita-Nasaud': 'Bistrița-Năsăud', Botosani: 'Botoșani', Braila: 'Brăila', Brasov: 'Brașov',
  Bucharest: 'București', Buzau: 'Buzău', Calarasi: 'Călărași', 'Caras-Severin': 'Caraș-Severin', Constanta: 'Constanța',
  'Dâmbovita': 'Dâmbovița', Dambovita: 'Dâmbovița', Galati: 'Galați', Ialomita: 'Ialomița', Iasi: 'Iași', Maramures: 'Maramureș',
  Mehedinti: 'Mehedinți', Mures: 'Mureș', Neamt: 'Neamț', Salaj: 'Sălaj', Timis: 'Timiș', 'Vâlcea': 'Vâlcea', Valcea: 'Vâlcea'
};

const args = process.argv.slice(2);
const CHECK_ONLY = args.includes('--check');

function mapshaper(cmdArgs) {
  execFileSync(process.execPath, [MAPSHAPER_BIN, ...cmdArgs], { stdio: ['ignore', 'ignore', 'inherit'] });
}
function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}
function need(p) {
  if (!existsSync(p)) throw new Error(`missing raw input ${p}; see geo/README.md for the download step`);
  return p;
}
function roundCoords(g) {
  // mapshaper already applied precision; this only guards against float noise
  return g;
}
function feature(geometry, props) {
  return { type: 'Feature', properties: props, geometry: roundCoords(geometry) };
}
function sortFeatures(features) {
  return features.sort((a, b) => {
    const ka = `${a.properties.level}|${a.properties.name || ''}|${a.properties.nameHu || ''}`;
    const kb = `${b.properties.level}|${b.properties.name || ''}|${b.properties.nameHu || ''}`;
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}
function write(name, features, meta) {
  const fc = {
    type: 'FeatureCollection',
    meta: { file: name, generatedBy: 'geo/build.mjs', bbox: BBOX.split(',').map(Number), ...meta },
    features: sortFeatures(features)
  };
  const out = join(OUT_DIR, name);
  writeFileSync(out, JSON.stringify(fc) + '\n');
  const size = statSync(out).size;
  const ok = size <= SIZE_LIMIT;
  console.log(`${ok ? 'ok  ' : 'BIG '} ${name} ${features.length} features ${(size / 1024).toFixed(0)} KB`);
  if (!ok) throw new Error(`${name} is ${size} bytes, over the ${SIZE_LIMIT} byte budget`);
}

// ------------------------------------------------------------------ layers

function historicalStates(year, targetYear, simplify) {
  const src = need(join(RAW, 'historical-basemaps', `world_${year}.geojson`));
  const tmp = join(TMP, `states-${year}.json`);
  // The world files are already coarse (world scale); simplifying them further destroys
  // shapes, so only clip and quantise unless asked otherwise.
  mapshaper(['-i', src, '-clip', `bbox=${BBOX}`, ...(simplify ? ['-simplify', simplify, 'keep-shapes'] : []), '-o', 'format=geojson', 'precision=0.001', tmp]);
  return readJson(tmp).features.filter((f) => f.geometry).map((f) => {
    const name = f.properties.NAME || null;
    const [nameHu, nameRo] = STATE_NAMES[name] || [null, null];
    return feature(f.geometry, {
      year: targetYear, sourceYear: year, level: 'country', name, nameHu, nameRo,
      subjectTo: f.properties.SUBJECTO || null, borderPrecision: f.properties.BORDERPRECISION ?? null,
      source: SOURCES.aourednik.id
    });
  });
}

function build1910() {
  const megye = need(join(RAW, 'gistory', '1_MO-HOR_Shp_EPSG3857', 'MO_Megye.shp'));
  const hrMegye = join(RAW, 'gistory', '1_MO-HOR_Shp_EPSG3857', 'HR_Megye.shp');
  const tmpHu = join(TMP, 'megye-1910.json');
  const tmpHr = join(TMP, 'hr-megye-1910.json');
  // The GISta shapefiles ship without .prj; the folder name and ShpEPSG3857.ini state EPSG:3857.
  mapshaper(['-i', megye, 'encoding=utf8', '-proj', 'from=EPSG:3857', 'crs=wgs84', '-simplify', COUNTY_SIMPLIFY, 'keep-shapes', '-o', 'format=geojson', 'precision=0.001', tmpHu]);
  const features = readJson(tmpHu).features.map((f) => {
    const hu = f.properties.Megye_1910;
    return feature(f.geometry, {
      year: 1910, level: 'county', name: hu, nameHu: hu, nameRo: COUNTY_RO[hu] ?? null,
      country: 'Kingdom of Hungary', countryHu: 'Magyar Királyság', region: f.properties.Nagytaj || null,
      statRegion: f.properties.Stat_regio || null, idMegye: f.properties.IDMegye || null,
      nowInRomania: COUNTY_IN_ROMANIA_NOW.has(hu), source: SOURCES.gista.id
    });
  });
  if (existsSync(hrMegye)) {
    mapshaper(['-i', hrMegye, 'encoding=utf8', '-proj', 'from=EPSG:3857', 'crs=wgs84', '-simplify', COUNTY_SIMPLIFY, 'keep-shapes', '-o', 'format=geojson', 'precision=0.001', tmpHr]);
    for (const f of readJson(tmpHr).features) {
      features.push(feature(f.geometry, {
        year: 1910, level: 'county', name: f.properties.Megyenev_1 || f.properties.Megyenev_H, nameHu: f.properties.Megyenev_H || null,
        nameRo: null, country: 'Kingdom of Croatia-Slavonia (Kingdom of Hungary)', countryHu: 'Horvát-Szlavónország',
        region: 'Horvát-Szlavónország', statRegion: null, idMegye: f.properties.Megye_ID || null, nowInRomania: false, source: SOURCES.gista.id
      }));
    }
  }
  // State outline: historical-basemaps has no 1910 file; 1914 is the nearest and, for this
  // window, identical to 1910 (Bosnia was annexed in 1908, the Balkan Wars changed only
  // Ottoman/Bulgarian/Serbian/Romanian borders south of the Danube, which 1914 shows).
  features.push(...historicalStates(1914, 1910, null));
  write('borders-1910.json', features, {
    year: 1910,
    description: 'Counties (varmegye) of the Kingdom of Hungary including Croatia-Slavonia in 1910, plus state borders of the region (historical-basemaps 1914 used as the 1910 outline).',
    sources: [SOURCES.gista, SOURCES.aourednik],
    notes: [
      'County polygons digitised at 1:400,000 by GISta Hungarorum; expect 0.5-1 km inaccuracy at settlement level. Simplified with mapshaper to ' + COUNTY_SIMPLIFY + ' of vertices (keep-shapes) to stay under 500 KB.',
      'nameRo is the interwar Romanian county name for counties wholly or partly in present-day Romania; null elsewhere.',
      'State borders are world-scale and approximate (historical-basemaps is work in progress).'
    ]
  });
}

function buildStates(year) {
  const features = historicalStates(year, year, null);
  write(`borders-${year}.json`, features, {
    year,
    description: year === 1920
      ? 'State borders after the Treaty of Trianon (4 June 1920): Romania, Hungary, Czechoslovakia, Yugoslavia, Austria, Poland and neighbours.'
      : 'State borders at the outbreak of the First World War: Austria-Hungary, Romania, Serbia, Russian Empire and neighbours.',
    sources: [SOURCES.aourednik],
    notes: ['World-scale, approximate polygons; use for orientation, not for locating a village relative to a border.']
  });
}

function buildNow() {
  const adm0 = need(join(RAW, 'natural-earth', 'ne_10m_admin_0_countries', 'ne_10m_admin_0_countries.shp'));
  const adm1 = need(join(RAW, 'natural-earth', 'ne_10m_admin_1_states_provinces', 'ne_10m_admin_1_states_provinces.shp'));
  const tmp0 = join(TMP, 'adm0-now.json');
  const tmp1 = join(TMP, 'adm1-ro-now.json');
  mapshaper(['-i', adm0, '-filter', `${JSON.stringify(NE_COUNTRIES)}.includes(ADM0_A3)`, '-clip', `bbox=${BBOX}`, '-simplify', '10%', 'keep-shapes', '-o', 'format=geojson', 'precision=0.001', tmp0]);
  mapshaper(['-i', adm1, '-filter', 'adm0_a3=="ROU"', '-simplify', '10%', 'keep-shapes', '-o', 'format=geojson', 'precision=0.001', tmp1]);
  const version0 = readFileSync(join(dirname(adm0), 'ne_10m_admin_0_countries.VERSION.txt'), 'utf8').trim();
  const features = [];
  for (const f of readJson(tmp0).features) {
    if (!f.geometry) continue;
    const iso3 = f.properties.ADM0_A3;
    const [nameHu, nameRo] = COUNTRY_NOW[iso3] || [f.properties.NAME_HU || null, null];
    features.push(feature(f.geometry, {
      year: null, level: 'country', name: f.properties.NAME_EN || f.properties.NAME, nameHu: f.properties.NAME_HU || nameHu, nameRo,
      iso2: f.properties.ISO_A2_EH || f.properties.ISO_A2 || null, iso3, source: SOURCES.naturalEarth.id
    }));
  }
  for (const f of readJson(tmp1).features) {
    if (!f.geometry) continue;
    const p = f.properties;
    const nameRo = JUDET_RO[p.name] || p.name;
    features.push(feature(f.geometry, {
      year: null, level: 'county', name: p.name_en || p.name, nameHu: p.name_hu || null, nameRo,
      iso2: 'RO', iso3: 'ROU', code: p.iso_3166_2 || null, typeEn: p.type_en || null, source: SOURCES.naturalEarth.id
    }));
  }
  write('borders-now.json', features, {
    year: null,
    description: 'Present-day state borders of Romania and its neighbours (Natural Earth admin-0, clipped) plus the 41 Romanian counties and Bucharest (Natural Earth admin-1).',
    sources: [{ ...SOURCES.naturalEarth, version: version0 }],
    notes: ['Country names in Romanian are a built-in table; county names in Romanian carry diacritics from a built-in table where Natural Earth has ASCII.']
  });
}

function check() {
  let ok = true;
  for (const name of ['borders-1910.json', 'borders-1914.json', 'borders-1920.json', 'borders-now.json']) {
    const p = join(OUT_DIR, name);
    if (!existsSync(p)) { console.log(`MISSING ${name}`); ok = false; continue; }
    const size = statSync(p).size;
    const fc = readJson(p);
    const bad = fc.features.filter((f) => !('year' in f.properties) || !('name' in f.properties) || !('nameHu' in f.properties) || !('nameRo' in f.properties));
    console.log(`${size <= SIZE_LIMIT && !bad.length ? 'ok  ' : 'FAIL'} ${name} ${fc.features.length} features ${(size / 1024).toFixed(0)} KB${bad.length ? ` ${bad.length} features missing required properties` : ''}`);
    if (size > SIZE_LIMIT || bad.length) ok = false;
  }
  return ok;
}

function main() {
  if (CHECK_ONLY) {
    process.exit(check() ? 0 : 1);
  }
  mkdirSync(OUT_DIR, { recursive: true });
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
  try {
    build1910();
    buildStates(1914);
    buildStates(1920);
    buildNow();
  } finally {
    rmSync(TMP, { recursive: true, force: true });
  }
  if (!check()) process.exit(1);
}

main();
