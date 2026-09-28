// Writes the 40-record unit-test fixture (QA-PLAN section 3): src/test/fixtures/songs.small.json
// and places.small.json. Deterministic; no randomness. Re-run after a schema change.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(here, '..', 'src', 'test', 'fixtures')

const SITE_NAME = {
  fmbc: "Folk Music in Bartok's Compositions (HUN-REN BTK ZTI)",
  bsys: 'The Bartok System (HUN-REN BTK ZTI, systems.zti.hu/br)',
  gyuj: 'Bela Bartok, the Ethnomusicologist (HUN-REN BTK ZTI, bartok-gyujtesek.zti.hu)',
  rfm: 'Rumanian Folk Music, vol. IV (Bartok, ed. Suchoff, 1975), Internet Archive scan',
}
const SITE_URL = {
  fmbc: (n) => `https://bartok-nepzene.zti.hu/en/browse/${n}`,
  bsys: (n) => `https://systems.zti.hu/br/en/browse/10/${n}`,
  gyuj: (n) => `https://bartok-gyujtesek.zti.hu/en/browse/21/${n}`,
  rfm: (n) => `https://archive.org/details/rumanianfolkmusi0004blab/page/n${n}`,
}

/** place table: id -> [name, nameHistorical, lat, lng, coordSource] */
const PLACES = {
  ro: ['RO', null, 45.9, 24.9, 'centroid-of-children'],
  'ro/crisana': ['Crișana', null, 46.7, 22.2, 'centroid-of-children'],
  'ro/crisana/bihor': ['Bihor', 'Bihar', 46.9, 22.3, 'centroid-of-children'],
  'ro/crisana/bihor/beius': ['Beiuș', 'Belényes', 46.66, 22.35, 'gazetteer-approx'],
  'ro/crisana/bihor/ineu': ['Ineu', 'Köröskisjenő', 46.43, 21.84, 'site'],
  'ro/crisana/bihor/nomap': ['Tărcaia', 'Tárkány', null, null, null],
  'ro/transylvania': ['Transylvania', null, 46.5, 24.5, 'centroid-of-children'],
  'ro/transylvania/cluj': ['Cluj', 'Kolozs', 46.8, 23.5, 'centroid-of-children'],
  'ro/transylvania/cluj/izvoru-crisului': ['Izvoru Crișului', 'Körösfő', 46.84, 23.1, 'site'],
  'ro/transylvania/harghita': ['Harghita', 'Csík', 46.5, 25.8, 'centroid-of-children'],
  'ro/transylvania/harghita/joseni': ['Joseni', 'Gyergyóalfalu', 46.7, 25.5, 'site'],
  'ro/transylvania/harghita/ciumani': ['Ciumani', 'Gyergyócsomafalva', 46.68, 25.53, 'site'],
  hu: ['HU', null, 47.2, 19.5, 'centroid-of-children'],
  'hu/unresolved': ['unresolved', null, 47.2, 19.5, 'centroid-of-children'],
  'hu/unresolved/ujszasz': ['Újszász', 'Újszász', null, null, null],
}
const typeOf = (id) => ['country', 'region', 'county', 'village'][id.split('/').length - 1]

const base = (id, site, n) => ({
  id,
  source: {
    site,
    siteName: SITE_NAME[site],
    siteId: String(n),
    url: SITE_URL[site](n),
    referenceCode: null,
    volume: null,
    number: null,
    siteRecordId: String(n),
    fetchedAt: null,
    alternates: [],
  },
  title: null,
  incipit: null,
  genre: null,
  genreRaw: null,
  style: null,
  styleRaw: null,
  performance: 'unknown',
  instrument: [],
  performer: { name: null, age: null, sex: null, ethnicity: null },
  collector: null,
  collected: { year: null, month: null, day: null, raw: null },
  location: {
    country: null,
    region: null,
    county: null,
    countyHistorical: null,
    village: null,
    villageHistorical: null,
    lat: null,
    lng: null,
    raw: null,
    placeId: null,
    origin: null,
    resolution: 'unresolved',
  },
  media: { notation: [], audio: [] },
  music: { systemPosition: null, cadences: null, rhythm: null, mode: null, ambitus: null, syllables: null, form: null },
  text: null,
  remarks: null,
  related: [],
  composition: [],
  journey: null,
})

function at(placeId) {
  if (!placeId) return {}
  const parts = placeId.split('/')
  const p = PLACES[placeId]
  const country = parts[0].toUpperCase()
  const region = parts[1] ? PLACES[parts.slice(0, 2).join('/')][0] : null
  const county = parts[2] ? PLACES[parts.slice(0, 3).join('/')] : null
  const village = parts[3] ? p : null
  return {
    country,
    region: region === 'unresolved' ? null : region,
    county: county ? county[0] : null,
    countyHistorical: county ? county[1] : null,
    village: village ? village[0] : null,
    villageHistorical: village ? village[1] : null,
    lat: p[2],
    lng: p[3],
    placeId,
    raw: village ? `${village[1]} (${county ? county[1] : '?'})` : county ? county[1] : null,
    resolution: village ? 'gazetteer' : county ? 'county' : 'unresolved',
  }
}

// [id, site, siteNumber, title, genre, style, performance, instruments, year, placeId, extras]
const rows = [
  ['bsys-1', 'bsys', 1, 'Adio, dragă, adio', 'cantec', 'old style', 'vocal', [], 1909, 'ro/crisana/bihor/beius', { ref: 'A 9', pos: 'A 9', num: 'BR_0009', performer: 'Ion Pop', audio: 1 }],
  ['bsys-2', 'bsys', 2, 'Ardeleana', 'joc', 'instrumental', 'instrumental', ['violin'], 1910, 'ro/crisana/bihor/beius', { ref: 'A 10', pos: 'A 10', num: 'BR_0010', notation: 1 }],
  ['bsys-3', 'bsys', 3, 'Ârsul de la munte', 'doina', 'old style', 'vocal', [], 1911, 'ro/crisana/bihor/beius', { ref: 'A 204', pos: 'A 204', num: 'BR_0204', performer: 'Maria Roșu' }],
  ['bsys-4', 'bsys', 4, 'Bade, bade', 'cantec', 'new style', 'vocal', [], 1912, 'ro/crisana/bihor/ineu', { ref: 'B 1', pos: 'B 1', num: 'BR_1001', performer: 'Ion Pop' }],
  ['bsys-5', 'bsys', 5, 'Șapte văi', 'colinda', 'old style', 'vocal', [], 1912, 'ro/crisana/bihor/ineu', { ref: 'A 11', pos: 'A 11', num: 'BR_0011' }],
  ['bsys-6', 'bsys', 6, 'Sara pe deal', 'cantec', 'new style', 'vocal', [], 1913, 'ro/crisana/bihor/ineu', { ref: 'A 12', pos: 'A 12', num: 'BR_0012', text: 'Sara pe deal buciumul sună cu jale' }],
  ['bsys-7', 'bsys', 7, 'Țara mea', 'cantec', 'mixed style', 'vocal', [], 1913, 'ro/crisana/bihor/ineu', { ref: 'C 5', pos: 'C 5', num: 'BR_2005' }],
  ['bsys-8', 'bsys', 8, 'Sculați, sculați, boieri mari', 'colinda', 'old style', 'vocal', [], 1910, 'ro/crisana/bihor/beius', { ref: 'A 13', pos: 'A 13', num: 'BR_0013', performer: 'Gheorghe Țepeș' }],
  ['bsys-9', 'bsys', 9, 'Cântec 2', 'cantec', 'old style', 'vocal', [], 1914, 'ro/crisana/bihor', { ref: 'A 14', pos: 'A 14', num: 'BR_0014' }],
  ['bsys-10', 'bsys', 10, 'Cântec 10', 'cantec', 'old style', 'vocal', [], 1914, 'ro/crisana/bihor', { ref: 'A 15', pos: 'A 15', num: 'BR_0015' }],
  ['bsys-11', 'bsys', 11, 'Hora lungă', 'doina', null, 'vocal', [], null, 'ro/crisana/bihor/beius', { ref: 'A 16', pos: 'A 16', num: 'BR_0016' }],
  ['bsys-12', 'bsys', 12, null, 'bocet', 'old style', 'vocal', [], 1917, 'ro/crisana/bihor/nomap', { ref: 'A 17', pos: 'A 17', num: 'BR_0017', incipit: 'Dragă mamă' }],
  ['bsys-13', 'bsys', 13, 'Ineu joc', 'joc', 'instrumental', 'instrumental', ['fluier', 'violin'], 1912, 'ro/crisana/bihor/ineu', { ref: 'A 18', pos: 'A 18', num: 'BR_0018' }],
  ['bsys-14', 'bsys', 14, 'Ördög útja', 'other', 'new style', 'vocal', [], 1906, 'ro/transylvania/cluj/izvoru-crisului', { ref: 'B 2', pos: 'B 2', num: 'BR_1002' }],
  ['bsys-15', 'bsys', 15, 'Őszi harmat után', 'cantec', 'new style', 'vocal', [], 1907, 'ro/transylvania/cluj/izvoru-crisului', { ref: 'B 3', pos: 'B 3', num: 'BR_1003', audio: 1 }],
  ['bsys-16', 'bsys', 16, 'Űzött a bánat', 'cantec', 'mixed style', 'vocal', [], 1908, 'ro/transylvania/cluj/izvoru-crisului', { ref: 'C 6', pos: 'C 6', num: 'BR_2006' }],
  ['bsys-17', 'bsys', 17, 'Adio, dragă, adio', 'cantec', 'old style', 'vocal', [], 1910, 'ro/transylvania/cluj/izvoru-crisului', { ref: 'A 19', pos: 'A 19', num: 'BR_0019' }],
  ['bsys-18', 'bsys', 18, 'Segg nóta', 'other', 'mixed style', 'unknown', [], 1908, 'ro/transylvania/cluj', { ref: 'C 1034', pos: 'C 1034', num: 'BR_12010' }],
  ['bsys-19', 'bsys', 19, 'Jaj de szépen', null, 'not classified', 'unknown', [], null, 'ro/transylvania/cluj', { ref: 'D 1', pos: 'D 1', num: 'BR_3001' }],
  ['bsys-20', 'bsys', 20, 'Gyergyói', 'joc', 'instrumental', 'instrumental', ['bagpipe'], 1907, 'ro/transylvania/harghita/joseni', { ref: 'A 20', pos: 'A 20', num: 'BR_0020' }],
  ['bsys-21', 'bsys', 21, 'Este van már', 'cantec', 'old style', 'vocal', [], 1907, 'ro/transylvania/harghita/joseni', { ref: 'A 21', pos: 'A 21', num: 'BR_0021' }],
  ['bsys-22', 'bsys', 22, 'Elindultam', 'cantec', 'new style', 'vocal', [], 1907, 'ro/transylvania/harghita/joseni', { ref: 'B 4', pos: 'B 4', num: 'BR_1004' }],
  ['bsys-23', 'bsys', 23, 'Csomafalvi', 'joc', 'instrumental', 'instrumental', ['violin'], 1914, 'ro/transylvania/harghita/ciumani', { ref: 'A 22', pos: 'A 22', num: 'BR_0022' }],
  ['bsys-24', 'bsys', 24, 'Zöld erdőben', 'cantec', 'mixed style', 'vocal', [], 1914, 'ro/transylvania/harghita/ciumani', { ref: 'C 7', pos: 'C 7', num: 'BR_2007' }],
  ['bsys-25', 'bsys', 25, 'Búza, búza', null, null, 'unknown', [], null, 'ro/transylvania/harghita', { ref: 'A 23', pos: 'A 23', num: 'BR_0023' }],
  ['bsys-26', 'bsys', 26, 'Hej, Dunáról', 'cantec', 'old style', 'vocal', [], 1918, 'hu/unresolved/ujszasz', { ref: 'A 24', pos: 'A 24', num: 'BR_0024' }],
  ['fmbc-1', 'fmbc', 5398, 'Pe loc', 'joc', null, 'instrumental', ['fluier'], 1910, 'ro/crisana/bihor/beius', { ref: 'L 132', num: 'MH_0863b', audio: 1, notation: 1 }],
  ['fmbc-2', 'fmbc', 5399, 'Brâul', 'joc', null, 'instrumental', ['violin'], 1910, 'ro/crisana/bihor/beius', { ref: 'L 133', num: 'MH_0864a' }],
  ['fmbc-3', 'fmbc', 5400, 'Buciumeana', 'joc', null, 'instrumental', [], 1912, 'ro/crisana/bihor/ineu', { ref: 'L 134', num: 'MH_0865a' }],
  ['fmbc-4', 'fmbc', 5401, 'Mărunțel', 'joc', null, 'instrumental', ['fluier'], 1912, 'ro/transylvania/cluj/izvoru-crisului', { ref: 'L 135', num: 'MH_0866b' }],
  ['fmbc-5', 'fmbc', 5402, 'Poarga românească', 'joc', null, 'instrumental', ['violin'], 1912, 'ro/transylvania/cluj/izvoru-crisului', { ref: null, num: 'MH_0867a' }],
  ['gyuj-1', 'gyuj', 612, 'Colo-n jos', 'colinda', 'old style', 'vocal', [], 1913, 'ro/crisana/bihor/beius', { ref: null, pos: 'A 30', num: '21/612' }],
  ['gyuj-2', 'gyuj', 5398, 'Colindă de fereastră', 'colinda', 'old style', 'vocal', [], 1913, 'ro/crisana/bihor/beius', { ref: null, pos: null, num: '21/5398' }],
  ['rfm-1', 'rfm', 94, 'Cce Sânte Mărie', 'colinda', null, 'vocal', [], 1914, 'ro/crisana/bihor/ineu', { ref: 'F. 1174 c)', pos: 'A I.', num: '1a', vol: 'RFM IV' }],
  ['rfm-2', 'rfm', 95, 'Cce Sânte Mărie (variant)', 'colinda', null, 'vocal', [], 1914, 'ro/crisana/bihor/ineu', { ref: 'F. 1174 d)', pos: 'A I.', num: '1b', vol: 'RFM IV' }],
  ['rfm-3', 'rfm', 120, 'Nunta', 'nunta', null, 'vocal', [], 1913, 'ro/crisana/bihor/beius', { ref: 'F. 1200', pos: 'B II.', num: '12', vol: 'RFM IV' }],
  ['rfm-4', 'rfm', 121, 'Nuntă mare', 'nunta', null, 'mixed', ['violin'], 1913, 'ro/crisana/bihor', { ref: 'F. 1201', pos: 'B II.', num: '112', vol: 'RFM IV' }],
  ['bsys-27', 'bsys', 27, 'Zăpada', 'cantec', 'old style', 'vocal', [], 1915, 'ro/crisana/bihor/beius', { ref: 'A 25', pos: 'A 25', num: 'BR_0025', collector: 'Bartók Béla' }],
  ['bsys-28', 'bsys', 28, 'Île de jos', 'cantec', 'old style', 'vocal', [], 1916, 'ro/crisana/bihor/beius', { ref: 'A 26', pos: 'A 26', num: 'BR_0026' }],
  ['bsys-29', 'bsys', 29, null, null, null, 'unknown', [], null, null, { ref: null, pos: null, num: null }],
]

const songs = rows.map(([id, site, n, title, genre, style, perf, instr, year, placeId, x]) => {
  const s = base(id, site, n)
  s.title = title
  s.incipit = x.incipit ?? title
  s.genre = genre
  s.genreRaw = genre
  s.style = style
  s.styleRaw = style
  s.performance = perf
  s.instrument = instr
  s.collected = year ? { year, month: 7, day: null, raw: `${year}. VII.` } : s.collected
  s.location = { ...s.location, ...at(placeId) }
  s.source = { ...s.source, referenceCode: x.ref ?? null, number: x.num ?? null, volume: x.vol ?? null }
  s.source.siteId = x.ref ?? x.pos ?? String(n)
  s.music.systemPosition = x.pos ?? null
  s.performer.name = x.performer ?? null
  s.collector = x.collector ?? (site === 'bsys' ? 'Bartók Béla' : null)
  s.text = x.text ?? null
  if (x.audio) s.media.audio = [{ url: `https://systems.zti.hu/media/audio/${id}.mp3`, type: 'audio/mpeg', caption: null }]
  if (x.notation) s.media.notation = [{ url: `https://systems.zti.hu/media/images/${id}.jpg`, type: 'image/jpeg', caption: null }]
  return s
})

const places = Object.entries(PLACES).map(([id, [name, nameHistorical, lat, lng, coordSource]]) => {
  const parts = id.split('/')
  const under = songs.filter((s) => s.location.placeId === id || (s.location.placeId ?? '').startsWith(id + '/'))
  const years = under.map((s) => s.collected.year).filter((y) => y !== null)
  return {
    id,
    type: typeOf(id),
    name,
    nameHistorical,
    parent: parts.length > 1 ? parts.slice(0, -1).join('/') : null,
    country: parts[0].toUpperCase(),
    region: parts[1] && parts[1] !== 'unresolved' ? PLACES[parts.slice(0, 2).join('/')][0] : null,
    county: parts[2] ? PLACES[parts.slice(0, 3).join('/')][0] : null,
    countyHistorical: parts[2] ? PLACES[parts.slice(0, 3).join('/')][1] : null,
    lat,
    lng,
    coordSource,
    counts: {
      total: under.length,
      byGenre: {},
      byPerformance: {},
      bySite: {},
    },
    years: { min: years.length ? Math.min(...years) : null, max: years.length ? Math.max(...years) : null },
    songIds: typeOf(id) === 'village' ? under.map((s) => s.id) : [],
    confidence: coordSource === 'gazetteer-approx' ? 'low' : coordSource ? 'high' : null,
  }
})

const sortKeys = (v) => {
  if (Array.isArray(v)) return v.map(sortKeys)
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]))
  return v
}

mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'songs.small.json'), JSON.stringify(sortKeys(songs), null, 2) + '\n')
writeFileSync(join(outDir, 'places.small.json'), JSON.stringify(sortKeys(places), null, 2) + '\n')
console.log(`make-fixture: ${songs.length} songs, ${places.length} places`)
