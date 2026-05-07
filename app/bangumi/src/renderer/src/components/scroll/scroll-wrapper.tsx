import { cn } from '@renderer/lib/utils'
import React from 'react'

export function ScrollWrapper({
  className,
  children,
  // options,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('overflow-auto', className)} {...props}>
      {children}
    </div>
  )
}
