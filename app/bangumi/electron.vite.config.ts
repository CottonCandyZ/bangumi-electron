import { resolve } from 'path'
import { execSync } from 'node:child_process'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function readBuildHash() {
  try {
    return execSync('git rev-parse --short=12 HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

const buildHash = process.env.BANGUMI_BUILD_HASH || readBuildHash()
const buildTime = process.env.BANGUMI_BUILD_TIME || new Date().toISOString()
const updateSourceUrl =
  process.env.BANGUMI_ELECTRON_UPDATE_URL || 'https://github.com/CottonCandyZ/bangumi-electron'

export default defineConfig({
  main: {
    define: {
      __APP_BUILD_HASH__: JSON.stringify(buildHash),
      __APP_BUILD_TIME__: JSON.stringify(buildTime),
      __APP_UPDATE_SOURCE_URL__: JSON.stringify(updateSourceUrl),
    },
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@main': resolve('src/main'),
        '@db': resolve('src/db'),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    define: {
      __APP_BUILD_HASH__: JSON.stringify(buildHash),
      __APP_BUILD_TIME__: JSON.stringify(buildTime),
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@main': resolve('src/main'),
        '@shared': resolve('src/shared'),
        '@db': resolve('src/db'),
      },
    },
    plugins: [react(), tailwindcss()],
  },
})
