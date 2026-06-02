import { app, safeStorage, session } from 'electron'
import { t } from '@main/tipc/_init'
import { readAppConfig } from '@main/tipc/config'
import { access, mkdir, writeFile } from 'node:fs/promises'
import { extname, join, parse } from 'node:path'

type DownloadImageInput = {
  filename?: string
  url: string
}

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  'image/avif': '.avif',
  'image/bmp': '.bmp',
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/svg+xml': '.svg',
  'image/webp': '.webp',
}

function getImageDownloadName(input: DownloadImageInput, contentType: string | null) {
  const parsedUrl = new URL(input.url)
  const urlName = decodeURIComponent(parsedUrl.pathname.split('/').pop() || '')
  const baseName = sanitizeFilename(input.filename || urlName || 'bangumi-image')
  const extension =
    extname(baseName) || CONTENT_TYPE_EXTENSIONS[contentType?.split(';')[0] ?? ''] || '.jpg'

  return extname(baseName) ? baseName : `${baseName}${extension}`
}

function sanitizeFilename(filename: string) {
  const sanitized = filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/./g, (character) => (character.charCodeAt(0) < 32 ? '_' : character))
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180)

  return sanitized && sanitized !== '.' && sanitized !== '..' ? sanitized : 'bangumi-image'
}

async function getAvailableFilePath(filename: string) {
  const downloadsDir = readAppConfig().general.downloadDirectory || app.getPath('downloads')
  await mkdir(downloadsDir, { recursive: true })
  const target = join(downloadsDir, filename)

  try {
    await access(target)
  } catch {
    return target
  }

  const parsed = parse(filename)
  for (let index = 1; index < 1000; index += 1) {
    const nextTarget = join(downloadsDir, `${parsed.name} (${index})${parsed.ext}`)
    try {
      await access(nextTarget)
    } catch {
      return nextTarget
    }
  }

  return join(downloadsDir, `${parsed.name}-${Date.now()}${parsed.ext}`)
}

export const utils = {
  getSafeStorageEncrypted: t.procedure.input<{ origin: string[] }>().action(async ({ input }) => {
    return input.origin.map((item) => safeStorage.encryptString(item).toString('base64'))
  }),
  getSafeStorageDecrypted: t.procedure
    .input<{ encrypted: string[] }>()
    .action(async ({ input }) => {
      return input.encrypted.map((item) => safeStorage.decryptString(Buffer.from(item, 'base64')))
    }),
  getCookie: t.procedure.input<Electron.CookiesGetFilter>().action(async ({ input }) => {
    return await session.defaultSession.cookies.get(input)
  }),
  removeCookie: t.procedure.input<{ url: string; name: string }>().action(async ({ input }) => {
    return await session.defaultSession.cookies.remove(input.url, input.name)
  }),
  setCookie: t.procedure.input<Electron.CookiesSetDetails>().action(async ({ input }) => {
    return await session.defaultSession.cookies.set(input)
  }),
  downloadImage: t.procedure.input<DownloadImageInput>().action(async ({ input }) => {
    const url = new URL(input.url)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('不支持下载此图片地址')
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`图片下载失败：${response.status}`)
    }

    const contentType = response.headers.get('content-type')
    const filename = getImageDownloadName(input, contentType)
    const filePath = await getAvailableFilePath(filename)
    const buffer = Buffer.from(await response.arrayBuffer())

    await writeFile(filePath, buffer)

    return { filePath }
  }),
}
