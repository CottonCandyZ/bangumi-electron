import { Skeleton } from '@renderer/components/ui/skeleton'
import { cn } from '@renderer/lib/utils'
import React, { useEffect, useState } from 'react'

export const Image = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    imageSrc?: string
    imageClassName?: string
    loading?: 'eager' | 'lazy'
    loadingClassName?: string
  }
>(({ className, imageSrc, imageClassName, loadingClassName, loading = 'lazy', ...props }, ref) => {
  const [isLoad, setIsLoad] = useState(false)
  useEffect(() => {
    setIsLoad(false)
  }, [imageSrc])
  return (
    <div
      className={cn('relative', (!imageSrc || !isLoad) && loadingClassName, className)}
      ref={ref}
      {...props}
      draggable={false}
    >
      <img
        className={cn(
          'h-full w-full max-w-none select-none object-cover',
          imageClassName,
          (!imageSrc || !isLoad) && 'invisible',
        )}
        loading={loading}
        src={imageSrc}
        onLoad={() => setIsLoad(true)}
        draggable={false}
      />
      {(!imageSrc || !isLoad) && <Skeleton className={cn('absolute inset-0')} />}
    </div>
  )
})

Image.displayName = 'Image'
