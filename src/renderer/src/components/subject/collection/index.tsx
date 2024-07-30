import { DropdownMenu } from '@radix-ui/react-dropdown-menu'
import { AddCollection } from '@renderer/components/collections/modify/add'
import RateButtons from '@renderer/components/collections/rate'
import SubjectCollectionSelector from '@renderer/components/collections/subject-select'
import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu'
import { Select, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySubjectCollection } from '@renderer/data/hooks/api/collection'
import { useQueryUserInfo } from '@renderer/data/hooks/api/user'
import { useIsLoginQuery } from '@renderer/data/hooks/session'
import { SubjectId } from '@renderer/data/types/bgm'

export default function SubjectCollection({ subjectId }: { subjectId: SubjectId }) {
  const isLogin = useIsLoginQuery().data
  const userInfo = useQueryUserInfo({ enabled: !!isLogin }).data
  const subjectCollectionQuery = useQuerySubjectCollection({
    subjectId,
    username: userInfo?.username,
    enabled: !!userInfo,
  })
  const subjectCollection = subjectCollectionQuery.data
  if (subjectCollection === null) {
    return <AddCollection subjectId={subjectId} />
  }

  if (
    subjectCollectionQuery.isFetching ||
    subjectCollection === undefined ||
    userInfo === undefined ||
    isLogin === undefined
  )
    return <Skeleton className="h-10 w-full" />
  if (!isLogin) return <div>登录按钮</div>
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-semibold">收藏盒</h2>
      <div className="flex flex-row gap-2">
        <Select value={subjectCollection.type.toString()}>
          <SelectTrigger className="w-fit font-medium">
            <SelectValue />
          </SelectTrigger>
          <SubjectCollectionSelector subjectType={subjectCollection.subject_type} />
        </Select>
        <Button variant="outline">移除收藏</Button>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <span className="i-mingcute-more-2-fill text-base" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-fit" align="start">
            <DropdownMenuItem>设为私密</DropdownMenuItem>
            <DropdownMenuItem>更改收藏</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <RateButtons rate={subjectCollection.rate} />
    </div>
  )
}
