import { Skeleton } from '@renderer/components/ui/skeleton'
import { cn } from '@renderer/lib/utils'
import React, { useState } from 'react'

export const Image = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, src, ...props }, ref) => {
    const [isLoad, setIsLoad] = useState(false)
    return (
      <div className={cn(className, 'relative')}>
        <img
          className={cn('max-w-none', className, !isLoad && 'invisible')}
          loading="lazy"
          ref={ref}
          src={src}
          {...props}
          onLoad={() => setIsLoad(true)}
        />
        {!isLoad && <Skeleton className={cn('absolute inset-0')} />}
      </div>
    )
  },
)

Image.displayName = 'Image'
