import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { useRelatedSubjectsQuery } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { RelatedSubject } from '@renderer/data/types/subject'

/** 前传和续集放在标题下面，关联条目里不再重复 */
export const SERIES_RELATIONS = ['前传', '续集'] as const

export function SeriesLinks({ subjectId }: { subjectId: SubjectId }) {
  const relatedSubjectsQuery = useRelatedSubjectsQuery({
    id: subjectId,
    needKeepPreviousData: false,
  })
  const relatedSubjects = relatedSubjectsQuery.data
  const links = SERIES_RELATIONS.flatMap((relation) =>
    (relatedSubjects?.get(relation) ?? []).map((subject) => ({ relation, subject })),
  )
  if (links.length === 0) return null
  return (
    <nav aria-label="系列" className="flex flex-wrap justify-center gap-1.5 @3xl:justify-start">
      {links.map(({ relation, subject }) => (
        <SeriesLink key={`${relation}-${subject.id}`} relation={relation} subject={subject} />
      ))}
    </nav>
  )
}

function SeriesLink({ relation, subject }: { relation: string; subject: RelatedSubject }) {
  const title = subject.name_cn || subject.name
  const prequel = relation === '前传'
  return (
    <MyLink
      to={`/subject/${subject.id}`}
      contextMenuTitle={{ name: subject.name, nameCN: subject.name_cn }}
      className="bg-muted/50 hover:bg-muted focus-visible:ring-ring flex max-w-80 min-w-0 cursor-default items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-0.5 text-xs transition-colors outline-none focus-visible:ring-2"
    >
      {subject.images.common !== '' ? (
        // 在 flex 里不能被压扁，否则圆形会被裁成歪的
        <Image
          imageSrc={subject.images.medium || subject.images.common}
          className="size-6 shrink-0 overflow-hidden rounded-full"
        />
      ) : (
        <span className="bg-muted size-6 shrink-0 rounded-full" />
      )}
      <span className="text-muted-foreground flex shrink-0 items-center">
        {prequel && <span className="i-mingcute-left-line" />}
        {relation}
        {!prequel && <span className="i-mingcute-right-line" />}
      </span>
      <span className="truncate font-medium">{title}</span>
    </MyLink>
  )
}
