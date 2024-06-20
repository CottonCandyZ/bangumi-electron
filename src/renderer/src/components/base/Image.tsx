import { Skeleton } from '@renderer/components/ui/skeleton'
import { cn } from '@renderer/lib/utils'
import React, { useState } from 'react'

export const Image = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, src, ...props }, ref) => {
    const [isLoad, setIsLoad] = useState(false)
    return (
      <>
        <img
          className={cn('max-w-none', className, !isLoad && 'size-0')}
          loading="lazy"
          ref={ref}
          src={src}
          {...props}
          onLoad={() => setIsLoad(true)}
        />
        {!isLoad && <Skeleton className={cn(className)} />}
      </>
    )
  },
)

Image.displayName = 'Image'
