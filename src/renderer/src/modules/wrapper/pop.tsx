import { Dialog } from '@renderer/components/dialog'
import { HoverCard } from '@renderer/components/ui/hover-card'
import { Toaster } from '@renderer/components/ui/sonner'
import { TooltipProvider } from '@renderer/components/ui/tooltip'
import { PropsWithChildren } from 'react'

export function Pop({ children }: PropsWithChildren) {
  return (
    <>
      <TooltipProvider>
        {children}
        <HoverCard />
        <Dialog />
        <Toaster richColors className="pointer-events-auto" />
      </TooltipProvider>
    </>
  )
}
