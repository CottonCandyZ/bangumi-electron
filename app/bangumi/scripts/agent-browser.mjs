import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const bin = join(dirname(require.resolve('agent-browser/package.json')), 'bin')

export function runAgentBrowser(args, options = {}) {
  // The upstream JS launcher sets windowsHide:false. Invoke its native CLI directly.
  const windows = process.platform === 'win32'
  const executable = windows
    ? join(bin, `agent-browser-win32-${process.arch}.exe`)
    : process.execPath
  const prefix = windows ? [] : [join(bin, 'agent-browser.js')]
  return spawnSync(executable, [...prefix, ...args], {
    ...options,
    shell: false,
    windowsHide: true,
  })
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = runAgentBrowser(process.argv.slice(2), { stdio: 'inherit' })
  if (result.error) console.error(result.error.message)
  process.exitCode = result.status ?? 1
}
