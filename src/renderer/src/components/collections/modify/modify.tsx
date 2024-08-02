import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@renderer/components/ui/sheet'
import { CollectionData } from '@renderer/data/types/collection'
import { PropsWithChildren, useState } from 'react'
import FormWrapper from '@renderer/components/collections/modify/form/form-wrapper'
import ScrollWrapper from '@renderer/components/base/scroll-warpper'
import { ModifyCollectionType } from '@renderer/data/types/modify'

export function ModifySubjectCollection({
  subjectCollection,
  username,
  accessToken,
  children,
}: PropsWithChildren<
  {
    subjectCollection: CollectionData
    dropdown?: boolean
  } & ModifyCollectionType
>) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        className="flex w-1/3 flex-col pl-0 pr-2 sm:max-w-none"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="pl-6">
          <SheetTitle>添加收藏</SheetTitle>
        </SheetHeader>
        <ScrollWrapper className="pl-6 pr-4 pt-2" options={{ scrollbars: { autoHide: 'leave' } }}>
          <FormWrapper
            info={{ collectionData: subjectCollection }}
            username={username}
            accessToken={accessToken}
            setOpen={setOpen}
          />
        </ScrollWrapper>
      </SheetContent>
    </Sheet>
  )
}
