import { Sheet } from '@renderer/components/ui/sheet'
import { openSheetAtom } from '@renderer/state/sheet'
import { useAtom } from 'jotai'
import { PropsWithChildren } from 'react'

export default function SheetWrapper({ children }: PropsWithChildren) {
  const [open, setOpen] = useAtom(openSheetAtom)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {children}
    </Sheet>
  )
}
