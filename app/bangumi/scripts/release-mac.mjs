import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const args = parseArgs(process.argv.slice(2))
const arch = args.arch ?? 'all'
const config = args.config ?? 'electron-builder.yml'
const publish = args.publish ?? 'never'
const projectDir = process.cwd()
const distDir = join(projectDir, 'dist')
const packageJson = JSON.parse(readFileSync(join(projectDir, 'package.json'), 'utf8'))
const tag = `v${packageJson.version}`

const builderConfig = readFileSync(join(projectDir, config), 'utf8')
const channel = args.channel ?? readYamlValue(builderConfig, 'channel') ?? 'latest'
const owner = readYamlValue(builderConfig, 'owner')
const repo = readYamlValue(builderConfig, 'repo')
const releaseType = readYamlValue(builderConfig, 'releaseType') ?? 'release'
const updateFile = join(distDir, `${channel}-mac.yml`)
const hostArch = process.arch === 'arm64' ? 'arm64' : 'x64'
const archs = arch === 'all' ? ['x64', 'arm64'] : [arch]
const nativeModule = join(
  projectDir,
  'node_modules',
  'better-sqlite3',
  'build',
  'Release',
  'better_sqlite3.node',
)

if (!['all', 'x64', 'arm64'].includes(arch)) {
  fail(`Unsupported mac arch "${arch}". Use all, x64, or arm64.`)
}

let exitCode = 0

try {
  for (const targetArch of archs) {
    rebuildNative(targetArch)
    run('pnpm', [
      'exec',
      'electron-builder',
      '--mac',
      `--${targetArch}`,
      '--config',
      config,
      '--publish',
      'never',
    ])
    copyUpdateFile(targetArch)
  }

  if (arch === 'all') {
    mergeUpdateFiles()
  }

  if (publish === 'always') {
    mergeRemoteUpdateFile()
    publishArtifacts()
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  exitCode = 1
} finally {
  if (!isNativeModuleArch(nativeModule, hostArch)) {
    try {
      rebuildNative(hostArch)
    } catch (error) {
      console.error(error instanceof Error ? error.message : error)
      exitCode = 1
    }
  }
}

process.exit(exitCode)

function parseArgs(values) {
  const result = {}
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]
    if (!value.startsWith('--')) continue
    const key = value.slice(2)
    const next = values[index + 1]
    if (next == null || next.startsWith('--')) {
      result[key] = 'true'
    } else {
      result[key] = next
      index += 1
    }
  }
  return result
}

function readYamlValue(yaml, key) {
  const match = yaml.match(new RegExp(`^\\s*${key}:\\s*(.+?)\\s*$`, 'm'))
  return match?.[1]?.replace(/^['"]|['"]$/g, '')
}

function rebuildNative(targetArch) {
  run('pnpm', [
    'exec',
    'electron-rebuild',
    '-f',
    '-w',
    'better-sqlite3',
    '-a',
    targetArch,
    '-v',
    packageJson.devDependencies.electron.replace(/^[^\d]*/, ''),
  ])
}

function isNativeModuleArch(filePath, targetArch) {
  if (!existsSync(filePath)) return false

  const result = spawnSync('file', [filePath], {
    cwd: projectDir,
    encoding: 'utf8',
  })

  if (result.status !== 0) return false
  return targetArch === 'arm64' ? result.stdout.includes('arm64') : result.stdout.includes('x86_64')
}

function copyUpdateFile(targetArch) {
  if (!existsSync(updateFile)) {
    fail(`Expected update metadata was not created: ${updateFile}`)
  }
  writeFileSync(join(distDir, `${channel}-mac.${targetArch}.yml`), readFileSync(updateFile))
}

function mergeUpdateFiles() {
  const x64Info = parseUpdateInfo(join(distDir, `${channel}-mac.x64.yml`))
  const arm64Info = parseUpdateInfo(join(distDir, `${channel}-mac.arm64.yml`))
  writeUpdateInfo({ ...x64Info, files: [...x64Info.files, ...arm64Info.files] })
}

function mergeRemoteUpdateFile() {
  if (arch === 'all' || owner == null || repo == null) return

  const remoteInfo = fetchRemoteUpdateInfo()
  if (remoteInfo == null) return

  const localInfo = parseUpdateInfo(updateFile)
  const mergedFiles = [
    ...remoteInfo.files.filter((file) => getMacFileArch(file.url) !== arch),
    ...localInfo.files,
  ]

  writeUpdateInfo({ ...localInfo, files: mergedFiles })
}

function writeUpdateInfo(info) {
  const defaultZip =
    info.files.find((file) => file.url.endsWith('.zip') && !file.url.includes('arm64')) ??
    info.files.find((file) => file.url.endsWith('.zip'))

  if (defaultZip == null) {
    fail('Could not find zip in generated mac update metadata.')
  }

  const output = [
    `version: ${info.version}`,
    'files:',
    ...info.files.flatMap((file) => [
      `  - url: ${file.url}`,
      `    sha512: ${file.sha512}`,
      `    size: ${file.size}`,
    ]),
    `path: ${defaultZip.url}`,
    `sha512: ${defaultZip.sha512}`,
    `releaseDate: '${info.releaseDate}'`,
    '',
  ].join('\n')

  writeFileSync(updateFile, output)
}

function parseUpdateInfo(filePath) {
  return parseUpdateInfoText(readFileSync(filePath, 'utf8'), filePath)
}

function parseUpdateInfoText(input, source) {
  const version = input.match(/^version:\s*(.+)$/m)?.[1]
  const releaseDate = input.match(/^releaseDate:\s*'(.+)'$/m)?.[1]
  const files = [...input.matchAll(/^\s+- url:\s*(.+)\n\s+sha512:\s*(.+)\n\s+size:\s*(\d+)/gm)].map(
    (match) => ({
      url: match[1],
      sha512: match[2],
      size: match[3],
    }),
  )

  if (version == null || releaseDate == null || files.length === 0) {
    fail(`Could not parse mac update metadata: ${source}`)
  }

  return { version, releaseDate, files }
}

function fetchRemoteUpdateInfo() {
  const url = `https://github.com/${owner}/${repo}/releases/download/${tag}/${channel}-mac.yml`
  const result = spawnSync('curl', ['-sS', '-L', '-f', url], {
    cwd: projectDir,
    env: process.env,
    encoding: 'utf8',
  })

  if (result.status !== 0 || result.stdout.trim() === '') return null
  return parseUpdateInfoText(result.stdout, url)
}

function getMacFileArch(url) {
  return url.includes('arm64') ? 'arm64' : 'x64'
}

function publishArtifacts() {
  if (owner == null || repo == null) {
    fail(`Missing GitHub publish owner/repo in ${config}.`)
  }

  const repoName = `${owner}/${repo}`
  const releaseArgs = ['release', 'view', tag, '--repo', repoName]
  const release = spawnSync('gh', releaseArgs, { stdio: 'ignore' })
  if (release.status !== 0) {
    const createArgs = ['release', 'create', tag, '--repo', repoName, '--title', tag]
    if (releaseType === 'prerelease') createArgs.push('--prerelease')
    run('gh', createArgs)
  }

  const updateInfo = parseUpdateInfo(updateFile)
  const artifacts = new Set([updateFile])
  for (const file of updateInfo.files) {
    artifacts.add(join(distDir, file.url))
    const blockmap = join(distDir, `${file.url}.blockmap`)
    if (existsSync(blockmap)) artifacts.add(blockmap)
  }

  run('gh', ['release', 'upload', tag, ...[...artifacts], '--repo', repoName, '--clobber'])
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: projectDir,
    env: process.env,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${commandArgs.join(' ')}`)
  }
}

function fail(message) {
  throw new Error(message)
}
