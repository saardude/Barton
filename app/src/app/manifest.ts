// Indirection over the build-time generated manifest so unit tests can mock this module
// (the generated file does not exist on a checkout that has not run `npm run sync-data`).
import { dataManifest } from '../generated/data-manifest'

export const manifest: Record<string, string | undefined> = dataManifest
