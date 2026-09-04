import { defineConfig } from 'vitest/config'
import config from './vitest.config'

// Explicit opt-in: these tests operate on a running Electron test profile via CLI + CDP.
export default defineConfig({
  ...config,
  test: {
    ...config.test,
    include: ['scripts/test/electron/*.test.mjs'],
  },
})
