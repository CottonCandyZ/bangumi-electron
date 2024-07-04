import { Skeleton } from '@renderer/components/ui/skeleton'
import { cn } from '@renderer/lib/utils'
import React, { useState } from 'react'

export const Image = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { imageSrc?: string; imageClassName?: string }
>(({ className, imageSrc, imageClassName, ...props }, ref) => {
  const [isLoad, setIsLoad] = useState(false)
  return (
    <div className={cn('relative', className)} ref={ref}>
      <img
        className={cn(
          'h-full w-full max-w-none object-cover',
          imageClassName,
          (!imageSrc || !isLoad) && 'invisible',
        )}
        loading="lazy"
        src={imageSrc}
        {...props}
        onLoad={() => setIsLoad(true)}
      />
      {(!imageSrc || !isLoad) && <Skeleton className={cn('absolute inset-0')} />}
    </div>
  )
})

Image.displayName = 'Image'
