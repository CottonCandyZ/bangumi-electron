import { AddSubjectCollection } from '@renderer/components/collections/modify/add'
import { ModifySubjectCollection } from '@renderer/components/collections/modify/modify'
import PrivateSwitch from '@renderer/components/subject/collection/private-switch'
import QuickRate from '@renderer/components/subject/collection/quick-rate'
import SubjectCollectionSelector from '@renderer/components/subject/collection/select'
import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySubjectCollection } from '@renderer/data/hooks/api/collection'
import { useQueryUserInfo } from '@renderer/data/hooks/api/user'
import { useAccessTokenQuery, useIsLoginQuery } from '@renderer/data/hooks/session'
import { SubjectId } from '@renderer/data/types/bgm'
import { CollectionType } from '@renderer/data/types/collection'
import { useCollectionIsInView } from '@renderer/state/inView'
import { useInView } from 'framer-motion'
import { useEffect, useRef } from 'react'
import MoreActionDropDown from '@renderer/components/subject/collection/more-action-drop-down'
import { useQuerySubjectInfo } from '@renderer/data/hooks/api/subject'

export default function SubjectCollection({ subjectId }: { subjectId: SubjectId }) {
  const isLogin = useIsLoginQuery().data
  const userInfo = useQueryUserInfo({ enabled: !!isLogin }).data
  const { data: accessToken } = useAccessTokenQuery()
  const subjectCollectionQuery = useQuerySubjectCollection({
    subjectId,
    username: userInfo?.username,
    enabled: !!userInfo,
    needKeepPreviousData: false,
  })
  const subjectCollection = subjectCollectionQuery.data
  const subjectInfoQuery = useQuerySubjectInfo({ id: subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data

  const ref = useRef<null | HTMLDivElement>(null)
  const isInView = useInView(ref)
  const setIsInView = useCollectionIsInView((state) => state.setInView)
  useEffect(() => {
    setIsInView(isInView)
  }, [isInView])

  const loading =
    subjectInfo === undefined ||
    subjectCollection === undefined ||
    userInfo === undefined ||
    isLogin === undefined ||
    accessToken === undefined
  if (!isLogin || !accessToken) return <div>登录按钮</div>
  return (
    <div className="flex flex-col gap-2" ref={ref}>
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-xl font-semibold">收藏盒</h2>
        {!loading && subjectCollection !== null && (
          <PrivateSwitch
            subjectCollection={subjectCollection}
            username={userInfo.username}
            accessToken={accessToken.access_token}
          />
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
            <SubjectCollectionSelector
              subjectCollection={subjectCollection}
              username={userInfo.username}
              accessToken={accessToken.access_token}
            />
            <ModifySubjectCollection
              subjectInfo={subjectInfo}
              subjectCollection={subjectCollection}
              accessToken={accessToken.access_token}
              username={userInfo.username}
            >
              <Button variant="outline">修改详情</Button>
            </ModifySubjectCollection>
            <MoreActionDropDown
              subjectId={subjectId}
              accessToken={accessToken.access_token}
              username={userInfo.username}
            />
          </div>
          {subjectCollection.type !== CollectionType.wantToWatch && (
            <QuickRate
              subjectCollection={subjectCollection}
              username={userInfo.username}
              accessToken={accessToken.access_token}
            />
          )}
        </div>
      ) : (
        <AddSubjectCollection
          subjectId={subjectId}
          username={userInfo.username}
          accessToken={accessToken.access_token}
        />
      )}
    </div>
  )
}
