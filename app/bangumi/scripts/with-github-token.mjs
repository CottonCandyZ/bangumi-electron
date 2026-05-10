import { execFileSync, spawnSync } from 'node:child_process'

const [command, ...commandArgs] = process.argv.slice(2)

if (command == null) {
  fail('Usage: node scripts/with-github-token.mjs <command> [...args]')
}

const token = readEnvToken('GH_TOKEN') ?? readEnvToken('GITHUB_TOKEN') ?? readGitHubCliToken()

if (token == null) {
  fail(
    'GitHub token is required for publishing. Run `gh auth login` or set GH_TOKEN before retrying.',
  )
}

const result = spawnSync(command, commandArgs, {
  cwd: process.cwd(),
  env: { ...process.env, GH_TOKEN: token },
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

function readGitHubCliToken() {
  try {
    const output = execFileSync('gh', ['auth', 'token'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()

    return output === '' ? undefined : output
  } catch {
    return undefined
  }
}

function readEnvToken(name) {
  const value = process.env[name]?.trim()
  return value == null || value === '' ? undefined : value
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
