import { AlertDialog } from '@renderer/components/dialog/alert'
import { NormalDialog } from '@renderer/components/dialog/normal'
import { SheetDialog } from '@renderer/components/dialog/sheet'
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
        <NormalDialog />
        <SheetDialog />
        <AlertDialog />
        <Toaster richColors className="pointer-events-auto" />
      </TooltipProvider>
    </>
  )
}
