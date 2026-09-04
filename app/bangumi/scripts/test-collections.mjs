import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
// Use Electron's Node ABI, which matches the packaged better-sqlite3 addon.
const result = spawnSync(
  require('electron'),
  [
    '--import',
    'tsx',
    '--test',
    'scripts/test/collection-sync.test.ts',
    'scripts/test/collection-transport.test.ts',
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', TSX_TSCONFIG_PATH: 'tsconfig.web.json' },
  },
)
process.exit(result.status ?? 1)
