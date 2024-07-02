import { MotionSkeleton } from '@renderer/components/ui/MotionSekleton'
import { cn } from '@renderer/lib/utils'
import { HTMLMotionProps, motion } from 'framer-motion'
import React, { useState } from 'react'

export const CoverMotionImage = React.forwardRef<HTMLImageElement, HTMLMotionProps<'img'>>(
  ({ className, src, ...props }, ref) => {
    const [isLoad, setIsLoad] = useState(false)
    return (
      <motion.div className={cn('relative', (!src || !isLoad) && 'aspect-[2/3]', className)}>
        <motion.img
          className={cn('max-w-none', className, (!src || !isLoad) && 'invisible')}
          loading="lazy"
          ref={ref}
          src={src}
          {...props}
          onLoad={() => setIsLoad(true)}
        />
        {(!src || !isLoad) && <MotionSkeleton className={cn('absolute inset-0')} />}
      </motion.div>
    )
  },
)

CoverMotionImage.displayName = 'CoverMotionImage'
