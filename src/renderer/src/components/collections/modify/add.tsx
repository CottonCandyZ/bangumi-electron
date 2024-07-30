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
import FormWrapper from '@renderer/components/collections/modify/form-wrapper'
import { Skeleton } from '@renderer/components/ui/skeleton'

export function AddCollection({ subjectId }: { subjectId: SubjectId }) {
  const subjectInfoQuery = useQuerySubjectInfo({ id: subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  const [collectionType, setCollectionType] = useState<CollectionType>(CollectionType.wantToWatch)
  if (subjectInfoQuery.isFetching || subjectInfo === undefined)
    return <Skeleton className="h-10 w-full" />
  return (
    <Sheet>
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
                    setCollectionType(item as unknown as CollectionType)
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
          <FormWrapper info={{ subjectInfo, collectionType }} />
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}
