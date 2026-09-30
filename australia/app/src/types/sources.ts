// Shape of australia/data/sources.json (written by australia/scraper/src/build.js).
export interface NewspaperSource {
  key: string
  title: string
  count: number
  songIds: string[]
  years: { min: number | null; max: number | null }
  stateHints: Record<string, number>
  town: string | null
  state: string | null
  lat: number | null
  lng: number | null
  wikidata: string | null
  troveTitleId: string | null
  resolved: boolean
}

export interface SongbookSource {
  id: string
  year: number
  yearRaw: string
  title: string
  author: string | null
  url: string
  songCount: number
}

export interface ArticleSource {
  id: string
  title: string
  url: string
}

export interface Sources {
  site: { name: string; url: string; editor: string; since: number }
  songbooks: SongbookSource[]
  articles: ArticleSource[]
  newspapers: NewspaperSource[]
}
