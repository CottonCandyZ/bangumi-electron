import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu'
import { Button } from '@renderer/components/ui/button'
import { SubjectId } from '@renderer/data/types/bgm'
import { CollectionType } from '@renderer/data/types/collection'
import { COLLECTION_TYPE_MAP } from '@renderer/lib/utils/map'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { cn } from '@renderer/lib/utils'
import { useSetAtom } from 'jotai'
import { subjectCollectionSheetFormActionAtom } from '@renderer/state/dialog/sheet'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'

export function AddSubjectCollection({
  subjectId,
  dropdown = false,
}: {
  subjectId: SubjectId
  dropdown?: boolean
}) {
  const subjectInfoQuery = useSubjectInfoQuery({ subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  const sheetAction = useSetAtom(subjectCollectionSheetFormActionAtom)
  if (subjectInfo === undefined) return <Skeleton className="h-10 w-full" />
  if (dropdown) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-full">添加收藏</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {Object.keys(CollectionType)
            .slice(0, Object.keys(CollectionType).length / 2)
            .map((item) => (
              <DropdownMenuItem
                key={item}
                onClick={() => {
                  sheetAction({
                    sheetTitle: '添加收藏',
                    collectionType: Number(item) as CollectionType,
                    subjectId: subjectInfo.id.toString(),
                    subjectTags: subjectInfo.tags,
                    subjectType: subjectInfo.type,
                  })
                }}
              >
                {COLLECTION_TYPE_MAP(subjectInfo.type)[item]}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
  return (
    <div className="flex flex-row">
      {Object.keys(CollectionType)
        .slice(0, Object.keys(CollectionType).length / 2)
        .map((item) => (
          <Button
            key={item}
            variant="outline"
            className={cn(
              'rounded-none border-l-0 px-2',
              Number(item) === 1 && 'rounded-l-md border-l',
              Number(item) === 5 && 'rounded-r-md',
            )}
            onClick={() => {
              sheetAction({
                sheetTitle: '添加收藏',
                collectionType: Number(item) as CollectionType,
                subjectId: subjectInfo.id.toString(),
                subjectTags: subjectInfo.tags,
                subjectType: subjectInfo.type,
              })
            }}
          >
            {COLLECTION_TYPE_MAP(subjectInfo.type)[item]}
          </Button>
        ))}
    </div>
  )
}
