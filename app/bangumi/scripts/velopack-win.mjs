import { existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const args = parseArgs(process.argv.slice(2))
const projectDir = process.cwd()
const packageJson = JSON.parse(readFileSync(join(projectDir, 'package.json'), 'utf8'))
const channel = args.channel ?? 'beta'
const arch = args.arch ?? process.arch
const publish = args.publish === 'always'
const packId = 'io.github.cottoncandyz.bangumi-electron'
const appUserModelId = packId
const releaseTag = `v${packageJson.version}`
const packChannel = `win-${arch}-${channel}`
const packDir = join(projectDir, 'dist', 'win-unpacked')
const outputDir = join(projectDir, 'dist', 'velopack', packChannel)
const iconPath = join(projectDir, 'build', 'icon.ico')
const vpkCommand = process.env.VPK_COMMAND || 'vpk'
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN
const repoUrl = 'https://github.com/CottonCandyZ/bangumi-electron'
const publishTarget = process.env.BANGUMI_VELOPACK_PUBLISH_TARGET || 'github'

resetOutputDir()
if (publish) downloadExistingRelease()

run('pnpm', ['exec', 'electron-builder', '--win', '--dir', `--${arch}`])

if (!existsSync(join(packDir, 'Bangumi.exe'))) {
  fail(`Expected unpacked app was not found: ${join(packDir, 'Bangumi.exe')}`)
}

if (!existsSync(iconPath)) {
  fail(`Expected Windows icon was not found: ${iconPath}`)
}

runVpk([
  'pack',
  '--packId',
  packId,
  '--packVersion',
  packageJson.version,
  '--packDir',
  packDir,
  '--mainExe',
  'Bangumi.exe',
  '--packTitle',
  'Bangumi',
  '--aumid',
  appUserModelId,
  '--packAuthors',
  packageJson.author ?? 'CottonCandyZ',
  '--icon',
  iconPath,
  '--channel',
  packChannel,
  '--outputDir',
  outputDir,
])

if (publish) {
  uploadRelease()
}

function resetOutputDir() {
  rmSync(outputDir, { recursive: true, force: true })
}

function downloadExistingRelease() {
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

function uploadRelease() {
  const uploadArgs = ['upload', publishTarget, '--outputDir', outputDir, '--channel', packChannel]

  if (publishTarget === 'github') appendGitHubArgs(uploadArgs)
  else if (publishTarget === 's3') appendS3Args(uploadArgs, { forUpload: true })
  else if (publishTarget === 'local') appendLocalArgs(uploadArgs, { forUpload: true })
  else fail(`Unsupported publish target "${publishTarget}". Use github, s3, or local.`)

  runVpk(uploadArgs)
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
    shell: process.platform === 'win32',
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
  console.error(message)
  process.exit(1)
}
