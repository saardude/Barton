// Fallback types for the git-ignored, build-time generated manifest (scripts/sync-data.mjs).
// When src/generated/data-manifest.ts exists TypeScript resolves the real file first; this
// ambient declaration only keeps `tsc` and the unit tests working on a checkout that has not
// run `npm run sync-data` yet.
declare module '*generated/data-manifest' {
  export const dataManifest: Record<string, string>
  export type DataFileName = string
}
