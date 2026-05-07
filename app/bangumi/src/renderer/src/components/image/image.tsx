import { Skeleton } from '@renderer/components/ui/skeleton'
import { cn } from '@renderer/lib/utils'
import { ImageLoadCache } from '@renderer/state/global-var'
import { useEffect, useRef, useState } from 'react'

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
  const errorTimeId = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    setStateImageSrc(imageSrc)
  }, [imageSrc])

  useEffect(() => {
    clearTimeout(errorTimeId.current)
    const refresh = () => {
      setStateImageSrc(imageSrc)
    }
    window.removeEventListener('online', refresh)
    if (isError) {
      if (navigator.onLine) {
        errorTimeId.current = setTimeout(refresh, 5000)
      } else {
        window.addEventListener('online', refresh)
      }
    }
  }, [isError, imageSrc])

  return (
    <div
      className={cn(
        'relative z-0',
        (!stateImageSrc || (careLoading && !isLoad)) && loadingClassName,
        className,
      )}
      {...props}
      key={imageSrc}
      draggable={false}
    >
      <img
        className={cn(
          'h-full w-full max-w-none object-cover select-none',
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
        loading={isLoad ? 'eager' : loading}
        src={stateImageSrc}
        draggable={false}
      />
      <Skeleton className="absolute inset-0 -z-10" />
      {children}
    </div>
  )
}
