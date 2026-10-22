import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
} from '@renderer/components/ui/dropdown-menu'
import { editLocalCollection } from '@renderer/data/collection/client'
import { useQuerySubjectCollection } from '@renderer/data/hooks/api/collection'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'
import { useSessionUsername } from '@renderer/data/hooks/session'
import { CollectionType, type CollectionData } from '@renderer/data/types/collection'
import type { Subject, SubjectType } from '@renderer/data/types/subject'
import { COLLECTION_TYPE_MAP } from '@renderer/lib/utils/map'
import { CollectionStatusDot } from '@renderer/modules/common/collections/subject-select-content'
import { CollectionPendingError } from '@renderer/lib/utils/network'
import { queryClient } from '@renderer/modules/wrapper/query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

/** 菜单里按 1~5 直接标记，对应收藏状态的枚举值 */
export const SUBJECT_COLLECTION_TYPES = [
  CollectionType.wantToWatch,
  CollectionType.watched,
  CollectionType.watching,
  CollectionType.aside,
  CollectionType.abandoned,
]

export function getSubjectCollectionTypeByKey(key: string) {
  return SUBJECT_COLLECTION_TYPES[Number(key) - 1] as CollectionType | undefined
}

function getCachedSubjectType(subjectId: number): SubjectType | undefined {
  const info = queryClient
    .getQueriesData<Subject>({ queryKey: ['subject-info'] })
    .map(([, data]) => data)
    .find((data) => data?.id === subjectId)
  if (info) return info.type
  return queryClient
    .getQueriesData<CollectionData | null>({ queryKey: ['collection-subject'] })
    .map(([, data]) => data)
    .find((data) => data?.subject_id === subjectId)?.subject_type
}

export function markSubjectCollection(subjectId: number, collectionType: CollectionType) {
  const subjectType = getCachedSubjectType(subjectId)
  editLocalCollection({ subjectId: subjectId.toString(), collectionType }).then(
    () => {
      toast.success(
        subjectType === undefined
          ? '收藏状态已更新'
          : `已标记成 ${COLLECTION_TYPE_MAP(subjectType)[collectionType]}`,
      )
    },
    (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '收藏状态更新失败，请重试')
    },
  )
}

/** 右键菜单里的「标记为」一排收藏状态，打开时才去读当前收藏状态 */
export function SubjectCollectionMenuEntry({
  onDone,
  subjectId,
}: {
  onDone: () => void
  subjectId: number
}) {
  const username = useSessionUsername()
  const collectionQuery = useQuerySubjectCollection({
    subjectId: subjectId.toString(),
    username,
    needKeepPreviousData: false,
  })
  const subjectInfoQuery = useSubjectInfoQuery({ subjectId: subjectId.toString() })
  const collection = collectionQuery.data
  const subjectType = collection?.subject_type ?? subjectInfoQuery.data?.type
  const labels = subjectType === undefined ? undefined : COLLECTION_TYPE_MAP(subjectType)
  const current = collection?.type
  // 同步还没写到本地时读取会抛 CollectionPendingError 并轮询，这不是失败
  const pending =
    collection === undefined &&
    (!collectionQuery.isError || collectionQuery.error instanceof CollectionPendingError)

  // 平铺成一排而不是子菜单：没有 Trigger 的根菜单会把自己的子菜单当成兄弟菜单而关闭
  return (
    <DropdownMenuGroup className="min-w-60">
      <DropdownMenuLabel className="flex items-center gap-1.5">
        标记为
        {/* 标记不依赖当前状态，读取中只是还不知道哪个是当前的 */}
        {pending && <Loader2 className="text-muted-foreground size-3 animate-spin" />}
        <DropdownMenuShortcut className="ml-auto font-normal tracking-normal">
          1–5
        </DropdownMenuShortcut>
      </DropdownMenuLabel>
      <div className="flex gap-0.5 px-1 pb-1">
        {SUBJECT_COLLECTION_TYPES.map((type, index) => (
          <DropdownMenuItem
            aria-label={`${labels?.[type] ?? ''}（${index + 1}）`}
            className="data-[current=true]:bg-accent data-[current=true]:text-accent-foreground flex-1 justify-center gap-1 px-1.5 py-1 text-xs whitespace-nowrap data-[current=true]:font-medium"
            data-current={type === current}
            disabled={!labels}
            key={type}
            onClick={() => {
              onDone()
              if (type !== current) markSubjectCollection(subjectId, type)
            }}
          >
            <CollectionStatusDot type={type} />
            {labels?.[type] ?? <span className="bg-muted h-3 w-6 rounded-sm" />}
          </DropdownMenuItem>
        ))}
      </div>
    </DropdownMenuGroup>
  )
}
