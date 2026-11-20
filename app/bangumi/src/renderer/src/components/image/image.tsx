import { Skeleton } from '@renderer/components/ui/skeleton'
import { cn } from '@renderer/lib/utils'
import { ImageLoadCache } from '@renderer/state/global-var'
import { useEffect, useState } from 'react'
import { getImageLayoutDimensions, rememberImageDimensions } from './image-dimensions'

type ImageProps = React.HTMLAttributes<HTMLDivElement> & {
  imageSrc?: string
  imageClassName?: string
  loading?: 'eager' | 'lazy'
  loadingClassName?: string
  careLoading?: boolean
  fallbackAspectRatio?: string
}

export function Image(props: ImageProps) {
  return <ImageContent key={props.imageSrc} {...props} />
}

function ImageContent({
  className,
  imageSrc,
  imageClassName,
  loadingClassName,
  fallbackAspectRatio,
  careLoading = false,
  loading = 'lazy',
  children,
  ...props
}: ImageProps) {
  const [isLoad, setIsLoad] = useState(() => !!imageSrc && ImageLoadCache.get(imageSrc) === true)
  const [isError, setIsError] = useState(false)
  const [stateImageSrc, setStateImageSrc] = useState(imageSrc)

  const dimensions =
    fallbackAspectRatio && imageSrc ? getImageLayoutDimensions(imageSrc) : undefined
  const aspectRatio = dimensions
    ? `${dimensions.width} / ${dimensions.height}`
    : fallbackAspectRatio
  const waitingForLoad = careLoading && !isLoad
  const unavailable = !imageSrc || isError

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
        (!stateImageSrc || waitingForLoad) && loadingClassName,
        className,
      )}
      {...props}
      draggable={false}
    >
      <img
        className={cn(
          'h-full w-full max-w-none rounded-[inherit] object-cover select-none',
          fallbackAspectRatio && 'h-auto object-contain',
          imageClassName,
          (unavailable || waitingForLoad) && 'invisible',
        )}
        style={aspectRatio ? { aspectRatio: `auto ${aspectRatio}` } : undefined}
        onLoad={(event) => {
          rememberImageDimensions(event.currentTarget)
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
      {(unavailable || !isLoad) && (
        <Skeleton className="absolute inset-0 -z-10 rounded-[inherit]" />
      )}
      {children}
    </div>
  )
}
