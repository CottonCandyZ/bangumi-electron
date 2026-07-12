const { chmod, copyFile, mkdir, rm } = require('node:fs/promises')
const { join } = require('node:path')
const { spawn } = require('node:child_process')

const BRIDGE_DIR = join(__dirname, '..', 'native', 'velopack-bridge')

/**
 * Build and install the Rust prerelease bridge for the exact platform/architecture currently
 * being packaged by electron-builder. Building from source avoids shipping a second set of
 * precompiled binaries for every platform in each application package.
 */
async function buildVelopackBridge(context) {
  const target = getRustTarget(context.electronPlatformName, context.arch)
  const executableName =
    context.electronPlatformName === 'win32'
      ? 'bangumi-velopack-bridge.exe'
      : 'bangumi-velopack-bridge'

  await run('cargo', ['build', '--locked', '--release', '--target', target], BRIDGE_DIR)

  const source = join(BRIDGE_DIR, 'target', target, 'release', executableName)
  const destinationDir = join(getPackagedResourcesDir(context), 'velopack-bridge')
  const destination = join(destinationDir, executableName)

  await rm(destinationDir, { recursive: true, force: true })
  await mkdir(destinationDir, { recursive: true })
  await copyFile(source, destination)
  if (context.electronPlatformName !== 'win32') await chmod(destination, 0o755)
}

function getPackagedResourcesDir(context) {
  if (context.electronPlatformName === 'darwin') {
    return join(
      context.appOutDir,
      `${context.packager.appInfo.productFilename}.app`,
      'Contents',
      'Resources',
    )
  }

  return join(context.appOutDir, 'resources')
}

function getRustTarget(platform, arch) {
  const archName = getArchName(arch)
  const targets = {
    win32: {
      x64: 'x86_64-pc-windows-msvc',
      arm64: 'aarch64-pc-windows-msvc',
    },
    darwin: {
      x64: 'x86_64-apple-darwin',
      arm64: 'aarch64-apple-darwin',
    },
    linux: {
      x64: 'x86_64-unknown-linux-gnu',
      arm64: 'aarch64-unknown-linux-gnu',
    },
  }

  const target = targets[platform]?.[archName]
  if (!target) {
    throw new Error(
      `The Velopack prerelease bridge does not support ${platform}/${archName ?? arch}.`,
    )
  }
  return target
}

function getArchName(arch) {
  if (arch === 'x64' || arch === 1) return 'x64'
  if (arch === 'arm64' || arch === 3) return 'arm64'
  return undefined
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', shell: false })
    child.once('error', reject)
    child.once('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
  })
}

module.exports = { buildVelopackBridge, getPackagedResourcesDir }
