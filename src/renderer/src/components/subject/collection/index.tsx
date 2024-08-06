import { AddSubjectCollection } from '@renderer/components/collections/modify/add'
import PrivateSwitch from '@renderer/components/subject/collection/private-switch'
import QuickRate from '@renderer/components/subject/collection/quick-rate'
import SubjectCollectionSelector from '@renderer/components/subject/collection/select'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySubjectCollection } from '@renderer/data/hooks/api/collection'
import { SubjectId } from '@renderer/data/types/bgm'
import { CollectionType } from '@renderer/data/types/collection'
import { useInView } from 'framer-motion'
import { useEffect, useRef } from 'react'
import MoreActionDropDown from '@renderer/components/subject/collection/more-action-drop-down'
import { useQuerySubjectInfo } from '@renderer/data/hooks/api/subject'
import { useSession } from '@renderer/components/wrapper/session-wrapper'
import { useSetAtom } from 'jotai'
import { collectionBoxInViewAtom } from '@renderer/state/in-view'
import ModifySubjectCollection from '@renderer/components/subject/collection/modify-action'

export default function SubjectCollection({ subjectId }: { subjectId: SubjectId }) {
  const { isLogin, userInfo, accessToken } = useSession()
  const subjectCollectionQuery = useQuerySubjectCollection({
    subjectId,
    username: userInfo?.username,
    enabled: !!userInfo,
    needKeepPreviousData: false,
  })
  const subjectCollection = subjectCollectionQuery.data
  const subjectInfoQuery = useQuerySubjectInfo({ subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data

  const ref = useRef<null | HTMLDivElement>(null)
  const isInView = useInView(ref)
  const setIsInView = useSetAtom(collectionBoxInViewAtom)
  useEffect(() => {
    setIsInView(isInView)
  }, [isInView])

  const loading =
    subjectInfo === undefined ||
    subjectCollection === undefined ||
    userInfo === undefined ||
    isLogin === undefined
  if (!isLogin || !accessToken) return <div>登录按钮</div>
  return (
    <div className="flex flex-col gap-2" ref={ref}>
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-xl font-semibold">收藏盒</h2>
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
        </div>
      ) : (
        <AddSubjectCollection subjectId={subjectId} />
      )}
    </div>
  )
}
