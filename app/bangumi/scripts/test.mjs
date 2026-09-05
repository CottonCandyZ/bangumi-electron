import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
// Match the ABI of the app's better-sqlite3 build without rebuilding it for host Node.
const result = spawnSync(
  require('electron'),
  [require.resolve('vitest/vitest.mjs'), ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    windowsHide: true,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  },
)
if (result.error) console.error(result.error.message)
process.exit(result.status ?? 1)
