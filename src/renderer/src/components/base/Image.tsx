import { Skeleton } from '@renderer/components/ui/skeleton'
import { cn } from '@renderer/lib/utils'
import { forwardRef, useState } from 'react'

export const Image = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    imageSrc?: string
    imageClassName?: string
    loading?: 'eager' | 'lazy'
    loadingClassName?: string
    isLoadInit?: boolean
  }
>(
  (
    {
      className,
      imageSrc,
      imageClassName,
      loadingClassName,
      loading = 'lazy',
      isLoadInit = false,
      children,
      ...props
    },
    ref,
  ) => {
    const [isLoad, setIsLoad] = useState(isLoadInit)
    return (
      <div
        className={cn('relative z-0', (!imageSrc || !isLoad) && loadingClassName, className)}
        ref={ref}
        {...props}
        key={imageSrc}
        draggable={false}
      >
        <img
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
        <Skeleton className={cn('absolute inset-0 -z-10')} />
        {children}
      </div>
    )
  },
)

Image.displayName = 'Image'
