import { AddSubjectCollection } from '@renderer/modules/collections/modify/add'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySubjectCollection } from '@renderer/data/hooks/api/collection'
import { SubjectId } from '@renderer/data/types/bgm'
import { CollectionType } from '@renderer/data/types/collection'
import { useInView } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useQuerySubjectInfo } from '@renderer/data/hooks/api/subject'
import { useSession } from '@renderer/modules/wrapper/session-wrapper'
import { useSetAtom } from 'jotai'
import { collectionBoxInViewAtom } from '@renderer/state/in-view'
import ScrollWrapper from '@renderer/components/scroll/scroll-wrapper'
import { isEmpty } from '@renderer/lib/utils/string'
import { Button } from '@renderer/components/ui/button'
import Login from '@renderer/modules/user/login'
import PrivateSwitch from '@renderer/modules/subject/collection/private-switch'
import SubjectCollectionSelector from '@renderer/modules/subject/collection/select'
import ModifySubjectCollection from '@renderer/modules/subject/collection/modify-action'
import MoreActionDropDown from '@renderer/modules/subject/collection/more-action-drop-down'
import QuickRate from '@renderer/modules/subject/collection/quick-rate'

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
  if (!isLogin || !accessToken)
    return (
      <Login>
        <Button className="">登录</Button>
      </Login>
    )
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
