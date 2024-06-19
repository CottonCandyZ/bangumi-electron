import { Skeleton } from '@renderer/components/ui/skeleton'
import { getImage } from '@renderer/constants/api/image'
import { cn } from '@renderer/lib/utils'
import { useQuery } from '@tanstack/react-query'
import React from 'react'

export const Image = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, src, ...props }, ref) => {
    const { data: url } = useQuery({
      queryKey: ['image', src],
      queryFn: async () => await getImage(src!),
      enabled: !!src,
    })
    return src && url ? (
      <img className={cn('max-w-none', className)} ref={ref} src={url} {...props} />
    ) : (
      <Skeleton className={cn(className)} />
    )
  },
)

Image.displayName = 'Image'
