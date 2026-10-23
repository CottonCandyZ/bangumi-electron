import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: Object.fromEntries(
      Object.entries({
        '@renderer': './src/renderer/src',
        '@main': './src/main',
        '@shared': './src/shared',
        '@db': './src/db',
      }).map(([name, path]) => [name, fileURLToPath(new URL(path, import.meta.url))]),
    ),
  },
  test: {
    environment: 'node',
    include: ['scripts/test/*.test.{ts,tsx}'],
    pool: 'forks',
    maxWorkers: 1,
    fileParallelism: false,
    restoreMocks: true,
  },
})
