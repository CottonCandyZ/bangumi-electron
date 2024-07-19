import SubjectCharacters from '@renderer/components/subject/character'
import SubjectCoverImage from '@renderer/components/subject/cover-image'
import SubjectEpisodes from '@renderer/components/subject/episode'
import { SubjectHeaderInfo } from '@renderer/components/subject/header-info'
import SubjectPersonTable from '@renderer/components/subject/person'
import RelatedSubjects from '@renderer/components/subject/related'
import SubjectScore from '@renderer/components/subject/score'
import SubjectTags from '@renderer/components/subject/tags/indext'
import { SubjectId } from '@renderer/data/types/bgm'

const SubjectContent = ({ subjectId }: { subjectId: SubjectId }) => {
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
        <SubjectCoverImage subjectId={subjectId} />
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
      <SubjectPersonTable subjectId={subjectId} />
    </div>
  )
}

SubjectContent.displayName = 'SubjectContent'
export default SubjectContent
