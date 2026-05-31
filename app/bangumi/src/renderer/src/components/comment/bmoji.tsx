import { BMOJI_ASSET_BASE_URL, BMOJI_MANIFEST } from '@renderer/components/comment/bmoji-data'
import { cn } from '@renderer/lib/utils'
import { useEffect, useMemo, useState } from 'react'

const BMOJI_SCRIPT_URL = 'https://bgm.tv/js/lib/bmo/bmo.js?v3'

type BmojiLayerModifiers = {
  x?: number
  y?: number
}

type BmojiLayer = {
  key: string
  layer: number
  order: number
  src: string
  modifiers?: BmojiLayerModifiers
}

type BmojiDecodedItem = {
  category?: string
  id?: string
  layer?: number
  meta?: {
    src?: string
  }
  modifiers?: BmojiLayerModifiers
  order?: number
  src?: string
}

type BmojiAPI = {
  decode: (code: string) => { items: BmojiDecodedItem[] } | null
  setAssets?: (assets: typeof BMOJI_MANIFEST) => void
}

declare global {
  interface Window {
    Bmoji?: BmojiAPI
    __BMOJI_ASSETS__?: typeof BMOJI_MANIFEST
  }
}

const BMOJI_ASSET_INDEX = createBmojiAssetIndex()

let bmojiScriptPromise: Promise<void> | null = null

export function Bmoji({ code, className }: { code: string; className?: string }) {
  const normalizedCode = normalizeBmojiCode(code)
  const expandedLayers = useMemo(
    () => (normalizedCode.startsWith('bmoC') ? null : resolveExpandedBmojiLayers(normalizedCode)),
    [normalizedCode],
  )
  const [compactLayers, setCompactLayers] = useState<BmojiLayer[] | null>(null)

  useEffect(() => {
    if (!normalizedCode.startsWith('bmoC')) {
      setCompactLayers(null)
      return
    }

    let cancelled = false
    setCompactLayers(null)
    loadBmojiDecoder()
      .then(() => {
        if (cancelled) return
        setCompactLayers(resolveCompactBmojiLayers(normalizedCode))
      })
      .catch(() => {
        if (!cancelled) setCompactLayers([])
      })

    return () => {
      cancelled = true
    }
  }, [normalizedCode])

  const layers = expandedLayers ?? compactLayers ?? []
  const loading = expandedLayers === null && compactLayers === null
  const hasLayers = layers.length > 0

  return (
    <span
      aria-label={`(${normalizedCode})`}
      className={cn(
        'bmo bbcode-bmoji relative inline-flex size-6 shrink-0 overflow-hidden align-text-bottom',
        className,
      )}
      data-bmoji-status={loading ? 'loading' : hasLayers ? 'rendered' : 'error'}
      data-code={normalizedCode}
      role="img"
      title={`(${normalizedCode})`}
    >
      {hasLayers
        ? layers.map((layer) => (
            <img
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-contain"
              draggable={false}
              key={layer.key}
              src={layer.src}
              style={{
                transform: getLayerTransform(layer.modifiers),
                zIndex: layer.layer * 100 + layer.order,
              }}
            />
          ))
        : `(${normalizedCode})`}
    </span>
  )
}

function normalizeBmojiCode(code: string) {
  return code.trim().replace(/^\((.*)\)$/, '$1')
}

function resolveExpandedBmojiLayers(code: string): BmojiLayer[] {
  if (!code.startsWith('bmo_')) return []

  const tokens = code.slice(4).split('_').filter(Boolean)
  if (tokens.length === 0) return []

  const layers: BmojiLayer[] = []

  for (const token of tokens) {
    const key = token.split(':', 1)[0]
    const asset = BMOJI_ASSET_INDEX.get(key)
    if (!asset) return []

    layers.push({
      key,
      layer: asset.layer,
      order: asset.order,
      src: asset.src,
    })
  }

  return sortLayers(layers)
}

function resolveCompactBmojiLayers(code: string): BmojiLayer[] {
  const decoded = window.Bmoji?.decode(code)
  if (!decoded?.items.length) return []

  return sortLayers(
    decoded.items
      .map((item, index): BmojiLayer | null => {
        const src = normalizeAssetSrc(item.meta?.src ?? item.src)
        if (!src) return null

        return {
          key: `${item.category ?? 'item'}-${item.id ?? index}`,
          layer: item.layer ?? 0,
          modifiers: item.modifiers,
          order: item.order ?? index,
          src,
        }
      })
      .filter((item): item is BmojiLayer => item !== null),
  )
}

function createBmojiAssetIndex() {
  const index = new Map<string, Omit<BmojiLayer, 'key'>>()

  Object.values(BMOJI_MANIFEST).forEach((category) => {
    category.items.forEach((item, order) => {
      const code = `${category.id}${item.id}`
      index.set(code, {
        layer: item.layer,
        order,
        src: normalizeAssetSrc(item.src) ?? '',
      })
    })
  })

  return index
}

function normalizeAssetSrc(src?: string) {
  if (!src) return undefined
  if (src.startsWith('http://') || src.startsWith('https://')) return src

  const match = src.match(/(?:^|\/)assets\/([^/?#]+)/)
  if (match) return `${BMOJI_ASSET_BASE_URL}${match[1]}`

  const filename = src.replace(/^\.?\//, '')
  return `${BMOJI_ASSET_BASE_URL}${filename}`
}

function sortLayers(layers: BmojiLayer[]) {
  return layers.sort((a, b) => {
    if (a.layer !== b.layer) return a.layer - b.layer
    return a.order - b.order
  })
}

function getLayerTransform(modifiers?: BmojiLayerModifiers) {
  if (!modifiers?.x && !modifiers?.y) return undefined
  return `translate(${modifiers.x ?? 0}px, ${modifiers.y ?? 0}px)`
}

function loadBmojiDecoder() {
  window.__BMOJI_ASSETS__ = BMOJI_MANIFEST

  if (window.Bmoji?.decode) {
    window.Bmoji.setAssets?.(BMOJI_MANIFEST)
    return Promise.resolve()
  }
  if (bmojiScriptPromise) return bmojiScriptPromise

  bmojiScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-bmoji-script="${BMOJI_SCRIPT_URL}"]`,
    )
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Bmoji')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = BMOJI_SCRIPT_URL
    script.async = true
    script.dataset.bmojiScript = BMOJI_SCRIPT_URL
    script.onload = () => {
      window.Bmoji?.setAssets?.(BMOJI_MANIFEST)
      resolve()
    }
    script.onerror = () => reject(new Error('Failed to load Bmoji'))
    document.head.appendChild(script)
  })

  return bmojiScriptPromise
}
