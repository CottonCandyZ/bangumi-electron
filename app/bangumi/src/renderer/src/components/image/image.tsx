import { Skeleton } from '@renderer/components/ui/skeleton'
import { cn } from '@renderer/lib/utils'
import { ImageLoadCache } from '@renderer/state/global-var'
import { useEffect, useState } from 'react'

type ImageProps = React.HTMLAttributes<HTMLDivElement> & {
  imageSrc?: string
  imageClassName?: string
  loading?: 'eager' | 'lazy'
  loadingClassName?: string
  careLoading?: boolean
}

export function Image({
  className,
  imageSrc,
  imageClassName,
  loadingClassName,
  careLoading = false,
  loading = 'lazy',
  children,
  ...props
}: ImageProps) {
  const [isLoad, setIsLoad] = useState(imageSrc ? (ImageLoadCache.get(imageSrc) ?? false) : false)
  const [isError, setIsError] = useState(false)
  const [stateImageSrc, setStateImageSrc] = useState(imageSrc)
  const [prevImageSrc, setPrevImageSrc] = useState(imageSrc)
  if (prevImageSrc !== imageSrc) {
    setPrevImageSrc(imageSrc)
    setStateImageSrc(imageSrc)
  }

  // 只在出错时才注册重试；正常挂载不做任何事（页面切换时会同时挂载上百张图片）
  useEffect(() => {
    if (!isError) return
    const refresh = () => {
      setStateImageSrc(imageSrc)
    }
    if (navigator.onLine) {
      const timeId = setTimeout(refresh, 5000)
      return () => clearTimeout(timeId)
    }
    window.addEventListener('online', refresh)
    return () => window.removeEventListener('online', refresh)
  }, [isError, imageSrc])

  return (
    <div
      className={cn(
        'relative z-0 rounded-[inherit]',
        (!stateImageSrc || (careLoading && !isLoad)) && loadingClassName,
        className,
      )}
      {...props}
      key={imageSrc}
      draggable={false}
    >
      <img
        className={cn(
          'h-full w-full max-w-none rounded-[inherit] object-cover select-none',
          imageClassName,
          (!imageSrc || isError || (careLoading && !isLoad)) && 'invisible',
        )}
        onLoad={() => {
          setIsLoad(true)
          setIsError(false)
          if (imageSrc) ImageLoadCache.set(imageSrc, true)
        }}
        onError={() => {
          setIsError(true)
          setStateImageSrc(undefined)
        }}
        decoding="async"
        loading={loading}
        src={stateImageSrc}
        draggable={false}
      />
      {(!imageSrc || isError || !isLoad) && (
        <Skeleton className="absolute inset-0 -z-10 rounded-[inherit]" />
      )}
      {children}
    </div>
  )
}
