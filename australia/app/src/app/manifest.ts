// Indirection over the build-time generated manifest so unit tests can mock this module.
import { dataManifest } from '../generated/data-manifest'

export const manifest: Record<string, string | undefined> = dataManifest
