import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const args = parseArgs(process.argv.slice(2))
const config = args.config ?? 'electron-builder.yml'
const projectDir = process.cwd()
const distDir = join(projectDir, 'dist')
const packageJson = JSON.parse(readFileSync(join(projectDir, 'package.json'), 'utf8'))
const builderConfig = readFileSync(join(projectDir, config), 'utf8')
const channel = args.channel ?? readYamlValue(builderConfig, 'channel') ?? 'latest'
const owner = readYamlValue(builderConfig, 'owner')
const repo = readYamlValue(builderConfig, 'repo')
const releaseType = readYamlValue(builderConfig, 'releaseType') ?? 'release'
const tag = `v${packageJson.version}`
const repoName = `${owner}/${repo}`
const installer = join(distDir, `${packageJson.name}-${packageJson.version}-setup.exe`)
const blockmap = `${installer}.blockmap`
const updateFile = join(distDir, `${channel}.yml`)

if (owner == null || repo == null) {
  fail(`Missing GitHub publish owner/repo in ${config}.`)
}

for (const file of [installer, blockmap, updateFile]) {
  if (!existsSync(file)) fail(`Expected release artifact was not found: ${file}`)
}

const release = spawnSync('gh', ['release', 'view', tag, '--repo', repoName], {
  stdio: 'ignore',
})

if (release.status !== 0) {
  const createArgs = ['release', 'create', tag, '--repo', repoName, '--title', tag]
  if (releaseType === 'prerelease') createArgs.push('--prerelease')
  run('gh', createArgs)
}

run('gh', [
  'release',
  'upload',
  tag,
  installer,
  blockmap,
  updateFile,
  '--repo',
  repoName,
  '--clobber',
])

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
  console.error(message)
  process.exit(1)
}
