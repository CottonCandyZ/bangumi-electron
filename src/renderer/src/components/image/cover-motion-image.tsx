import { MotionSkeleton } from '@renderer/components/ui/motion-skeleton'
import { cn } from '@renderer/lib/utils'
import { HTMLMotionProps, motion } from 'framer-motion'
import { forwardRef } from 'react'

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
    return (
      <motion.div
        className={cn('relative z-0', !imageSrc && loadingClassName, className)}
        ref={ref}
        key={imageSrc}
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
          draggable={false}
        />
        <MotionSkeleton className={cn('absolute inset-0 -z-10')} />
      </motion.div>
    )
  },
)

CoverMotionImage.displayName = 'CoverMotionImage'
