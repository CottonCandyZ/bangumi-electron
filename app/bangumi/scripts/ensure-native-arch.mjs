import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

if (process.platform !== 'darwin') {
  process.exit(0)
}

const projectDir = process.cwd()
const packageJson = JSON.parse(readFileSync(join(projectDir, 'package.json'), 'utf8'))
const hostArch = process.arch === 'arm64' ? 'arm64' : 'x64'
const nativeModules = [
  {
    name: 'better-sqlite3',
    binaryPath: join(
      projectDir,
      'node_modules',
      'better-sqlite3',
      'build',
      'Release',
      'better_sqlite3.node',
    ),
  },
  {
    name: 'bangumi-macos-traffic-lights',
    binaryPath: join(
      projectDir,
      'node_modules',
      'bangumi-macos-traffic-lights',
      'build',
      'Release',
      'bangumi_macos_traffic_lights.node',
    ),
  },
]

const modulesToRebuild = nativeModules.filter(
  (module) => !isNativeModuleArch(module.binaryPath, hostArch),
)
if (modulesToRebuild.length === 0) {
  process.exit(0)
}

console.log(
  `Rebuilding native modules for local macOS ${hostArch} dev runtime: ${modulesToRebuild.map((module) => module.name).join(', ')}`,
)
run('pnpm', [
  'exec',
  'electron-rebuild',
  '-f',
  '-w',
  modulesToRebuild.map((module) => module.name).join(','),
  '-a',
  hostArch,
  '-v',
  packageJson.devDependencies.electron.replace(/^[^\d]*/, ''),
])

function isNativeModuleArch(filePath, arch) {
  if (!existsSync(filePath)) return false

  const result = spawnSync('file', [filePath], {
    cwd: projectDir,
    encoding: 'utf8',
  })

  if (result.status !== 0) return false
  return arch === 'arm64' ? result.stdout.includes('arm64') : result.stdout.includes('x86_64')
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: projectDir,
    env: process.env,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
