// The app copy of the catalogue (data/songs.slim.json, written by scraper/src/build.js `slim()`)
// omits nulls, empty arrays, rawFields and every field derivable from places.json. This module
// restores the schema shape (`Song`) once at load time, so selectors, sorts and the export work on
// exactly the fields docs/DATA-SCHEMA.md describes. It also accepts full schema records unchanged.
import type { Place } from '../types/place'
import type { Song } from '../types/song'
import { collectorsOf } from './collectors'
// Side-effect import so the `collectors` interface merge is part of every build, incremental or not.
import '../types/song-augment'

type Raw = Record<string, unknown>
const obj = (v: unknown): Raw => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : {})
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
const str = (v: unknown): string | null => (typeof v === 'string' ? v : null)
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

const SITE_NAMES: Record<string, string> = {
  fmbc: "Folk Music in Bartok's Compositions (HUN-REN BTK ZTI)",
  bsys: 'The Bartok System (HUN-REN BTK ZTI, systems.zti.hu/br)',
  gyuj: 'Bela Bartok, the Ethnomusicologist (HUN-REN BTK ZTI, bartok-gyujtesek.zti.hu)',
  rfm: 'Rumanian Folk Music (Bartok, ed. Suchoff, Nijhoff, 1967-1975), digitised copy; the page consulted is linked',
}

function locationFromPlace(placeId: string, place: Place | undefined, raw: Raw): Song['location'] {
  const isVillage = place?.type === 'village'
  const region = place?.region && place.region !== 'unresolved' ? place.region : null
  return {
    country: place?.country ?? str(raw.country),
    region: region ?? str(raw.region),
    county: place?.county ?? str(raw.county),
    countyHistorical: place?.countyHistorical ?? str(raw.countyHistorical),
    village: isVillage ? place.name : str(raw.village),
    villageHistorical: isVillage ? (place.nameHistorical ?? null) : str(raw.villageHistorical),
    lat: place?.lat ?? num(raw.lat),
    lng: place?.lng ?? num(raw.lng),
    raw: str(raw.raw),
    placeId,
    origin: raw.origin ? hydrateOrigin(obj(raw.origin)) : null,
    resolution: (str(raw.resolution) as Song['location']['resolution']) ?? null,
  }
}

function hydrateOrigin(o: Raw): NonNullable<Song['location']['origin']> {
  return {
    village: str(o.village),
    villageHistorical: str(o.villageHistorical),
    county: str(o.county),
    countyHistorical: str(o.countyHistorical),
    placeId: str(o.placeId),
  }
}

function mediaItem(m: unknown): Song['media']['notation'][number] {
  const o = obj(m)
  return { url: str(o.url) ?? '', type: str(o.type), caption: str(o.caption) }
}

/** Restore one record to the schema shape. `placeById` supplies the location fields for resolved places. */
export function hydrateSong(input: unknown, placeById: Map<string, Place>): Song {
  const r = obj(input)
  const src = obj(r.source)
  const site = (str(src.site) ?? 'bsys') as Song['source']['site']
  const siteId = str(src.siteId) ?? str(src.siteRecordId) ?? String(r.id ?? '')
  const rawLoc = obj(r.location)
  const placeId = str(rawLoc.placeId)
  const place = placeId ? placeById.get(placeId) : undefined
  const perf = obj(r.performer)
  const col = obj(r.collected)
  const music = obj(r.music)
  const media = obj(r.media)
  const journey = r.journey ? obj(r.journey) : null
  const title = str(r.title)
  const song: Song = {
    id: String(r.id ?? ''),
    source: {
      site,
      siteName: str(src.siteName) ?? SITE_NAMES[site] ?? site,
      siteId,
      url: str(src.url) ?? '',
      referenceCode: str(src.referenceCode) ?? siteId,
      volume: str(src.volume),
      number: str(src.number),
      siteRecordId: str(src.siteRecordId),
      fetchedAt: str(src.fetchedAt),
      alternates: arr<Raw>(src.alternates).map((a) => ({
        site: (str(a.site) ?? 'bsys') as 'fmbc' | 'bsys' | 'gyuj',
        siteName: str(a.siteName),
        siteId: str(a.siteId) ?? '',
        url: str(a.url) ?? '',
        id: str(a.id),
      })),
    },
    title,
    incipit: str(r.incipit),
    genre: (str(r.genre) as Song['genre']) ?? null,
    genreRaw: str(r.genreRaw),
    style: str(r.style),
    styleRaw: str(r.styleRaw),
    performance: (str(r.performance) as Song['performance']) ?? 'unknown',
    instrument: arr<string>(r.instrument).filter((x) => typeof x === 'string'),
    performer: {
      name: str(perf.name),
      age: num(perf.age),
      sex: (str(perf.sex) as 'm' | 'f' | null) ?? null,
      ethnicity: str(perf.ethnicity),
    },
    collector: str(r.collector) ?? (Array.isArray(r.collectors) && r.collectors.length ? String(r.collectors[0]) : null),
    collectorRaw: str(r.collectorRaw) ?? str(r.collector),
    collectors: collectorsOf(r.collectors, str(r.collector)),
    collected: { year: num(col.year), month: num(col.month), day: num(col.day), raw: str(col.raw) },
    location: placeId
      ? locationFromPlace(placeId, place, rawLoc)
      : {
          country: str(rawLoc.country),
          region: str(rawLoc.region),
          county: str(rawLoc.county),
          countyHistorical: str(rawLoc.countyHistorical),
          village: str(rawLoc.village),
          villageHistorical: str(rawLoc.villageHistorical),
          lat: num(rawLoc.lat),
          lng: num(rawLoc.lng),
          raw: str(rawLoc.raw),
          placeId: null,
          origin: rawLoc.origin ? hydrateOrigin(obj(rawLoc.origin)) : null,
          resolution: (str(rawLoc.resolution) as Song['location']['resolution']) ?? null,
        },
    media: { notation: arr(media.notation).map(mediaItem), audio: arr(media.audio).map(mediaItem) },
    music: {
      systemPosition: str(music.systemPosition),
      cadences: str(music.cadences),
      rhythm: str(music.rhythm),
      mode: str(music.mode),
      ambitus: str(music.ambitus),
      syllables: str(music.syllables),
      form: str(music.form),
    },
    text: str(r.text),
    remarks: str(r.remarks),
    related: arr<Raw>(r.related).map((x) => ({
      id: str(x.id),
      url: str(x.url),
      label: str(x.label),
      relation: (str(x.relation) as Song['related'][number]['relation']) ?? 'link',
    })),
    composition: arr<Raw>(r.composition).map((c) => ({
      work: str(c.work),
      movement: str(c.movement),
      catalogue: str(c.catalogue),
      raw: str(c.raw),
    })),
    journey: journey
      ? {
          collectionId: str(journey.collectionId),
          label: str(journey.label),
          dateRaw: str(journey.dateRaw),
          place: str(journey.place),
          url: str(journey.url),
        }
      : null,
  }
  if (r.rawFields && typeof r.rawFields === 'object') song.rawFields = r.rawFields as Song['rawFields']
  return song
}

export function hydrateSongs(input: unknown, places: Place[]): Song[] {
  const placeById = new Map(places.map((p) => [p.id, p]))
  return arr(input).map((s) => hydrateSong(s, placeById))
}
