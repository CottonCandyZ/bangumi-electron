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
    careLoading?: boolean
  }
>(
  (
    {
      className,
      imageSrc,
      imageClassName,
      loadingClassName,
      careLoading = false,
      loading = 'lazy',
      children,
      ...props
    },
    ref,
  ) => {
    const [isLoad, setIsLoad] = useState(false)
    return (
      <div
        className={cn(
          'relative z-0',
          (!imageSrc || (careLoading && !isLoad)) && loadingClassName,
          className,
        )}
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
          onLoad={() => setIsLoad(true)}
          loading={loading}
          src={imageSrc}
          draggable={false}
        />
        <Skeleton className="absolute inset-0 -z-10" />
        {children}
      </div>
    )
  },
)

Image.displayName = 'Image'
