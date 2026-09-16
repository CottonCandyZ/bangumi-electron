import { cn } from '@renderer/lib/utils'
import type { ReactNode } from 'react'

export function NavItemContent({
  icon,
  label,
  open,
}: {
  icon: ReactNode
  label: string
  open: boolean
}) {
  return (
    <>
      <span className="flex w-[var(--nav-icon-column)] shrink-0 items-center justify-center">
        {icon}
      </span>
      <span
        aria-hidden={!open}
        className={cn(
          'min-w-0 flex-1 overflow-hidden text-left whitespace-nowrap transition-opacity duration-150 motion-reduce:transition-none',
          open ? 'opacity-100' : 'opacity-0',
        )}
      >
        {label}
      </span>
    </>
  )
}
