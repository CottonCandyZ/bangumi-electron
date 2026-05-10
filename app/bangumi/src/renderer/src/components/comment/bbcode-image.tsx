import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { cn } from '@renderer/lib/utils'
import { RefreshCcwIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

type ImageStatus = 'loading' | 'loaded' | 'error'

export function BBCodeImage({ src, alt = '' }: { src: string; alt?: string }) {
  const [status, setStatus] = useState<ImageStatus>('loading')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    setStatus('loading')
    setRetryKey(0)
  }, [src])

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
          status !== 'loaded' && 'absolute inset-0 h-full w-full opacity-0',
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
        <span className="bg-muted/70 flex h-full min-h-32 w-full flex-col items-center justify-center gap-2 rounded-md border p-4">
          <span className="text-muted-foreground text-sm">图片加载失败</span>
          <Button
            variant="outline"
            size="sm"
            className="group border-primary/30 bg-background hover:border-primary hover:bg-primary hover:text-primary-foreground gap-2 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95"
            onClick={() => {
              setStatus('loading')
              setRetryKey((key) => key + 1)
            }}
          >
            <RefreshCcwIcon className="size-4 transition-transform duration-150 group-hover:-rotate-45 group-active:rotate-180" />
            重试
          </Button>
        </span>
      )}
    </span>
  )
}
