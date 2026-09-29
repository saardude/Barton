import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// globals are off, so Testing Library's automatic cleanup must be wired by hand.
afterEach(() => cleanup())
