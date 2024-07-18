import { Image } from '@renderer/components/base/Image'
import SubjectCharacters from '@renderer/components/subject/character'
import SubjectEpisodes from '@renderer/components/subject/episode'
import { SubjectHeaderInfo } from '@renderer/components/subject/header-info'
import PersonsTable from '@renderer/components/subject/person/table'
import RelatedSubjects from '@renderer/components/subject/related'
import SubjectScore from '@renderer/components/subject/score'
import SubjectTags from '@renderer/components/subject/tags/indext'
import { Card } from '@renderer/components/ui/card'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySubjectInfo } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { isEmpty } from '@renderer/lib/utils/string'
import { useLocation } from 'react-router-dom'

const SubjectContent = ({ subjectId }: { subjectId: SubjectId }) => {
  const subjectInfoQuery = useQuerySubjectInfo({ id: subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  const { state } = useLocation()
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-10">
      {/* <div className="fixed left-[72px] right-0 top-[5rem] z-50 flex justify-center px-20">
          <TabsOnly
            layoutId={`${subjectId}-tabs`}
            tabsContent={new Set(['章节', '标签', '角色', '相关信息', '关联条目'])}
            className="bg-transparent shadow backdrop-blur-2xl"
            currentSelect="章节"
          />
        </div> */}
      <section className="flex w-full flex-row gap-8">
        {/* cover */}
        <Card
          className="h-min w-56 shrink-0 overflow-hidden"
          style={{ viewTransitionName: state.viewTransitionName }}
        >
          {subjectInfo !== undefined ? (
            !isEmpty(subjectInfo.images.common) ? (
              <Image imageSrc={subjectInfo.images.common} loadingClassName="aspect-[2/3]" />
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center">还没有图片哦</div>
            )
          ) : (
            <Skeleton className="aspect-[2/3]" />
          )}
        </Card>
        {/* info */}
        <SubjectHeaderInfo subjectId={subjectId} />
      </section>
      {/* 章节 */}
      <SubjectEpisodes subjectId={subjectId} />
      <div className="flex flex-row gap-5">
        <section className="flex basis-3/4 flex-col gap-5">
          {/* 标签 */}
          <SubjectTags subjectId={subjectId} />
        </section>
        <section className="flex min-w-56 flex-1 flex-col gap-2">
          {/* 评分 */}
          <SubjectScore subjectId={subjectId} />
        </section>
      </div>
      <SubjectCharacters subjectId={subjectId} />
      <RelatedSubjects subjectId={subjectId} />
      <PersonsTable subjectId={subjectId} />
    </div>
  )
}

SubjectContent.displayName = 'SubjectContent'
export default SubjectContent
