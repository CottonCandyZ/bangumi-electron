import { createStore, get, update } from 'idb-keyval'

type ImageDimensions = { width: number; height: number }

const CACHE_KEY = 'sizes-v1'
const CACHE_LIMIT = 2048
const WRITE_DELAY_MS = 250
const RESIZE_PREFIXES = ['', '/r/1200', '/r/800', '/r/600', '/r/400', '/r/200', '/r/100']

let dimensions = new Map<string, ImageDimensions>()
let pending = new Map<string, ImageDimensions>()
let storage: ReturnType<typeof createStore> | undefined
let writeScheduled = false

function getStorage() {
  return (storage ??= createStore('image-cache', 'dimensions'))
}

export async function restoreImageDimensions() {
  try {
    const saved = await get<Map<string, ImageDimensions>>(CACHE_KEY, getStorage())
    if (saved instanceof Map) {
      const merged = new Map<string, ImageDimensions>()
      for (const [src, size] of saved) setRecentSize(merged, src, size)
      // Measurements can already arrive while IndexedDB is loading.
      for (const [src, size] of dimensions) setRecentSize(merged, src, size)
      dimensions = merged
    }
  } catch {
    // Images can still use their fallback and be measured during this session.
  }
}

function imageUrl(src: string) {
  if (!src || src.length > 2048) return undefined
  try {
    const url = new URL(src, document.baseURI)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : undefined
  } catch {
    return undefined
  }
}

export function getImageLayoutDimensions(src: string) {
  const url = imageUrl(src)
  if (!url) return undefined

  const exact = dimensions.get(url.href)
  if (exact || url.origin !== 'https://lain.bgm.tv') return exact

  // Bangumi's width-only resizes preserve the original ratio. Cropped grid variants do not.
  const originalPath = url.pathname.match(/^(?:\/r\/\d+)?(\/pic\/(?:cover|crt)\/l\/.+)$/)?.[1]
  if (!originalPath) return undefined

  for (const prefix of RESIZE_PREFIXES) {
    const alternative = `${url.origin}${prefix}${originalPath}${url.search}${url.hash}`
    const cached = dimensions.get(alternative)
    if (cached) return cached
  }
  return undefined
}

function setRecentSize(cache: Map<string, ImageDimensions>, src: string, size: ImageDimensions) {
  cache.delete(src)
  cache.set(src, size)
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!)
}

function scheduleWrite() {
  if (writeScheduled || pending.size === 0) return
  writeScheduled = true
  setTimeout(() => void storePendingDimensions(), WRITE_DELAY_MS)
}

async function storePendingDimensions() {
  const batch = pending
  pending = new Map()

  try {
    await update<Map<string, ImageDimensions>>(
      CACHE_KEY,
      (saved) => {
        const cache = saved instanceof Map ? saved : new Map<string, ImageDimensions>()
        for (const [src, size] of batch) setRecentSize(cache, src, size)
        return cache
      },
      getStorage(),
    )
  } catch {
    // A storage failure must not affect image rendering.
  } finally {
    writeScheduled = false
    scheduleWrite()
  }
}

export function rememberImageDimensions(image: HTMLImageElement) {
  const { naturalWidth: width, naturalHeight: height } = image
  if (!width || !height) return

  const src = imageUrl(image.currentSrc || image.src)?.href
  if (!src) return

  const previous = dimensions.get(src)
  if (previous?.width === width && previous.height === height) return

  const size = { width, height }
  setRecentSize(dimensions, src, size)
  setRecentSize(pending, src, size)
  scheduleWrite()
}
