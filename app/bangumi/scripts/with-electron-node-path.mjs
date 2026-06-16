import { existsSync, readFileSync } from 'node:fs'
import { delimiter, dirname, resolve } from 'node:path'
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

ensureElectronBinary(dirname(electronPackage))

const nodePath = [projectNodeModules, process.env.NODE_PATH].filter(Boolean).join(delimiter)
const cdpPort = process.env.BANGUMI_ELECTRON_CDP_PORT || '9222'
const env = {
  ...process.env,
  NODE_PATH: nodePath,
  BANGUMI_ELECTRON_CDP_PORT: cdpPort,
  REMOTE_DEBUGGING_PORT: process.env.REMOTE_DEBUGGING_PORT || cdpPort,
}

const result = spawnSync(command, commandArgs, {
  cwd: process.cwd(),
  env,
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

function ensureElectronBinary(electronDir) {
  if (isElectronBinaryInstalled(electronDir)) return

  const installScript = resolve(electronDir, 'install.js')
  if (!existsSync(installScript)) {
    fail(`Expected Electron install script was not found: ${installScript}`)
  }

  console.log('Electron binary is missing; running Electron install script...')
  const result = spawnSync(process.execPath, [installScript], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  })

  if (result.error != null) {
    fail(result.error.message)
  }

  if (result.signal != null) {
    fail(`Electron install script was terminated by ${result.signal}`)
  }

  if ((result.status ?? 1) !== 0) {
    fail(`Electron install script failed with exit code ${result.status ?? 1}`)
  }

  if (!isElectronBinaryInstalled(electronDir)) {
    fail(
      `Electron binary is still missing after install. Check ${resolve(electronDir, 'dist')} and retry pnpm install.`,
    )
  }
}

function isElectronBinaryInstalled(electronDir) {
  const pathFile = resolve(electronDir, 'path.txt')
  if (!existsSync(pathFile)) return false

  const executablePath = readFileSync(pathFile, 'utf8').trim()
  if (!executablePath) return false

  const distPath = process.env.ELECTRON_OVERRIDE_DIST_PATH || resolve(electronDir, 'dist')
  return existsSync(resolve(distPath, executablePath))
}
