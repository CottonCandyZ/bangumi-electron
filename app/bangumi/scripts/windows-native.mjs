import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { execFileSync } from 'node:child_process'

const require = createRequire(import.meta.url)

// electron-builder's npmRebuild:false keeps the host's SQLite binary. Replace it
// only while packing Windows, then restore it so local development still works.
export function withWindowsSqlitePrebuild(arch, pack) {
  if (process.platform === 'win32') return pack()

  const machine = { x64: 0x8664, arm64: 0xaa64 }[arch]
  if (machine == null) throw new Error(`Unsupported Windows architecture: ${arch}`)

  const sqliteDir = dirname(require.resolve('better-sqlite3/package.json'))
  const electronDir = dirname(require.resolve('electron/package.json'))
  const { version } = JSON.parse(readFileSync(join(sqliteDir, 'package.json'), 'utf8'))
  const abi = readFileSync(join(electronDir, 'abi_version'), 'utf8').trim()
  const archive = `better-sqlite3-v${version}-electron-v${abi}-win32-${arch}.tar.gz`
  const url = `https://github.com/WiseLibs/better-sqlite3/releases/download/v${version}/${archive}`
  const binary = join(sqliteDir, 'build', 'Release', 'better_sqlite3.node')
  const original = existsSync(binary) ? readFileSync(binary) : undefined
  const tempDir = mkdtempSync(join(tmpdir(), 'bangumi-windows-sqlite-'))

  try {
    execFileSync(
      'curl',
      [
        '--fail',
        '--location',
        '--silent',
        '--show-error',
        '--retry',
        '3',
        '--output',
        join(tempDir, archive),
        url,
      ],
      {
        stdio: 'inherit',
      },
    )
    execFileSync('tar', ['-xzf', join(tempDir, archive), '-C', tempDir], { stdio: 'inherit' })
    const prebuild = join(tempDir, 'build', 'Release', 'better_sqlite3.node')
    const data = readFileSync(prebuild)
    const peOffset = data.length >= 64 ? data.readUInt32LE(0x3c) : -1
    if (
      data.toString('ascii', 0, 2) !== 'MZ' ||
      peOffset < 0 ||
      peOffset + 6 > data.length ||
      data.toString('ascii', peOffset, peOffset + 4) !== 'PE\u0000\u0000' ||
      data.readUInt16LE(peOffset + 4) !== machine
    ) {
      throw new Error(`SQLite prebuild is not a Windows ${arch} PE binary`)
    }
    mkdirSync(dirname(binary), { recursive: true })
    copyFileSync(prebuild, binary)
    return pack()
  } finally {
    if (original == null) rmSync(binary, { force: true })
    else writeFileSync(binary, original)
    rmSync(tempDir, { recursive: true, force: true })
  }
}
