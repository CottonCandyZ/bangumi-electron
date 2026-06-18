import { cn } from '@renderer/lib/utils'
import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

export const NativeScrollViewport = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'h-full w-full overflow-x-hidden overflow-y-auto focus-visible:outline-hidden',
        className,
      )}
      {...props}
    />
  ),
)

NativeScrollViewport.displayName = 'NativeScrollViewport'
