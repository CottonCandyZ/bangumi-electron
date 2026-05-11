import { existsSync } from 'node:fs'
import { delimiter, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const [command, ...commandArgs] = process.argv.slice(2)

if (command == null) {
  fail('Usage: node scripts/with-electron-node-path.mjs <command> [...args]')
}

const projectNodeModules = resolve(process.cwd(), 'node_modules')
const electronPackage = resolve(projectNodeModules, 'electron/package.json')

if (!existsSync(electronPackage)) {
  fail(
    `Expected Electron dependency was not found: ${electronPackage}\nRun pnpm install and retry.`,
  )
}

const nodePath = [projectNodeModules, process.env.NODE_PATH].filter(Boolean).join(delimiter)
const result = spawnSync(command, commandArgs, {
  cwd: process.cwd(),
  env: { ...process.env, NODE_PATH: nodePath },
  shell: process.platform === 'win32',
  stdio: 'inherit',
})

if (result.error != null) {
  fail(result.error.message)
}

if (result.signal != null) {
  fail(`Command was terminated by ${result.signal}: ${command} ${commandArgs.join(' ')}`)
}

process.exit(result.status ?? 1)

function fail(message) {
  console.error(message)
  process.exit(1)
}
