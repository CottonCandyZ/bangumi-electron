import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const projectDir = process.cwd()
const electronBuilderCli = join(projectDir, 'node_modules', 'electron-builder', 'cli.js')
const electronPackageDir = join(projectDir, 'node_modules', 'electron')

// better-sqlite3 >= 13 is a Node-API addon that ships prebuilds for every supported
// platform/arch, so it no longer needs an Electron-ABI-specific download here.
if (process.platform === 'darwin') {
  run(process.execPath, [
    electronBuilderCli,
    'install-app-deps',
    '--platform',
    process.platform,
    '--arch',
    process.arch,
  ])
} else {
  installElectronBinary()
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: projectDir,
    env: process.env,
    stdio: 'inherit',
  })

  if (result.error != null) {
    throw result.error
  }

  if (result.signal != null) {
    throw new Error(`Command was terminated by ${result.signal}: ${command}`)
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function installElectronBinary() {
  const binaryName = process.platform === 'win32' ? 'electron.exe' : 'electron'
  const electronBinary = join(electronPackageDir, 'dist', binaryName)

  if (existsSync(electronBinary)) return

  run(process.execPath, [join(electronPackageDir, 'install.js')])
}
