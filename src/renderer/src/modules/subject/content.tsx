import { Card } from '@renderer/components/ui/card'
import { Separator } from '@renderer/components/ui/separator'
import { SubjectId } from '@renderer/data/types/bgm'
import { SubjectCharacters } from '@renderer/modules/subject/character'
import { SubjectCollection } from '@renderer/modules/subject/collection'
import { SubjectCoverImage } from '@renderer/modules/subject/cover-image'
import { SubjectEpisodes } from '@renderer/modules/subject/episode'
import { SubjectHeaderInfo } from '@renderer/modules/subject/header-info'
import { RelatedSubjects } from '@renderer/modules/subject/related'
import { SubjectScore } from '@renderer/modules/subject/score'
import { SubjectTags } from '@renderer/modules/subject/tags'

export const SubjectContent = ({ subjectId }: { subjectId: SubjectId }) => {
  return (
    <div className="mx-auto flex max-w-[86rem] flex-col gap-10 px-10 @container">
      <section className="flex w-full flex-row gap-8">
        {/* cover */}
        <SubjectCoverImage subjectId={subjectId} />
        {/* info */}
        <SubjectHeaderInfo subjectId={subjectId} />
      </section>
      {/* 章节 */}

      <div className="flex w-full flex-col gap-10">
        <section className="flex flex-row gap-5">
          <div className="flex w-full flex-col gap-5">
            <SubjectEpisodes subjectId={subjectId} />
            <div className="flex w-full flex-row">
              <SubjectTags subjectId={subjectId} />
            </div>
          </div>
          <Card className="h-fit bg-transparent p-4">
            <section className="flex min-w-56 flex-1 flex-col gap-2">
              <SubjectCollection subjectId={subjectId} />
              <Separator />
              <div className="w-56">
                <SubjectScore subjectId={subjectId} />
              </div>
            </section>
          </Card>
        </section>

        <SubjectCharacters subjectId={subjectId} />
        <RelatedSubjects subjectId={subjectId} />
      </div>
    </div>
  )
}

SubjectContent.displayName = 'SubjectContent'
