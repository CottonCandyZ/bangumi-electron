import { MotionSkeleton } from '@renderer/components/ui/motion-skeleton'
import { cn } from '@renderer/lib/utils'
import { HTMLMotionProps, motion } from 'framer-motion'
import { forwardRef, useState } from 'react'

export const CoverMotionImage = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & {
    imageSrc?: string
    imageClassName?: string
    loadingClassName?: string
    loading?: 'eager' | 'lazy'
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
      ...props
    },
    ref,
  ) => {
    const [isLoad, setIsLoad] = useState(false)
    return (
      <motion.div
        className={cn('relative z-0', (!imageSrc || !isLoad) && loadingClassName, className)}
        ref={ref}
        {...props}
        draggable={false}
      >
        <motion.img
          className={cn(
            'h-full w-full max-w-none select-none object-cover',
            imageClassName,
            !imageSrc && 'invisible',
          )}
          loading={loading}
          src={imageSrc}
          onLoad={() => setIsLoad(true)}
          draggable={false}
        />
        <MotionSkeleton className={cn('absolute inset-0 -z-10')} />
      </motion.div>
    )
  },
)

CoverMotionImage.displayName = 'CoverMotionImage'
