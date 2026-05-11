import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { cn } from '@renderer/lib/utils'
import { ExternalLinkIcon, RefreshCcwIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type ImageStatus = 'loading' | 'loaded' | 'error'

export function BBCodeImage({ src, alt = '' }: { src: string; alt?: string }) {
  const [status, setStatus] = useState<ImageStatus>('loading')
  const [retryKey, setRetryKey] = useState(0)
  const [retrying, setRetrying] = useState(false)
  const retryTimerRef = useRef<number | null>(null)

  useEffect(() => {
    setStatus('loading')
    setRetryKey(0)
    setRetrying(false)
    if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current)
  }, [src])

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current)
    }
  }, [])

  return (
    <span
      className={cn(
        'relative my-2 flex min-h-32 w-full max-w-xl items-center justify-center overflow-hidden rounded-md',
        status === 'loaded' && 'min-h-0 w-fit max-w-full',
      )}
    >
      <img
        key={`${src}-${retryKey}`}
        className={cn(
          'max-h-96 max-w-full rounded-md object-contain select-none',
          status !== 'loaded' && 'pointer-events-none absolute inset-0 h-full w-full opacity-0',
        )}
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        draggable={false}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
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
