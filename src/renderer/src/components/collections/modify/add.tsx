import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu'
import { Button } from '@renderer/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@renderer/components/ui/sheet'
import { useQuerySubjectInfo } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { CollectionType } from '@renderer/data/types/collection'
import { COLLECTION_TYPE_MAP } from '@renderer/lib/utils/map'
import { useState } from 'react'
import FormWrapper from '@renderer/components/collections/modify/form/form-wrapper'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { cn } from '@renderer/lib/utils'
import ScrollWrapper from '@renderer/components/base/scroll-warpper'
import { ModifyCollectionOptType } from '@renderer/data/types/modify'

export function AddSubjectCollection({
  subjectId,
  dropdown = false,
  username,
  accessToken,
}: {
  subjectId: SubjectId
  dropdown?: boolean
} & ModifyCollectionOptType) {
  const subjectInfoQuery = useQuerySubjectInfo({ id: subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  const [collectionType, setCollectionType] = useState<CollectionType>(CollectionType.wantToWatch)
  const [open, setOpen] = useState(false)
  if (subjectInfo === undefined) return <Skeleton className="h-10 w-full" />
  if (dropdown) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full">添加收藏</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {Object.keys(CollectionType)
              .slice(0, Object.keys(CollectionType).length / 2)
              .map((item) => (
                <SheetTrigger asChild key={item}>
                  <DropdownMenuItem
                    onClick={() => {
                      setCollectionType(Number(item) as CollectionType)
                    }}
                  >
                    {COLLECTION_TYPE_MAP(subjectInfo.type)[item]}
                  </DropdownMenuItem>
                </SheetTrigger>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <SheetContent className="w-[400px]">
          <SheetHeader>
            <SheetTitle>添加收藏</SheetTitle>
          </SheetHeader>
          <FormWrapper
            info={{ subjectInfo, collectionType }}
            username={username}
            accessToken={accessToken}
            setOpen={setOpen}
          />
        </SheetContent>
      </Sheet>
    )
  }
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="flex flex-row">
        {Object.keys(CollectionType)
          .slice(0, Object.keys(CollectionType).length / 2)
          .map((item) => (
            <SheetTrigger asChild key={item}>
              <Button
                variant="outline"
                className={cn(
                  'rounded-none border-l-0 px-2',
                  Number(item) === 1 && 'rounded-l-md border-l',
                  Number(item) === 5 && 'rounded-r-md',
                )}
                onClick={() => {
                  setCollectionType(Number(item) as CollectionType)
                }}
              >
                {COLLECTION_TYPE_MAP(subjectInfo.type)[item]}
              </Button>
            </SheetTrigger>
          ))}
      </div>
      <SheetContent
        className="flex w-1/3 flex-col pl-0 pr-2 sm:max-w-none"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="pl-6">
          <SheetTitle>添加收藏</SheetTitle>
        </SheetHeader>
        <ScrollWrapper className="pl-6 pr-4 pt-2" options={{ scrollbars: { autoHide: 'leave' } }}>
          <FormWrapper
            info={{ subjectInfo, collectionType }}
            username={username}
            accessToken={accessToken}
            setOpen={setOpen}
          />
        </ScrollWrapper>
      </SheetContent>
    </Sheet>
  )
}
