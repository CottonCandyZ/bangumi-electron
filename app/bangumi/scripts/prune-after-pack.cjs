const { rm } = require('node:fs/promises')
const { join } = require('node:path')

module.exports = async function pruneAfterPack(context) {
  const unpackedRoot = join(context.appOutDir, 'resources', 'app.asar.unpacked', 'node_modules')
  const platform = context.electronPlatformName

  await Promise.all([
    pruneBetterSqlite3(unpackedRoot),
    pruneMacOSTrafficLights(unpackedRoot, platform),
    pruneKoffi(unpackedRoot, platform, context.arch),
    pruneVelopack(unpackedRoot, platform, context.arch),
  ])
}

async function pruneBetterSqlite3(unpackedRoot) {
  const root = join(unpackedRoot, 'better-sqlite3')
  await removeAll([
    join(root, 'deps'),
    join(root, 'src'),
    join(root, 'build', 'deps'),
    join(root, 'build', 'Release', 'obj'),
    join(root, 'build', 'Release', 'better_sqlite3.iobj'),
    join(root, 'build', 'Release', 'better_sqlite3.ipdb'),
    join(root, 'build', 'Release', 'better_sqlite3.pdb'),
    join(root, 'build', 'Release', 'better_sqlite3.lib'),
    join(root, 'build', 'Release', 'better_sqlite3.exp'),
    join(root, 'build', 'Release', 'sqlite3.lib'),
    join(root, 'build', 'Release', 'test_extension.node'),
  ])
}

async function pruneMacOSTrafficLights(unpackedRoot, platform) {
  const root = join(unpackedRoot, 'bangumi-macos-traffic-lights')

  if (platform !== 'darwin') {
    await remove(root)
    return
  }

  await removeAll([join(root, 'src'), join(root, 'build', 'Release', 'obj')])
}

async function pruneKoffi(unpackedRoot, platform, contextArch) {
  const root = join(unpackedRoot, 'koffi', 'build', 'koffi')
  const arch = getArchName(contextArch)
  const keepPrefixes =
    {
      win32: arch ? [`win32_${arch === 'ia32' ? 'ia32' : arch}`] : ['win32_'],
      darwin: arch && arch !== 'universal' ? [`darwin_${arch}`] : ['darwin_'],
      linux: arch && arch !== 'ia32' ? [`linux_${arch}`, `musl_${arch}`] : ['linux_', 'musl_'],
    }[platform] ?? null

  if (!keepPrefixes) return
  await Promise.all([
    removeExcept(root, keepPrefixes),
    removeAll([
      join(unpackedRoot, 'koffi', 'doc'),
      join(unpackedRoot, 'koffi', 'lib'),
      join(unpackedRoot, 'koffi', 'src'),
      join(unpackedRoot, 'koffi', 'vendor'),
    ]),
  ])
}

async function pruneVelopack(unpackedRoot, platform, contextArch) {
  const root = join(unpackedRoot, 'velopack', 'lib', 'native')
  const arch = getArchName(contextArch)
  const winArch = arch === 'ia32' ? 'x86' : arch
  const keepParts =
    {
      win32: winArch ? [`_win_${winArch}_`] : ['_win_'],
      darwin: ['_osx.'],
      linux: arch ? [`_linux_${arch}_`] : ['_linux_'],
    }[platform] ?? null

  if (!keepParts) return
  await removeExcept(root, keepParts)
}

function getArchName(arch) {
  if (arch === 'ia32' || arch === 0) return 'ia32'
  if (arch === 'x64' || arch === 1) return 'x64'
  if (arch === 'arm64' || arch === 3) return 'arm64'
  if (arch === 'universal' || arch === 4) return 'universal'
  return null
}

async function removeExcept(root, keepParts) {
  let entries
  try {
    entries = await require('node:fs/promises').readdir(root, { withFileTypes: true })
  } catch {
    return
  }

  await Promise.all(
    entries
      .filter((entry) => !keepParts.some((part) => entry.name.includes(part)))
      .map((entry) => remove(join(root, entry.name))),
  )
}

async function removeAll(paths) {
  await Promise.all(paths.map(remove))
}

async function remove(path) {
  await rm(path, { recursive: true, force: true })
}
