import { MotionSkeleton } from '@renderer/components/ui/motion-skeleton'
import { cn } from '@renderer/lib/utils'
import { ImageLoadCache } from '@renderer/state/global-var'
import { HTMLMotionProps, motion } from 'framer-motion'
import { forwardRef, useEffect, useRef, useState } from 'react'

export const CoverMotionImage = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & {
    imageSrc?: string
    imageClassName?: string
    loadingClassName?: string
    loading?: 'eager' | 'lazy'
    careLoading: boolean
    onload?: (load: boolean) => void
  }
>(
  (
    {
      className,
      imageClassName,
      imageSrc,
      loading = 'lazy',
      loadingClassName = 'aspect-[2/3]',
      careLoading = false,
      ...props
    },
    ref,
  ) => {
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
      <motion.div
        className={cn(
          'relative z-0',
          (!stateImageSrc || (careLoading && !isLoad)) && loadingClassName,
          className,
        )}
        ref={ref}
        key={imageSrc}
        {...props}
        draggable={false}
      >
        <motion.img
          className={cn(
            'h-full w-full max-w-none select-none object-cover',
            imageClassName,
            (!imageSrc || isError) && 'invisible',
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
        <MotionSkeleton className={cn('absolute inset-0 -z-10')} />
      </motion.div>
    )
  },
)

CoverMotionImage.displayName = 'CoverMotionImage'
