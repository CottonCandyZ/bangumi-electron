import { MotionSkeleton } from '@renderer/components/ui/MotionSekleton'
import { cn } from '@renderer/lib/utils'
import { HTMLMotionProps, motion } from 'framer-motion'
import React, { useState } from 'react'

export const CoverMotionImage = React.forwardRef<
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
      onload,
      loading = 'lazy',
      loadingClassName = 'aspect-[2/3]',
      ...props
    },
    ref,
  ) => {
    const [isLoad, setIsLoad] = useState(false)
    onload && setTimeout(() => onload(isLoad), 400)
    return (
      <motion.div
        className={cn('relative', (!imageSrc || !isLoad) && loadingClassName, className)}
        ref={ref}
        {...props}
      >
        <motion.img
          className={cn(
            'h-full w-full max-w-none object-cover',
            imageClassName,
            (!imageSrc || !isLoad) && 'invisible',
            'z-0',
          )}
          loading={loading}
          src={imageSrc}
          onLoad={() => setIsLoad(true)}
        />
        {(!imageSrc || !isLoad) && <MotionSkeleton className={cn('absolute inset-0')} />}
      </motion.div>
    )
  },
)

CoverMotionImage.displayName = 'CoverMotionImage'
