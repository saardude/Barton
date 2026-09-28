// Turn a parsed melody entry into a record of data/schema/song.schema.json.

import { clean, fold, similar } from './util.mjs';

const MALE = /^(ion|ioan|iuon|petru|pavel|vasile|gheorghe|george|gligor|grigore|dumitru|toader|todor|teodor|nicolae|niculae|simion|mihai|mihail|iosif|iacob|ilie|andrei|alexandru|avram|moise|lazar|lazăr|achim|stefan|ștefan|ștefan|stefan|luca|pascu|petre|ianos|ianoș|onisim|isaia|ilisie|ilisia|aron|filip|tanase|tănase|costan|constantin|zaharie|maxim|sandu|nistor|marian|florea|iancu|ionut|savu|matei|traian|anton|iosiv|iov|iovu|ignat|gherasim|solomon|samuil|samoil|david|adam|sofron|pintea|dănilă|danila|mitru|onu|nutu|nuțu|joachim|ioachim|lupu|ursu|crăciun|craciun|indrei|indrie|nicoara|nicoară|precup|gavril|gavrila|gavrilă)$/;
const FEMALE = /^(maria|marie|mărie|ana|anuta|anuța|anica|ileana|ilana|erina|irina|ioana|joana|sofia|lina|susana|suzana|letitia|letiția|floare|florica|rafila|paraschiva|saveta|veronica|mariuta|măriuța|maricuta|maricuța|elena|dochia|docia|docea|nastasia|nastasie|todora|teodora|catrina|cătălina|ludovica|ludovina|marta|persida|salvina|silvia|rozalia|rozalie|sava|iuliana|iulia|reghina|regina|zamfira|firuta|firuța|lucretia|lucreția|domnica|eva|rusanda|ruxanda|iula|julia|iuliana|tita|ana|rozina|ravica|raveca|mărioara|marioara|vironica|onita|onița|palagia|pelaghia|todosia|ilinca|ileana|tresia|tereza|treja|nuța|doica|doicu)$/;

/** Performer string -> {name, age, sex, ethnicity, ageRaw, count}. */
export function parsePerformer(raw) {
  const out = { name: null, age: null, sex: null, ethnicity: 'Romanian', ageRaw: null, count: null };
  const t = clean(raw);
  if (!t) return out;
  const ages = [...t.matchAll(/\(\s*(?:ca\.?\s*)?(\d{1,2})(?:\s*[-–,;]\s*(?:ca\.?\s*)?\d{1,2})*\s*\)/g)];
  if (ages.length) {
    out.ageRaw = ages.map((a) => a[0]).join(' ');
    out.age = parseInt(ages[0][1], 10);
    if (out.age > 120) out.age = null;
  }
  let name = t.replace(/\(\s*[^()]*\)/g, ' ').replace(/[,;.\s]+$/, '').replace(/\s+/g, ' ').trim();
  name = name.replace(/^[,;.\s]+/, '');
  out.name = name || null;
  const f = fold(name);
  if (/\b(tigan|tiganca|tigance|tigani|tigan batran|lautar|lautari)\b/.test(f)) out.ethnicity = 'Roma (printed: țigan)';
  const persons = name.split(/\s*(?:,|;|\bsi\b|\bși\b|\b\$i\b|\bsi\b)\s*/i).filter(Boolean);
  const sexes = new Set();
  for (const p of persons) {
    const pf = fold(p);
    if (/\b(un|doi|2|trei|3|patru)\b.*\b(om|oameni|fecior|feciori|barbat|barbati|tigan|tigani|baiat|baieti|copil|copii|batran|batrani|june|juni)\b|^(fecior|feciori|om|oameni|barbat|barbati|tigan|tigani|baiat|baieti|batran|batrani|june|juni|dascal|preot|cantor|diac|popa|invatator)\b/.test(pf)) { sexes.add('m'); continue; }
    if (/\b(o|doua|2|trei|3|patru)\b.*\b(muiere|muieri|fata|fete|femeie|femei|tiganca|tigance|fetita|baba|babe|nevasta|neveste)\b|^(muiere|muieri|fata|fete|femeie|femei|tiganca|tigance|fetita|fetite|baba|babe|nevasta|neveste)\b/.test(pf)) { sexes.add('f'); continue; }
    const first = pf.split(' ')[0];
    if (MALE.test(first)) sexes.add('m');
    else if (FEMALE.test(first)) sexes.add('f');
    else if (/\bbatrana\b|\btanara\b|\bfata\b/.test(pf)) sexes.add('f');
    else if (/\bbatran\b|\btanar\b/.test(pf)) sexes.add('m');
  }
  if (sexes.size === 1) out.sex = [...sexes][0];
  out.count = persons.length > 1 ? persons.length : null;
  return out;
}

/**
 * Resolve a printed village + historical county through the gazetteer (data/gazetteer.json
 * plus print/places-rfm.json). Returns the schema location object.
 */
export function resolveLocation(gaz, { village, villageModernHint, countyHistorical, countyPrinted, raw }) {
  const loc = {
    country: null, region: null, county: null, countyHistorical: countyHistorical || null,
    village: null, villageHistorical: village || null, lat: null, lng: null,
    raw: raw || null, placeId: null, origin: null, resolution: 'unresolved'
  };
  const hist = countyHistorical ? gaz.historicalCounty(countyHistorical) : null;
  const tryNames = [villageModernHint, village].filter(Boolean);
  let hit = null;
  for (const name of tryNames) {
    hit = gaz.lookup(name, { county: countyHistorical });
    if (hit && countyHistorical && hit.entry.countyHistorical && fold(hit.entry.countyHistorical) !== fold(countyHistorical)) {
      // Same name in another county: only accept when the printed county is not exclusive to another county
      const alt = gaz.lookup(name, {});
      if (alt && alt.ambiguous) hit = null;
    }
    if (hit) break;
  }
  if (!hit && village) {
    // fuzzy: OCR damage on the village name, restricted to the printed county
    const cands = (gaz.data.places || []).filter((p) => !countyHistorical || fold(p.countyHistorical) === fold(countyHistorical) || (hist && p.county === hist.county));
    const scored = cands.map((p) => ({ p, ok: [p.name, p.nameHistorical, ...(p.aliases || [])].some((n) => n && similar(n, village)) })).filter((x) => x.ok);
    if (scored.length === 1) hit = { entry: scored[0].p, via: 'fuzzy', ambiguous: false };
  }
  if (hit) {
    const e = hit.entry;
    loc.country = e.country || null;
    loc.region = e.region || null;
    loc.county = e.county || null;
    loc.village = e.name || null;
    loc.lat = typeof e.lat === 'number' ? e.lat : null;
    loc.lng = typeof e.lng === 'number' ? e.lng : null;
    loc.placeId = e.placeId || null;
    loc.resolution = 'gazetteer';
    if (!loc.countyHistorical && e.countyHistorical) loc.countyHistorical = e.countyHistorical;
    return loc;
  }
  if (hist) {
    loc.country = hist.country || null;
    loc.region = hist.region || null;
    loc.county = hist.exclusive ? (hist.county || null) : (hist.county || null);
    loc.resolution = hist.county ? 'county' : 'unresolved';
    if (!hist.exclusive && !hist.county) loc.country = null;
  }
  return loc;
}

/** Assemble the record. `x` carries everything the volume parser knows. */
export function buildRecord(x) {
  const number = x.label;
  const id = `rfm-${x.volume}-${number}`;
  const perf = parsePerformer(x.performerRaw);
  const pageUrl = x.page.url;
  return {
    id,
    source: {
      site: 'rfm',
      siteName: `Rumanian Folk Music, vol. ${x.roman} (Bartók, ed. Suchoff, 1975), Internet Archive scan`,
      siteId: `RFM ${x.roman} No. ${number}`,
      url: pageUrl,
      referenceCode: x.referenceCode || null,
      volume: x.roman,
      number,
      siteRecordId: `${x.itemId}:n${x.page.index}:${number}`,
      fetchedAt: x.fetchedAt || null,
      alternates: []
    },
    title: x.incipit || null,
    incipit: x.incipit || null,
    genre: x.genre,
    genreRaw: x.genreRaw || null,
    style: null,
    performance: x.performance,
    instrument: x.instrument || [],
    performer: { name: perf.name, age: perf.age, sex: perf.sex, ethnicity: perf.ethnicity },
    collector: 'Bartók Béla',
    collected: { year: x.collected.year, month: x.collected.month, day: null, raw: x.collected.raw },
    location: x.location,
    media: {
      notation: [{ url: pageUrl, type: 'text/html', caption: `Scanned page ${x.page.printedPage ? `p. ${x.page.printedPage}` : `leaf ${x.page.leafNum}`} on the Internet Archive (notation not mirrored)` }],
      audio: []
    },
    music: { systemPosition: x.systemPosition || null, cadences: null, rhythm: null, mode: null, ambitus: null, syllables: null, form: null },
    text: x.incipit || null,
    remarks: x.remarks || null,
    related: [],
    composition: [],
    rawFields: x.rawFields,
    styleRaw: x.styleRaw || null,
    journey: null
  };
}
