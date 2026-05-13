import { spawnSync } from 'node:child_process'

const env = {
  ...process.env,
  BANGUMI_ELECTRON_CDP_PORT: process.env.BANGUMI_ELECTRON_CDP_PORT || '9222',
}
env.REMOTE_DEBUGGING_PORT = process.env.REMOTE_DEBUGGING_PORT || env.BANGUMI_ELECTRON_CDP_PORT

const result = spawnSync('pnpm', ['dev'], {
  cwd: process.cwd(),
  env,
  shell: process.platform === 'win32',
  stdio: 'inherit',
})

if (result.error != null) {
  console.error(result.error.message)
  process.exit(1)
}

if (result.signal != null) {
  console.error(`Command was terminated by ${result.signal}: pnpm dev`)
  process.exit(1)
}

process.exit(result.status ?? 1)
