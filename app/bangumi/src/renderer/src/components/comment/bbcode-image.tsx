import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { client } from '@renderer/lib/client'
import { cn } from '@renderer/lib/utils'
import { ExternalLinkIcon, Maximize2Icon, RefreshCcwIcon } from 'lucide-react'
import PhotoSwipe from 'photoswipe'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import 'photoswipe/style.css'
import { toast } from 'sonner'

type ImageStatus = 'loading' | 'loaded' | 'error'
export type ImagePreviewItem = {
  alt: string
  height: number
  id: string
  src: string
  width: number
}

type BBCodeImagePreviewContextValue = {
  openImage: (id: string, fallback: ImagePreviewItem) => void
  registerImage: (item: ImagePreviewItem) => void
  unregisterImage: (id: string) => void
}

const BBCodeImagePreviewContext = createContext<BBCodeImagePreviewContextValue | null>(null)

export function BBCodeImagePreviewProvider({ children }: { children: ReactNode }) {
  const itemsRef = useRef<ImagePreviewItem[]>([])

  const registerImage = useCallback((item: ImagePreviewItem) => {
    const index = itemsRef.current.findIndex((currentItem) => currentItem.id === item.id)

    if (index === -1) {
      itemsRef.current = [...itemsRef.current, item]
      return
    }

    const nextItems = [...itemsRef.current]
    nextItems[index] = item
    itemsRef.current = nextItems
  }, [])

  const unregisterImage = useCallback((id: string) => {
    itemsRef.current = itemsRef.current.filter((item) => item.id !== id)
  }, [])

  const openImage = useCallback((id: string, fallback: ImagePreviewItem) => {
    const registeredItems = itemsRef.current
    const items =
      registeredItems.length > 0 && registeredItems.some((item) => item.id === id)
        ? registeredItems
        : [fallback]
    const index = Math.max(
      0,
      items.findIndex((item) => item.id === id),
    )

    openImagePreview(items, index)
  }, [])

  const value = useMemo(
    () => ({
      openImage,
      registerImage,
      unregisterImage,
    }),
    [openImage, registerImage, unregisterImage],
  )

  return (
    <BBCodeImagePreviewContext.Provider value={value}>
      {children}
    </BBCodeImagePreviewContext.Provider>
  )
}

export function BBCodeImage({ src, alt = '' }: { src: string; alt?: string }) {
  const id = useId()
  const previewGroup = useContext(BBCodeImagePreviewContext)
  const [status, setStatus] = useState<ImageStatus>('loading')
  const [dimensions, setDimensions] = useState<{ height: number; width: number }>()
  const [retryKey, setRetryKey] = useState(0)
  const [retrying, setRetrying] = useState(false)
  const retryTimerRef = useRef<number | null>(null)

  useEffect(() => {
    setStatus('loading')
    setDimensions(undefined)
    setRetryKey(0)
    setRetrying(false)
    if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current)
  }, [src])

  useEffect(() => {
    if (!previewGroup || status !== 'loaded' || !dimensions) return

    previewGroup.registerImage({
      id,
      src,
      alt,
      width: dimensions.width,
      height: dimensions.height,
    })

    return () => {
      previewGroup.unregisterImage(id)
    }
  }, [alt, dimensions, id, previewGroup, src, status])

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current)
    }
  }, [])

  function openPreview() {
    const item = {
      id,
      src,
      alt,
      width: dimensions?.width ?? 1200,
      height: dimensions?.height ?? 800,
    }

    if (previewGroup) {
      previewGroup.openImage(id, item)
      return
    }

    openImagePreview([item], 0)
  }

  return (
    <span
      className={cn(
        'relative my-2 flex min-h-32 w-full max-w-xl items-center justify-center overflow-hidden rounded-md',
        status === 'loaded' && 'min-h-0 w-fit max-w-full',
      )}
    >
      {status === 'loaded' ? (
        <button
          type="button"
          className="group focus-visible:ring-ring relative max-w-full cursor-zoom-in rounded-md text-left focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label="全屏预览图片"
          onClick={openPreview}
        >
          <img
            key={`${src}-${retryKey}`}
            className="max-h-96 max-w-full rounded-md object-contain select-none"
            src={src}
            alt={alt}
            loading="lazy"
            referrerPolicy="no-referrer"
            draggable={false}
            onLoad={(event) => {
              setStatus('loaded')
              setDimensions({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })
            }}
            onError={() => setStatus('error')}
          />
          <span className="absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Maximize2Icon className="size-4" />
          </span>
        </button>
      ) : (
        <img
          key={`${src}-${retryKey}`}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          draggable={false}
          onLoad={(event) => {
            setStatus('loaded')
            setDimensions({
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            })
          }}
          onError={() => setStatus('error')}
        />
      )}
      {status === 'loading' && <Skeleton className="absolute inset-0" />}
      {status === 'error' && (
        <span className="bg-muted/70 relative z-10 flex h-full min-h-32 w-full flex-col items-center justify-center gap-2 rounded-md border p-4">
          <span className="text-muted-foreground text-sm">图片加载失败</span>
          <span className="flex flex-row flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn('group gap-2 shadow-none', retrying && 'text-primary')}
              onClick={() => {
                setStatus('loading')
                setRetrying(true)
                setRetryKey((key) => key + 1)
                if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current)
                retryTimerRef.current = window.setTimeout(() => setRetrying(false), 700)
              }}
            >
              <RefreshCcwIcon
                className={cn(
                  'size-4 transition-transform duration-150 group-active:rotate-90',
                  retrying && 'animate-spin',
                )}
              />
              {retrying ? '正在重试' : '重试'}
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2 shadow-none">
              <a className="bbcode-image-action-link" href={src} target="_blank" rel="noreferrer">
                <ExternalLinkIcon className="size-4" />
                浏览器打开
              </a>
            </Button>
          </span>
        </span>
      )}
    </span>
  )
}

export function openImagePreview(items: ImagePreviewItem[], index: number) {
  const pswp = new PhotoSwipe({
    dataSource: items.map((item) => ({
      src: item.src,
      alt: item.alt,
      width: item.width,
      height: item.height,
    })),
    index,
    bgOpacity: 0.9,
    imageClickAction: 'zoom',
    tapAction: 'zoom',
    doubleTapAction: 'zoom',
    bgClickAction: 'close',
    wheelToZoom: true,
    closeTitle: '关闭图片预览',
    zoomTitle: '缩放图片',
    arrowPrevTitle: '上一张图片',
    arrowNextTitle: '下一张图片',
    errorMsg: '图片加载失败',
    mainClass: 'bangumi-image-preview no-drag-region',
  })

  pswp.on('uiRegister', () => {
    pswp.ui?.registerElement({
      name: 'download',
      className: 'pswp__button--download',
      title: '下载图片',
      ariaLabel: '下载图片',
      order: 9,
      isButton: true,
      html: {
        isCustomSVG: true,
        inner:
          '<path d="M15 6h2v13l5-5 1.4 1.4L16 22.8l-7.4-7.4L10 14l5 5V6z" id="pswp__icn-download"/><path d="M9 25h14v2H9v-2z"/>',
        outlineID: 'pswp__icn-download',
        size: 32,
      },
      onClick: (event) => {
        event.preventDefault()
        event.stopPropagation()
        const data = pswp.currSlide?.data as { alt?: string; src?: string } | undefined
        void downloadImage(data?.src, data?.alt)
      },
    })
  })

  pswp.init()
}

async function downloadImage(src: string | undefined, alt: string | undefined) {
  if (!src) return

  const toastId = toast.loading('正在下载图片')
  try {
    const result = await client.downloadImage({
      url: src,
      filename: getImageDownloadName(src, alt),
    })
    toast.success('图片已下载', {
      id: toastId,
      description: result.filePath,
    })
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '图片下载失败', {
      id: toastId,
    })
  }
}

function getImageDownloadName(src: string, alt: string | undefined) {
  const filename = getUrlFilename(src)
  if (filename) return filename

  const sanitizedAlt = alt?.trim().replace(/[\\/:*?"<>|]+/g, '_')
  return sanitizedAlt ? `${sanitizedAlt}.jpg` : 'bangumi-image.jpg'
}

function getUrlFilename(src: string) {
  try {
    const url = new URL(src, window.location.href)
    return url.pathname.split('/').pop() || undefined
  } catch {
    return src.split('?')[0].split('#')[0].split('/').pop() || undefined
  }
}
