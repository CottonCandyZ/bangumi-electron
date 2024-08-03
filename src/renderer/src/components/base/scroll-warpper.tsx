import { cn } from '@renderer/lib/utils'
import { PartialOptions } from 'overlayscrollbars'
import {
  OverlayScrollbarsComponent,
  OverlayScrollbarsComponentProps,
} from 'overlayscrollbars-react'

export default function ScrollWrapper({
  className,
  children,
  options,
  ...props
}: OverlayScrollbarsComponentProps) {
  const typeOptions = options as PartialOptions | undefined
  return (
    <OverlayScrollbarsComponent
      className={cn('pr-2', className)}
      options={{
        ...typeOptions,
        scrollbars: { ...typeOptions?.scrollbars, theme: 'os-theme-custom', clickScroll: true },
      }}
      defer
      {...props}
    >
      {children}
    </OverlayScrollbarsComponent>
  )
}
