// App-side field on the schema record until data/schema/song.schema.json ships `collectors`
// (once gen-types emits the same `collectors: string[]`, this interface merge is a no-op).
declare module './song' {
  interface Song {
    /** Normalised collector names (Hungarian order); empty when unknown. See src/data/collectors.ts. */
    collectors: string[]
  }
}

export {}
