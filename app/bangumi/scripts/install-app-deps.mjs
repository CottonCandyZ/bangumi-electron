import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { pipeline } from 'node:stream/promises'
import { get } from 'node:https'

const projectDir = process.cwd()
const electronBuilderCli = join(projectDir, 'node_modules', 'electron-builder', 'cli.js')
const electronPackageDir = join(projectDir, 'node_modules', 'electron')
const betterSqlitePackageDir = join(projectDir, 'node_modules', 'better-sqlite3')

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
  await installBetterSqlitePrebuild()
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

async function installBetterSqlitePrebuild() {
  const packageJson = JSON.parse(readFileSync(join(betterSqlitePackageDir, 'package.json'), 'utf8'))
  const electronAbi = readFileSync(join(electronPackageDir, 'abi_version'), 'utf8').trim()
  const assetName = [
    `better-sqlite3-v${packageJson.version}`,
    `electron-v${electronAbi}`,
    process.platform,
    process.arch,
  ].join('-')
  const archiveName = `${assetName}.tar.gz`
  const archiveUrl = `https://github.com/WiseLibs/better-sqlite3/releases/download/v${packageJson.version}/${archiveName}`
  const outputPath = join(betterSqlitePackageDir, 'build', 'Release', 'better_sqlite3.node')

  if (existsSync(outputPath)) return

  const tempDir = join(tmpdir(), 'bangumi-electron-native-deps')
  const archivePath = join(tempDir, archiveName)

  mkdirSync(tempDir, { recursive: true })
  await download(archiveUrl, archivePath)

  rmSync(join(betterSqlitePackageDir, 'build'), { recursive: true, force: true })
  run('tar', ['-xzf', archivePath, '-C', betterSqlitePackageDir])

  if (!existsSync(outputPath)) {
    throw new Error(`Expected better-sqlite3 prebuild was not extracted: ${outputPath}`)
  }
}

async function download(url, outputPath, redirects = 0) {
  await new Promise((resolve, reject) => {
    const request = get(
      url,
      {
        headers: {
          'user-agent': 'bangumi-electron-install-app-deps',
        },
      },
      async (response) => {
        const location = response.headers.location

        if (
          response.statusCode != null &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          location != null
        ) {
          response.resume()
          if (redirects >= 5) {
            reject(new Error(`Too many redirects while downloading ${url}`))
            return
          }

          try {
            await download(new URL(location, url).toString(), outputPath, redirects + 1)
            resolve()
          } catch (error) {
            reject(error)
          }
          return
        }

        if (response.statusCode !== 200) {
          response.resume()
          reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`))
          return
        }

        try {
          await pipeline(response, createWriteStream(outputPath))
          resolve()
        } catch (error) {
          reject(error)
        }
      },
    )

    request.on('error', reject)
  })
}
