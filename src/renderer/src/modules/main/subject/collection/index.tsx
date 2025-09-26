import { AddSubjectCollection } from '@renderer/modules/common/collections/modify/add'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySubjectCollection } from '@renderer/data/hooks/api/collection'
import { SubjectId } from '@renderer/data/types/bgm'
import { CollectionType } from '@renderer/data/types/collection'
import { useInView } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useSession } from '@renderer/data/hooks/session'
import { useSetAtom } from 'jotai'
import { collectionBoxInViewAtom } from '@renderer/state/in-view'
import { ScrollWrapper } from '@renderer/components/scroll/scroll-wrapper'
import { isEmpty } from '@renderer/lib/utils/string'
import { Button } from '@renderer/components/ui/button'
import { PrivateSwitch } from '@renderer/modules/main/subject/collection/private-switch'
import { SubjectCollectionSelector } from '@renderer/modules/main/subject/collection/select'
import { ModifySubjectCollection } from '@renderer/modules/main/subject/collection/modify-action'
import { MoreActionDropDown } from '@renderer/modules/main/subject/collection/more-action-drop-down'
import { QuickRate } from '@renderer/modules/main/subject/collection/quick-rate'
import { loginDialogAtom } from '@renderer/state/dialog/normal'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'

export function SubjectCollection({ subjectId }: { subjectId: SubjectId }) {
  const userInfo = useSession()
  const subjectCollectionQuery = useQuerySubjectCollection({
    subjectId,
    username: userInfo?.username,
    enabled: !!userInfo,
    needKeepPreviousData: false,
  })
  const subjectCollection = subjectCollectionQuery.data
  const subjectInfoQuery = useSubjectInfoQuery({ subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  const openLoginDialog = useSetAtom(loginDialogAtom)

  const ref = useRef<null | HTMLDivElement>(null)
  const isInView = useInView(ref)
  const setIsInView = useSetAtom(collectionBoxInViewAtom)
  useEffect(() => {
    setIsInView(isInView)
  }, [isInView, setIsInView])

  const loading = subjectInfo === undefined || subjectCollection === undefined || !userInfo
  if (userInfo === null)
    return <Button onClick={() => openLoginDialog({ open: true })}>登录</Button>
  return (
    <div className="flex flex-col gap-2" ref={ref}>
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-xl font-medium">收藏盒</h2>
        {!loading && subjectCollection !== null && (
          <PrivateSwitch subjectCollection={subjectCollection} />
        )}
      </div>
      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : subjectCollection !== null ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-row items-center gap-2">
            <SubjectCollectionSelector subjectCollection={subjectCollection} />
            <ModifySubjectCollection
              subjectCollection={subjectCollection}
              subjectInfo={subjectInfo}
            />
            <MoreActionDropDown subjectId={subjectId} />
          </div>
          {subjectCollection.type !== CollectionType.wantToWatch && (
            <QuickRate subjectCollection={subjectCollection} />
          )}
          {subjectCollection.comment && !isEmpty(subjectCollection.comment) && (
            <ScrollWrapper className="max-h-40 max-w-56 rounded-md border border-border p-2 text-sm">
              <p className="">{subjectCollection.comment}</p>
            </ScrollWrapper>
          )}
        </div>
      ) : (
        <AddSubjectCollection subjectId={subjectId} />
      )}
    </div>
  )
}
