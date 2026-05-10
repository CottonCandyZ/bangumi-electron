import { cn } from '@renderer/lib/utils'
import { useEffect, useRef } from 'react'

const BMOJI_SCRIPT_URL = 'https://bgm.tv/js/lib/bmo/bmo.js?v3'
const BMOJI_MANIFEST_URL = 'https://bgm.tv/js/lib/bmo/assets/manifest.local.json'

type BmojiRenderOptions = {
  width?: number
  height?: number
  cache?: boolean
  renderAsImage?: boolean
}

type BmojiAPI = {
  render: (element: HTMLElement, options?: BmojiRenderOptions) => Promise<unknown> | unknown
}

declare global {
  interface Window {
    Bmoji?: BmojiAPI
    __BMOJI_MANIFEST_URL__?: string
  }
}

let bmojiScriptPromise: Promise<void> | null = null

export function Bmoji({ code, className }: { code: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let cancelled = false
    const element = ref.current
    if (!element) return

    element.textContent = `(${code})`
    element.dataset.code = code
    element.dataset.bmojiStatus = 'loading'

    loadBmojiScript()
      .then(() => {
        if (cancelled || !ref.current || !window.Bmoji?.render) return
        return window.Bmoji.render(ref.current, {
          width: 63,
          height: 63,
          renderAsImage: true,
        })
      })
      .catch(() => {
        if (ref.current) ref.current.dataset.bmojiStatus = 'error'
      })

    return () => {
      cancelled = true
    }
  }, [code])

  return (
    <span ref={ref} className={cn('bmo bbcode-bmoji', className)} data-code={code}>
      ({code})
    </span>
  )
}

function loadBmojiScript() {
  if (window.Bmoji?.render) return Promise.resolve()
  if (bmojiScriptPromise) return bmojiScriptPromise

  window.__BMOJI_MANIFEST_URL__ = BMOJI_MANIFEST_URL

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
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Bmoji'))
    document.head.appendChild(script)
  })

  return bmojiScriptPromise
}
