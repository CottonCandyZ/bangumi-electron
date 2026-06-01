import { existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const args = parseArgs(process.argv.slice(2))
const arch = args.arch ?? 'all'
const channel = args.channel ?? 'beta'
const publish = args.publish === 'always'
const projectDir = process.cwd()
const packageJson = JSON.parse(readFileSync(join(projectDir, 'package.json'), 'utf8'))
const packId = 'io.github.cottoncandyz.bangumi-electron'
const releaseTag = `v${packageJson.version}`
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
const vpkCommand = process.env.VPK_COMMAND || 'vpk'
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN
const repoUrl = 'https://github.com/CottonCandyZ/bangumi-electron'
const publishTarget = process.env.BANGUMI_VELOPACK_PUBLISH_TARGET || 'github'

if (process.platform !== 'darwin') {
  fail('macOS Velopack packages must be built on macOS.')
}

if (!['all', 'x64', 'arm64'].includes(arch)) {
  fail(`Unsupported mac arch "${arch}". Use all, x64, or arm64.`)
}

let exitCode = 0

try {
  for (const targetArch of archs) {
    const packChannel = `osx-${targetArch}-${channel}`
    const outputDir = join(projectDir, 'dist', 'velopack', packChannel)

    resetOutputDir(outputDir)
    if (publish) downloadExistingRelease(outputDir, packChannel)
    rebuildNative(targetArch)
    run('pnpm', [
      'exec',
      'electron-builder',
      '--mac',
      '--dir',
      `--${targetArch}`,
      '--publish',
      'never',
    ])

    runVpk([
      'pack',
      '--packId',
      packId,
      '--packVersion',
      packageJson.version,
      '--packDir',
      findAppBundle(targetArch),
      '--mainExe',
      'Bangumi',
      '--packTitle',
      'Bangumi',
      '--packAuthors',
      packageJson.author ?? 'CottonCandyZ',
      '--icon',
      join(projectDir, 'build', 'icon.icns'),
      '--bundleId',
      packId,
      '--runtime',
      `osx-${targetArch}`,
      '--channel',
      packChannel,
      '--outputDir',
      outputDir,
    ])

    if (publish) upload(outputDir, packChannel)
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

function findAppBundle(targetArch) {
  const candidates = [
    join(projectDir, 'dist', `mac-${targetArch}`, 'Bangumi.app'),
    join(projectDir, 'dist', targetArch === 'arm64' ? 'mac-arm64' : 'mac', 'Bangumi.app'),
    join(projectDir, 'dist', 'mac', 'Bangumi.app'),
  ]

  const appBundle = candidates.find((candidate) => existsSync(candidate))
  if (appBundle == null) {
    fail(`Expected macOS app bundle was not found. Checked: ${candidates.join(', ')}`)
  }

  return appBundle
}

function upload(outputDir, packChannel) {
  const uploadArgs = ['upload', publishTarget, '--outputDir', outputDir, '--channel', packChannel]

  if (publishTarget === 'github') appendGitHubArgs(uploadArgs)
  else if (publishTarget === 's3') appendS3Args(uploadArgs, { forUpload: true })
  else if (publishTarget === 'local') appendLocalArgs(uploadArgs, { forUpload: true })
  else fail(`Unsupported publish target "${publishTarget}". Use github, s3, or local.`)

  runVpk(uploadArgs)
}

function resetOutputDir(outputDir) {
  rmSync(outputDir, { recursive: true, force: true })
}

function downloadExistingRelease(outputDir, packChannel) {
  const downloadArgs = ['download', publishTarget, '--outputDir', outputDir, '--channel', packChannel]

  if (publishTarget === 'github') appendGitHubArgs(downloadArgs, { forDownload: true })
  else if (publishTarget === 's3') appendS3Args(downloadArgs)
  else if (publishTarget === 'local') appendLocalArgs(downloadArgs)
  else fail(`Unsupported publish target "${publishTarget}". Use github, s3, or local.`)

  const result = runVpk(downloadArgs, { allowFailure: true })
  if (result.status !== 0) {
    console.warn(
      `No existing ${packChannel} release feed was downloaded; continuing with full package.`,
    )
  }
}

function appendGitHubArgs(commandArgs, options = {}) {
  commandArgs.push('--repoUrl', repoUrl)

  if (!options.forDownload) {
    commandArgs.push(
      `--tag=${releaseTag}`,
      `--releaseName=Bangumi-${packageJson.version}`,
      '--merge=true',
      '--publish=true',
    )
  }

  if (channel === 'beta') commandArgs.push('--pre=true')
  if (token) commandArgs.push(`--token=${token}`)
}

function appendS3Args(commandArgs, options = {}) {
  const bucket = process.env.BANGUMI_VELOPACK_S3_BUCKET
  if (!bucket) fail('BANGUMI_VELOPACK_S3_BUCKET is required when publishing to s3.')

  commandArgs.push('--bucket', bucket)
  appendOptionalArg(commandArgs, '--endpoint', process.env.BANGUMI_VELOPACK_S3_ENDPOINT)
  appendOptionalArg(commandArgs, '--region', process.env.BANGUMI_VELOPACK_S3_REGION)
  appendOptionalArg(commandArgs, '--keyId', process.env.BANGUMI_VELOPACK_S3_KEY_ID)
  appendOptionalArg(commandArgs, '--secret', process.env.BANGUMI_VELOPACK_S3_SECRET)
  appendOptionalArg(commandArgs, '--session', process.env.BANGUMI_VELOPACK_S3_SESSION)
  appendOptionalArg(commandArgs, '--prefix', process.env.BANGUMI_VELOPACK_S3_PREFIX)
  appendOptionalArg(commandArgs, '--disablePathStyle', process.env.BANGUMI_VELOPACK_S3_DISABLE_PATH_STYLE)
  if (options.forUpload) {
    appendOptionalArg(commandArgs, '--keepMaxReleases', process.env.BANGUMI_VELOPACK_KEEP_MAX_RELEASES)
  }
}

function appendLocalArgs(commandArgs, options = {}) {
  const localPath = process.env.BANGUMI_VELOPACK_LOCAL_PATH
  if (!localPath) fail('BANGUMI_VELOPACK_LOCAL_PATH is required when publishing to local.')

  commandArgs.push('--path', localPath)
  if (options.forUpload) {
    commandArgs.push('--regenerate=true')
    appendOptionalArg(commandArgs, '--keepMaxReleases', process.env.BANGUMI_VELOPACK_KEEP_MAX_RELEASES)
  }
}

function appendOptionalArg(commandArgs, name, value) {
  if (!value) return
  commandArgs.push(name, value)
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

function runVpk(commandArgs, options = {}) {
  const [command, ...commandPrefix] = vpkCommand.split(' ').filter(Boolean)
  return run(command, [...commandPrefix, ...commandArgs], options)
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: projectDir,
    env: process.env,
    stdio: 'inherit',
  })

  if (!options.allowFailure && result.status !== 0) {
    throw new Error(`Command failed: ${command} ${redactArgs(commandArgs).join(' ')}`)
  }

  return result
}

function redactArgs(commandArgs) {
  return commandArgs.map((arg, index) => {
    if (arg.startsWith('--token=')) return '--token=<redacted>'
    if (['--token', '--secret', '--keyId', '--session'].includes(commandArgs[index - 1])) {
      return '<redacted>'
    }
    return arg
  })
}

function fail(message) {
  throw new Error(message)
}
