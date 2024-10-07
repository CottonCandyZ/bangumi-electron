import os from 'node:os'

const { platform } = process
export const isMacOS = platform === 'darwin'

export const isWindows = platform === 'win32'

export const isLinux = platform === 'linux'
export const isWindows11 = isWindows && os.version().startsWith('Windows 11')
