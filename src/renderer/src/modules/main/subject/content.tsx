import { Card } from '@renderer/components/ui/card'
import { Separator } from '@renderer/components/ui/separator'
import { SubjectId } from '@renderer/data/types/bgm'
import { cn } from '@renderer/lib/utils'
import { SubjectCharacters } from '@renderer/modules/main/subject/character'
import { SubjectCollection } from '@renderer/modules/main/subject/collection'
import { SubjectCoverImage } from '@renderer/modules/main/subject/cover-image'
import { SubjectEpisodes } from '@renderer/modules/main/subject/episode'
import { SubjectHeaderInfo } from '@renderer/modules/main/subject/header-info'
import { RelatedSubjects } from '@renderer/modules/main/subject/related'
import { SubjectScore } from '@renderer/modules/main/subject/score'
import { SubjectTags } from '@renderer/modules/main/subject/tags'

export const SubjectContent = ({
  subjectId,
  className,
  style,
}: {
  subjectId: SubjectId
  className?: string
  style?: React.CSSProperties
}) => {
  return (
    <div className={cn('max-w-8xl mx-auto flex flex-col gap-10 px-10', className)} style={style}>
      <section className="flex w-full flex-row gap-8">
        {/* cover */}
        <SubjectCoverImage subjectId={subjectId} key={subjectId} />
        {/* info */}
        <SubjectHeaderInfo subjectId={subjectId} />
      </section>

      <div className="flex w-full flex-col gap-10">
        <section className="flex flex-row gap-5">
          <div className="flex w-full flex-col gap-5">
            {/* 章节 */}
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
                <SubjectScore subjectId={subjectId} key={subjectId} />
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
