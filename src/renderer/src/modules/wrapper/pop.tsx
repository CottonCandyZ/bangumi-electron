import { Dialog } from '@renderer/components/dialog'

import { Toaster } from '@renderer/components/ui/sonner'
import { TooltipProvider } from '@renderer/components/ui/tooltip'
import { HoverCard } from '@renderer/modules/hover-card'
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
